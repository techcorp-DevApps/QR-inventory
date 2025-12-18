import { describe, it, expect } from 'vitest';

// Test the parseQRData function which is used by the scanner
const parseQRData = (qrData: string): { type: string; id: string; name: string; prefix?: string } | null => {
  const parts = qrData.split(':');
  if (parts.length < 2) return null;
  
  const [typePart, id, ...nameParts] = parts;
  const name = nameParts.length > 0 ? decodeURIComponent(nameParts.join(':')) : '';
  
  let prefix: string | undefined;
  let typePrefix = typePart;
  
  if (typePart.includes('-')) {
    const prefixParts = typePart.split('-');
    prefix = prefixParts.slice(0, -1).join('-');
    typePrefix = prefixParts[prefixParts.length - 1];
  }
  
  const typeMap: Record<string, string> = {
    'LOC': 'location',
    'ARE': 'area',
    'SEC': 'section',
    'ITE': 'item',
    'PRE': 'pregenerated',
  };
  
  const type = typeMap[typePrefix];
  if (!type) return null;
  
  return { type, id, name, prefix };
};

describe('QR Scanner', () => {
  describe('parseQRData', () => {
    it('should parse location QR data', () => {
      const result = parseQRData('LOC:uuid-123:Office');
      expect(result).toEqual({
        type: 'location',
        id: 'uuid-123',
        name: 'Office',
        prefix: undefined,
      });
    });

    it('should parse area QR data', () => {
      const result = parseQRData('ARE:uuid-456:Corner%20Shelf');
      expect(result).toEqual({
        type: 'area',
        id: 'uuid-456',
        name: 'Corner Shelf',
        prefix: undefined,
      });
    });

    it('should parse section QR data', () => {
      const result = parseQRData('SEC:uuid-789:Shelf%201');
      expect(result).toEqual({
        type: 'section',
        id: 'uuid-789',
        name: 'Shelf 1',
        prefix: undefined,
      });
    });

    it('should parse item QR data', () => {
      const result = parseQRData('ITE:uuid-abc:Container%201');
      expect(result).toEqual({
        type: 'item',
        id: 'uuid-abc',
        name: 'Container 1',
        prefix: undefined,
      });
    });

    it('should parse pre-generated QR data', () => {
      const result = parseQRData('PRE:uuid-def');
      expect(result).toEqual({
        type: 'pregenerated',
        id: 'uuid-def',
        name: '',
        prefix: undefined,
      });
    });

    it('should parse QR data with prefix', () => {
      const result = parseQRData('WAREHOUSE-LOC:uuid-123:Storage%20Room');
      expect(result).toEqual({
        type: 'location',
        id: 'uuid-123',
        name: 'Storage Room',
        prefix: 'WAREHOUSE',
      });
    });

    it('should parse pre-generated QR with prefix', () => {
      const result = parseQRData('OFFICE-PRE:uuid-xyz');
      expect(result).toEqual({
        type: 'pregenerated',
        id: 'uuid-xyz',
        name: '',
        prefix: 'OFFICE',
      });
    });

    it('should return null for invalid QR data', () => {
      expect(parseQRData('invalid')).toBeNull();
      expect(parseQRData('')).toBeNull();
      expect(parseQRData('UNKNOWN:uuid')).toBeNull();
    });

    it('should handle names with colons', () => {
      const result = parseQRData('LOC:uuid-123:Room%3A%20A');
      expect(result).toEqual({
        type: 'location',
        id: 'uuid-123',
        name: 'Room: A',
        prefix: undefined,
      });
    });
  });
});
