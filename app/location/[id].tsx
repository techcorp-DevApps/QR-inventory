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
import type { Area } from '@/types/inventory';

export default function LocationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { getLocationById, getAreasByLocation, addArea, updateArea, updateAreaQR, deleteArea } = useInventoryContext();
  
  const location = getLocationById(id);
  const areas = getAreasByLocation(id);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [qrModalVisible, setQRModalVisible] = useState(false);
  const [editQRModalVisible, setEditQRModalVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

  if (!location) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Location not found</ThemedText>
      </ThemedView>
    );
  }

  const handleAreaPress = (area: Area) => {
    router.push(`/area/${location.id}/${area.id}` as any);
  };

  const handleAreaLongPress = (area: Area) => {
    setSelectedArea(area);
    setQRModalVisible(true);
  };

  const handleAddArea = async (name: string) => {
    await addArea(name, location.id);
  };

  const handleEditArea = async (name: string) => {
    if (selectedArea) {
      await updateArea(selectedArea.id, name);
      setSelectedArea(null);
    }
  };

  const handleDeleteArea = async () => {
    if (selectedArea) {
      await deleteArea(selectedArea.id);
      setSelectedArea(null);
    }
  };

  const handleEditQR = () => {
    setEditQRModalVisible(true);
  };

  const handleSaveQR = async (newQRData: string) => {
    if (selectedArea) {
      await updateAreaQR(selectedArea.id, newQRData);
      setSelectedArea({ ...selectedArea, qrData: newQRData });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.lg) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color={colors.tint} />
          <ThemedText style={[styles.backText, { color: colors.tint }]}>Back</ThemedText>
        </Pressable>
        <ThemedText type="title" style={styles.title}>{location.name}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {areas.length} {areas.length === 1 ? 'area' : 'areas'}
        </ThemedText>
      </View>

      {areas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            No areas yet
          </ThemedText>
          <ThemedText style={[styles.emptyHint, { color: colors.textDisabled }]}>
            Tap the + button to add an area
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={areas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <InventoryTile
              name={item.name}
              qrData={item.qrData}
              type="area"
              onPress={() => handleAreaPress(item)}
              onLongPress={() => handleAreaLongPress(item)}
            />
          )}
        />
      )}

      <FAB onPress={() => setAddModalVisible(true)} />

      <AddEditModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAddArea}
        type="area"
      />

      <AddEditModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedArea(null);
        }}
        onSave={handleEditArea}
        onDelete={handleDeleteArea}
        type="area"
        initialName={selectedArea?.name}
        isEditing
      />

      {selectedArea && (
        <>
          <QRModal
            visible={qrModalVisible}
            onClose={() => {
              setQRModalVisible(false);
              setSelectedArea(null);
            }}
            name={selectedArea.name}
            qrData={selectedArea.qrData}
            type="area"
            breadcrumb={location.name}
            onEditQR={handleEditQR}
          />

          <EditQRModal
            visible={editQRModalVisible}
            onClose={() => setEditQRModalVisible(false)}
            onSave={handleSaveQR}
            entityName={selectedArea.name}
            entityType="area"
            currentQRData={selectedArea.qrData}
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
