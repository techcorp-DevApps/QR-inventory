import { describe, it, expect } from 'vitest';
import { 
  generateQRData, 
  parseQRData, 
  generateId,
  generatePreQRCode,
  generateBulkQRCodes,
  qrDataToHex,
  hexToQRData,
  formatHexForDisplay,
  isValidQRData,
} from '../lib/qr-utils';

describe('QR Utils', () => {
  describe('generateId', () => {
    it('should generate a valid UUID', () => {
      const id = generateId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(36);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateQRData', () => {
    it('should generate QR data for location', () => {
      const qrData = generateQRData('location', 'Office');
      expect(qrData).toContain('LOC:');
      expect(qrData).toContain('Office');
    });

    it('should generate QR data for area', () => {
      const qrData = generateQRData('area', 'Corner Shelf');
      expect(qrData).toContain('ARE:');
      expect(qrData).toContain('Corner%20Shelf');
    });

    it('should generate QR data with prefix', () => {
      const qrData = generateQRData('location', 'Office', 'WAREHOUSE');
      expect(qrData).toContain('WAREHOUSE-LOC:');
    });
  });

  describe('generatePreQRCode', () => {
    it('should generate pre-generated QR code without prefix', () => {
      const qrData = generatePreQRCode();
      expect(qrData).toContain('PRE:');
      expect(isValidQRData(qrData)).toBe(true);
    });

    it('should generate pre-generated QR code with prefix', () => {
      const qrData = generatePreQRCode('OFFICE');
      expect(qrData).toContain('OFFICE-PRE:');
    });
  });

  describe('generateBulkQRCodes', () => {
    it('should generate specified number of QR codes', () => {
      const codes = generateBulkQRCodes(5);
      expect(codes.length).toBe(5);
      codes.forEach(code => {
        expect(isValidQRData(code)).toBe(true);
      });
    });

    it('should generate QR codes with prefix', () => {
      const codes = generateBulkQRCodes(3, 'WAREHOUSE');
      expect(codes.length).toBe(3);
      codes.forEach(code => {
        expect(code).toContain('WAREHOUSE-PRE:');
      });
    });
  });

  describe('qrDataToHex', () => {
    it('should convert QR data to hex string', () => {
      const hex = qrDataToHex('ABC');
      expect(hex).toBe('414243');
    });

    it('should handle special characters', () => {
      const hex = qrDataToHex('A:B');
      expect(hex).toBe('413A42');
    });
  });

  describe('hexToQRData', () => {
    it('should convert hex string back to QR data', () => {
      const qrData = hexToQRData('414243');
      expect(qrData).toBe('ABC');
    });

    it('should handle hex with spaces', () => {
      const qrData = hexToQRData('41 42 43');
      expect(qrData).toBe('ABC');
    });

    it('should return null for invalid hex', () => {
      expect(hexToQRData('XYZ')).toBeNull();
      expect(hexToQRData('123')).toBeNull(); // Odd length
    });
  });

  describe('formatHexForDisplay', () => {
    it('should format hex in groups of 4', () => {
      const formatted = formatHexForDisplay('ABCDEF123456');
      expect(formatted).toBe('ABCD EF12 3456');
    });
  });

  describe('parseQRData', () => {
    it('should parse location QR data', () => {
      const qrData = 'LOC:test-uuid-123:Office';
      const parsed = parseQRData(qrData);
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe('location');
      expect(parsed?.id).toBe('test-uuid-123');
      expect(parsed?.name).toBe('Office');
    });

    it('should parse QR data with prefix', () => {
      const qrData = 'WAREHOUSE-LOC:test-uuid-123:Office';
      const parsed = parseQRData(qrData);
      expect(parsed).not.toBeNull();
      expect(parsed?.prefix).toBe('WAREHOUSE');
      expect(parsed?.type).toBe('location');
    });

    it('should parse pre-generated QR data', () => {
      const qrData = 'PRE:test-uuid-456';
      const parsed = parseQRData(qrData);
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe('pregenerated');
    });

    it('should return null for invalid QR data', () => {
      const parsed = parseQRData('invalid');
      expect(parsed).toBeNull();
    });
  });

  describe('isValidQRData', () => {
    it('should return true for valid QR data', () => {
      const qrData = 'LOC:a1b2c3d4-e5f6-7890-abcd-ef1234567890:Test';
      expect(isValidQRData(qrData)).toBe(true);
    });

    it('should return false for invalid QR data', () => {
      expect(isValidQRData('invalid')).toBe(false);
      expect(isValidQRData('LOC:not-a-uuid:Test')).toBe(false);
    });
  });
});
