import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
  onEdit?: () => void;
}

export function QRModal({ visible, onClose, name, qrData, type, breadcrumb, onEditQR, onEdit }: QRModalProps) {
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

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              {onEdit && (
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.elevated }]}
                  onPress={onEdit}
                >
                  <MaterialIcons name="edit" size={20} color={accentColor} />
                  <ThemedText style={[styles.actionButtonText, { color: accentColor }]}>
                    Edit {type.charAt(0).toUpperCase() + type.slice(1)}
                  </ThemedText>
                </Pressable>
              )}
              {onEditQR && (
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.elevated }]}
                  onPress={() => {
                    onClose();
                    onEditQR();
                  }}
                >
                  <MaterialIcons name="qr-code" size={20} color={colors.textSecondary} />
                  <ThemedText style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                    Change QR
                  </ThemedText>
                </Pressable>
              )}
            </View>

            <Pressable
              style={[styles.closeButton, { backgroundColor: accentColor }]}
              onPress={onClose}
            >
              <ThemedText style={[styles.closeButtonText, { color: '#FFFFFF' }]}>Close</ThemedText>
            </Pressable>
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
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
