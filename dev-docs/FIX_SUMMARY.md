# QR Inventory App - APK Build Fix Summary

## Issues Fixed

Two critical issues were identified and resolved when the application was installed as a built APK file on Android devices:

1. **Bulk QR Code Generation Not Working**: When generating bulk QR codes, no QR codes were being generated.
2. **Location Saving Not Working**: When adding a new location, the location was not being saved.

## Root Cause Analysis

Both issues stemmed from the same underlying problem: the `uuid` library (version 13.0.0) was being used to generate unique identifiers (UUIDs) for QR codes and inventory entities.

The `uuid` library's `v4()` function relies on `crypto.getRandomValues()`, which is a Web Crypto API. While this API is available in:
- Modern web browsers
- Node.js environments
- Expo development mode (via Metro bundler polyfills)

It is **not available** in the React Native JavaScript runtime when the app is built and installed as a standalone APK on Android devices. This caused the UUID generation to fail silently, resulting in:
- Empty QR code arrays when generating bulk codes
- Failed location creation (since each location requires a unique ID and QR data)

## Solution Implemented

The fix involved replacing the `uuid` library with `expo-crypto`, which is an Expo SDK module that provides native cryptographic functions. The `expo-crypto` module uses the device's native cryptographic APIs, ensuring consistent behavior across all environments including production APK builds.

### Changes Made

#### 1. `lib/qr-utils.ts`

**Before:**
```typescript
import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}
```

**After:**
```typescript
import * as Crypto from 'expo-crypto';

function generateUUID(): string {
  const uuid = Crypto.randomUUID();
  return uuid;
}

export function generateId(): string {
  return generateUUID();
}
```

#### 2. `__mocks__/expo-crypto.ts` (New File)

A mock file was created for the testing environment since `expo-crypto` is a native module that cannot run in Node.js test environments:

```typescript
export function randomUUID(): string {
  return crypto.randomUUID();
}
```

#### 3. `vitest.config.ts` (New File)

A Vitest configuration file was added to properly alias the `expo-crypto` import to the mock during testing:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'expo-crypto': path.resolve(__dirname, '__mocks__/expo-crypto.ts'),
    },
  },
});
```

## Verification

All QR-related tests pass successfully after the fix:

- ✅ `generateId` - Generates valid UUIDs
- ✅ `generateQRData` - Creates QR data for locations, areas, sections, items
- ✅ `generatePreQRCode` - Creates pre-generated QR codes with/without prefix
- ✅ `generateBulkQRCodes` - Generates specified number of QR codes
- ✅ `qrDataToHex` / `hexToQRData` - Hex conversion functions
- ✅ `parseQRData` - Parses QR data strings correctly
- ✅ `isValidQRData` - Validates QR data format

## Rebuilding the APK

After pulling the latest changes, rebuild the APK using:

```bash
# Install dependencies
pnpm install

# Build the APK using EAS Build (recommended)
eas build --platform android --profile preview

# Or use local build
npx expo run:android --variant release
```

## Technical Notes

- The `expo-crypto` module was already included in the project dependencies, so no new packages needed to be installed.
- The `uuid` package can optionally be removed from `package.json` if it's not used elsewhere in the project.
- This fix ensures UUID generation works consistently across:
  - Development mode (Expo Go / Metro)
  - Production APK builds
  - iOS builds
  - Web builds

## Commit Reference

Commit: `80070ef` - "fix: Replace uuid library with expo-crypto for native APK compatibility"
