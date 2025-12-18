import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { EntityType } from '@/types/inventory';

interface AddEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  onDelete?: () => void;
  type: EntityType;
  initialName?: string;
  isEditing?: boolean;
}

export function AddEditModal({
  visible,
  onClose,
  onSave,
  onDelete,
  type,
  initialName = '',
  isEditing = false,
}: AddEditModalProps) {
  const [name, setName] = useState(initialName);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const accentColor = colors[type] || colors.tint;

  useEffect(() => {
    if (visible) {
      setName(initialName);
    }
  }, [visible, initialName]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    onSave(trimmedName);
    setName('');
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete ' + type.charAt(0).toUpperCase() + type.slice(1),
      `Are you sure you want to delete "${initialName}"? This will also delete all items inside.`,
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

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

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
            { paddingBottom: Math.max(insets.bottom, Spacing.xl) },
          ]}
        >
          <View style={styles.handle} />
          
          <ThemedText type="subtitle" style={styles.title}>
            {isEditing ? `Edit ${typeLabel}` : `Add ${typeLabel}`}
          </ThemedText>

          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
              Name
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
              placeholder={`Enter ${type} name`}
              placeholderTextColor={colors.textDisabled}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

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
                {isEditing ? 'Save' : 'Add'}
              </ThemedText>
            </Pressable>
          </View>

          {isEditing && onDelete && (
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <ThemedText style={[styles.deleteText, { color: '#EF4444' }]}>
                Delete {typeLabel}
              </ThemedText>
            </Pressable>
          )}
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
    padding: Spacing.xl,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  inputContainer: {
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
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
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
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
