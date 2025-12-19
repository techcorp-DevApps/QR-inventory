import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddEditModal } from '@/components/add-edit-modal';
import { EditQRModal } from '@/components/edit-qr-modal';
import { FAB } from '@/components/fab';
import { InventoryTile } from '@/components/inventory-tile';
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

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [qrModalVisible, setQRModalVisible] = useState(false);
  const [editQRModalVisible, setEditQRModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

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

  const handleAddItem = async (name: string) => {
    await addItem(name, section.locationId, section.areaId, section.id);
  };

  const handleEditItem = async (name: string) => {
    if (selectedItem) {
      await updateItem(selectedItem.id, { name });
      setSelectedItem(null);
    }
  };

  const handleDeleteItem = async () => {
    if (selectedItem) {
      await deleteItem(selectedItem.id);
      setSelectedItem(null);
    }
  };

  const handleEditQR = () => {
    setEditQRModalVisible(true);
  };

  const handleSaveQR = async (newQRData: string) => {
    if (selectedItem) {
      await updateItemQR(selectedItem.id, newQRData);
      setSelectedItem({ ...selectedItem, qrData: newQRData });
    }
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
              onPress={() => handleItemLongPress(item)}
              onLongPress={() => handleItemLongPress(item)}
            />
          )}
        />
      )}

      <FAB onPress={() => setAddModalVisible(true)} />

      <AddEditModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAddItem}
        type="item"
      />

      <AddEditModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedItem(null);
        }}
        onSave={handleEditItem}
        onDelete={handleDeleteItem}
        type="item"
        initialName={selectedItem?.name}
        isEditing
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
    paddingBottom: 100,
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
});
