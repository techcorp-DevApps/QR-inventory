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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatHexForDisplay, qrDataToHex } from '@/lib/qr-utils';
import type { PreGeneratedQR } from '@/types/inventory';

interface QRLabelModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (label: string, notes: string) => void;
  qrCode: PreGeneratedQR | null;
}

export function QRLabelModal({
  visible,
  onClose,
  onSave,
  qrCode,
}: QRLabelModalProps) {
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    if (visible && qrCode) {
      setLabel(qrCode.label || '');
      setNotes(qrCode.notes || '');
    }
  }, [visible, qrCode]);

  const handleSave = () => {
    onSave(label.trim(), notes.trim());
    onClose();
  };

  if (!qrCode) return null;

  const hexCode = formatHexForDisplay(qrDataToHex(qrCode.qrData)).substring(0, 32);

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
          
          <View style={styles.header}>
            <ThemedText type="subtitle">Edit QR Code Details</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* QR Code Preview */}
          <View style={[styles.qrPreview, { backgroundColor: colors.card }]}>
            <QRCode 
              value={qrCode.qrData} 
              size={100} 
              backgroundColor="transparent" 
              color={colors.text} 
            />
            <View style={styles.qrInfo}>
              {qrCode.prefix && (
                <View style={[styles.prefixBadge, { backgroundColor: colors.tint + '20' }]}>
                  <ThemedText style={[styles.prefixText, { color: colors.tint }]}>
                    {qrCode.prefix}
                  </ThemedText>
                </View>
              )}
              <ThemedText style={[styles.hexCode, { color: colors.textSecondary }]}>
                {hexCode}...
              </ThemedText>
              <ThemedText style={[styles.dateText, { color: colors.textDisabled }]}>
                Created: {new Date(qrCode.createdAt).toLocaleDateString()}
              </ThemedText>
            </View>
          </View>

          {/* Label Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
              Label
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.elevated, color: colors.text }]}
              value={label}
              onChangeText={setLabel}
              placeholder="e.g., Shelf A-1, Box #42, Equipment Tag"
              placeholderTextColor={colors.textDisabled}
              maxLength={50}
            />
            <ThemedText style={[styles.hint, { color: colors.textDisabled }]}>
              A short label to identify this QR code before assignment
            </ThemedText>
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
              placeholder="Add any notes about this QR code..."
              placeholderTextColor={colors.textDisabled}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
            />
            <ThemedText style={[styles.hint, { color: colors.textDisabled }]}>
              Optional notes for organization (e.g., intended use, location)
            </ThemedText>
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
              style={[styles.button, styles.saveButton, { backgroundColor: colors.tint }]}
              onPress={handleSave}
            >
              <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Save
              </ThemedText>
            </Pressable>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  qrPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  qrInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  prefixBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  prefixText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hexCode: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
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
  hint: {
    fontSize: 12,
    marginTop: Spacing.xs,
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
});
