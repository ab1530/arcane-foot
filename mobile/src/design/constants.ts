/**
 * STATIC DESIGN CONSTANTS
 * Use these in StyleSheet.create() to avoid module initialization issues
 */

// Spacing (8-point grid)
export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

// Border Radius
export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// Colors
export const COLORS = {
  // Arcane Dark
  black: '#0A0A0A',
  anthracite: '#1B1B1F',
  charcoal: '#27272A',
  slate: '#3F3F46',

  // Yellow Accent
  yellow: '#E4FF3B',
  yellowDim: '#E4FF3B20',
  yellowGlow: '#E4FF3B40',

  // Grays
  gray50: '#FAFAFA',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray300: '#D4D4D8',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',

  // Semantic
  success: '#10B981',
  successBg: '#10B98120',
  warning: '#F59E0B',
  warningBg: '#F59E0B20',
  error: '#EF4444',
  errorBg: '#EF444420',
  info: '#3B82F6',
  infoBg: '#3B82F620',

  // Glass
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(228, 255, 59, 0.1)',
  glassLight: 'rgba(255, 255, 255, 0.05)',
} as const;

// Typography
export const FONT_SIZE = {
  xxs: 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
} as const;

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
} as const;

export const FONT_FAMILY = {
  display: 'Poppins',
  sans: 'Inter',
  body: 'Manrope',
  mono: 'Courier New',
} as const;

// Shadows
export const SHADOW_SM = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
};

export const SHADOW_MD = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 3,
};

export const SHADOW_LG = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.2,
  shadowRadius: 15,
  elevation: 8,
};

export const SHADOW_GLOW_YELLOW = {
  shadowColor: '#E4FF3B',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.3,
  shadowRadius: 20,
  elevation: 0,
};

// Icon Sizes
export const ICON_SIZE = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
} as const;

// Z-Index
export const Z_INDEX = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  loading: 90,
  max: 999,
} as const;
