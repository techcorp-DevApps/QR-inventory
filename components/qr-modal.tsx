import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { qrDataToHex, formatHexForDisplay } from '@/lib/qr-utils';
import type { EntityType } from '@/types/inventory';

interface QRModalProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  qrData: string;
  type: EntityType;
  breadcrumb?: string;
  onEditQR?: () => void;
}

export function QRModal({ visible, onClose, name, qrData, type, breadcrumb, onEditQR }: QRModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const accentColor = colors[type] || colors.tint;

  const hexCode = formatHexForDisplay(qrDataToHex(qrData));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <ThemedView
          style={[
            styles.container,
            {
              marginTop: insets.top + 40,
              marginBottom: insets.bottom + 40,
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <ThemedText style={[styles.typeLabel, { color: accentColor }]}>
                {type.toUpperCase()}
              </ThemedText>
              <ThemedText type="subtitle" style={styles.name}>
                {name}
              </ThemedText>
              {breadcrumb && (
                <ThemedText style={[styles.breadcrumb, { color: colors.textSecondary }]}>
                  {breadcrumb}
                </ThemedText>
              )}
            </View>

            <View style={[styles.qrContainer, { backgroundColor: '#FFFFFF' }]}>
              <QRCode
                value={qrData}
                size={180}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            </View>

            {/* QR Hex Code Display */}
            <View style={[styles.hexContainer, { backgroundColor: colors.elevated }]}>
              <ThemedText style={[styles.hexLabel, { color: colors.textSecondary }]}>
                QR Hex Code (for manual entry)
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <ThemedText style={[styles.hexCode, { color: colors.text }]} selectable>
                  {hexCode}
                </ThemedText>
              </ScrollView>
            </View>

            <View style={styles.buttonRow}>
              {onEditQR && (
                <Pressable
                  style={[styles.editButton, { backgroundColor: accentColor }]}
                  onPress={() => {
                    onClose();
                    onEditQR();
                  }}
                >
                  <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    Edit QR Code
                  </ThemedText>
                </Pressable>
              )}
              <Pressable
                style={[styles.closeButton, { backgroundColor: colors.elevated }]}
                onPress={onClose}
              >
                <ThemedText style={styles.buttonText}>Close</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </ThemedView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  name: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  breadcrumb: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  qrContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  hexContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  hexLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hexCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  closeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
