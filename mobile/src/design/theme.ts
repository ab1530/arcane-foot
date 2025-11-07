// Modern Design System inspired by shadcn/ui and iOS 18
import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Color System with HSL values for better control
export const colors = {
  // Brand Colors - Arcane theme
  brand: {
    primary: '#E4FF3B', // Arcane yellow
    primaryLight: '#F0FF6B',
    primaryDark: '#C8E611',
    secondary: '#1A1A1A',
    accent: '#00FFB3', // Neon cyan
    gradient: ['#E4FF3B', '#00FFB3'],
  },

  // Base Colors
  background: {
    primary: '#080C1D', // Arcane brand color
    secondary: '#0A0E1F',
    tertiary: '#1A1F35',
    elevated: '#1F1F1F',
    overlay: 'rgba(8, 12, 29, 0.8)',
  },

  // Surface Colors with glass effect
  surface: {
    glass: 'rgba(255, 255, 255, 0.03)',
    glassLight: 'rgba(255, 255, 255, 0.05)',
    glassMedium: 'rgba(255, 255, 255, 0.08)',
    glassHeavy: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.05)',
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    muted: 'rgba(255, 255, 255, 0.3)',
    inverse: '#0A0A0A',
  },

  // Semantic Colors
  semantic: {
    success: '#22C55E',
    successLight: 'rgba(34, 197, 94, 0.1)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.1)',
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.1)',
  },

  // Status Colors
  status: {
    online: '#22C55E',
    offline: '#6B7280',
    busy: '#F59E0B',
    away: '#3B82F6',
  },

  // Chart Colors
  chart: {
    primary: '#E4FF3B',
    secondary: '#00FFB3',
    tertiary: '#3B82F6',
    quaternary: '#F59E0B',
    quinary: '#EF4444',
  },
} as const;

// Typography System
export const typography = {
  // Font Families
  fonts: {
    regular: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    semiBold: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto-Bold',
      default: 'System',
    }),
    mono: Platform.select({
      ios: 'SF Mono',
      android: 'monospace',
      default: 'monospace',
    }),
  },

  // Font Sizes
  sizes: {
    // Display
    display1: 56,
    display2: 48,
    display3: 40,

    // Headings
    h1: 32,
    h2: 28,
    h3: 24,
    h4: 20,
    h5: 18,
    h6: 16,

    // Body
    xl: 18,
    lg: 16,
    base: 14,
    sm: 13,
    xs: 12,
    xxs: 10,

    // UI
    button: 15,
    caption: 12,
    overline: 10,
  },

  // Font Weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
    black: '900' as const,
  },

  // Line Heights
  lineHeights: {
    tight: 1.1,
    snug: 1.2,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
} as const;

// Spacing System (8px base)
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 56,
  '6xl': 64,
  '7xl': 72,
  '8xl': 80,
} as const;

// Border Radius (aligned with web)
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  full: 9999,
} as const;

// Shadows (iOS style)
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
  },
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: -2,
  },
  glow: {
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 0,
  },
} as const;

// Animation Durations
export const animations = {
  // Durations
  durations: {
    instant: 0,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 800,
    slowest: 1000,
  },

  // Easings (cubic-bezier values for Reanimated)
  easings: {
    linear: [0, 0, 1, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    easeInQuad: [0.55, 0.085, 0.68, 0.53],
    easeInCubic: [0.55, 0.055, 0.675, 0.19],
    easeOutCubic: [0.215, 0.61, 0.355, 1],
    easeInOutCubic: [0.645, 0.045, 0.355, 1],
    easeInExpo: [0.95, 0.05, 0.795, 0.035],
    easeOutExpo: [0.19, 1, 0.22, 1],
    easeInOutExpo: [1, 0, 0, 1],
    spring: [0.175, 0.885, 0.32, 1.275],
  },

  // Spring Configs for Reanimated
  springs: {
    gentle: {
      damping: 15,
      stiffness: 100,
      mass: 1,
    },
    wobbly: {
      damping: 10,
      stiffness: 180,
      mass: 1,
    },
    stiff: {
      damping: 20,
      stiffness: 200,
      mass: 1,
    },
    slow: {
      damping: 15,
      stiffness: 40,
      mass: 1,
    },
    bouncy: {
      damping: 8,
      stiffness: 200,
      mass: 0.8,
    },
  },
} as const;

// Layout
export const layout = {
  // Screen dimensions
  screen: {
    width: screenWidth,
    height: screenHeight,
  },

  // Safe area padding
  safeArea: {
    top: Platform.OS === 'ios' ? 44 : 24,
    bottom: Platform.OS === 'ios' ? 34 : 0,
  },

  // Content width constraints
  contentWidth: {
    xs: 320,
    sm: 384,
    md: 448,
    lg: 512,
    xl: 576,
    full: screenWidth,
  },

  // Grid
  grid: {
    columns: 12,
    gutter: spacing.md,
  },

  // Common aspect ratios
  aspectRatios: {
    square: 1,
    video: 16 / 9,
    poster: 3 / 4,
    wide: 21 / 9,
    ultraWide: 32 / 9,
  },
} as const;

// Z-index scale
export const zIndex = {
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

// Blur values for glass effect
export const blur = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
} as const;

// Export complete theme
export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  animations,
  layout,
  zIndex,
  blur,
} as const;

// Type exports
export type Theme = typeof theme;
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Shadows = typeof shadows;
export type Animations = typeof animations;
export type Layout = typeof layout;
export type ZIndex = typeof zIndex;
export type Blur = typeof blur;

export default theme;