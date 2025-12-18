import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useInventoryContext } from '@/contexts/inventory-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  exportBackup,
  importBackup,
  getBackupSizeEstimate,
  getBackupSummary,
  type BackupData,
} from '@/lib/backup-utils';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    data,
    preGeneratedQRs,
    locations,
    areas,
    sections,
    items,
    restoreFromBackup,
    clearAllData,
  } = useInventoryContext();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const backupSize = getBackupSizeEstimate(data, preGeneratedQRs);
  const totalItems = locations.length + areas.length + sections.length + items.length;

  const handleExport = async () => {
    if (totalItems === 0 && preGeneratedQRs.length === 0) {
      Alert.alert('Nothing to Export', 'Add some inventory items before creating a backup.');
      return;
    }

    setIsExporting(true);
    try {
      await exportBackup(data, preGeneratedQRs);
      Alert.alert('Success', 'Backup exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Failed to export backup. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const backupData = await importBackup();
      
      if (!backupData) {
        setIsImporting(false);
        return; // User cancelled
      }

      const summary = getBackupSummary(backupData);
      
      Alert.alert(
        'Import Backup',
        `This backup contains:\n• ${summary.locations} locations\n• ${summary.areas} areas\n• ${summary.sections} sections\n• ${summary.items} items\n• ${summary.preGeneratedQRs} pre-generated QR codes\n\nExported: ${new Date(summary.exportedAt).toLocaleString()}\n\nHow would you like to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Merge',
            onPress: () => performImport(backupData, 'merge'),
          },
          {
            text: 'Replace All',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Confirm Replace',
                'This will delete all existing data and replace it with the backup. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Replace',
                    style: 'destructive',
                    onPress: () => performImport(backupData, 'replace'),
                  },
                ]
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', error instanceof Error ? error.message : 'Failed to import backup.');
    } finally {
      setIsImporting(false);
    }
  };

  const performImport = async (backupData: BackupData, mode: 'merge' | 'replace') => {
    try {
      await restoreFromBackup(backupData, mode);
      Alert.alert('Success', `Backup ${mode === 'merge' ? 'merged' : 'restored'} successfully!`);
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', 'Failed to restore backup data.');
    }
  };

  const handleClearData = () => {
    if (totalItems === 0 && preGeneratedQRs.length === 0) {
      Alert.alert('Nothing to Clear', 'Your inventory is already empty.');
      return;
    }

    Alert.alert(
      'Clear All Data',
      `This will permanently delete:\n• ${locations.length} locations\n• ${areas.length} areas\n• ${sections.length} sections\n• ${items.length} items\n• ${preGeneratedQRs.length} pre-generated QR codes\n\nThis action cannot be undone. Consider creating a backup first.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Alert.alert('Cleared', 'All inventory data has been deleted.');
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.lg) }]}>
        <ThemedText type="title">Settings</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Backup Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="backup" size={24} color={colors.tint} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>Data Backup</ThemedText>
          </View>
          
          <ThemedText style={[styles.sectionDesc, { color: colors.textSecondary }]}>
            Export your inventory data as a JSON file for safekeeping or transfer to another device.
          </ThemedText>

          <View style={[styles.statsBox, { backgroundColor: colors.elevated }]}>
            <View style={styles.statRow}>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Items
              </ThemedText>
              <ThemedText style={styles.statValue}>{totalItems}</ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Pre-generated QRs
              </ThemedText>
              <ThemedText style={styles.statValue}>{preGeneratedQRs.length}</ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Estimated Size
              </ThemedText>
              <ThemedText style={styles.statValue}>{backupSize}</ThemedText>
            </View>
          </View>

          <Pressable
            style={[styles.button, { backgroundColor: colors.tint, opacity: isExporting ? 0.7 : 1 }]}
            onPress={handleExport}
            disabled={isExporting}
          >
            <MaterialIcons name="file-download" size={20} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>
              {isExporting ? 'Exporting...' : 'Export Backup'}
            </ThemedText>
          </Pressable>
        </View>

        {/* Restore Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="restore" size={24} color="#10B981" />
            <ThemedText type="subtitle" style={styles.sectionTitle}>Restore Data</ThemedText>
          </View>
          
          <ThemedText style={[styles.sectionDesc, { color: colors.textSecondary }]}>
            Import a previously exported backup file. You can merge with existing data or replace everything.
          </ThemedText>

          <Pressable
            style={[styles.button, { backgroundColor: '#10B981', opacity: isImporting ? 0.7 : 1 }]}
            onPress={handleImport}
            disabled={isImporting}
          >
            <MaterialIcons name="file-upload" size={20} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>
              {isImporting ? 'Importing...' : 'Import Backup'}
            </ThemedText>
          </Pressable>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="warning" size={24} color="#EF4444" />
            <ThemedText type="subtitle" style={styles.sectionTitle}>Danger Zone</ThemedText>
          </View>
          
          <ThemedText style={[styles.sectionDesc, { color: colors.textSecondary }]}>
            Permanently delete all inventory data. This action cannot be undone.
          </ThemedText>

          <Pressable
            style={[styles.button, styles.dangerButton]}
            onPress={handleClearData}
          >
            <MaterialIcons name="delete-forever" size={20} color="#EF4444" />
            <ThemedText style={[styles.buttonText, { color: '#EF4444' }]}>
              Clear All Data
            </ThemedText>
          </Pressable>
        </View>

        {/* App Info */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info-outline" size={24} color={colors.textSecondary} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>About</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>
              App Version
            </ThemedText>
            <ThemedText>1.0.0</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Backup Format
            </ThemedText>
            <ThemedText>JSON v1.0</ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.lg,
  },
  section: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
  },
  sectionDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  statsBox: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
});
