// Mock for expo-crypto to use in tests
// Uses the uuid library for test environment since crypto.randomUUID is available in Node.js

export function randomUUID(): string {
  // Use crypto.randomUUID() which is available in Node.js 14.17+
  return crypto.randomUUID();
}

export default {
  randomUUID,
};
