# QR Inventory Manager - Design Document

## Overview
A mobile inventory management app that uses auto-generated QR codes to identify and track storage locations and contents in a hierarchical structure.

## Hierarchy Structure
```
Location (e.g., Office)
  └── Area (e.g., Corner Shelf)
      └── Section (e.g., Shelf 1)
          └── Item (e.g., Container 1)
```

## Screen List

### 1. Home Screen (Locations Dashboard)
- **Purpose**: Display all locations as tiles with name and mini QR code
- **Content**: Grid of location tiles (2 columns)
- **Actions**: Tap tile → Navigate to Areas Dashboard, Add new location button (FAB)

### 2. Areas Dashboard
- **Purpose**: Display all areas within a selected location
- **Content**: Header with location name, grid of area tiles with mini QR codes
- **Actions**: Tap tile → Navigate to Sections/Items Dashboard, Add new area button, Back navigation

### 3. Sections & Items Dashboard
- **Purpose**: Display sections and items within a selected area
- **Content**: Header with breadcrumb (Location > Area), two sections - Sections grid and Items list
- **Actions**: Tap section → Navigate to Items view, Add section/item buttons

### 4. Section Items View
- **Purpose**: Display items within a specific section
- **Content**: Header with full breadcrumb, list of items with QR codes
- **Actions**: Add item, Edit/Delete items

### 5. Search Screen
- **Purpose**: Global fuzzy search across all hierarchy levels
- **Content**: Search input at top, filtered results grouped by type (locations, areas, sections, items)
- **Actions**: Type to filter (case-insensitive fuzzy match), tap result to navigate

### 6. Add/Edit Modal
- **Purpose**: Create or edit locations, areas, sections, or items
- **Content**: Form with name input, QR code preview (auto-generated on create)
- **Actions**: Save, Cancel, Delete (for edit mode)

### 7. QR Code Detail Modal
- **Purpose**: Display full-size QR code for scanning
- **Content**: Large QR code, item/location name, breadcrumb path
- **Actions**: Close modal

## Primary Content and Functionality

### Tile Component
- Name displayed prominently
- Mini QR code (64x64px) in corner
- Subtle background color or icon to indicate type
- Touch feedback on press

### QR Code Generation
- Auto-generated when any item is created
- Encodes: Type + ID + Name (e.g., "LOC:uuid:Office")
- Uses `react-native-qrcode-svg` library

### Data Storage
- Local storage using AsyncStorage
- JSON structure for each hierarchy level
- Each entity has: id, name, qrData, parentId, createdAt

### Fuzzy Search
- Case-insensitive matching
- Searches across: name field of all entities
- Results grouped by type with visual indicators
- Real-time filtering as user types

## Key User Flows

### Flow 1: Browse Inventory
1. User opens app → Home screen shows all locations as tiles
2. User taps "Office" tile → Areas dashboard opens
3. User taps "Corner Shelf" → Sections/Items view opens
4. User taps "Shelf 1" section → Items within that section displayed

### Flow 2: Add New Location
1. User taps "+" FAB on Home screen
2. Add modal opens with name input
3. User enters "Garage" and taps Save
4. QR code auto-generated, new tile appears on Home screen

### Flow 3: Search for Item
1. User taps Search tab
2. User types "container" in search input
3. Results filter in real-time showing all matching items
4. User taps "Container 1" → Navigates to its location in hierarchy

### Flow 4: View QR Code
1. User long-presses or taps QR icon on any tile
2. Full-size QR code modal opens
3. User can scan this code with another device

## Color Choices

### Primary Palette
- **Primary**: #2563EB (Blue 600) - Main actions, selected states
- **Primary Light**: #3B82F6 (Blue 500) - Hover/pressed states
- **Primary Dark**: #1D4ED8 (Blue 700) - Headers, emphasis

### Surface Colors
- **Background**: #F8FAFC (Slate 50) - Main background
- **Card**: #FFFFFF - Tile/card backgrounds
- **Elevated**: #F1F5F9 (Slate 100) - Elevated surfaces, search bar

### Text Colors
- **Primary Text**: #0F172A (Slate 900) - Main text
- **Secondary Text**: #475569 (Slate 600) - Subtitles, descriptions
- **Disabled Text**: #94A3B8 (Slate 400) - Placeholder text

### Accent Colors
- **Location**: #2563EB (Blue) - Location tiles accent
- **Area**: #7C3AED (Violet) - Area tiles accent
- **Section**: #059669 (Emerald) - Section tiles accent
- **Item**: #EA580C (Orange) - Item tiles accent

### Dark Mode
- **Background**: #0F172A (Slate 900)
- **Card**: #1E293B (Slate 800)
- **Elevated**: #334155 (Slate 700)
- **Primary Text**: #F8FAFC (Slate 50)
- **Secondary Text**: #94A3B8 (Slate 400)

## Typography

- **Title**: 28px, Bold - Screen titles
- **Subtitle**: 20px, SemiBold - Section headers
- **Body**: 16px, Regular - Main content
- **Caption**: 14px, Regular - Secondary info
- **Small**: 12px, Regular - Timestamps, hints

## Spacing & Layout

- **Grid**: 8pt base unit
- **Screen padding**: 16px
- **Tile gap**: 12px
- **Tile padding**: 16px
- **Card radius**: 12px
- **Button radius**: 8px

## Navigation Structure

```
Tab Bar:
├── Home (house.fill) - Locations Dashboard
├── Search (magnifyingglass) - Global Search
└── (No settings needed - local app)

Stack Navigation:
Home → Areas → Sections/Items → Section Items
```

## Component Specifications

### Inventory Tile
- Width: (screen width - 44px) / 2
- Height: 120px
- Border radius: 12px
- Shadow: subtle elevation
- QR code: 48x48px, bottom-right corner
- Name: 16px bold, top-left

### Search Bar
- Height: 44px
- Border radius: 22px (pill shape)
- Background: Elevated surface color
- Icon: 20px, left side
- Placeholder: "Search locations, items..."

### FAB (Floating Action Button)
- Size: 56px
- Position: Bottom-right, 16px from edges
- Icon: Plus sign, 24px
- Shadow: Medium elevation
