/**
 * ARCANE DESIGN SYSTEM 2.0 - THEME CONFIGURATION
 * Complete theme system integrating all Arcane design tokens
 *
 * @version 2.0.0
 * @date 2025-11-11
 * @status Production Ready
 */

import { Dimensions, Platform } from 'react-native';
import { tokens } from './tokens';
import { typographyPresets } from './typography';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Re-export tokens for easy access
export { tokens };
export * from './tokens';
export * from './typography';

// ============================================================================
// ENHANCED COLOR SYSTEM (Backward Compatible)
// ============================================================================

/**
 * Enhanced color system with Arcane 2.0 palette
 * Maintains backward compatibility while adding new Arcane colors
 */
export const colors = {
  // Brand Colors - Arcane 2.0
  brand: {
    primary: tokens.colors.yellow.DEFAULT,        // #E4FF3B
    primaryLight: tokens.colors.yellow.bright,     // #F0FF6B
    primaryDark: tokens.colors.yellow.dark,        // #C8E611
    secondary: tokens.colors.arcane.anthracite,    // #10162F
    accent: '#58E6FF',                             // Codex cyan
    gradient: [tokens.colors.yellow.DEFAULT, '#58E6FF'],
  },

  // Arcane Dark Foundation
  arcane: tokens.colors.arcane,

  // Yellow Accent Variants
  yellow: tokens.colors.yellow,

  // Neutral Grays
  gray: tokens.colors.gray,

  // Base Colors (Backward compatible)
  background: {
    primary: tokens.colors.arcane.black,           // #0B1022
    secondary: tokens.colors.arcane.anthracite,    // #10162F
    tertiary: tokens.colors.arcane.charcoal,       // #141B34
    elevated: tokens.colors.arcane.charcoal,       // #141B34
    overlay: 'rgba(11, 16, 34, 0.8)',
  },

  // Surface Colors with glass effect
  surface: {
    glass: 'rgba(255, 255, 255, 0.08)',
    glassLight: 'rgba(255, 255, 255, 0.05)',
    glassMedium: 'rgba(255, 255, 255, 0.08)',
    glassHeavy: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.12)',
    borderLight: 'rgba(255, 255, 255, 0.08)',
  },

  // Text Colors - Arcane 2.0
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.6)',
    tertiary: 'rgba(255, 255, 255, 0.4)',
    muted: 'rgba(255, 255, 255, 0.4)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    inverse: tokens.colors.arcane.black,
  },

  // Semantic Colors - Arcane 2.0
  semantic: tokens.colors.semantic,

  // Feature Colors
  feature: tokens.colors.feature,

  // Status Colors (Backward compatible)
  status: {
    online: tokens.colors.semantic.success,
    offline: tokens.colors.gray[500],
    busy: tokens.colors.semantic.warning,
    away: tokens.colors.semantic.info,
    success: tokens.colors.semantic.success,
    warning: tokens.colors.semantic.warning,
    error: tokens.colors.semantic.error,
    info: tokens.colors.semantic.info,
  },

  // Chart Colors
  chart: {
    primary: tokens.colors.yellow.DEFAULT,         // #E4FF3B
    secondary: '#58E6FF',
    tertiary: tokens.colors.semantic.info,         // #3B82F6
    quaternary: tokens.colors.semantic.warning,    // #F59E0B
    quinary: tokens.colors.semantic.error,         // #EF4444
  },

  // Gradients
  gradients: tokens.colors.gradients,
} as const;

// ============================================================================
// TYPOGRAPHY SYSTEM (Using Arcane 2.0 tokens)
// ============================================================================

/**
 * Legacy typography object for backward compatibility
 * New code should use typography presets from './typography'
 */
export const typographyLegacy = {
  // Font Families - Arcane 2.0
  fonts: {
    display: tokens.fontFamilies.display,
    regular: tokens.fontFamilies.body,
    medium: tokens.fontFamilies.sans,
    semiBold: tokens.fontFamilies.sans,
    bold: tokens.fontFamilies.display,
    mono: tokens.fontFamilies.mono,
  },

  // Font Sizes - Arcane 2.0
  sizes: {
    // Display
    display1: tokens.fontSize['6xl'],              // 60
    display2: tokens.fontSize['5xl'],              // 48
    display3: tokens.fontSize['4xl'],              // 36

    // Headings
    h1: tokens.fontSize['5xl'],                    // 48
    h2: tokens.fontSize['4xl'],                    // 36
    h3: tokens.fontSize['3xl'],                    // 30
    h4: tokens.fontSize['2xl'],                    // 24
    h5: tokens.fontSize.xl,                        // 20
    h6: tokens.fontSize.base,                      // 16

    // Body
    xl: tokens.fontSize.lg,                        // 18
    lg: tokens.fontSize.base,                      // 16
    base: tokens.fontSize.sm,                      // 14
    sm: tokens.fontSize.xs,                        // 12
    xs: tokens.fontSize.xs,                        // 12
    xxs: 10,                                        // Extra small - for badges

    // UI
    button: tokens.fontSize.base,                  // 16
    caption: tokens.fontSize.xs,                   // 12
    overline: tokens.fontSize.xs,                  // 12
  },

  // Font Weights - Arcane 2.0
  weights: tokens.fontWeight,

  // Line Heights - Arcane 2.0
  lineHeights: tokens.lineHeight,

  // Letter Spacing - Arcane 2.0
  letterSpacing: tokens.letterSpacing,
} as const;

/**
 * Unified typography system (legacy scales + presets)
 * Provides backward compatibility while exposing new Arcane presets
 */
export const typography = {
  ...typographyLegacy,
  presets: typographyPresets,
  ...typographyPresets,
} as const;

// ============================================================================
// SPACING & LAYOUT (Using Arcane 2.0 tokens)
// ============================================================================

/**
 * Spacing System - 8-point grid with named aliases
 * Static values to avoid module initialization issues
 */
export const spacing = {
  // Base spacing scale (8-point grid)
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
  // Named aliases for convenience
  xxs: 2,   // Extra extra small (NEW - for Badge)
  xs: 4,    // 4
  sm: 8,    // 8
  md: 16,   // 16
  lg: 24,   // 24
  xl: 32,   // 32
  '2xl': 48, // 48
} as const;

/**
 * Border Radius System (already has named keys)
 * Static values to avoid module initialization issues
 */
export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

/**
 * Shadow System with glow effects
 */
export const shadows = tokens.shadows;

// ============================================================================
// ANIMATIONS (Using Arcane 2.0 tokens)
// ============================================================================

/**
 * Animation system with durations and easing
 */
export const animations = {
  durations: tokens.duration,
  springs: tokens.easing,
} as const;

// ============================================================================
// LAYOUT & UTILITIES
// ============================================================================

/**
 * Layout system with responsive breakpoints
 */
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
    gutter: 12, // spacing[3] = 12px
  },

  // Common aspect ratios
  aspectRatios: {
    square: 1,
    video: 16 / 9,
    poster: 3 / 4,
    wide: 21 / 9,
    ultraWide: 32 / 9,
  },

  // Breakpoints
  breakpoints: tokens.breakpoints,
} as const;

/**
 * Z-index layering system
 */
export const zIndex = tokens.zIndex;

/**
 * Blur intensity values
 */
export const blur = tokens.blur;

/**
 * Glassmorphism presets
 */
export const glass = tokens.glass;

/**
 * Icon sizes
 */
export const iconSize = tokens.iconSize;

// ============================================================================
// COMPLETE THEME EXPORT
// ============================================================================

/**
 * Complete Arcane Design System 2.0 theme
 * Import this for full access to all design tokens
 */

export const theme = {
  // Core tokens
  colors,
  typography,
  typographyLegacy, // For backward compatibility
  spacing,
  radius,
  shadows,
  animations,

  // Layout & utilities
  layout,
  zIndex,
  blur,
  glass,
  iconSize,

  // Direct token access
  tokens,
} as const;


// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Theme = typeof theme;
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Shadows = typeof shadows;
export type Animations = typeof animations;
export type Layout = typeof layout;
export type ZIndex = typeof zIndex;
export type Blur = typeof blur;
export type Glass = typeof glass;
export type IconSize = typeof iconSize;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default theme;
