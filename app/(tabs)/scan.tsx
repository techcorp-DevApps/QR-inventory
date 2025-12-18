import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QRScanner } from '@/components/qr-scanner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useInventoryContext } from '@/contexts/inventory-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { parseQRData } from '@/lib/qr-utils';

type ScanMode = 'navigate' | 'assign';

interface ScannedResult {
  qrData: string;
  type: 'location' | 'area' | 'section' | 'item' | 'pregenerated' | 'unknown';
  name?: string;
  entityId?: string;
}

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    getLocationById,
    getAreaById,
    getSectionById,
    locations,
    areas,
    sections,
    items,
    preGeneratedQRs,
    getUnassignedPreQRs,
  } = useInventoryContext();

  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('navigate');
  const [lastScanned, setLastScanned] = useState<ScannedResult | null>(null);

  const unassignedQRs = getUnassignedPreQRs();

  const handleScan = (data: string) => {
    setScannerVisible(false);
    
    // Parse the QR data
    const parsed = parseQRData(data);
    
    if (!parsed) {
      // Check if it's a raw QR code from our system by checking against stored data
      const matchingLocation = locations.find(l => l.qrData === data);
      const matchingArea = areas.find(a => a.qrData === data);
      const matchingSection = sections.find(s => s.qrData === data);
      const matchingItem = items.find(i => i.qrData === data);
      const matchingPreGen = preGeneratedQRs.find(p => p.qrData === data);

      if (matchingLocation) {
        handleNavigateToEntity('location', matchingLocation.id, matchingLocation.name);
        return;
      } else if (matchingArea) {
        handleNavigateToEntity('area', matchingArea.id, matchingArea.name, matchingArea.locationId);
        return;
      } else if (matchingSection) {
        handleNavigateToEntity('section', matchingSection.id, matchingSection.name);
        return;
      } else if (matchingItem) {
        setLastScanned({
          qrData: data,
          type: 'item',
          name: matchingItem.name,
          entityId: matchingItem.id,
        });
        Alert.alert('Item Found', `Found item: ${matchingItem.name}`);
        return;
      } else if (matchingPreGen) {
        if (matchingPreGen.assignedTo) {
          Alert.alert('Already Assigned', 'This QR code has already been assigned to an entity.');
        } else {
          setLastScanned({
            qrData: data,
            type: 'pregenerated',
          });
          Alert.alert(
            'Unassigned QR Code',
            'This is a pre-generated QR code that hasn\'t been assigned yet. Would you like to assign it to an entity?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Assign', onPress: () => showAssignmentOptions(data) },
            ]
          );
        }
        return;
      }

      setLastScanned({
        qrData: data,
        type: 'unknown',
      });
      Alert.alert('Unknown QR Code', 'This QR code is not recognized by the inventory system.');
      return;
    }

    // Handle parsed QR data
    if (parsed.type === 'pregenerated') {
      const preGen = preGeneratedQRs.find(p => p.qrData === data);
      if (preGen?.assignedTo) {
        Alert.alert('Already Assigned', 'This QR code has already been assigned.');
      } else {
        setLastScanned({
          qrData: data,
          type: 'pregenerated',
        });
        Alert.alert(
          'Unassigned QR Code',
          'Would you like to assign this QR code to an entity?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Assign', onPress: () => showAssignmentOptions(data) },
          ]
        );
      }
      return;
    }

    // Navigate to the entity
    setLastScanned({
      qrData: data,
      type: parsed.type as any,
      name: parsed.name,
      entityId: parsed.id,
    });

    handleNavigateToEntity(parsed.type, parsed.id, parsed.name);
  };

  const handleNavigateToEntity = (type: string, id: string, name?: string, locationId?: string) => {
    switch (type) {
      case 'location':
        router.push(`/location/${id}` as any);
        break;
      case 'area':
        if (locationId) {
          router.push(`/area/${locationId}/${id}` as any);
        } else {
          const area = getAreaById(id);
          if (area) {
            router.push(`/area/${area.locationId}/${id}` as any);
          }
        }
        break;
      case 'section':
        router.push(`/section/${id}` as any);
        break;
      case 'item':
        Alert.alert('Item Found', `Found item: ${name || 'Unknown'}`);
        break;
    }
  };

  const showAssignmentOptions = (qrData: string) => {
    Alert.alert(
      'Assign QR Code',
      'This feature allows you to assign this QR code to an existing entity. Go to the entity and use "Edit QR Code" to assign this code.',
      [{ text: 'OK' }]
    );
  };

  const openScanner = (mode: ScanMode) => {
    setScanMode(mode);
    setScannerVisible(true);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.lg) }]}>
        <ThemedText type="title">Scan</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Scan QR codes to navigate or assign
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Quick Scan Card */}
        <Pressable
          style={[styles.scanCard, { backgroundColor: colors.tint }]}
          onPress={() => openScanner('navigate')}
        >
          <View style={styles.scanCardIcon}>
            <MaterialIcons name="qr-code-scanner" size={48} color="#FFFFFF" />
          </View>
          <View style={styles.scanCardText}>
            <ThemedText style={styles.scanCardTitle}>Quick Scan</ThemedText>
            <ThemedText style={styles.scanCardDesc}>
              Scan any QR code to navigate to its location or item
            </ThemedText>
          </View>
          <MaterialIcons name="chevron-right" size={28} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <ThemedText type="subtitle" style={styles.statsTitle}>Inventory Stats</ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statNumber, { color: colors.location }]}>
                {locations.length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Locations
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statNumber, { color: colors.area }]}>
                {areas.length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Areas
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statNumber, { color: colors.section }]}>
                {sections.length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Sections
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statNumber, { color: colors.item }]}>
                {items.length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Items
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Pre-generated QR Stats */}
        <View style={[styles.preGenCard, { backgroundColor: colors.card }]}>
          <View style={styles.preGenHeader}>
            <MaterialIcons name="qr-code-2" size={24} color={colors.tint} />
            <ThemedText type="subtitle" style={styles.preGenTitle}>Pre-generated QR Codes</ThemedText>
          </View>
          <View style={styles.preGenStats}>
            <View style={styles.preGenStat}>
              <ThemedText style={[styles.preGenNumber, { color: colors.tint }]}>
                {preGeneratedQRs.length}
              </ThemedText>
              <ThemedText style={[styles.preGenLabel, { color: colors.textSecondary }]}>
                Total
              </ThemedText>
            </View>
            <View style={[styles.preGenDivider, { backgroundColor: colors.border }]} />
            <View style={styles.preGenStat}>
              <ThemedText style={[styles.preGenNumber, { color: '#F59E0B' }]}>
                {unassignedQRs.length}
              </ThemedText>
              <ThemedText style={[styles.preGenLabel, { color: colors.textSecondary }]}>
                Unassigned
              </ThemedText>
            </View>
            <View style={[styles.preGenDivider, { backgroundColor: colors.border }]} />
            <View style={styles.preGenStat}>
              <ThemedText style={[styles.preGenNumber, { color: '#10B981' }]}>
                {preGeneratedQRs.length - unassignedQRs.length}
              </ThemedText>
              <ThemedText style={[styles.preGenLabel, { color: colors.textSecondary }]}>
                Assigned
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Last Scanned */}
        {lastScanned && (
          <View style={[styles.lastScannedCard, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.lastScannedLabel, { color: colors.textSecondary }]}>
              Last Scanned
            </ThemedText>
            <View style={styles.lastScannedContent}>
              <MaterialIcons 
                name={lastScanned.type === 'unknown' ? 'help-outline' : 'qr-code-2'} 
                size={24} 
                color={lastScanned.type === 'unknown' ? colors.textDisabled : colors.tint} 
              />
              <View style={styles.lastScannedText}>
                <ThemedText style={styles.lastScannedType}>
                  {lastScanned.type.charAt(0).toUpperCase() + lastScanned.type.slice(1)}
                </ThemedText>
                {lastScanned.name && (
                  <ThemedText style={[styles.lastScannedName, { color: colors.textSecondary }]}>
                    {lastScanned.name}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.elevated }]}>
          <ThemedText style={[styles.tipsTitle, { color: colors.textSecondary }]}>
            Quick Tips
          </ThemedText>
          <View style={styles.tipItem}>
            <MaterialIcons name="lightbulb-outline" size={18} color={colors.textDisabled} />
            <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
              Long-press any tile to view and edit its QR code
            </ThemedText>
          </View>
          <View style={styles.tipItem}>
            <MaterialIcons name="lightbulb-outline" size={18} color={colors.textDisabled} />
            <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
              Use the QR Codes tab to generate codes in bulk
            </ThemedText>
          </View>
          <View style={styles.tipItem}>
            <MaterialIcons name="lightbulb-outline" size={18} color={colors.textDisabled} />
            <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
              Scan pre-generated QR codes to assign them to items
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Scanner Modal */}
      <Modal
        visible={scannerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setScannerVisible(false)}
      >
        <QRScanner
          onScan={handleScan}
          onClose={() => setScannerVisible(false)}
          title={scanMode === 'navigate' ? 'Scan to Navigate' : 'Scan to Assign'}
          subtitle={scanMode === 'navigate' ? 'Point at any inventory QR code' : 'Scan a pre-generated QR code'}
        />
      </Modal>
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
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.lg,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  scanCardIcon: {
    marginRight: Spacing.lg,
  },
  scanCardText: {
    flex: 1,
  },
  scanCardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  scanCardDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  statsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  statsTitle: {
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  preGenCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  preGenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  preGenTitle: {
    fontSize: 16,
  },
  preGenStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preGenStat: {
    flex: 1,
    alignItems: 'center',
  },
  preGenNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  preGenLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  preGenDivider: {
    width: 1,
    height: 40,
  },
  lastScannedCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  lastScannedLabel: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  lastScannedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  lastScannedText: {
    flex: 1,
  },
  lastScannedType: {
    fontSize: 16,
    fontWeight: '600',
  },
  lastScannedName: {
    fontSize: 14,
    marginTop: 2,
  },
  tipsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
