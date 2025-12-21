import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddEditModal } from '@/components/add-edit-modal';
import { BulkItemModal } from '@/components/bulk-item-modal';
import { EditQRModal } from '@/components/edit-qr-modal';
import { FAB } from '@/components/fab';
import { InventoryTile } from '@/components/inventory-tile';
import { ItemDetailModal } from '@/components/item-detail-modal';
import { QRModal } from '@/components/qr-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useInventoryContext } from '@/contexts/inventory-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Section, Item, EntityType } from '@/types/inventory';

type AddType = 'section' | 'item';

export default function AreaScreen() {
  const { locationId, areaId } = useLocalSearchParams<{ locationId: string; areaId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    getLocationById,
    getAreaById,
    getSectionsByArea,
    getItemsByArea,
    addSection,
    addItem,
    updateSection,
    updateItem,
    updateSectionQR,
    updateItemQR,
    deleteSection,
    deleteItem,
  } = useInventoryContext();

  const location = getLocationById(locationId);
  const area = getAreaById(areaId);
  const sections = getSectionsByArea(areaId);
  const directItems = getItemsByArea(areaId);

  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addType, setAddType] = useState<AddType>('section');
  const [qrModalVisible, setQRModalVisible] = useState(false);
  const [editQRModalVisible, setEditQRModalVisible] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Section | Item | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>('section');
  
  // New states for ItemDetailModal
  const [editItemModalVisible, setEditItemModalVisible] = useState(false);
  const [editSectionModalVisible, setEditSectionModalVisible] = useState(false);
  
  // New state for BulkItemModal
  const [bulkItemModalVisible, setBulkItemModalVisible] = useState(false);
  
  // FAB menu state
  const [showFABMenu, setShowFABMenu] = useState(false);

  if (!location || !area) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Area not found</ThemedText>
      </ThemedView>
    );
  }

  const breadcrumb = `${location.name} > ${area.name}`;

  const handleSectionPress = (section: Section) => {
    router.push(`/section/${section.id}` as any);
  };

  const handleEntityLongPress = (entity: Section | Item, type: EntityType) => {
    setSelectedEntity(entity);
    setSelectedEntityType(type);
    setQRModalVisible(true);
  };

  // Handler for editing items - opens ItemDetailModal
  const handleEditItem = () => {
    setQRModalVisible(false);
    setEditItemModalVisible(true);
  };

  // Handler for editing sections - opens AddEditModal
  const handleEditSection = () => {
    setQRModalVisible(false);
    setEditSectionModalVisible(true);
  };

  const handleAdd = async (name: string) => {
    if (addType === 'section') {
      await addSection(name, locationId, areaId);
    } else {
      await addItem(name, locationId, areaId, null);
    }
  };

  // Updated handler for saving item changes from ItemDetailModal
  const handleSaveItemChanges = async (updates: Partial<Item>) => {
    if (selectedEntity && selectedEntityType === 'item') {
      await updateItem(selectedEntity.id, updates);
      setSelectedEntity(null);
      setEditItemModalVisible(false);
    }
  };

  // Handler for saving section changes
  const handleSaveSectionChanges = async (name: string) => {
    if (selectedEntity && selectedEntityType === 'section') {
      await updateSection(selectedEntity.id, name);
      setSelectedEntity(null);
      setEditSectionModalVisible(false);
    }
  };

  const handleDelete = async () => {
    if (selectedEntity) {
      if (selectedEntityType === 'section') {
        await deleteSection(selectedEntity.id);
      } else {
        await deleteItem(selectedEntity.id);
      }
      setSelectedEntity(null);
      setEditItemModalVisible(false);
      setEditSectionModalVisible(false);
    }
  };

  const handleEditQR = () => {
    setQRModalVisible(false);
    setEditQRModalVisible(true);
  };

  const handleSaveQR = async (newQRData: string) => {
    if (selectedEntity) {
      if (selectedEntityType === 'section') {
        await updateSectionQR(selectedEntity.id, newQRData);
      } else {
        await updateItemQR(selectedEntity.id, newQRData);
      }
      setSelectedEntity({ ...selectedEntity, qrData: newQRData });
    }
  };

  // Handler for bulk item save
  const handleBulkItemSave = async (items: Array<{ name: string; quantity: number; condition: Item['condition'] }>) => {
    for (const item of items) {
      await addItem(item.name, locationId, areaId, null, {
        quantity: item.quantity,
        condition: item.condition,
      });
    }
    setBulkItemModalVisible(false);
  };

  const openAddModal = (type: AddType) => {
    setAddType(type);
    setShowFABMenu(false);
    setAddModalVisible(true);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.lg) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color={colors.tint} />
          <ThemedText style={[styles.backText, { color: colors.tint }]}>Back</ThemedText>
        </Pressable>
        <ThemedText type="title" style={styles.title}>{area.name}</ThemedText>
        <ThemedText style={[styles.breadcrumb, { color: colors.textSecondary }]}>
          {location.name}
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sections */}
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Sections</ThemedText>
          <ThemedText style={[styles.count, { color: colors.textSecondary }]}>
            {sections.length}
          </ThemedText>
        </View>
        
        {sections.length === 0 ? (
          <View style={[styles.emptySection, { backgroundColor: colors.elevated }]}>
            <ThemedText style={{ color: colors.textSecondary }}>No sections</ThemedText>
          </View>
        ) : (
          sections.map((section) => (
            <InventoryTile
              key={section.id}
              name={section.name}
              qrData={section.qrData}
              type="section"
              onPress={() => handleSectionPress(section)}
              onLongPress={() => handleEntityLongPress(section, 'section')}
            />
          ))
        )}

        {/* Direct Items */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <ThemedText type="subtitle">Items (Direct)</ThemedText>
          <ThemedText style={[styles.count, { color: colors.textSecondary }]}>
            {directItems.length}
          </ThemedText>
        </View>
        
        {directItems.length === 0 ? (
          <View style={[styles.emptySection, { backgroundColor: colors.elevated }]}>
            <ThemedText style={{ color: colors.textSecondary }}>No items directly in this area</ThemedText>
          </View>
        ) : (
          directItems.map((item) => (
            <InventoryTile
              key={item.id}
              name={item.name}
              qrData={item.qrData}
              type="item"
              description={item.description}
              quantity={item.quantity}
              condition={item.condition}
              photos={item.photos}
              onPress={() => handleEntityLongPress(item, 'item')}
              onLongPress={() => handleEntityLongPress(item, 'item')}
            />
          ))
        )}
      </ScrollView>

      {/* FAB Menu */}
      {showFABMenu && (
        <View style={styles.fabMenu}>
          <Pressable
            style={[styles.fabMenuItem, { backgroundColor: colors.section }]}
            onPress={() => openAddModal('section')}
          >
            <MaterialIcons name="view-module" size={20} color="#FFFFFF" />
            <ThemedText style={styles.fabMenuText}>Add Section</ThemedText>
          </Pressable>
          
          <Pressable
            style={[styles.fabMenuItem, { backgroundColor: colors.item }]}
            onPress={() => openAddModal('item')}
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

      {/* Add Section/Item Modal */}
      <AddEditModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAdd}
        type={addType}
      />

      {/* Edit Section Modal (for sections only) */}
      {selectedEntityType === 'section' && selectedEntity && (
        <AddEditModal
          visible={editSectionModalVisible}
          onClose={() => {
            setEditSectionModalVisible(false);
            setSelectedEntity(null);
          }}
          onSave={handleSaveSectionChanges}
          onDelete={handleDelete}
          type="section"
          initialName={selectedEntity.name}
          isEditing
        />
      )}

      {/* Edit Item Modal (for items - using ItemDetailModal) */}
      {selectedEntityType === 'item' && selectedEntity && (
        <ItemDetailModal
          visible={editItemModalVisible}
          onClose={() => {
            setEditItemModalVisible(false);
            setSelectedEntity(null);
          }}
          onSave={handleSaveItemChanges}
          onDelete={handleDelete}
          initialData={selectedEntity as Item}
          isEditing
        />
      )}

      {/* Bulk Item Modal */}
      <BulkItemModal
        visible={bulkItemModalVisible}
        onClose={() => setBulkItemModalVisible(false)}
        onSave={handleBulkItemSave}
        locationId={locationId}
        areaId={areaId}
        sectionId={null}
        locationName={location.name}
        areaName={area.name}
      />

      {selectedEntity && (
        <>
          <QRModal
            visible={qrModalVisible}
            onClose={() => {
              setQRModalVisible(false);
              setSelectedEntity(null);
            }}
            name={selectedEntity.name}
            qrData={selectedEntity.qrData}
            type={selectedEntityType}
            breadcrumb={breadcrumb}
            onEditQR={handleEditQR}
            onEdit={selectedEntityType === 'item' ? handleEditItem : handleEditSection}
          />

          <EditQRModal
            visible={editQRModalVisible}
            onClose={() => setEditQRModalVisible(false)}
            onSave={handleSaveQR}
            entityName={selectedEntity.name}
            entityType={selectedEntityType}
            currentQRData={selectedEntity.qrData}
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  count: {
    fontSize: 14,
  },
  emptySection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
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
