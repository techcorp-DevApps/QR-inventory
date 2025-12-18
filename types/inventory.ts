export type EntityType = 'location' | 'area' | 'section' | 'item';

export interface BaseEntity {
  id: string;
  name: string;
  qrData: string;
  createdAt: string;
}

export interface Location extends BaseEntity {
  type: 'location';
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

export interface Item extends BaseEntity {
  type: 'item';
  locationId: string;
  areaId: string;
  sectionId: string | null; // Items can be directly in an area or in a section
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

export interface PreGeneratedQR {
  qrData: string;
  prefix: string | null;
  createdAt: string;
  assignedTo: string | null;
  assignedType: EntityType | null;
}
