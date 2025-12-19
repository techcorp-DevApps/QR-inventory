import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/themed-text';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { EntityType, LocationIcon, LocationColor, Item } from '@/types/inventory';

// Map LocationIcon to MaterialIcons name
const ICON_MAP: Record<LocationIcon, string> = {
  'home': 'home',
  'business': 'business',
  'warehouse': 'warehouse',
  'store': 'store',
  'apartment': 'apartment',
  'garage': 'garage',
  'storage': 'inventory-2',
  'kitchen': 'kitchen',
  'bedroom': 'bed',
  'bathroom': 'bathroom',
  'office': 'work',
  'meeting-room': 'meeting-room',
  'factory': 'factory',
  'inventory': 'inventory',
  'local-shipping': 'local-shipping',
};

interface InventoryTileProps {
  name: string;
  qrData: string;
  type: EntityType;
  onPress: () => void;
  onLongPress?: () => void;
  // Location customization
  icon?: LocationIcon;
  color?: LocationColor;
  // Item details
  description?: string;
  quantity?: number;
  condition?: Item['condition'];
  photos?: string[];
}

const CONDITION_COLORS: Record<NonNullable<Item['condition']>, string> = {
  new: '#10B981',
  good: '#3B82F6',
  fair: '#F59E0B',
  poor: '#EF4444',
};

export function InventoryTile({ 
  name, 
  qrData, 
  type, 
  onPress, 
  onLongPress,
  icon,
  color,
  description,
  quantity,
  condition,
  photos,
}: InventoryTileProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const accentColor = color || colors[type] || colors.tint;

  const renderItemDetails = () => {
    if (type !== 'item') return null;
    
    return (
      <View style={styles.itemDetails}>
        {quantity !== undefined && quantity > 1 && (
          <View style={[styles.badge, { backgroundColor: colors.elevated }]}>
            <ThemedText style={[styles.badgeText, { color: colors.textSecondary }]}>
              Qty: {quantity}
            </ThemedText>
          </View>
        )}
        {condition && (
          <View style={[styles.badge, { backgroundColor: CONDITION_COLORS[condition] + '20' }]}>
            <ThemedText style={[styles.badgeText, { color: CONDITION_COLORS[condition] }]}>
              {condition.charAt(0).toUpperCase() + condition.slice(1)}
            </ThemedText>
          </View>
        )}
        {photos && photos.length > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.elevated }]}>
            <MaterialIcons name="photo" size={12} color={colors.textSecondary} />
            <ThemedText style={[styles.badgeText, { color: colors.textSecondary, marginLeft: 2 }]}>
              {photos.length}
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

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
        {/* Left side: Icon (for locations) or Photo thumbnail (for items with photos) */}
        {type === 'location' && icon && (
          <View style={[styles.iconContainer, { backgroundColor: accentColor + '20' }]}>
            <MaterialIcons 
              name={ICON_MAP[icon] as any} 
              size={24} 
              color={accentColor} 
            />
          </View>
        )}
        {type === 'item' && photos && photos.length > 0 && (
          <Image 
            source={{ uri: photos[0] }} 
            style={styles.thumbnail}
          />
        )}
        
        {/* Middle: Text content */}
        <View style={styles.textContainer}>
          <ThemedText style={styles.name} numberOfLines={2}>
            {name}
          </ThemedText>
          {description && type === 'item' && (
            <ThemedText 
              style={[styles.description, { color: colors.textSecondary }]} 
              numberOfLines={1}
            >
              {description}
            </ThemedText>
          )}
          <View style={styles.metaRow}>
            <ThemedText style={[styles.typeLabel, { color: accentColor }]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </ThemedText>
            {renderItemDetails()}
          </View>
        </View>
        
        {/* Right side: QR Code */}
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
    alignItems: 'center',
    minHeight: 72,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemDetails: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  qrContainer: {
    padding: 6,
    borderRadius: BorderRadius.sm,
  },
});
