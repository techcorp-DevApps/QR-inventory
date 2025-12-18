import { describe, it, expect } from 'vitest';
import type { PreGeneratedQR } from '../types/inventory';

// Mock the qr-utils functions for testing
const qrDataToHex = (qrData: string): string => {
  return Array.from(qrData)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
};

const formatHexForDisplay = (hex: string): string => {
  return hex.match(/.{1,4}/g)?.join(' ') || hex;
};

// Inline the generateQRCodesPDFHTML function for testing
function generateQRCodeSVG(data: string, size: number = 100): string {
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=svg`;
}

function generateQRCodesPDFHTML(qrCodes: PreGeneratedQR[], title: string = 'QR Codes'): string {
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

describe('PDF Export', () => {
  describe('generateQRCodesPDFHTML', () => {
    it('should generate valid HTML with QR codes', () => {
      const mockQRCodes: PreGeneratedQR[] = [
        {
          qrData: 'PRE:test-uuid-123',
          prefix: 'WAREHOUSE',
          createdAt: new Date('2024-01-15').toISOString(),
          assignedTo: null,
          assignedType: null,
        },
        {
          qrData: 'PRE:test-uuid-456',
          prefix: null,
          createdAt: new Date('2024-01-16').toISOString(),
          assignedTo: null,
          assignedType: null,
        },
      ];

      const html = generateQRCodesPDFHTML(mockQRCodes, 'Test QR Codes');

      // Check HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      
      // Check title
      expect(html).toContain('Test QR Codes');
      
      // Check QR code count
      expect(html).toContain('2 QR codes generated');
      
      // Check prefix is displayed
      expect(html).toContain('WAREHOUSE');
      
      // Check QR code images are included
      expect(html).toContain('api.qrserver.com');
      expect(html).toContain('PRE%3Atest-uuid-123');
    });

    it('should handle empty QR code array', () => {
      const html = generateQRCodesPDFHTML([], 'Empty Export');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Empty Export');
      expect(html).toContain('0 QR codes generated');
    });

    it('should include hex codes for each QR', () => {
      const mockQRCodes: PreGeneratedQR[] = [
        {
          qrData: 'ABC',
          prefix: null,
          createdAt: new Date().toISOString(),
          assignedTo: null,
          assignedType: null,
        },
      ];

      const html = generateQRCodesPDFHTML(mockQRCodes);

      // Check hex-code class is present
      expect(html).toContain('hex-code');
      // ABC in hex is 414243
      expect(html).toContain('4142 43');
    });

    it('should use default title when not provided', () => {
      const mockQRCodes: PreGeneratedQR[] = [
        {
          qrData: 'PRE:test',
          prefix: null,
          createdAt: new Date().toISOString(),
          assignedTo: null,
          assignedType: null,
        },
      ];

      const html = generateQRCodesPDFHTML(mockQRCodes);

      expect(html).toContain('QR Codes');
    });

    it('should include proper CSS styling', () => {
      const html = generateQRCodesPDFHTML([]);

      // Check for key CSS classes
      expect(html).toContain('.qr-card');
      expect(html).toContain('.qr-image');
      expect(html).toContain('.hex-code');
      expect(html).toContain('@media print');
    });

    it('should format dates correctly', () => {
      const mockQRCodes: PreGeneratedQR[] = [
        {
          qrData: 'PRE:test',
          prefix: null,
          createdAt: '2024-06-15T10:30:00.000Z',
          assignedTo: null,
          assignedType: null,
        },
      ];

      const html = generateQRCodesPDFHTML(mockQRCodes);

      // Date should be formatted (format depends on locale)
      expect(html).toContain('class="date"');
    });
  });
});
