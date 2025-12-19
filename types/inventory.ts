export type EntityType = 'location' | 'area' | 'section' | 'item';

// Available icons for locations
export type LocationIcon = 
  | 'home' | 'business' | 'warehouse' | 'store' | 'apartment'
  | 'garage' | 'storage' | 'kitchen' | 'bedroom' | 'bathroom'
  | 'office' | 'meeting-room' | 'factory' | 'inventory' | 'local-shipping';

// Available colors for locations
export type LocationColor = 
  | '#3B82F6' | '#10B981' | '#F59E0B' | '#EF4444' | '#8B5CF6'
  | '#EC4899' | '#06B6D4' | '#84CC16' | '#F97316' | '#6366F1';

export interface BaseEntity {
  id: string;
  name: string;
  qrData: string;
  createdAt: string;
}

export interface Location extends BaseEntity {
  type: 'location';
  icon?: LocationIcon;
  color?: LocationColor;
}

export interface Area extends BaseEntity {
  type: 'area';
  locationId: string;
}

export interface Section extends BaseEntity {
  type: 'section';
  locationId: string;
  areaId: string;
}

// Extended item interface with photos and notes
export interface Item extends BaseEntity {
  type: 'item';
  locationId: string;
  areaId: string;
  sectionId: string | null; // Items can be directly in an area or in a section
  // New fields for enhanced item management
  description?: string;
  quantity?: number;
  condition?: 'new' | 'good' | 'fair' | 'poor';
  photos?: string[]; // Array of base64 encoded images or file URIs
  customFields?: CustomField[];
  notes?: string;
}

// Custom field for flexible item attributes
export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export type InventoryEntity = Location | Area | Section | Item;

export interface InventoryData {
  locations: Location[];
  areas: Area[];
  sections: Section[];
  items: Item[];
}

export interface SearchResult {
  entity: InventoryEntity;
  breadcrumb: string;
}

// Extended PreGeneratedQR with labels/notes
export interface PreGeneratedQR {
  qrData: string;
  prefix: string | null;
  createdAt: string;
  assignedTo: string | null;
  assignedType: EntityType | null;
  // New fields for better organization
  label?: string;
  notes?: string;
}

// Bulk item creation template
export interface BulkItemTemplate {
  name: string;
  description?: string;
  quantity?: number;
  condition?: Item['condition'];
}

// Inventory report data structure
export interface InventoryReport {
  generatedAt: string;
  totalLocations: number;
  totalAreas: number;
  totalSections: number;
  totalItems: number;
  locations: LocationReport[];
}

export interface LocationReport {
  location: Location;
  areas: AreaReport[];
}

export interface AreaReport {
  area: Area;
  sections: SectionReport[];
  items: Item[];
}

export interface SectionReport {
  section: Section;
  items: Item[];
}
