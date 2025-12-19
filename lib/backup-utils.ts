import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import type { InventoryData, PreGeneratedQR } from '@/types/inventory';

export interface BackupData {
  version: string;
  exportedAt: string;
  inventory: InventoryData;
  preGeneratedQRs: PreGeneratedQR[];
  // Metadata for backup info
  metadata?: {
    appVersion: string;
    deviceInfo?: string;
    totalPhotos?: number;
  };
}

const BACKUP_VERSION = '2.0'; // Updated version for new features
const APP_VERSION = '1.1.0';

/**
 * Create a backup object from current inventory data
 */
export function createBackupData(
  inventory: InventoryData,
  preGeneratedQRs: PreGeneratedQR[]
): BackupData {
  // Count total photos across all items
  const totalPhotos = inventory.items.reduce((count, item) => {
    return count + (item.photos?.length || 0);
  }, 0);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    inventory,
    preGeneratedQRs,
    metadata: {
      appVersion: APP_VERSION,
      totalPhotos,
    },
  };
}

/**
 * Validate backup data structure
 */
export function validateBackupData(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;
  
  const backup = data as Record<string, unknown>;
  
  // Check required fields
  if (typeof backup.version !== 'string') return false;
  if (typeof backup.exportedAt !== 'string') return false;
  if (!backup.inventory || typeof backup.inventory !== 'object') return false;
  
  const inventory = backup.inventory as Record<string, unknown>;
  
  // Check inventory structure
  if (!Array.isArray(inventory.locations)) return false;
  if (!Array.isArray(inventory.areas)) return false;
  if (!Array.isArray(inventory.sections)) return false;
  if (!Array.isArray(inventory.items)) return false;
  
  // Check preGeneratedQRs (optional for older backups)
  if (backup.preGeneratedQRs !== undefined && !Array.isArray(backup.preGeneratedQRs)) {
    return false;
  }
  
  return true;
}

/**
 * Migrate backup data from older versions to current version
 */
export function migrateBackupData(data: BackupData): BackupData {
  // Version 1.0 to 2.0 migration
  if (data.version === '1.0') {
    // Add default values for new fields in items
    const migratedItems = data.inventory.items.map(item => ({
      ...item,
      quantity: item.quantity ?? 1,
      condition: item.condition ?? 'good',
    }));

    // Add default values for new fields in locations
    const migratedLocations = data.inventory.locations.map(location => ({
      ...location,
      // icon and color are optional, so no defaults needed
    }));

    // Add default values for new fields in preGeneratedQRs
    const migratedQRs = (data.preGeneratedQRs || []).map(qr => ({
      ...qr,
      // label and notes are optional, so no defaults needed
    }));

    return {
      ...data,
      version: BACKUP_VERSION,
      inventory: {
        ...data.inventory,
        items: migratedItems,
        locations: migratedLocations,
      },
      preGeneratedQRs: migratedQRs,
      metadata: {
        appVersion: APP_VERSION,
        totalPhotos: migratedItems.reduce((count, item) => count + (item.photos?.length || 0), 0),
      },
    };
  }

  return data;
}

/**
 * Export backup data to a JSON file and share/download it
 */
export async function exportBackup(
  inventory: InventoryData,
  preGeneratedQRs: PreGeneratedQR[]
): Promise<void> {
  const backupData = createBackupData(inventory, preGeneratedQRs);
  const jsonString = JSON.stringify(backupData, null, 2);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `inventory-backup-${timestamp}.json`;

  if (Platform.OS === 'web') {
    // Web: Create a download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Mobile: Save to file and share using new API
    const file = new File(Paths.cache, filename);
    await file.write(jsonString);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Inventory Backup',
        UTI: 'public.json',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  }
}

/**
 * Import backup data from a JSON file
 */
export async function importBackup(): Promise<BackupData | null> {
  try {
    if (Platform.OS === 'web') {
      // Web: Use file input
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        
        input.onchange = async (event) => {
          const fileInput = (event.target as HTMLInputElement).files?.[0];
          if (!fileInput) {
            resolve(null);
            return;
          }

          try {
            const text = await fileInput.text();
            const data = JSON.parse(text);
            
            if (!validateBackupData(data)) {
              reject(new Error('Invalid backup file format'));
              return;
            }
            
            // Migrate if needed
            const migratedData = migrateBackupData(data);
            resolve(migratedData);
          } catch (error) {
            reject(new Error('Failed to parse backup file'));
          }
        };

        input.oncancel = () => resolve(null);
        input.click();
      });
    } else {
      // Mobile: Use document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const fileUri = result.assets[0].uri;
      const file = new File(fileUri);
      const content = await file.text();

      const data = JSON.parse(content);
      
      if (!validateBackupData(data)) {
        throw new Error('Invalid backup file format');
      }

      // Migrate if needed
      return migrateBackupData(data);
    }
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  }
}

/**
 * Get backup file size estimate
 */
export function getBackupSizeEstimate(
  inventory: InventoryData,
  preGeneratedQRs: PreGeneratedQR[]
): string {
  const backupData = createBackupData(inventory, preGeneratedQRs);
  const jsonString = JSON.stringify(backupData);
  const bytes = new Blob([jsonString]).size;
  
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Get summary of backup data
 */
export function getBackupSummary(data: BackupData): {
  locations: number;
  areas: number;
  sections: number;
  items: number;
  preGeneratedQRs: number;
  exportedAt: string;
  version: string;
  totalPhotos: number;
  hasCustomFields: boolean;
} {
  const totalPhotos = data.inventory.items.reduce((count, item) => {
    return count + (item.photos?.length || 0);
  }, 0);

  const hasCustomFields = data.inventory.items.some(item => 
    item.customFields && item.customFields.length > 0
  );

  return {
    locations: data.inventory.locations.length,
    areas: data.inventory.areas.length,
    sections: data.inventory.sections.length,
    items: data.inventory.items.length,
    preGeneratedQRs: data.preGeneratedQRs?.length || 0,
    exportedAt: data.exportedAt,
    version: data.version,
    totalPhotos,
    hasCustomFields,
  };
}

/**
 * Export backup without photos (smaller file size)
 */
export async function exportBackupWithoutPhotos(
  inventory: InventoryData,
  preGeneratedQRs: PreGeneratedQR[]
): Promise<void> {
  // Create a copy of inventory without photos
  const inventoryWithoutPhotos: InventoryData = {
    ...inventory,
    items: inventory.items.map(item => {
      const { photos, ...itemWithoutPhotos } = item;
      return itemWithoutPhotos;
    }),
  };

  await exportBackup(inventoryWithoutPhotos, preGeneratedQRs);
}

/**
 * Validate that imported data is compatible with current app version
 */
export function checkBackupCompatibility(data: BackupData): {
  compatible: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Check version
  const [majorVersion] = data.version.split('.').map(Number);
  const [currentMajor] = BACKUP_VERSION.split('.').map(Number);
  
  if (majorVersion > currentMajor) {
    return {
      compatible: false,
      warnings: ['This backup was created with a newer version of the app and may not be compatible.'],
    };
  }

  if (majorVersion < currentMajor) {
    warnings.push('This backup was created with an older version and will be automatically migrated.');
  }

  // Check for large photo data
  const totalPhotos = data.inventory.items.reduce((count, item) => {
    return count + (item.photos?.length || 0);
  }, 0);

  if (totalPhotos > 100) {
    warnings.push(`This backup contains ${totalPhotos} photos which may take a while to restore.`);
  }

  return {
    compatible: true,
    warnings,
  };
}
