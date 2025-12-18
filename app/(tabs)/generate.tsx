import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useInventoryContext } from '@/contexts/inventory-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { qrDataToHex, formatHexForDisplay } from '@/lib/qr-utils';
import { exportQRCodesToPDF, printQRCodes } from '@/lib/pdf-export';

type ViewMode = 'generate' | 'list' | 'print';

export default function GenerateScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { preGeneratedQRs, generateBulkQRs, deletePreGeneratedQR, clearUnassignedPreQRs, getUnassignedPreQRs } = useInventoryContext();

  const [viewMode, setViewMode] = useState<ViewMode>('generate');
  const [count, setCount] = useState('10');
  const [prefix, setPrefix] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const unassignedQRs = useMemo(() => getUnassignedPreQRs(), [getUnassignedPreQRs, preGeneratedQRs]);

  const handleGenerate = async () => {
    const num = parseInt(count, 10);
    if (isNaN(num) || num < 1 || num > 100) {
      Alert.alert('Invalid Count', 'Please enter a number between 1 and 100');
      return;
    }

    setIsGenerating(true);
    try {
      await generateBulkQRs(num, prefix.trim() || undefined);
      Alert.alert('Success', `Generated ${num} QR codes${prefix ? ` with prefix "${prefix}"` : ''}`);
      setViewMode('list');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate QR codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearUnassigned = () => {
    Alert.alert(
      'Clear Unassigned QR Codes',
      `Are you sure you want to delete ${unassignedQRs.length} unassigned QR codes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: clearUnassignedPreQRs,
        },
      ]
    );
  };

  const handleExportPDF = async () => {
    if (unassignedQRs.length === 0) {
      Alert.alert('No QR Codes', 'Generate some QR codes first to export as PDF');
      return;
    }

    setIsExporting(true);
    try {
      await exportQRCodesToPDF(unassignedQRs, 'QR_Codes_Export');
      Alert.alert('Success', 'PDF exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    if (unassignedQRs.length === 0) {
      Alert.alert('No QR Codes', 'Generate some QR codes first to print');
      return;
    }

    setIsExporting(true);
    try {
      await printQRCodes(unassignedQRs, 'QR Codes');
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to print. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderGenerateView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          Bulk Generate QR Codes
        </ThemedText>
        <ThemedText style={[styles.cardDesc, { color: colors.textSecondary }]}>
          Generate QR codes in advance for printing. These can be assigned to locations or items later.
        </ThemedText>

        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
            Number of QR Codes
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.elevated, color: colors.text }]}
            value={count}
            onChangeText={setCount}
            keyboardType="number-pad"
            placeholder="10"
            placeholderTextColor={colors.textDisabled}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
            Prefix (Optional)
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.elevated, color: colors.text }]}
            value={prefix}
            onChangeText={setPrefix}
            placeholder="e.g., WAREHOUSE, OFFICE"
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="characters"
          />
          <ThemedText style={[styles.hint, { color: colors.textDisabled }]}>
            Use prefixes to classify QR codes by department, building, etc.
          </ThemedText>
        </View>

        <Pressable
          style={[styles.generateButton, { backgroundColor: colors.tint, opacity: isGenerating ? 0.7 : 1 }]}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          <MaterialIcons name="qr-code-2" size={24} color="#FFFFFF" />
          <ThemedText style={styles.generateButtonText}>
            {isGenerating ? 'Generating...' : 'Generate QR Codes'}
          </ThemedText>
        </Pressable>
      </View>

      {/* Stats Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          QR Code Stats
        </ThemedText>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statNumber, { color: colors.tint }]}>
              {preGeneratedQRs.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Generated
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statNumber, { color: '#10B981' }]}>
              {preGeneratedQRs.length - unassignedQRs.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Assigned
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statNumber, { color: '#F59E0B' }]}>
              {unassignedQRs.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Unassigned
            </ThemedText>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderListView = () => (
    <View style={styles.listContainer}>
      <View style={styles.listHeader}>
        <ThemedText style={[styles.listTitle, { color: colors.textSecondary }]}>
          {unassignedQRs.length} Unassigned QR Codes
        </ThemedText>
        {unassignedQRs.length > 0 && (
          <Pressable onPress={handleClearUnassigned}>
            <ThemedText style={{ color: '#EF4444' }}>Clear All</ThemedText>
          </Pressable>
        )}
      </View>

      {unassignedQRs.length === 0 ? (
        <View style={styles.emptyList}>
          <MaterialIcons name="qr-code-2" size={64} color={colors.textDisabled} />
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            No unassigned QR codes
          </ThemedText>
          <ThemedText style={[styles.emptyHint, { color: colors.textDisabled }]}>
            Generate some QR codes to get started
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={unassignedQRs}
          keyExtractor={(item) => item.qrData}
          contentContainerStyle={styles.qrList}
          renderItem={({ item }) => (
            <View style={[styles.qrItem, { backgroundColor: colors.card }]}>
              <View style={styles.qrPreview}>
                <QRCode value={item.qrData} size={60} backgroundColor="transparent" color={colors.text} />
              </View>
              <View style={styles.qrInfo}>
                {item.prefix && (
                  <View style={[styles.prefixTag, { backgroundColor: colors.tint + '20' }]}>
                    <ThemedText style={[styles.prefixText, { color: colors.tint }]}>
                      {item.prefix}
                    </ThemedText>
                  </View>
                )}
                <ThemedText style={[styles.qrHex, { color: colors.textSecondary }]} numberOfLines={1}>
                  {formatHexForDisplay(qrDataToHex(item.qrData)).substring(0, 24)}...
                </ThemedText>
                <ThemedText style={[styles.qrDate, { color: colors.textDisabled }]}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </ThemedText>
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => deletePreGeneratedQR(item.qrData)}
              >
                <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );

  const renderPrintView = () => (
    <ScrollView contentContainerStyle={styles.printContainer}>
      <View style={[styles.printHeader, { backgroundColor: colors.card }]}>
        <ThemedText type="subtitle">Print Preview</ThemedText>
        <ThemedText style={[styles.printHint, { color: colors.textSecondary }]}>
          {unassignedQRs.length} QR codes ready for printing
        </ThemedText>
        
        {/* Export Buttons */}
        <View style={styles.exportButtons}>
          <Pressable
            style={[styles.exportButton, { backgroundColor: colors.tint, opacity: isExporting ? 0.7 : 1 }]}
            onPress={handleExportPDF}
            disabled={isExporting || unassignedQRs.length === 0}
          >
            <MaterialIcons name="picture-as-pdf" size={20} color="#FFFFFF" />
            <ThemedText style={styles.exportButtonText}>
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </ThemedText>
          </Pressable>
          
          <Pressable
            style={[styles.exportButton, { backgroundColor: '#10B981', opacity: isExporting ? 0.7 : 1 }]}
            onPress={handlePrint}
            disabled={isExporting || unassignedQRs.length === 0}
          >
            <MaterialIcons name="print" size={20} color="#FFFFFF" />
            <ThemedText style={styles.exportButtonText}>
              Print
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.printGrid}>
        {unassignedQRs.map((qr) => (
          <View key={qr.qrData} style={[styles.printCard, { backgroundColor: '#FFFFFF' }]}>
            <QRCode value={qr.qrData} size={100} backgroundColor="#FFFFFF" color="#000000" />
            {qr.prefix && (
              <ThemedText style={styles.printPrefix}>{qr.prefix}</ThemedText>
            )}
            <ThemedText style={styles.printHex} numberOfLines={2}>
              {formatHexForDisplay(qrDataToHex(qr.qrData)).substring(0, 32)}
            </ThemedText>
          </View>
        ))}
      </View>

      {unassignedQRs.length === 0 && (
        <View style={styles.emptyList}>
          <ThemedText style={{ color: colors.textSecondary }}>
            No QR codes to print
          </ThemedText>
        </View>
      )}
    </ScrollView>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.lg) }]}>
        <ThemedText type="title">QR Codes</ThemedText>
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabBar, { backgroundColor: colors.elevated }]}>
        <Pressable
          style={[styles.tab, viewMode === 'generate' && { backgroundColor: colors.card }]}
          onPress={() => setViewMode('generate')}
        >
          <ThemedText style={[styles.tabText, viewMode === 'generate' && { color: colors.tint }]}>
            Generate
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tab, viewMode === 'list' && { backgroundColor: colors.card }]}
          onPress={() => setViewMode('list')}
        >
          <ThemedText style={[styles.tabText, viewMode === 'list' && { color: colors.tint }]}>
            List ({unassignedQRs.length})
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tab, viewMode === 'print' && { backgroundColor: colors.card }]}
          onPress={() => setViewMode('print')}
        >
          <ThemedText style={[styles.tabText, viewMode === 'print' && { color: colors.tint }]}>
            Print
          </ThemedText>
        </Pressable>
      </View>

      {viewMode === 'generate' && renderGenerateView()}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'print' && renderPrintView()}
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm - 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  listTitle: {
    fontSize: 14,
  },
  qrList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  qrItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  qrPreview: {
    marginRight: Spacing.md,
  },
  qrInfo: {
    flex: 1,
  },
  prefixTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  prefixText: {
    fontSize: 10,
    fontWeight: '600',
  },
  qrHex: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  qrDate: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.lg,
  },
  emptyHint: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  printContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  printHeader: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  printHint: {
    fontSize: 14,
    marginTop: 4,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  printGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  printCard: {
    width: 140,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  printPrefix: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    marginTop: Spacing.sm,
  },
  printHex: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
