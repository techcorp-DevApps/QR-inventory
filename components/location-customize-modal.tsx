import React, { useEffect, useState } from 'react';
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
import type { Location, LocationIcon, LocationColor } from '@/types/inventory';

interface LocationCustomizeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; icon?: LocationIcon; color?: LocationColor }) => void;
  onDelete?: () => void;
  initialData?: Partial<Location>;
  isEditing?: boolean;
}

const AVAILABLE_ICONS: { value: LocationIcon; name: string }[] = [
  { value: 'home', name: 'home' },
  { value: 'business', name: 'business' },
  { value: 'warehouse', name: 'warehouse' },
  { value: 'store', name: 'store' },
  { value: 'apartment', name: 'apartment' },
  { value: 'garage', name: 'garage' },
  { value: 'storage', name: 'inventory-2' },
  { value: 'kitchen', name: 'kitchen' },
  { value: 'bedroom', name: 'bed' },
  { value: 'bathroom', name: 'bathroom' },
  { value: 'office', name: 'work' },
  { value: 'meeting-room', name: 'meeting-room' },
  { value: 'factory', name: 'factory' },
  { value: 'inventory', name: 'inventory' },
  { value: 'local-shipping', name: 'local-shipping' },
];

const AVAILABLE_COLORS: LocationColor[] = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

export function LocationCustomizeModal({
  visible,
  onClose,
  onSave,
  onDelete,
  initialData = {},
  isEditing = false,
}: LocationCustomizeModalProps) {
  const [name, setName] = useState(initialData.name || '');
  const [selectedIcon, setSelectedIcon] = useState<LocationIcon | undefined>(initialData.icon);
  const [selectedColor, setSelectedColor] = useState<LocationColor | undefined>(initialData.color);
  
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    if (visible) {
      setName(initialData.name || '');
      setSelectedIcon(initialData.icon);
      setSelectedColor(initialData.color);
    }
  }, [visible, initialData]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a location name');
      return;
    }

    onSave({
      name: trimmedName,
      icon: selectedIcon,
      color: selectedColor,
    });
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to delete "${initialData.name}"? This will also delete all areas, sections, and items inside.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.();
            onClose();
          },
        },
      ]
    );
  };

  const accentColor = selectedColor || colors.location;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <ThemedView
          style={[
            styles.container,
            { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
          ]}
        >
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <ThemedText type="subtitle">
              {isEditing ? 'Edit Location' : 'Add Location'}
            </ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Preview */}
            <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
              <View style={[styles.previewIcon, { backgroundColor: accentColor + '20' }]}>
                <MaterialIcons 
                  name={selectedIcon ? AVAILABLE_ICONS.find(i => i.value === selectedIcon)?.name as any || 'place' : 'place'} 
                  size={32} 
                  color={accentColor} 
                />
              </View>
              <ThemedText style={styles.previewName}>
                {name || 'Location Name'}
              </ThemedText>
              <View style={[styles.previewBadge, { backgroundColor: accentColor }]}>
                <ThemedText style={styles.previewBadgeText}>Location</ThemedText>
              </View>
            </View>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                Name *
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.elevated,
                    color: colors.text,
                    borderColor: accentColor,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter location name"
                placeholderTextColor={colors.textDisabled}
                autoFocus={!isEditing}
              />
            </View>

            {/* Icon Selection */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                Icon
              </ThemedText>
              <View style={styles.iconGrid}>
                {AVAILABLE_ICONS.map((icon) => (
                  <Pressable
                    key={icon.value}
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: selectedIcon === icon.value ? accentColor : colors.elevated,
                        borderColor: selectedIcon === icon.value ? accentColor : 'transparent',
                      },
                    ]}
                    onPress={() => setSelectedIcon(selectedIcon === icon.value ? undefined : icon.value)}
                  >
                    <MaterialIcons
                      name={icon.name as any}
                      size={24}
                      color={selectedIcon === icon.value ? '#FFFFFF' : colors.text}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Color Selection */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                Color
              </ThemedText>
              <View style={styles.colorGrid}>
                {AVAILABLE_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorButton,
                      {
                        backgroundColor: color,
                        borderWidth: selectedColor === color ? 3 : 0,
                        borderColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                      },
                    ]}
                    onPress={() => setSelectedColor(selectedColor === color ? undefined : color)}
                  >
                    {selectedColor === color && (
                      <MaterialIcons name="check" size={20} color="#FFFFFF" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.elevated }]}
                onPress={onClose}
              >
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.button, styles.saveButton, { backgroundColor: accentColor }]}
                onPress={handleSave}
              >
                <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  {isEditing ? 'Save' : 'Add Location'}
                </ThemedText>
              </Pressable>
            </View>

            {isEditing && onDelete && (
              <Pressable style={styles.deleteButton} onPress={handleDelete}>
                <ThemedText style={[styles.deleteText, { color: '#EF4444' }]}>
                  Delete Location
                </ThemedText>
              </Pressable>
            )}
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
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    paddingHorizontal: Spacing.xl,
  },
  previewCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  previewBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  previewBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
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
  deleteButton: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
