import * as Crypto from 'expo-crypto';
import type { EntityType } from '@/types/inventory';

/**
 * Generate a UUID v4 using expo-crypto for native compatibility
 * This works properly in both development and production APK builds
 */
function generateUUID(): string {
  const uuid = Crypto.randomUUID();
  return uuid;
}

/**
 * Generate a unique QR data string for an inventory entity
 * Format: PREFIX-TYPE:UUID:NAME or TYPE:UUID:NAME (if no prefix)
 */
export function generateQRData(type: EntityType, name: string, prefix?: string): string {
  const id = generateUUID();
  const typePrefix = type.toUpperCase().substring(0, 3); // LOC, ARE, SEC, ITE
  const fullPrefix = prefix ? `${prefix}-${typePrefix}` : typePrefix;
  return `${fullPrefix}:${id}:${encodeURIComponent(name)}`;
}

/**
 * Generate a pre-generated QR code (not yet assigned to any entity)
 * Format: PREFIX-PRE:UUID or PRE:UUID (if no prefix)
 */
export function generatePreQRCode(prefix?: string): string {
  const id = generateUUID();
  const typePrefix = prefix ? `${prefix}-PRE` : 'PRE';
  return `${typePrefix}:${id}`;
}

/**
 * Generate multiple pre-generated QR codes
 */
export function generateBulkQRCodes(count: number, prefix?: string): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generatePreQRCode(prefix));
  }
  return codes;
}

/**
 * Convert QR data to a hex string for display
 */
export function qrDataToHex(qrData: string): string {
  return Array.from(qrData)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Convert hex string back to QR data
 */
export function hexToQRData(hex: string): string | null {
  try {
    const cleanHex = hex.replace(/\s/g, '').toUpperCase();
    if (cleanHex.length % 2 !== 0) return null;
    
    let result = '';
    for (let i = 0; i < cleanHex.length; i += 2) {
      const byte = parseInt(cleanHex.substring(i, i + 2), 16);
      if (isNaN(byte)) return null;
      result += String.fromCharCode(byte);
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Format hex string for display (groups of 4)
 */
export function formatHexForDisplay(hex: string): string {
  const clean = hex.replace(/\s/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

/**
 * Parse QR data string back to components
 */
export function parseQRData(qrData: string): { type: string; id: string; name: string; prefix?: string } | null {
  const parts = qrData.split(':');
  if (parts.length < 2) return null;
  
  const [typePart, id, ...nameParts] = parts;
  const name = nameParts.length > 0 ? decodeURIComponent(nameParts.join(':')) : '';
  
  // Check if there's a prefix (format: PREFIX-TYPE)
  let prefix: string | undefined;
  let typePrefix = typePart;
  
  if (typePart.includes('-')) {
    const prefixParts = typePart.split('-');
    prefix = prefixParts.slice(0, -1).join('-');
    typePrefix = prefixParts[prefixParts.length - 1];
  }
  
  const typeMap: Record<string, string> = {
    'LOC': 'location',
    'ARE': 'area',
    'SEC': 'section',
    'ITE': 'item',
    'PRE': 'pregenerated',
  };
  
  return {
    type: typeMap[typePrefix] || typePrefix.toLowerCase(),
    id,
    name,
    prefix,
  };
}

/**
 * Validate if a string is a valid QR data format
 */
export function isValidQRData(qrData: string): boolean {
  const parts = qrData.split(':');
  if (parts.length < 2) return false;
  
  const [typePart, id] = parts;
  // Check if ID looks like a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Generate a new UUID using expo-crypto for native compatibility
 */
export function generateId(): string {
  return generateUUID();
}
