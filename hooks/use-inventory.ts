import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { generateId, generateQRData, generateBulkQRCodes } from '@/lib/qr-utils';
import type {
  Area,
  InventoryData,
  Item,
  Location,
  Section,
  SearchResult,
  PreGeneratedQR,
} from '@/types/inventory';

const STORAGE_KEY = 'inventory_data';
const PRE_QR_STORAGE_KEY = 'pre_generated_qr_codes';

const defaultData: InventoryData = {
  locations: [],
  areas: [],
  sections: [],
  items: [],
};

export function useInventory() {
  const [data, setData] = useState<InventoryData>(defaultData);
  const [preGeneratedQRs, setPreGeneratedQRs] = useState<PreGeneratedQR[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from storage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stored, preQRs] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(PRE_QR_STORAGE_KEY),
      ]);
      if (stored) {
        setData(JSON.parse(stored));
      }
      if (preQRs) {
        setPreGeneratedQRs(JSON.parse(preQRs));
      }
    } catch (error) {
      console.error('Failed to load inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newData: InventoryData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setData(newData);
    } catch (error) {
      console.error('Failed to save inventory data:', error);
    }
  };

  const savePreGeneratedQRs = async (qrs: PreGeneratedQR[]) => {
    try {
      await AsyncStorage.setItem(PRE_QR_STORAGE_KEY, JSON.stringify(qrs));
      setPreGeneratedQRs(qrs);
    } catch (error) {
      console.error('Failed to save pre-generated QR codes:', error);
    }
  };

  // Location CRUD
  const addLocation = useCallback(async (name: string): Promise<Location> => {
    const id = generateId();
    const qrData = generateQRData('location', name);
    const newLocation: Location = {
      id,
      name,
      qrData,
      type: 'location',
      createdAt: new Date().toISOString(),
    };
    const newData = { ...data, locations: [...data.locations, newLocation] };
    await saveData(newData);
    return newLocation;
  }, [data]);

  const updateLocation = useCallback(async (id: string, name: string) => {
    const newData = {
      ...data,
      locations: data.locations.map((loc) =>
        loc.id === id ? { ...loc, name } : loc
      ),
    };
    await saveData(newData);
  }, [data]);

  const updateLocationQR = useCallback(async (id: string, newQRData: string) => {
    const newData = {
      ...data,
      locations: data.locations.map((loc) =>
        loc.id === id ? { ...loc, qrData: newQRData } : loc
      ),
    };
    await saveData(newData);
    // Mark pre-generated QR as assigned if it exists
    const preQR = preGeneratedQRs.find(q => q.qrData === newQRData);
    if (preQR) {
      const updatedPreQRs = preGeneratedQRs.map(q =>
        q.qrData === newQRData ? { ...q, assignedTo: id, assignedType: 'location' as const } : q
      );
      await savePreGeneratedQRs(updatedPreQRs);
    }
  }, [data, preGeneratedQRs]);

  const deleteLocation = useCallback(async (id: string) => {
    const newData = {
      locations: data.locations.filter((loc) => loc.id !== id),
      areas: data.areas.filter((area) => area.locationId !== id),
      sections: data.sections.filter((sec) => sec.locationId !== id),
      items: data.items.filter((item) => item.locationId !== id),
    };
    await saveData(newData);
  }, [data]);

  // Area CRUD
  const addArea = useCallback(async (name: string, locationId: string): Promise<Area> => {
    const id = generateId();
    const qrData = generateQRData('area', name);
    const newArea: Area = {
      id,
      name,
      qrData,
      type: 'area',
      locationId,
      createdAt: new Date().toISOString(),
    };
    const newData = { ...data, areas: [...data.areas, newArea] };
    await saveData(newData);
    return newArea;
  }, [data]);

  const updateArea = useCallback(async (id: string, name: string) => {
    const newData = {
      ...data,
      areas: data.areas.map((area) =>
        area.id === id ? { ...area, name } : area
      ),
    };
    await saveData(newData);
  }, [data]);

  const updateAreaQR = useCallback(async (id: string, newQRData: string) => {
    const newData = {
      ...data,
      areas: data.areas.map((area) =>
        area.id === id ? { ...area, qrData: newQRData } : area
      ),
    };
    await saveData(newData);
    const preQR = preGeneratedQRs.find(q => q.qrData === newQRData);
    if (preQR) {
      const updatedPreQRs = preGeneratedQRs.map(q =>
        q.qrData === newQRData ? { ...q, assignedTo: id, assignedType: 'area' as const } : q
      );
      await savePreGeneratedQRs(updatedPreQRs);
    }
  }, [data, preGeneratedQRs]);

  const deleteArea = useCallback(async (id: string) => {
    const newData = {
      ...data,
      areas: data.areas.filter((area) => area.id !== id),
      sections: data.sections.filter((sec) => sec.areaId !== id),
      items: data.items.filter((item) => item.areaId !== id),
    };
    await saveData(newData);
  }, [data]);

  // Section CRUD
  const addSection = useCallback(async (name: string, locationId: string, areaId: string): Promise<Section> => {
    const id = generateId();
    const qrData = generateQRData('section', name);
    const newSection: Section = {
      id,
      name,
      qrData,
      type: 'section',
      locationId,
      areaId,
      createdAt: new Date().toISOString(),
    };
    const newData = { ...data, sections: [...data.sections, newSection] };
    await saveData(newData);
    return newSection;
  }, [data]);

  const updateSection = useCallback(async (id: string, name: string) => {
    const newData = {
      ...data,
      sections: data.sections.map((sec) =>
        sec.id === id ? { ...sec, name } : sec
      ),
    };
    await saveData(newData);
  }, [data]);

  const updateSectionQR = useCallback(async (id: string, newQRData: string) => {
    const newData = {
      ...data,
      sections: data.sections.map((sec) =>
        sec.id === id ? { ...sec, qrData: newQRData } : sec
      ),
    };
    await saveData(newData);
    const preQR = preGeneratedQRs.find(q => q.qrData === newQRData);
    if (preQR) {
      const updatedPreQRs = preGeneratedQRs.map(q =>
        q.qrData === newQRData ? { ...q, assignedTo: id, assignedType: 'section' as const } : q
      );
      await savePreGeneratedQRs(updatedPreQRs);
    }
  }, [data, preGeneratedQRs]);

  const deleteSection = useCallback(async (id: string) => {
    const newData = {
      ...data,
      sections: data.sections.filter((sec) => sec.id !== id),
      items: data.items.map((item) =>
        item.sectionId === id ? { ...item, sectionId: null } : item
      ),
    };
    await saveData(newData);
  }, [data]);

  // Item CRUD
  const addItem = useCallback(async (
    name: string,
    locationId: string,
    areaId: string,
    sectionId: string | null
  ): Promise<Item> => {
    const id = generateId();
    const qrData = generateQRData('item', name);
    const newItem: Item = {
      id,
      name,
      qrData,
      type: 'item',
      locationId,
      areaId,
      sectionId,
      createdAt: new Date().toISOString(),
    };
    const newData = { ...data, items: [...data.items, newItem] };
    await saveData(newData);
    return newItem;
  }, [data]);

  const updateItem = useCallback(async (id: string, name: string) => {
    const newData = {
      ...data,
      items: data.items.map((item) =>
        item.id === id ? { ...item, name } : item
      ),
    };
    await saveData(newData);
  }, [data]);

  const updateItemQR = useCallback(async (id: string, newQRData: string) => {
    const newData = {
      ...data,
      items: data.items.map((item) =>
        item.id === id ? { ...item, qrData: newQRData } : item
      ),
    };
    await saveData(newData);
    const preQR = preGeneratedQRs.find(q => q.qrData === newQRData);
    if (preQR) {
      const updatedPreQRs = preGeneratedQRs.map(q =>
        q.qrData === newQRData ? { ...q, assignedTo: id, assignedType: 'item' as const } : q
      );
      await savePreGeneratedQRs(updatedPreQRs);
    }
  }, [data, preGeneratedQRs]);

  const deleteItem = useCallback(async (id: string) => {
    const newData = {
      ...data,
      items: data.items.filter((item) => item.id !== id),
    };
    await saveData(newData);
  }, [data]);

  // Pre-generated QR codes
  const generateBulkQRs = useCallback(async (count: number, prefix?: string) => {
    const qrCodes = generateBulkQRCodes(count, prefix);
    const newPreQRs: PreGeneratedQR[] = qrCodes.map(qrData => ({
      qrData,
      prefix: prefix || null,
      createdAt: new Date().toISOString(),
      assignedTo: null,
      assignedType: null,
    }));
    const updatedPreQRs = [...preGeneratedQRs, ...newPreQRs];
    await savePreGeneratedQRs(updatedPreQRs);
    return newPreQRs;
  }, [preGeneratedQRs]);

  const deletePreGeneratedQR = useCallback(async (qrData: string) => {
    const updatedPreQRs = preGeneratedQRs.filter(q => q.qrData !== qrData);
    await savePreGeneratedQRs(updatedPreQRs);
  }, [preGeneratedQRs]);

  const clearUnassignedPreQRs = useCallback(async () => {
    const updatedPreQRs = preGeneratedQRs.filter(q => q.assignedTo !== null);
    await savePreGeneratedQRs(updatedPreQRs);
  }, [preGeneratedQRs]);

  // Getters
  const getLocationById = useCallback((id: string) => {
    return data.locations.find((loc) => loc.id === id);
  }, [data.locations]);

  const getAreaById = useCallback((id: string) => {
    return data.areas.find((area) => area.id === id);
  }, [data.areas]);

  const getSectionById = useCallback((id: string) => {
    return data.sections.find((sec) => sec.id === id);
  }, [data.sections]);

  const getAreasByLocation = useCallback((locationId: string) => {
    return data.areas.filter((area) => area.locationId === locationId);
  }, [data.areas]);

  const getSectionsByArea = useCallback((areaId: string) => {
    return data.sections.filter((sec) => sec.areaId === areaId);
  }, [data.sections]);

  const getItemsByArea = useCallback((areaId: string) => {
    return data.items.filter((item) => item.areaId === areaId && !item.sectionId);
  }, [data.items]);

  const getItemsBySection = useCallback((sectionId: string) => {
    return data.items.filter((item) => item.sectionId === sectionId);
  }, [data.items]);

  const getUnassignedPreQRs = useCallback(() => {
    return preGeneratedQRs.filter(q => q.assignedTo === null);
  }, [preGeneratedQRs]);

  // Backup and restore
  const restoreFromBackup = useCallback(async (
    backupData: { inventory: InventoryData; preGeneratedQRs: PreGeneratedQR[] },
    mode: 'merge' | 'replace'
  ) => {
    if (mode === 'replace') {
      await saveData(backupData.inventory);
      await savePreGeneratedQRs(backupData.preGeneratedQRs || []);
    } else {
      // Merge mode - add items that don't exist
      const mergedData: InventoryData = {
        locations: [...data.locations],
        areas: [...data.areas],
        sections: [...data.sections],
        items: [...data.items],
      };

      // Add locations that don't exist by ID
      backupData.inventory.locations.forEach(loc => {
        if (!mergedData.locations.find(l => l.id === loc.id)) {
          mergedData.locations.push(loc);
        }
      });

      // Add areas that don't exist by ID
      backupData.inventory.areas.forEach(area => {
        if (!mergedData.areas.find(a => a.id === area.id)) {
          mergedData.areas.push(area);
        }
      });

      // Add sections that don't exist by ID
      backupData.inventory.sections.forEach(sec => {
        if (!mergedData.sections.find(s => s.id === sec.id)) {
          mergedData.sections.push(sec);
        }
      });

      // Add items that don't exist by ID
      backupData.inventory.items.forEach(item => {
        if (!mergedData.items.find(i => i.id === item.id)) {
          mergedData.items.push(item);
        }
      });

      await saveData(mergedData);

      // Merge pre-generated QRs
      const mergedPreQRs = [...preGeneratedQRs];
      (backupData.preGeneratedQRs || []).forEach(qr => {
        if (!mergedPreQRs.find(q => q.qrData === qr.qrData)) {
          mergedPreQRs.push(qr);
        }
      });
      await savePreGeneratedQRs(mergedPreQRs);
    }
  }, [data, preGeneratedQRs]);

  const clearAllData = useCallback(async () => {
    await saveData(defaultData);
    await savePreGeneratedQRs([]);
  }, []);

  // Fuzzy search
  const search = useCallback((query: string): SearchResult[] => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    const fuzzyMatch = (text: string): boolean => {
      const lowerText = text.toLowerCase();
      let queryIndex = 0;
      for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
        if (lowerText[i] === lowerQuery[queryIndex]) {
          queryIndex++;
        }
      }
      return queryIndex === lowerQuery.length;
    };

    data.locations.forEach((loc) => {
      if (fuzzyMatch(loc.name)) {
        results.push({ entity: loc, breadcrumb: loc.name });
      }
    });

    data.areas.forEach((area) => {
      if (fuzzyMatch(area.name)) {
        const location = data.locations.find((l) => l.id === area.locationId);
        results.push({
          entity: area,
          breadcrumb: `${location?.name || 'Unknown'} > ${area.name}`,
        });
      }
    });

    data.sections.forEach((section) => {
      if (fuzzyMatch(section.name)) {
        const location = data.locations.find((l) => l.id === section.locationId);
        const area = data.areas.find((a) => a.id === section.areaId);
        results.push({
          entity: section,
          breadcrumb: `${location?.name || 'Unknown'} > ${area?.name || 'Unknown'} > ${section.name}`,
        });
      }
    });

    data.items.forEach((item) => {
      if (fuzzyMatch(item.name)) {
        const location = data.locations.find((l) => l.id === item.locationId);
        const area = data.areas.find((a) => a.id === item.areaId);
        const section = item.sectionId
          ? data.sections.find((s) => s.id === item.sectionId)
          : null;
        const breadcrumb = section
          ? `${location?.name || 'Unknown'} > ${area?.name || 'Unknown'} > ${section.name} > ${item.name}`
          : `${location?.name || 'Unknown'} > ${area?.name || 'Unknown'} > ${item.name}`;
        results.push({ entity: item, breadcrumb });
      }
    });

    return results;
  }, [data]);

  return {
    data,
    loading,
    // Locations
    locations: data.locations,
    addLocation,
    updateLocation,
    updateLocationQR,
    deleteLocation,
    getLocationById,
    // Areas
    areas: data.areas,
    addArea,
    updateArea,
    updateAreaQR,
    deleteArea,
    getAreaById,
    getAreasByLocation,
    // Sections
    sections: data.sections,
    addSection,
    updateSection,
    updateSectionQR,
    deleteSection,
    getSectionById,
    getSectionsByArea,
    // Items
    items: data.items,
    addItem,
    updateItem,
    updateItemQR,
    deleteItem,
    getItemsByArea,
    getItemsBySection,
    // Pre-generated QRs
    preGeneratedQRs,
    generateBulkQRs,
    deletePreGeneratedQR,
    clearUnassignedPreQRs,
    getUnassignedPreQRs,
    // Search
    search,
    // Backup/Restore
    restoreFromBackup,
    clearAllData,
  };
}
