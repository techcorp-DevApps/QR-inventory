import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { BulkItemTemplate, Item } from '@/types/inventory';
import { generateId } from '@/lib/qr-utils';

interface BulkItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (items: BulkItemTemplate[]) => void;
  locationName: string;
  areaName: string;
  sectionName?: string;
}

interface ItemEntry {
  id: string;
  name: string;
  quantity: string;
  condition: Item['condition'];
}

const CONDITIONS: { value: Item['condition']; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export function BulkItemModal({
  visible,
  onClose,
  onSave,
  locationName,
  areaName,
  sectionName,
}: BulkItemModalProps) {
  const [items, setItems] = useState<ItemEntry[]>([
    { id: generateId(), name: '', quantity: '1', condition: 'good' },
  ]);
  const [defaultCondition, setDefaultCondition] = useState<Item['condition']>('good');
  
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleAddItem = () => {
    setItems([...items, { id: generateId(), name: '', quantity: '1', condition: defaultCondition }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleUpdateItem = (id: string, field: keyof ItemEntry, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleQuickAdd = (count: number) => {
    const newItems: ItemEntry[] = [];
    for (let i = 0; i < count; i++) {
      newItems.push({ id: generateId(), name: '', quantity: '1', condition: defaultCondition });
    }
    setItems([...items, ...newItems]);
  };

  const handleSave = () => {
    const validItems = items.filter(item => item.name.trim());
    
    if (validItems.length === 0) {
      Alert.alert('Error', 'Please enter at least one item name');
      return;
    }

    const bulkItems: BulkItemTemplate[] = validItems.map(item => ({
      name: item.name.trim(),
      quantity: parseInt(item.quantity, 10) || 1,
      condition: item.condition,
    }));

    onSave(bulkItems);
    setItems([{ id: generateId(), name: '', quantity: '1', condition: 'good' }]);
    onClose();
  };

  const handleClose = () => {
    setItems([{ id: generateId(), name: '', quantity: '1', condition: 'good' }]);
    onClose();
  };

  const breadcrumb = sectionName 
    ? `${locationName} > ${areaName} > ${sectionName}`
    : `${locationName} > ${areaName}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <ThemedView
          style={[
            styles.container,
            { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
          ]}
        >
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <View>
              <ThemedText type="subtitle">Add Multiple Items</ThemedText>
              <ThemedText style={[styles.breadcrumb, { color: colors.textSecondary }]}>
                {breadcrumb}
              </ThemedText>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Quick Add Buttons */}
          <View style={styles.quickAddRow}>
            <ThemedText style={[styles.quickAddLabel, { color: colors.textSecondary }]}>
              Quick add:
            </ThemedText>
            {[5, 10, 20].map(count => (
              <Pressable
                key={count}
                style={[styles.quickAddButton, { backgroundColor: colors.elevated }]}
                onPress={() => handleQuickAdd(count)}
              >
                <ThemedText style={{ color: colors.tint }}>+{count}</ThemedText>
              </Pressable>
            ))}
          </View>

          {/* Default Condition Selector */}
          <View style={styles.defaultConditionRow}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
              Default condition for new items:
            </ThemedText>
            <View style={styles.conditionButtons}>
              {CONDITIONS.map(c => (
                <Pressable
                  key={c.value}
                  style={[
                    styles.conditionButton,
                    {
                      backgroundColor: defaultCondition === c.value ? colors.tint : colors.elevated,
                    },
                  ]}
                  onPress={() => setDefaultCondition(c.value)}
                >
                  <ThemedText
                    style={[
                      styles.conditionButtonText,
                      { color: defaultCondition === c.value ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {c.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Item List */}
            <View style={styles.itemList}>
              {items.map((item, index) => (
                <View key={item.id} style={[styles.itemRow, { backgroundColor: colors.elevated }]}>
                  <View style={styles.itemNumber}>
                    <ThemedText style={[styles.itemNumberText, { color: colors.textSecondary }]}>
                      {index + 1}
                    </ThemedText>
                  </View>
                  <TextInput
                    style={[styles.itemNameInput, { color: colors.text }]}
                    value={item.name}
                    onChangeText={(text) => handleUpdateItem(item.id, 'name', text)}
                    placeholder="Item name"
                    placeholderTextColor={colors.textDisabled}
                  />
                  <TextInput
                    style={[styles.itemQtyInput, { color: colors.text, backgroundColor: colors.card }]}
                    value={item.quantity}
                    onChangeText={(text) => handleUpdateItem(item.id, 'quantity', text)}
                    placeholder="Qty"
                    placeholderTextColor={colors.textDisabled}
                    keyboardType="number-pad"
                  />
                  <Pressable
                    onPress={() => handleRemoveItem(item.id)}
                    style={styles.removeButton}
                    disabled={items.length === 1}
                  >
                    <MaterialIcons 
                      name="remove-circle" 
                      size={24} 
                      color={items.length === 1 ? colors.textDisabled : '#EF4444'} 
                    />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Add More Button */}
            <Pressable
              style={[styles.addMoreButton, { borderColor: colors.tint }]}
              onPress={handleAddItem}
            >
              <MaterialIcons name="add" size={20} color={colors.tint} />
              <ThemedText style={{ color: colors.tint }}>Add Another Item</ThemedText>
            </Pressable>

            {/* Summary */}
            <View style={[styles.summary, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.summaryText, { color: colors.textSecondary }]}>
                {items.filter(i => i.name.trim()).length} items ready to add
              </ThemedText>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.elevated }]}
                onPress={handleClose}
              >
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.button, styles.saveButton, { backgroundColor: colors.item }]}
                onPress={handleSave}
              >
                <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  Add {items.filter(i => i.name.trim()).length} Items
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  breadcrumb: {
    fontSize: 12,
    marginTop: 4,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  quickAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  quickAddLabel: {
    fontSize: 14,
  },
  quickAddButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  defaultConditionRow: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  conditionButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  conditionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  conditionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    paddingHorizontal: Spacing.xl,
  },
  itemList: {
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  itemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemNumberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemNameInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
  },
  itemQtyInput: {
    width: 50,
    height: 32,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
    textAlign: 'center',
  },
  removeButton: {
    padding: Spacing.xs,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.sm,
  },
  summary: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {},
  saveButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
