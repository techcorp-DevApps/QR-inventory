import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { qrDataToHex, formatHexForDisplay } from './qr-utils';
import type { 
  InventoryData, 
  InventoryReport, 
  LocationReport, 
  AreaReport, 
  SectionReport,
  Location,
  Area,
  Section,
  Item,
} from '@/types/inventory';

/**
 * Generate inventory report data structure from inventory data
 */
export function generateInventoryReport(data: InventoryData): InventoryReport {
  const locationReports: LocationReport[] = data.locations.map(location => {
    const locationAreas = data.areas.filter(a => a.locationId === location.id);
    
    const areaReports: AreaReport[] = locationAreas.map(area => {
      const areaSections = data.sections.filter(s => s.areaId === area.id);
      const areaItems = data.items.filter(i => i.areaId === area.id && !i.sectionId);
      
      const sectionReports: SectionReport[] = areaSections.map(section => ({
        section,
        items: data.items.filter(i => i.sectionId === section.id),
      }));

      return {
        area,
        sections: sectionReports,
        items: areaItems,
      };
    });

    return {
      location,
      areas: areaReports,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalLocations: data.locations.length,
    totalAreas: data.areas.length,
    totalSections: data.sections.length,
    totalItems: data.items.length,
    locations: locationReports,
  };
}

/**
 * Generate QR code image URL for PDF
 */
function generateQRCodeURL(data: string, size: number = 80): string {
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=svg`;
}

/**
 * Get condition badge HTML
 */
function getConditionBadge(condition?: string): string {
  if (!condition) return '';
  
  const colors: Record<string, string> = {
    new: '#10B981',
    good: '#3B82F6',
    fair: '#F59E0B',
    poor: '#EF4444',
  };
  
  const color = colors[condition] || '#6B7280';
  return `<span class="condition-badge" style="background-color: ${color}20; color: ${color};">${condition}</span>`;
}

/**
 * Generate item row HTML
 */
function generateItemRowHTML(item: Item, index: number): string {
  const hexCode = formatHexForDisplay(qrDataToHex(item.qrData)).substring(0, 24);
  const qrUrl = generateQRCodeURL(item.qrData, 60);
  
  return `
    <tr class="item-row">
      <td class="item-index">${index + 1}</td>
      <td class="item-qr">
        <img src="${qrUrl}" alt="QR" class="qr-small" />
      </td>
      <td class="item-details">
        <div class="item-name">${item.name}</div>
        ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
        <div class="item-meta">
          ${item.quantity && item.quantity > 1 ? `<span class="qty-badge">Qty: ${item.quantity}</span>` : ''}
          ${getConditionBadge(item.condition)}
        </div>
      </td>
      <td class="item-hex">${hexCode}...</td>
    </tr>
  `;
}

/**
 * Generate section HTML
 */
function generateSectionHTML(sectionReport: SectionReport): string {
  if (sectionReport.items.length === 0) return '';
  
  const itemRows = sectionReport.items.map((item, i) => generateItemRowHTML(item, i)).join('');
  
  return `
    <div class="section-block">
      <div class="section-header">
        <span class="section-icon">📦</span>
        <span class="section-name">${sectionReport.section.name}</span>
        <span class="section-count">${sectionReport.items.length} items</span>
      </div>
      <table class="items-table">
        <thead>
          <tr>
            <th width="30">#</th>
            <th width="70">QR</th>
            <th>Item Details</th>
            <th width="120">Code</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Generate area HTML
 */
function generateAreaHTML(areaReport: AreaReport): string {
  const directItemRows = areaReport.items.map((item, i) => generateItemRowHTML(item, i)).join('');
  const sectionsHTML = areaReport.sections.map(s => generateSectionHTML(s)).join('');
  
  const hasDirectItems = areaReport.items.length > 0;
  const hasSections = areaReport.sections.some(s => s.items.length > 0);
  
  if (!hasDirectItems && !hasSections) return '';
  
  return `
    <div class="area-block">
      <div class="area-header">
        <span class="area-icon">📁</span>
        <span class="area-name">${areaReport.area.name}</span>
      </div>
      
      ${hasDirectItems ? `
        <div class="direct-items">
          <table class="items-table">
            <thead>
              <tr>
                <th width="30">#</th>
                <th width="70">QR</th>
                <th>Item Details</th>
                <th width="120">Code</th>
              </tr>
            </thead>
            <tbody>
              ${directItemRows}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      ${sectionsHTML}
    </div>
  `;
}

/**
 * Generate location HTML
 */
function generateLocationHTML(locationReport: LocationReport): string {
  const areasHTML = locationReport.areas.map(a => generateAreaHTML(a)).join('');
  
  // Count total items in this location
  let totalItems = 0;
  locationReport.areas.forEach(area => {
    totalItems += area.items.length;
    area.sections.forEach(section => {
      totalItems += section.items.length;
    });
  });
  
  if (totalItems === 0) return '';
  
  const locationColor = locationReport.location.color || '#3B82F6';
  
  return `
    <div class="location-block" style="border-left-color: ${locationColor};">
      <div class="location-header" style="background-color: ${locationColor}10;">
        <div class="location-title">
          <span class="location-icon">📍</span>
          <span class="location-name">${locationReport.location.name}</span>
        </div>
        <div class="location-stats">
          <span>${locationReport.areas.length} areas</span>
          <span>•</span>
          <span>${totalItems} items</span>
        </div>
      </div>
      ${areasHTML}
    </div>
  `;
}

/**
 * Generate full HTML report
 */
export function generateReportHTML(report: InventoryReport): string {
  const locationsHTML = report.locations.map(l => generateLocationHTML(l)).join('');
  const generatedDate = new Date(report.generatedAt).toLocaleString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Inventory Report</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #1F2937;
          background: #fff;
          padding: 20px;
        }
        
        .report-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #E5E7EB;
        }
        
        .report-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }
        
        .report-subtitle {
          font-size: 14px;
          color: #6B7280;
        }
        
        .summary-grid {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin: 20px 0;
        }
        
        .summary-item {
          text-align: center;
          padding: 12px 20px;
          background: #F9FAFB;
          border-radius: 8px;
        }
        
        .summary-value {
          font-size: 24px;
          font-weight: 700;
          color: #3B82F6;
        }
        
        .summary-label {
          font-size: 11px;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .location-block {
          margin-bottom: 24px;
          border-left: 4px solid #3B82F6;
          background: #fff;
          border-radius: 0 8px 8px 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          page-break-inside: avoid;
        }
        
        .location-header {
          padding: 12px 16px;
          border-radius: 0 8px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .location-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .location-icon {
          font-size: 18px;
        }
        
        .location-name {
          font-size: 16px;
          font-weight: 600;
        }
        
        .location-stats {
          font-size: 11px;
          color: #6B7280;
          display: flex;
          gap: 8px;
        }
        
        .area-block {
          padding: 12px 16px;
          border-top: 1px solid #E5E7EB;
        }
        
        .area-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px dashed #E5E7EB;
        }
        
        .area-icon {
          font-size: 14px;
        }
        
        .area-name {
          font-size: 14px;
          font-weight: 600;
        }
        
        .section-block {
          margin: 12px 0 12px 20px;
          padding: 12px;
          background: #F9FAFB;
          border-radius: 6px;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .section-icon {
          font-size: 12px;
        }
        
        .section-name {
          font-size: 13px;
          font-weight: 500;
        }
        
        .section-count {
          font-size: 11px;
          color: #6B7280;
          margin-left: auto;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .items-table th {
          text-align: left;
          padding: 8px;
          font-size: 10px;
          font-weight: 600;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #E5E7EB;
        }
        
        .items-table td {
          padding: 8px;
          vertical-align: middle;
          border-bottom: 1px solid #F3F4F6;
        }
        
        .item-row:last-child td {
          border-bottom: none;
        }
        
        .item-index {
          font-size: 11px;
          color: #9CA3AF;
          text-align: center;
        }
        
        .qr-small {
          width: 50px;
          height: 50px;
        }
        
        .item-name {
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .item-desc {
          font-size: 11px;
          color: #6B7280;
          margin-bottom: 4px;
        }
        
        .item-meta {
          display: flex;
          gap: 6px;
        }
        
        .qty-badge, .condition-badge {
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }
        
        .qty-badge {
          background: #E5E7EB;
          color: #374151;
        }
        
        .item-hex {
          font-family: 'Courier New', monospace;
          font-size: 9px;
          color: #6B7280;
        }
        
        .report-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          text-align: center;
          font-size: 11px;
          color: #9CA3AF;
        }
        
        @media print {
          body {
            padding: 10px;
          }
          
          .location-block {
            page-break-inside: avoid;
          }
          
          .area-block {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1 class="report-title">📋 Inventory Report</h1>
        <p class="report-subtitle">Generated on ${generatedDate}</p>
        
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">${report.totalLocations}</div>
            <div class="summary-label">Locations</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${report.totalAreas}</div>
            <div class="summary-label">Areas</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${report.totalSections}</div>
            <div class="summary-label">Sections</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${report.totalItems}</div>
            <div class="summary-label">Items</div>
          </div>
        </div>
      </div>
      
      ${locationsHTML || '<p style="text-align: center; color: #6B7280; padding: 40px;">No inventory items to display.</p>'}
      
      <div class="report-footer">
        <p>QR Inventory Manager - Complete Inventory Report</p>
        <p>All QR codes shown are scannable and linked to their respective items</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Export inventory report to PDF
 */
export async function exportInventoryReportPDF(data: InventoryData): Promise<void> {
  const report = generateInventoryReport(data);
  const html = generateReportHTML(report);
  
  try {
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `Inventory_Report_${timestamp}.pdf`;

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Inventory Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    }
  } catch (error) {
    console.error('Failed to export inventory report:', error);
    throw error;
  }
}

/**
 * Print inventory report directly
 */
export async function printInventoryReport(data: InventoryData): Promise<void> {
  const report = generateInventoryReport(data);
  const html = generateReportHTML(report);
  
  try {
    await Print.printAsync({ html });
  } catch (error) {
    console.error('Failed to print inventory report:', error);
    throw error;
  }
}
