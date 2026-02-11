/**
 * @deprecated This file is deprecated. Please use @/design/theme instead.
 *
 * Migration Guide:
 * - COLORS -> colors
 * - SPACING -> spacing
 * - FONTS -> typography
 * - BORDER_RADIUS -> radius
 * - SHADOWS -> shadows
 * - ANIMATION -> animations
 *
 * See /mobile/src/design/theme.ts for the new comprehensive design system.
 */

// ARCANE Design System for Mobile (DEPRECATED)
export const COLORS = {
  // Primary ARCANE Colors
  dark: '#080C1D',
  darkBg: '#0A0E1F',
  darkBorder: '#1A1F35',
  accent: '#E4FF3B',
  accentDark: '#B8CC00',
  grey: '#9FA1A9',
  lightGrey: '#E5E7EB',

  // Status Colors
  success: '#22C55E',
  error: '#EF4444',
  warning: '#EAB308',
  info: '#3B82F6',

  // Glass Effect
  glassLight: 'rgba(255, 255, 255, 0.05)',
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(228, 255, 59, 0.2)',
  glassGlow: 'rgba(228, 255, 59, 0.1)',

  // Card
  cardBg: '#0D1117',

  // Additional Colors
  danger: '#EF4444',
  white: '#FFFFFF',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9FA1A9',
  textMuted: '#6B7280',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONTS = {
  family: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    black: 'System',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    title: 36,
  },
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 350,
};
