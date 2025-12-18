import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QRModal } from '@/components/qr-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useInventoryContext } from '@/contexts/inventory-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { SearchResult, EntityType } from '@/types/inventory';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { search, getLocationById, getAreaById } = useInventoryContext();
  
  const [query, setQuery] = useState('');
  const [qrModalVisible, setQRModalVisible] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const results = useMemo(() => {
    return search(query);
  }, [query, search]);

  const handleResultPress = (result: SearchResult) => {
    const entity = result.entity;
    
    switch (entity.type) {
      case 'location':
        router.push(`/location/${entity.id}` as any);
        break;
      case 'area':
        router.push(`/area/${entity.locationId}/${entity.id}` as any);
        break;
      case 'section':
        router.push(`/section/${entity.id}` as any);
        break;
      case 'item':
        // For items, show QR modal
        setSelectedResult(result);
        setQRModalVisible(true);
        break;
    }
  };

  const handleResultLongPress = (result: SearchResult) => {
    setSelectedResult(result);
    setQRModalVisible(true);
  };

  const getTypeIcon = (type: EntityType): string => {
    switch (type) {
      case 'location': return 'location-on';
      case 'area': return 'grid-view';
      case 'section': return 'folder';
      case 'item': return 'inventory-2';
      default: return 'help';
    }
  };

  const renderResult = ({ item }: { item: SearchResult }) => {
    const accentColor = colors[item.entity.type] || colors.tint;
    
    return (
      <Pressable
        onPress={() => handleResultPress(item)}
        onLongPress={() => handleResultLongPress(item)}
        style={({ pressed }) => [
          styles.resultItem,
          { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: accentColor + '20' }]}>
          <MaterialIcons name={getTypeIcon(item.entity.type) as any} size={24} color={accentColor} />
        </View>
        <View style={styles.resultContent}>
          <ThemedText style={styles.resultName} numberOfLines={1}>
            {item.entity.name}
          </ThemedText>
          <ThemedText style={[styles.resultBreadcrumb, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.breadcrumb}
          </ThemedText>
        </View>
        <View style={[styles.typeTag, { backgroundColor: accentColor + '20' }]}>
          <ThemedText style={[styles.typeText, { color: accentColor }]}>
            {item.entity.type}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.lg) }]}>
        <ThemedText type="title">Search</ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.elevated }]}>
          <MaterialIcons name="search" size={22} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search locations, areas, sections, items..."
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {query.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search" size={64} color={colors.textDisabled} />
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            Start typing to search
          </ThemedText>
          <ThemedText style={[styles.emptyHint, { color: colors.textDisabled }]}>
            Search across all locations, areas, sections, and items
          </ThemedText>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={64} color={colors.textDisabled} />
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            No results found
          </ThemedText>
          <ThemedText style={[styles.emptyHint, { color: colors.textDisabled }]}>
            Try a different search term
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.entity.type}-${item.entity.id}`}
          contentContainerStyle={styles.listContent}
          renderItem={renderResult}
          ListHeaderComponent={
            <ThemedText style={[styles.resultCount, { color: colors.textSecondary }]}>
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </ThemedText>
          }
        />
      )}

      {selectedResult && (
        <QRModal
          visible={qrModalVisible}
          onClose={() => {
            setQRModalVisible(false);
            setSelectedResult(null);
          }}
          name={selectedResult.entity.name}
          qrData={selectedResult.entity.qrData}
          type={selectedResult.entity.type}
          breadcrumb={selectedResult.breadcrumb}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  resultCount: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  resultContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultBreadcrumb: {
    fontSize: 12,
  },
  typeTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
  },
});
