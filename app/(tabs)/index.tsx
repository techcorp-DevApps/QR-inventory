import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EditQRModal } from '@/components/edit-qr-modal';
import { FAB } from '@/components/fab';
import { InventoryTile } from '@/components/inventory-tile';
import { LocationCustomizeModal } from '@/components/location-customize-modal';
import { QRModal } from '@/components/qr-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useInventoryContext } from '@/contexts/inventory-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Location, LocationIcon, LocationColor } from '@/types/inventory';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { locations, loading, addLocation, updateLocation, updateLocationQR, deleteLocation } = useInventoryContext();
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [qrModalVisible, setQRModalVisible] = useState(false);
  const [editQRModalVisible, setEditQRModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const handleLocationPress = (location: Location) => {
    router.push(`/location/${location.id}` as any);
  };

  const handleLocationLongPress = (location: Location) => {
    setSelectedLocation(location);
    setQRModalVisible(true);
  };

  const handleAddLocation = async (data: { name: string; icon?: LocationIcon; color?: LocationColor }) => {
    await addLocation(data.name, data.icon, data.color);
  };

  const handleEditLocation = async (data: { name: string; icon?: LocationIcon; color?: LocationColor }) => {
    if (selectedLocation) {
      await updateLocation(selectedLocation.id, data.name, data.icon, data.color);
      setSelectedLocation(null);
    }
  };

  const handleDeleteLocation = async () => {
    if (selectedLocation) {
      await deleteLocation(selectedLocation.id);
      setSelectedLocation(null);
    }
  };

  const handleEditQR = () => {
    setEditQRModalVisible(true);
  };

  const handleSaveQR = async (newQRData: string) => {
    if (selectedLocation) {
      await updateLocationQR(selectedLocation.id, newQRData);
      // Update the selected location with new QR data for display
      setSelectedLocation({ ...selectedLocation, qrData: newQRData });
    }
  };

  const handleEditFromQRModal = () => {
    setQRModalVisible(false);
    setEditModalVisible(true);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.lg) }]}>
        <ThemedText type="title">Locations</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {locations.length} {locations.length === 1 ? 'location' : 'locations'}
        </ThemedText>
      </View>

      {locations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            No locations yet
          </ThemedText>
          <ThemedText style={[styles.emptyHint, { color: colors.textDisabled }]}>
            Tap the + button to add your first location
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <InventoryTile
              name={item.name}
              qrData={item.qrData}
              type="location"
              icon={item.icon}
              color={item.color}
              onPress={() => handleLocationPress(item)}
              onLongPress={() => handleLocationLongPress(item)}
            />
          )}
        />
      )}

      <FAB onPress={() => setAddModalVisible(true)} />

      {/* Add Location Modal */}
      <LocationCustomizeModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAddLocation}
      />

      {/* Edit Location Modal */}
      <LocationCustomizeModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedLocation(null);
        }}
        onSave={handleEditLocation}
        onDelete={handleDeleteLocation}
        initialData={selectedLocation || undefined}
        isEditing
      />

      {selectedLocation && (
        <>
          <QRModal
            visible={qrModalVisible}
            onClose={() => {
              setQRModalVisible(false);
              setSelectedLocation(null);
            }}
            name={selectedLocation.name}
            qrData={selectedLocation.qrData}
            type="location"
            onEditQR={handleEditQR}
            onEdit={handleEditFromQRModal}
          />

          <EditQRModal
            visible={editQRModalVisible}
            onClose={() => setEditQRModalVisible(false)}
            onSave={handleSaveQR}
            entityName={selectedLocation.name}
            entityType="location"
            currentQRData={selectedLocation.qrData}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
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
