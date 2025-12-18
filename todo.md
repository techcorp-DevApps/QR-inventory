# Project TODO

- [x] Set up theme colors and typography
- [x] Create data models for Location, Area, Section, Item
- [x] Implement AsyncStorage hooks for CRUD operations
- [x] Create QR code generation utility
- [x] Build InventoryTile component with mini QR code
- [x] Implement Home screen (Locations Dashboard)
- [x] Implement Areas Dashboard screen
- [x] Implement Sections/Items Dashboard screen
- [x] Implement Section Items view screen
- [x] Build Search screen with fuzzy search
- [x] Create Add/Edit modal for all entity types
- [x] Create QR code detail modal
- [x] Add tab navigation (Home, Search)
- [x] Generate custom app icon
- [x] Test all user flows end-to-end

## New Features (v2)
- [x] Display QR hex code below QR codes for manual entry
- [x] Add Edit QR option to manually assign QR codes
- [x] Implement QR code scanning for manual assignment
- [x] Implement hex entry input for manual QR assignment
- [x] Build bulk QR code generation screen
- [x] Add prefix support for bulk QR generation
- [x] Create printable QR code sheet view

## New Features (v3)
- [x] Export generated QR codes as PDF for printing

## New Features (v4)
- [x] Create QR code scanner component using expo-camera
- [x] Add Scan tab to bottom navigation
- [x] Implement scan-to-navigate flow (scan existing QR to view item/location)
- [x] Implement scan-to-assign flow (scan pre-generated QR to assign to entity)

## New Features (v5)
- [x] Create backup utility to export inventory data as JSON
- [x] Create restore utility to import inventory data from JSON
- [x] Add Settings tab with backup/restore options
- [x] Implement file picker for importing JSON backups

## Bug Fixes
- [x] Fix Android build failure - remove deprecated expo-barcode-scanner
