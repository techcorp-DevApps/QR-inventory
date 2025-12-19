import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Item, CustomField } from '@/types/inventory';
import { generateId } from '@/lib/qr-utils';

interface ItemDetailModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<Item>) => void;
  onDelete?: () => void;
  initialData?: Partial<Item>;
  isEditing?: boolean;
}

const CONDITIONS: { value: Item['condition']; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: '#10B981' },
  { value: 'good', label: 'Good', color: '#3B82F6' },
  { value: 'fair', label: 'Fair', color: '#F59E0B' },
  { value: 'poor', label: 'Poor', color: '#EF4444' },
];

export function ItemDetailModal({
  visible,
  onClose,
  onSave,
  onDelete,
  initialData = {},
  isEditing = false,
}: ItemDetailModalProps) {
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [quantity, setQuantity] = useState(initialData.quantity?.toString() || '1');
  const [condition, setCondition] = useState<Item['condition']>(initialData.condition || 'good');
  const [photos, setPhotos] = useState<string[]>(initialData.photos || []);
  const [notes, setNotes] = useState(initialData.notes || '');
  const [customFields, setCustomFields] = useState<CustomField[]>(initialData.customFields || []);
  
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    if (visible) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setQuantity(initialData.quantity?.toString() || '1');
      setCondition(initialData.condition || 'good');
      setPhotos(initialData.photos || []);
      setNotes(initialData.notes || '');
      setCustomFields(initialData.customFields || []);
    }
  }, [visible, initialData]);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotos([...photos, base64Image]);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotos([...photos, base64Image]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleAddCustomField = () => {
    setCustomFields([...customFields, { id: generateId(), label: '', value: '' }]);
  };

  const handleUpdateCustomField = (id: string, field: 'label' | 'value', text: string) => {
    setCustomFields(customFields.map(cf => 
      cf.id === id ? { ...cf, [field]: text } : cf
    ));
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter(cf => cf.id !== id));
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    // Filter out empty custom fields
    const validCustomFields = customFields.filter(cf => cf.label.trim() && cf.value.trim());

    onSave({
      name: trimmedName,
      description: description.trim() || undefined,
      quantity: qty,
      condition,
      photos: photos.length > 0 ? photos : undefined,
      notes: notes.trim() || undefined,
      customFields: validCustomFields.length > 0 ? validCustomFields : undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${initialData.name}"?`,
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
              {isEditing ? 'Edit Item' : 'Add Item'}
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
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                Name *
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.elevated, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter item name"
                placeholderTextColor={colors.textDisabled}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                Description
              </ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.elevated, color: colors.text }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter item description"
                placeholderTextColor={colors.textDisabled}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Quantity and Condition Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  Quantity
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.elevated, color: colors.text }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                  placeholderTextColor={colors.textDisabled}
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 2, marginLeft: Spacing.md }]}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  Condition
                </ThemedText>
                <View style={styles.conditionRow}>
                  {CONDITIONS.map((c) => (
                    <Pressable
                      key={c.value}
                      style={[
                        styles.conditionButton,
                        {
                          backgroundColor: condition === c.value ? c.color : colors.elevated,
                          borderColor: c.color,
                        },
                      ]}
                      onPress={() => setCondition(c.value)}
                    >
                      <ThemedText
                        style={[
                          styles.conditionText,
                          { color: condition === c.value ? '#FFFFFF' : c.color },
                        ]}
                      >
                        {c.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Photos Section */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                Photos
              </ThemedText>
              <View style={styles.photosContainer}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoWrapper}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <Pressable
                      style={styles.removePhotoButton}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <MaterialIcons name="close" size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
                {photos.length < 5 && (
                  <View style={styles.addPhotoButtons}>
                    <Pressable
                      style={[styles.addPhotoButton, { backgroundColor: colors.elevated }]}
                      onPress={handlePickImage}
                    >
                      <MaterialIcons name="photo-library" size={24} color={colors.tint} />
                      <ThemedText style={[styles.addPhotoText, { color: colors.tint }]}>
                        Gallery
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.addPhotoButton, { backgroundColor: colors.elevated }]}
                      onPress={handleTakePhoto}
                    >
                      <MaterialIcons name="camera-alt" size={24} color={colors.tint} />
                      <ThemedText style={[styles.addPhotoText, { color: colors.tint }]}>
                        Camera
                      </ThemedText>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* Notes Input */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                Notes
              </ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.elevated, color: colors.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any additional notes..."
                placeholderTextColor={colors.textDisabled}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Custom Fields Section */}
            <View style={styles.inputGroup}>
              <View style={styles.customFieldsHeader}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  Custom Fields
                </ThemedText>
                <Pressable onPress={handleAddCustomField} style={styles.addFieldButton}>
                  <MaterialIcons name="add" size={20} color={colors.tint} />
                  <ThemedText style={{ color: colors.tint }}>Add Field</ThemedText>
                </Pressable>
              </View>
              {customFields.map((field) => (
                <View key={field.id} style={styles.customFieldRow}>
                  <TextInput
                    style={[styles.customFieldInput, { backgroundColor: colors.elevated, color: colors.text }]}
                    value={field.label}
                    onChangeText={(text) => handleUpdateCustomField(field.id, 'label', text)}
                    placeholder="Label"
                    placeholderTextColor={colors.textDisabled}
                  />
                  <TextInput
                    style={[styles.customFieldInput, { backgroundColor: colors.elevated, color: colors.text, flex: 1.5 }]}
                    value={field.value}
                    onChangeText={(text) => handleUpdateCustomField(field.id, 'value', text)}
                    placeholder="Value"
                    placeholderTextColor={colors.textDisabled}
                  />
                  <Pressable
                    onPress={() => handleRemoveCustomField(field.id)}
                    style={styles.removeFieldButton}
                  >
                    <MaterialIcons name="remove-circle" size={24} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
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
                style={[styles.button, styles.saveButton, { backgroundColor: colors.item }]}
                onPress={handleSave}
              >
                <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  {isEditing ? 'Save' : 'Add Item'}
                </ThemedText>
              </Pressable>
            </View>

            {isEditing && onDelete && (
              <Pressable style={styles.deleteButton} onPress={handleDelete}>
                <ThemedText style={[styles.deleteText, { color: '#EF4444' }]}>
                  Delete Item
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
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  conditionButton: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 10,
    marginTop: 4,
  },
  customFieldsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customFieldRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  customFieldInput: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  removeFieldButton: {
    padding: 4,
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
