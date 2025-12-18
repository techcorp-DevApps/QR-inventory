import { describe, it, expect } from 'vitest';
import type { InventoryData, PreGeneratedQR } from '../types/inventory';

// Inline the validation function for testing
function validateBackupData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const backup = data as Record<string, unknown>;
  
  if (typeof backup.version !== 'string') return false;
  if (typeof backup.exportedAt !== 'string') return false;
  if (!backup.inventory || typeof backup.inventory !== 'object') return false;
  
  const inventory = backup.inventory as Record<string, unknown>;
  
  if (!Array.isArray(inventory.locations)) return false;
  if (!Array.isArray(inventory.areas)) return false;
  if (!Array.isArray(inventory.sections)) return false;
  if (!Array.isArray(inventory.items)) return false;
  
  if (backup.preGeneratedQRs !== undefined && !Array.isArray(backup.preGeneratedQRs)) {
    return false;
  }
  
  return true;
}

// Inline the createBackupData function for testing
function createBackupData(
  inventory: InventoryData,
  preGeneratedQRs: PreGeneratedQR[]
) {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    inventory,
    preGeneratedQRs,
  };
}

// Inline the getBackupSummary function for testing
function getBackupSummary(data: {
  inventory: InventoryData;
  preGeneratedQRs?: PreGeneratedQR[];
  exportedAt: string;
}) {
  return {
    locations: data.inventory.locations.length,
    areas: data.inventory.areas.length,
    sections: data.inventory.sections.length,
    items: data.inventory.items.length,
    preGeneratedQRs: data.preGeneratedQRs?.length || 0,
    exportedAt: data.exportedAt,
  };
}

describe('Backup Utils', () => {
  describe('validateBackupData', () => {
    it('should validate correct backup data', () => {
      const validBackup = {
        version: '1.0',
        exportedAt: '2024-01-15T10:00:00.000Z',
        inventory: {
          locations: [],
          areas: [],
          sections: [],
          items: [],
        },
        preGeneratedQRs: [],
      };

      expect(validateBackupData(validBackup)).toBe(true);
    });

    it('should validate backup with inventory data', () => {
      const validBackup = {
        version: '1.0',
        exportedAt: '2024-01-15T10:00:00.000Z',
        inventory: {
          locations: [{ id: '1', name: 'Office', qrData: 'LOC:1', type: 'location', createdAt: '2024-01-15' }],
          areas: [{ id: '2', name: 'Desk', qrData: 'ARE:2', type: 'area', locationId: '1', createdAt: '2024-01-15' }],
          sections: [],
          items: [],
        },
        preGeneratedQRs: [],
      };

      expect(validateBackupData(validBackup)).toBe(true);
    });

    it('should reject null data', () => {
      expect(validateBackupData(null)).toBe(false);
    });

    it('should reject non-object data', () => {
      expect(validateBackupData('string')).toBe(false);
      expect(validateBackupData(123)).toBe(false);
      expect(validateBackupData([])).toBe(false);
    });

    it('should reject missing version', () => {
      const invalid = {
        exportedAt: '2024-01-15T10:00:00.000Z',
        inventory: { locations: [], areas: [], sections: [], items: [] },
      };
      expect(validateBackupData(invalid)).toBe(false);
    });

    it('should reject missing exportedAt', () => {
      const invalid = {
        version: '1.0',
        inventory: { locations: [], areas: [], sections: [], items: [] },
      };
      expect(validateBackupData(invalid)).toBe(false);
    });

    it('should reject missing inventory', () => {
      const invalid = {
        version: '1.0',
        exportedAt: '2024-01-15T10:00:00.000Z',
      };
      expect(validateBackupData(invalid)).toBe(false);
    });

    it('should reject incomplete inventory structure', () => {
      const invalid = {
        version: '1.0',
        exportedAt: '2024-01-15T10:00:00.000Z',
        inventory: { locations: [] }, // Missing areas, sections, items
      };
      expect(validateBackupData(invalid)).toBe(false);
    });

    it('should reject invalid preGeneratedQRs type', () => {
      const invalid = {
        version: '1.0',
        exportedAt: '2024-01-15T10:00:00.000Z',
        inventory: { locations: [], areas: [], sections: [], items: [] },
        preGeneratedQRs: 'not an array',
      };
      expect(validateBackupData(invalid)).toBe(false);
    });
  });

  describe('createBackupData', () => {
    it('should create valid backup data structure', () => {
      const inventory: InventoryData = {
        locations: [{ id: '1', name: 'Office', qrData: 'LOC:1', type: 'location', createdAt: '2024-01-15' }],
        areas: [],
        sections: [],
        items: [],
      };
      const preQRs: PreGeneratedQR[] = [
        { qrData: 'PRE:123', prefix: null, createdAt: '2024-01-15', assignedTo: null, assignedType: null },
      ];

      const backup = createBackupData(inventory, preQRs);

      expect(backup.version).toBe('1.0');
      expect(backup.exportedAt).toBeDefined();
      expect(backup.inventory).toEqual(inventory);
      expect(backup.preGeneratedQRs).toEqual(preQRs);
    });

    it('should include ISO timestamp', () => {
      const inventory: InventoryData = { locations: [], areas: [], sections: [], items: [] };
      const backup = createBackupData(inventory, []);

      expect(backup.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('getBackupSummary', () => {
    it('should return correct counts', () => {
      const backup = {
        version: '1.0',
        exportedAt: '2024-01-15T10:00:00.000Z',
        inventory: {
          locations: [{ id: '1' }, { id: '2' }] as any,
          areas: [{ id: '1' }] as any,
          sections: [{ id: '1' }, { id: '2' }, { id: '3' }] as any,
          items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }] as any,
        },
        preGeneratedQRs: [{ qrData: '1' }, { qrData: '2' }] as any,
      };

      const summary = getBackupSummary(backup);

      expect(summary.locations).toBe(2);
      expect(summary.areas).toBe(1);
      expect(summary.sections).toBe(3);
      expect(summary.items).toBe(4);
      expect(summary.preGeneratedQRs).toBe(2);
      expect(summary.exportedAt).toBe('2024-01-15T10:00:00.000Z');
    });

    it('should handle empty backup', () => {
      const backup = {
        version: '1.0',
        exportedAt: '2024-01-15T10:00:00.000Z',
        inventory: {
          locations: [],
          areas: [],
          sections: [],
          items: [],
        },
        preGeneratedQRs: [],
      };

      const summary = getBackupSummary(backup);

      expect(summary.locations).toBe(0);
      expect(summary.areas).toBe(0);
      expect(summary.sections).toBe(0);
      expect(summary.items).toBe(0);
      expect(summary.preGeneratedQRs).toBe(0);
    });

    it('should handle missing preGeneratedQRs', () => {
      const backup = {
        version: '1.0',
        exportedAt: '2024-01-15T10:00:00.000Z',
        inventory: {
          locations: [],
          areas: [],
          sections: [],
          items: [],
        },
      };

      const summary = getBackupSummary(backup);

      expect(summary.preGeneratedQRs).toBe(0);
    });
  });
});
