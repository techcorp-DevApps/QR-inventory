import React, { useState, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatHexForDisplay, qrDataToHex } from '@/lib/qr-utils';
import type { PreGeneratedQR, Item } from '@/types/inventory';

interface BatchAssignModalProps {
  visible: boolean;
  onClose: () => void;
  onAssign: (qrCodes: PreGeneratedQR[], items: Item[]) => void;
  availableQRCodes: PreGeneratedQR[];
  availableItems: Item[];
}

export function BatchAssignModal({
  visible,
  onClose,
  onAssign,
  availableQRCodes,
  availableItems,
}: BatchAssignModalProps) {
  const [selectedQRs, setSelectedQRs] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'qr' | 'items'>('qr');
  const [searchQuery, setSearchQuery] = useState('');
  
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Filter unassigned QR codes
  const unassignedQRs = useMemo(() => 
    availableQRCodes.filter(qr => !qr.assignedTo),
    [availableQRCodes]
  );

  // Filter items without custom QR (items that could use pre-generated QRs)
  const assignableItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return availableItems.filter(item => 
      item.name.toLowerCase().includes(query)
    );
  }, [availableItems, searchQuery]);

  const handleToggleQR = (qrData: string) => {
    const newSelected = new Set(selectedQRs);
    if (newSelected.has(qrData)) {
      newSelected.delete(qrData);
    } else {
      newSelected.add(qrData);
    }
    setSelectedQRs(newSelected);
  };

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      // Limit selection to number of selected QRs
      if (newSelected.size < selectedQRs.size) {
        newSelected.add(itemId);
      } else {
        Alert.alert(
          'Selection Limit',
          `You can only select up to ${selectedQRs.size} items to match the selected QR codes.`
        );
      }
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAllQRs = () => {
    if (selectedQRs.size === unassignedQRs.length) {
      setSelectedQRs(new Set());
    } else {
      setSelectedQRs(new Set(unassignedQRs.map(qr => qr.qrData)));
    }
  };

  const handleNextStep = () => {
    if (selectedQRs.size === 0) {
      Alert.alert('No Selection', 'Please select at least one QR code to assign.');
      return;
    }
    setStep('items');
  };

  const handleBack = () => {
    setStep('qr');
    setSelectedItems(new Set());
    setSearchQuery('');
  };

  const handleAssign = () => {
    if (selectedItems.size === 0) {
      Alert.alert('No Selection', 'Please select items to assign QR codes to.');
      return;
    }

    if (selectedItems.size !== selectedQRs.size) {
      Alert.alert(
        'Mismatch',
        `You have selected ${selectedQRs.size} QR codes but ${selectedItems.size} items. Please select the same number of items.`
      );
      return;
    }

    const qrCodesToAssign = unassignedQRs.filter(qr => selectedQRs.has(qr.qrData));
    const itemsToAssign = availableItems.filter(item => selectedItems.has(item.id));

    Alert.alert(
      'Confirm Assignment',
      `Assign ${selectedQRs.size} QR codes to ${selectedItems.size} items?\n\nThis will replace the existing QR codes on these items.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: () => {
            onAssign(qrCodesToAssign, itemsToAssign);
            handleClose();
          },
        },
      ]
    );
  };

  const handleClose = () => {
    setSelectedQRs(new Set());
    setSelectedItems(new Set());
    setStep('qr');
    setSearchQuery('');
    onClose();
  };

  const renderQRItem = ({ item }: { item: PreGeneratedQR }) => {
    const isSelected = selectedQRs.has(item.qrData);
    const hexCode = formatHexForDisplay(qrDataToHex(item.qrData)).substring(0, 20);

    return (
      <Pressable
        style={[
          styles.listItem,
          {
            backgroundColor: isSelected ? colors.tint + '20' : colors.card,
            borderColor: isSelected ? colors.tint : 'transparent',
          },
        ]}
        onPress={() => handleToggleQR(item.qrData)}
      >
        <View style={styles.checkbox}>
          {isSelected ? (
            <MaterialIcons name="check-box" size={24} color={colors.tint} />
          ) : (
            <MaterialIcons name="check-box-outline-blank" size={24} color={colors.textSecondary} />
          )}
        </View>
        <View style={styles.qrPreview}>
          <QRCode value={item.qrData} size={40} backgroundColor="transparent" color={colors.text} />
        </View>
        <View style={styles.itemInfo}>
          {item.label && (
            <ThemedText style={styles.itemLabel}>{item.label}</ThemedText>
          )}
          {item.prefix && (
            <View style={[styles.prefixBadge, { backgroundColor: colors.tint + '20' }]}>
              <ThemedText style={[styles.prefixText, { color: colors.tint }]}>
                {item.prefix}
              </ThemedText>
            </View>
          )}
          <ThemedText style={[styles.hexCode, { color: colors.textSecondary }]}>
            {hexCode}...
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const renderItemRow = ({ item }: { item: Item }) => {
    const isSelected = selectedItems.has(item.id);

    return (
      <Pressable
        style={[
          styles.listItem,
          {
            backgroundColor: isSelected ? colors.item + '20' : colors.card,
            borderColor: isSelected ? colors.item : 'transparent',
          },
        ]}
        onPress={() => handleToggleItem(item.id)}
      >
        <View style={styles.checkbox}>
          {isSelected ? (
            <MaterialIcons name="check-box" size={24} color={colors.item} />
          ) : (
            <MaterialIcons name="check-box-outline-blank" size={24} color={colors.textSecondary} />
          )}
        </View>
        <View style={styles.itemInfo}>
          <ThemedText style={styles.itemName}>{item.name}</ThemedText>
          {item.description && (
            <ThemedText style={[styles.itemDescription, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.description}
            </ThemedText>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          {step === 'items' ? (
            <Pressable onPress={handleBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}
          <View style={styles.headerCenter}>
            <ThemedText type="subtitle">
              {step === 'qr' ? 'Select QR Codes' : 'Select Items'}
            </ThemedText>
            <ThemedText style={[styles.stepIndicator, { color: colors.textSecondary }]}>
              Step {step === 'qr' ? '1' : '2'} of 2
            </ThemedText>
          </View>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {step === 'qr' ? (
          <>
            {/* QR Selection Header */}
            <View style={styles.selectionHeader}>
              <ThemedText style={[styles.selectionCount, { color: colors.textSecondary }]}>
                {selectedQRs.size} of {unassignedQRs.length} selected
              </ThemedText>
              <Pressable onPress={handleSelectAllQRs}>
                <ThemedText style={{ color: colors.tint }}>
                  {selectedQRs.size === unassignedQRs.length ? 'Deselect All' : 'Select All'}
                </ThemedText>
              </Pressable>
            </View>

            {/* QR List */}
            <FlatList
              data={unassignedQRs}
              keyExtractor={(item) => item.qrData}
              renderItem={renderQRItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialIcons name="qr-code-2" size={48} color={colors.textDisabled} />
                  <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No unassigned QR codes available
                  </ThemedText>
                </View>
              }
            />

            {/* Next Button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: selectedQRs.size > 0 ? colors.tint : colors.textDisabled },
                ]}
                onPress={handleNextStep}
                disabled={selectedQRs.size === 0}
              >
                <ThemedText style={styles.primaryButtonText}>
                  Next: Select Items ({selectedQRs.size})
                </ThemedText>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </>
        ) : (
          <>
            {/* Item Selection Header */}
            <View style={styles.selectionHeader}>
              <ThemedText style={[styles.selectionCount, { color: colors.textSecondary }]}>
                {selectedItems.size} of {selectedQRs.size} items selected
              </ThemedText>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: colors.elevated }]}>
              <MaterialIcons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search items..."
                placeholderTextColor={colors.textDisabled}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>

            {/* Item List */}
            <FlatList
              data={assignableItems}
              keyExtractor={(item) => item.id}
              renderItem={renderItemRow}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialIcons name="inventory-2" size={48} color={colors.textDisabled} />
                  <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {searchQuery ? 'No items match your search' : 'No items available'}
                  </ThemedText>
                </View>
              }
            />

            {/* Assign Button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: selectedItems.size === selectedQRs.size ? colors.item : colors.textDisabled },
                ]}
                onPress={handleAssign}
                disabled={selectedItems.size !== selectedQRs.size}
              >
                <MaterialIcons name="link" size={20} color="#FFFFFF" />
                <ThemedText style={styles.primaryButtonText}>
                  Assign {selectedItems.size} QR Codes
                </ThemedText>
              </Pressable>
            </View>
          </>
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  stepIndicator: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  selectionCount: {
    fontSize: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
  },
  checkbox: {
    marginRight: Spacing.md,
  },
  qrPreview: {
    marginRight: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  prefixBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  prefixText: {
    fontSize: 10,
    fontWeight: '600',
  },
  hexCode: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
