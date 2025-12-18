import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { qrDataToHex, formatHexForDisplay } from './qr-utils';
import type { PreGeneratedQR } from '@/types/inventory';

/**
 * Generate QR code SVG as a data URL for embedding in HTML
 */
function generateQRCodeSVG(data: string, size: number = 100): string {
  // Use a simple QR code generation approach for PDF
  // We'll use an inline SVG with the QR data encoded
  const encodedData = encodeURIComponent(data);
  // Use a public QR code API for generating QR codes in PDF
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=svg`;
}

/**
 * Generate HTML content for PDF with QR codes
 */
export function generateQRCodesPDFHTML(qrCodes: PreGeneratedQR[], title: string = 'QR Codes'): string {
  const qrCodesHTML = qrCodes.map((qr, index) => {
    const hexCode = formatHexForDisplay(qrDataToHex(qr.qrData)).substring(0, 32);
    const qrImageUrl = generateQRCodeSVG(qr.qrData, 150);
    
    return `
      <div class="qr-card">
        <img src="${qrImageUrl}" alt="QR Code ${index + 1}" class="qr-image" />
        ${qr.prefix ? `<div class="prefix">${qr.prefix}</div>` : ''}
        <div class="hex-code">${hexCode}</div>
        <div class="date">${new Date(qr.createdAt).toLocaleDateString()}</div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          background: #fff;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .header h1 {
          font-size: 24px;
          color: #111827;
          margin-bottom: 8px;
        }
        
        .header p {
          font-size: 14px;
          color: #6b7280;
        }
        
        .grid {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          justify-content: center;
        }
        
        .qr-card {
          width: 180px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          text-align: center;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .qr-image {
          width: 120px;
          height: 120px;
          margin-bottom: 12px;
        }
        
        .prefix {
          font-size: 10px;
          font-weight: 600;
          color: #2563eb;
          background: #eff6ff;
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 8px;
        }
        
        .hex-code {
          font-size: 8px;
          font-family: 'Courier New', monospace;
          color: #374151;
          word-break: break-all;
          line-height: 1.4;
          margin-bottom: 4px;
        }
        
        .date {
          font-size: 9px;
          color: #9ca3af;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
        }
        
        @media print {
          body {
            padding: 10px;
          }
          
          .qr-card {
            width: 160px;
            padding: 12px;
          }
          
          .qr-image {
            width: 100px;
            height: 100px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>${qrCodes.length} QR codes generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="grid">
        ${qrCodesHTML}
      </div>
      
      <div class="footer">
        <p>QR Inventory Manager - Scan codes to assign to locations or items</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Export QR codes to PDF and share/download
 */
export async function exportQRCodesToPDF(qrCodes: PreGeneratedQR[], title: string = 'QR Codes'): Promise<void> {
  if (qrCodes.length === 0) {
    throw new Error('No QR codes to export');
  }

  const html = generateQRCodesPDFHTML(qrCodes, title);

  try {
    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Share or save the PDF
    if (Platform.OS === 'web') {
      // On web, trigger download
      const response = await fetch(uri);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // On mobile, use sharing
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${title}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    }
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
}

/**
 * Print QR codes directly
 */
export async function printQRCodes(qrCodes: PreGeneratedQR[], title: string = 'QR Codes'): Promise<void> {
  if (qrCodes.length === 0) {
    throw new Error('No QR codes to print');
  }

  const html = generateQRCodesPDFHTML(qrCodes, title);

  try {
    await Print.printAsync({ html });
  } catch (error) {
    console.error('Failed to print:', error);
    throw error;
  }
}
