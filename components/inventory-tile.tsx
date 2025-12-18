import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ThemedText } from '@/components/themed-text';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { EntityType } from '@/types/inventory';

interface InventoryTileProps {
  name: string;
  qrData: string;
  type: EntityType;
  onPress: () => void;
  onLongPress?: () => void;
}

export function InventoryTile({ name, qrData, type, onPress, onLongPress }: InventoryTileProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const accentColor = colors[type] || colors.tint;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: colors.card,
          borderLeftColor: accentColor,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <ThemedText style={styles.name} numberOfLines={2}>
            {name}
          </ThemedText>
          <ThemedText style={[styles.typeLabel, { color: accentColor }]}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </ThemedText>
        </View>
        <View style={[styles.qrContainer, { backgroundColor: colors.elevated }]}>
          <QRCode
            value={qrData}
            size={48}
            backgroundColor="transparent"
            color={colors.text}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 72,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qrContainer: {
    padding: 6,
    borderRadius: BorderRadius.sm,
  },
});
