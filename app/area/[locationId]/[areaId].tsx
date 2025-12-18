import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddEditModal } from '@/components/add-edit-modal';
import { EditQRModal } from '@/components/edit-qr-modal';
import { FAB } from '@/components/fab';
import { InventoryTile } from '@/components/inventory-tile';
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

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addType, setAddType] = useState<AddType>('section');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [qrModalVisible, setQRModalVisible] = useState(false);
  const [editQRModalVisible, setEditQRModalVisible] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Section | Item | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>('section');
  const [showAddOptions, setShowAddOptions] = useState(false);

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

  const handleAdd = async (name: string) => {
    if (addType === 'section') {
      await addSection(name, locationId, areaId);
    } else {
      await addItem(name, locationId, areaId, null);
    }
  };

  const handleEdit = async (name: string) => {
    if (selectedEntity) {
      if (selectedEntityType === 'section') {
        await updateSection(selectedEntity.id, name);
      } else {
        await updateItem(selectedEntity.id, name);
      }
      setSelectedEntity(null);
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
    }
  };

  const handleEditQR = () => {
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

  const openAddModal = (type: AddType) => {
    setAddType(type);
    setShowAddOptions(false);
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
              onPress={() => handleEntityLongPress(item, 'item')}
              onLongPress={() => handleEntityLongPress(item, 'item')}
            />
          ))
        )}
      </ScrollView>

      {/* Add Options */}
      {showAddOptions && (
        <View style={[styles.addOptions, { backgroundColor: colors.card }]}>
          <Pressable
            style={[styles.addOption, { borderBottomColor: colors.border }]}
            onPress={() => openAddModal('section')}
          >
            <MaterialIcons name="folder" size={24} color={colors.section} />
            <ThemedText style={styles.addOptionText}>Add Section</ThemedText>
          </Pressable>
          <Pressable
            style={styles.addOption}
            onPress={() => openAddModal('item')}
          >
            <MaterialIcons name="inventory-2" size={24} color={colors.item} />
            <ThemedText style={styles.addOptionText}>Add Item</ThemedText>
          </Pressable>
        </View>
      )}

      <FAB onPress={() => setShowAddOptions(!showAddOptions)} icon={showAddOptions ? 'close' : 'add'} />

      <AddEditModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAdd}
        type={addType}
      />

      <AddEditModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedEntity(null);
        }}
        onSave={handleEdit}
        onDelete={handleDelete}
        type={selectedEntityType}
        initialName={selectedEntity?.name}
        isEditing
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
  addOptions: {
    position: 'absolute',
    bottom: 96,
    right: 24,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  addOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  addOptionText: {
    marginLeft: Spacing.md,
    fontSize: 16,
    fontWeight: '500',
  },
});
