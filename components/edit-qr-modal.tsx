import React, { useState } from 'react';
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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QRScanner } from '@/components/qr-scanner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { hexToQRData, isValidQRData, formatHexForDisplay, qrDataToHex } from '@/lib/qr-utils';
import type { EntityType } from '@/types/inventory';

type EditMode = 'select' | 'scan' | 'hex';

interface EditQRModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (newQRData: string) => void;
  entityName: string;
  entityType: EntityType;
  currentQRData: string;
}

export function EditQRModal({
  visible,
  onClose,
  onSave,
  entityName,
  entityType,
  currentQRData,
}: EditQRModalProps) {
  const [mode, setMode] = useState<EditMode>('select');
  const [hexInput, setHexInput] = useState('');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const accentColor = colors[entityType] || colors.tint;

  const resetState = () => {
    setMode('select');
    setHexInput('');
    setScannedData(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleHexSubmit = () => {
    const cleanHex = hexInput.replace(/\s/g, '');
    if (!cleanHex) {
      Alert.alert('Error', 'Please enter a hex code');
      return;
    }

    const qrData = hexToQRData(cleanHex);
    if (!qrData) {
      Alert.alert('Error', 'Invalid hex code format');
      return;
    }

    if (!isValidQRData(qrData)) {
      Alert.alert('Error', 'The hex code does not represent a valid QR code');
      return;
    }

    onSave(qrData);
    handleClose();
  };

  const handleScanResult = (data: string) => {
    if (!isValidQRData(data)) {
      Alert.alert('Invalid QR Code', 'The scanned QR code is not a valid inventory QR code');
      return;
    }
    setScannedData(data);
  };

  const confirmScannedQR = () => {
    if (scannedData) {
      onSave(scannedData);
      handleClose();
    }
  };

  const renderSelectMode = () => (
    <View style={styles.optionsContainer}>
      <ThemedText type="subtitle" style={styles.title}>
        Edit QR Code
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
        Manually assign a pre-generated QR code to "{entityName}"
      </ThemedText>

      <Pressable
        style={[styles.optionButton, { backgroundColor: colors.elevated }]}
        onPress={() => setMode('scan')}
      >
        <View style={[styles.optionIcon, { backgroundColor: accentColor + '20' }]}>
          <MaterialIcons name="qr-code-scanner" size={28} color={accentColor} />
        </View>
        <View style={styles.optionText}>
          <ThemedText style={styles.optionTitle}>Scan QR Code</ThemedText>
          <ThemedText style={[styles.optionDesc, { color: colors.textSecondary }]}>
            Use camera to scan a pre-generated QR code
          </ThemedText>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </Pressable>

      <Pressable
        style={[styles.optionButton, { backgroundColor: colors.elevated }]}
        onPress={() => setMode('hex')}
      >
        <View style={[styles.optionIcon, { backgroundColor: accentColor + '20' }]}>
          <MaterialIcons name="text-fields" size={28} color={accentColor} />
        </View>
        <View style={styles.optionText}>
          <ThemedText style={styles.optionTitle}>Enter QR Hex</ThemedText>
          <ThemedText style={[styles.optionDesc, { color: colors.textSecondary }]}>
            Manually type the QR code hex value
          </ThemedText>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </Pressable>

      <Pressable
        style={[styles.cancelButton, { backgroundColor: colors.elevated }]}
        onPress={handleClose}
      >
        <ThemedText style={styles.cancelText}>Cancel</ThemedText>
      </Pressable>
    </View>
  );

  const renderScanMode = () => {
    // If already scanned, show confirmation
    if (scannedData) {
      return (
        <View style={styles.scannedResult}>
          <MaterialIcons name="check-circle" size={64} color="#10B981" />
          <ThemedText style={styles.scannedTitle}>QR Code Scanned!</ThemedText>
          <ThemedText style={[styles.scannedHex, { color: colors.textSecondary }]}>
            {formatHexForDisplay(qrDataToHex(scannedData).substring(0, 32))}...
          </ThemedText>
          <View style={styles.scannedButtons}>
            <Pressable
              style={[styles.rescanButton, { backgroundColor: colors.elevated }]}
              onPress={() => setScannedData(null)}
            >
              <ThemedText>Scan Again</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.confirmButton, { backgroundColor: accentColor }]}
              onPress={confirmScannedQR}
            >
              <ThemedText style={{ color: '#FFFFFF' }}>Confirm & Save</ThemedText>
            </Pressable>
          </View>
        </View>
      );
    }

    // Show actual camera scanner (Task 1.2 - Integrate QRScanner)
    return (
      <View style={styles.scannerContainer}>
        <QRScanner
          onScan={handleScanResult}
          onClose={() => setMode('select')}
          title="Scan QR Code"
          subtitle={`Scan a pre-generated QR code to assign to ${entityName}`}
        />
      </View>
    );
  };

  const renderHexMode = () => (
    <View style={styles.hexContainer}>
      <View style={styles.scanHeader}>
        <Pressable onPress={() => setMode('select')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.tint} />
        </Pressable>
        <ThemedText type="subtitle">Enter QR Hex</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ThemedText style={[styles.hexHint, { color: colors.textSecondary }]}>
        Enter the hex code printed below the QR code. You can find this on pre-generated QR code sheets.
      </ThemedText>

      <TextInput
        style={[
          styles.hexInput,
          {
            backgroundColor: colors.elevated,
            color: colors.text,
            borderColor: accentColor,
          },
        ]}
        value={hexInput}
        onChangeText={(text) => setHexInput(text.toUpperCase())}
        placeholder="e.g., 5052 453A 6162 6364..."
        placeholderTextColor={colors.textDisabled}
        autoCapitalize="characters"
        autoCorrect={false}
        multiline
        numberOfLines={3}
      />

      <View style={styles.hexButtons}>
        <Pressable
          style={[styles.cancelButton, { backgroundColor: colors.elevated, flex: 1 }]}
          onPress={() => setMode('select')}
        >
          <ThemedText>Back</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.saveButton, { backgroundColor: accentColor, flex: 1 }]}
          onPress={handleHexSubmit}
        >
          <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }}>
            Save QR Code
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );

  // For scan mode, we need a full-screen modal
  if (visible && mode === 'scan' && !scannedData) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
        {renderScanMode()}
      </Modal>
    );
  }

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
            { paddingBottom: Math.max(insets.bottom, Spacing.xl) },
          ]}
        >
          <View style={styles.handle} />
          {mode === 'select' && renderSelectMode()}
          {mode === 'scan' && scannedData && renderScanMode()}
          {mode === 'hex' && renderHexMode()}
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
    minHeight: 400,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  cancelText: {
    fontSize: 16,
  },
  scannerContainer: {
    flex: 1,
    minHeight: 400,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  scannedResult: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  scannedTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  scannedHex: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  scannedButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  rescanButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
  },
  confirmButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
  },
  hexContainer: {
    flex: 1,
  },
  hexHint: {
    fontSize: 14,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  hexInput: {
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hexButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  saveButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
});
