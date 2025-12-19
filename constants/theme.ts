/**
 * QR Inventory Manager Theme
 * Color palette designed for inventory management with hierarchy-based accents
 */

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#0F172A",
    textSecondary: "#475569",
    textDisabled: "#94A3B8",
    background: "#F8FAFC",
    card: "#FFFFFF",
    elevated: "#F1F5F9",
    tint: "#2563EB",
    tintLight: "#3B82F6",
    tintDark: "#1D4ED8",
    icon: "#475569",
    tabIconDefault: "#64748B",
    tabIconSelected: "#2563EB",
    border: "#E2E8F0",
    // Hierarchy accent colors
    location: "#2563EB",
    area: "#7C3AED",
    section: "#059669",
    item: "#EA580C",
  },
  dark: {
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    textDisabled: "#64748B",
    background: "#0F172A",
    card: "#1E293B",
    elevated: "#334155",
    tint: "#3B82F6",
    tintLight: "#60A5FA",
    tintDark: "#2563EB",
    icon: "#94A3B8",
    tabIconDefault: "#64748B",
    tabIconSelected: "#3B82F6",
    border: "#334155",
    // Hierarchy accent colors
    location: "#3B82F6",
    area: "#8B5CF6",
    section: "#10B981",
    item: "#F97316",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};
