import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BulkItemModal } from '@/components/bulk-item-modal';
import { EditQRModal } from '@/components/edit-qr-modal';
import { FAB } from '@/components/fab';
import { InventoryTile } from '@/components/inventory-tile';
import { ItemDetailModal } from '@/components/item-detail-modal';
import { QRModal } from '@/components/qr-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useInventoryContext } from '@/contexts/inventory-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Item } from '@/types/inventory';

export default function SectionScreen() {
  const { sectionId } = useLocalSearchParams<{ sectionId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    getLocationById,
    getAreaById,
    getSectionById,
    getItemsBySection,
    addItem,
    updateItem,
    updateItemQR,
    deleteItem,
  } = useInventoryContext();

  const section = getSectionById(sectionId);
  const area = section ? getAreaById(section.areaId) : null;
  const location = section ? getLocationById(section.locationId) : null;
  const items = getItemsBySection(sectionId);

  // Modal states
  const [qrModalVisible, setQRModalVisible] = useState(false);
  const [editQRModalVisible, setEditQRModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  // New state for ItemDetailModal (replaces AddEditModal for items)
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [editItemModalVisible, setEditItemModalVisible] = useState(false);
  
  // New state for BulkItemModal
  const [bulkItemModalVisible, setBulkItemModalVisible] = useState(false);
  
  // FAB menu state
  const [showFABMenu, setShowFABMenu] = useState(false);

  if (!section || !area || !location) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Section not found</ThemedText>
      </ThemedView>
    );
  }

  const breadcrumb = `${location.name} > ${area.name} > ${section.name}`;

  const handleItemLongPress = (item: Item) => {
    setSelectedItem(item);
    setQRModalVisible(true);
  };

  // Handler for opening edit modal from QR modal
  const handleEditFromQRModal = () => {
    setQRModalVisible(false);
    setEditItemModalVisible(true);
  };

  // Handler for adding new item
  const handleAddItem = async (itemData: Partial<Item>) => {
    await addItem(
      itemData.name || 'New Item',
      section.locationId,
      section.areaId,
      section.id,
      {
        quantity: itemData.quantity,
        condition: itemData.condition,
        description: itemData.description,
        notes: itemData.notes,
        photos: itemData.photos,
        customFields: itemData.customFields,
      }
    );
    setAddItemModalVisible(false);
  };

  // Updated handler for saving item changes from ItemDetailModal
  const handleSaveItemChanges = async (updates: Partial<Item>) => {
    if (selectedItem) {
      await updateItem(selectedItem.id, updates);
      setSelectedItem(null);
      setEditItemModalVisible(false);
    }
  };

  const handleDeleteItem = async () => {
    if (selectedItem) {
      await deleteItem(selectedItem.id);
      setSelectedItem(null);
      setEditItemModalVisible(false);
    }
  };

  const handleEditQR = () => {
    setQRModalVisible(false);
    setEditQRModalVisible(true);
  };

  const handleSaveQR = async (newQRData: string) => {
    if (selectedItem) {
      await updateItemQR(selectedItem.id, newQRData);
      setSelectedItem({ ...selectedItem, qrData: newQRData });
    }
  };

  // Handler for bulk item save
  const handleBulkItemSave = async (bulkItems: Array<{ name: string; quantity: number; condition: Item['condition'] }>) => {
    for (const item of bulkItems) {
      await addItem(item.name, section.locationId, section.areaId, section.id, {
        quantity: item.quantity,
        condition: item.condition,
      });
    }
    setBulkItemModalVisible(false);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.lg) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color={colors.tint} />
          <ThemedText style={[styles.backText, { color: colors.tint }]}>Back</ThemedText>
        </Pressable>
        <ThemedText type="title" style={styles.title}>{section.name}</ThemedText>
        <ThemedText style={[styles.breadcrumb, { color: colors.textSecondary }]}>
          {location.name} › {area.name}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </ThemedText>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            No items yet
          </ThemedText>
          <ThemedText style={[styles.emptyHint, { color: colors.textDisabled }]}>
            Tap the + button to add an item
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <InventoryTile
              name={item.name}
              qrData={item.qrData}
              type="item"
              description={item.description}
              quantity={item.quantity}
              condition={item.condition}
              photos={item.photos}
              onPress={() => handleItemLongPress(item)}
              onLongPress={() => handleItemLongPress(item)}
            />
          )}
        />
      )}

      {/* FAB Menu */}
      {showFABMenu && (
        <View style={styles.fabMenu}>
          <Pressable
            style={[styles.fabMenuItem, { backgroundColor: colors.item }]}
            onPress={() => {
              setAddItemModalVisible(true);
              setShowFABMenu(false);
            }}
          >
            <MaterialIcons name="inventory-2" size={20} color="#FFFFFF" />
            <ThemedText style={styles.fabMenuText}>Add Single Item</ThemedText>
          </Pressable>
          
          <Pressable
            style={[styles.fabMenuItem, { backgroundColor: '#8B5CF6' }]}
            onPress={() => {
              setBulkItemModalVisible(true);
              setShowFABMenu(false);
            }}
          >
            <MaterialIcons name="playlist-add" size={20} color="#FFFFFF" />
            <ThemedText style={styles.fabMenuText}>Bulk Add Items</ThemedText>
          </Pressable>
        </View>
      )}

      <FAB onPress={() => setShowFABMenu(!showFABMenu)} icon={showFABMenu ? 'close' : 'add'} />

      {/* Add Item Modal (using ItemDetailModal) */}
      <ItemDetailModal
        visible={addItemModalVisible}
        onClose={() => setAddItemModalVisible(false)}
        onSave={handleAddItem}
        isEditing={false}
      />

      {/* Edit Item Modal (using ItemDetailModal) */}
      {selectedItem && (
        <ItemDetailModal
          visible={editItemModalVisible}
          onClose={() => {
            setEditItemModalVisible(false);
            setSelectedItem(null);
          }}
          onSave={handleSaveItemChanges}
          onDelete={handleDeleteItem}
          initialData={selectedItem}
          isEditing
        />
      )}

      {/* Bulk Item Modal */}
      <BulkItemModal
        visible={bulkItemModalVisible}
        onClose={() => setBulkItemModalVisible(false)}
        onSave={handleBulkItemSave}
        locationId={section.locationId}
        areaId={section.areaId}
        sectionId={section.id}
        locationName={location.name}
        areaName={area.name}
        sectionName={section.name}
      />

      {selectedItem && (
        <>
          <QRModal
            visible={qrModalVisible}
            onClose={() => {
              setQRModalVisible(false);
              setSelectedItem(null);
            }}
            name={selectedItem.name}
            qrData={selectedItem.qrData}
            type="item"
            breadcrumb={breadcrumb}
            onEditQR={handleEditQR}
            onEdit={handleEditFromQRModal}
          />

          <EditQRModal
            visible={editQRModalVisible}
            onClose={() => setEditQRModalVisible(false)}
            onSave={handleSaveQR}
            entityName={selectedItem.name}
            entityType="item"
            currentQRData={selectedItem.qrData}
          />
        </>
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
    paddingBottom: Spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
    marginBottom: Spacing.sm,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    marginBottom: 4,
  },
  breadcrumb: {
    fontSize: 14,
  },
  subtitle: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
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
    marginBottom: Spacing.sm,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  fabMenu: {
    position: 'absolute',
    bottom: 96,
    right: 24,
    gap: 10,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabMenuText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
