/**
 * ARCANE DESIGN SYSTEM 2.0 - DESIGN TOKENS
 * Single source of truth shared with the Next.js app via design/tokens.json
 */

import { Platform } from 'react-native';
import rawTokens from 'design/tokens.json';

const {
  colors: colorTokens,
  fontSize: fontSizeTokens,
  fontWeight: fontWeightTokens,
  lineHeight: lineHeightTokens,
  letterSpacing: letterSpacingTokens,
  spacing: spacingTokens,
  radius: radiusTokens,
  shadows: shadowTokens,
  duration: durationTokens,
  easing: easingTokens,
  zIndex: zIndexTokens,
  iconSize: iconSizeTokens,
  breakpoints: breakpointTokens,
  blur: blurTokens,
  glass: glassTokens,
  fontFamilies: fontFamiliesTokens,
} = rawTokens;

const surfaceColors = {
  glass: 'rgba(255, 255, 255, 0.08)',
  glassLight: 'rgba(255, 255, 255, 0.05)',
  glassMedium: 'rgba(255, 255, 255, 0.08)',
  glassHeavy: 'rgba(255, 255, 255, 0.12)',
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
};

const backgroundColors = {
  primary: colorTokens.arcane?.black ?? '#0A0A0A',
  secondary: colorTokens.arcane?.anthracite ?? '#1B1B1F',
  tertiary: colorTokens.arcane?.charcoal ?? '#27272A',
  elevated: colorTokens.arcane?.charcoal ?? '#27272A',
  overlay: 'rgba(10, 10, 10, 0.8)',
};

const textColors = {
  primary: colorTokens.gray?.['50'] ?? '#FAFAFA',
  secondary: colorTokens.gray?.['200'] ?? '#E4E4E7',
  tertiary: colorTokens.gray?.['300'] ?? '#D4D4D8',
  muted: colorTokens.gray?.['400'] ?? '#A1A1AA',
  disabled: colorTokens.gray?.['500'] ?? '#71717A',
  inverse: colorTokens.arcane?.black ?? '#0A0A0A',
};

const brandColors = {
  primary: colorTokens.yellow?.DEFAULT ?? '#E4FF3B',
  primaryLight: colorTokens.yellow?.bright ?? '#F0FF6B',
  primaryDark: colorTokens.yellow?.dark ?? '#C8E611',
  secondary: colorTokens.arcane?.anthracite ?? '#1B1B1F',
  accent: '#58E6FF',
  gradient: colorTokens.gradients?.primary ?? ['#E4FF3B', '#58E6FF'],
};

export const colors = {
  ...colorTokens,
  surface: surfaceColors,
  background: backgroundColors,
  text: textColors,
  brand: brandColors,
};

export const fontFamilies = {
  display: Platform.select({
    ios: fontFamiliesTokens.display,
    android: fontFamiliesTokens.display,
    default: 'System',
  }),
  sans: Platform.select({
    ios: fontFamiliesTokens.sans,
    android: fontFamiliesTokens.sans,
    default: 'System',
  }),
  body: Platform.select({
    ios: fontFamiliesTokens.body,
    android: fontFamiliesTokens.body,
    default: 'System',
  }),
  mono: Platform.select({
    ios: fontFamiliesTokens.mono,
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

export const fontSize = fontSizeTokens;
export const fontWeight = fontWeightTokens;
export const lineHeight = lineHeightTokens;
export const letterSpacing = letterSpacingTokens;
export const spacing = spacingTokens;
export const radius = radiusTokens;
export const shadows = shadowTokens;
export const duration = durationTokens;
export const easing = easingTokens;
export const zIndex = zIndexTokens;
export const iconSize = iconSizeTokens;
export const breakpoints = breakpointTokens;
export const blur = blurTokens;
export const glass = glassTokens;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Colors = typeof colors;
export type FontFamilies = typeof fontFamilies;
export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type LineHeight = typeof lineHeight;
export type LetterSpacing = typeof letterSpacing;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Shadows = typeof shadows;
export type Duration = typeof duration;
export type Easing = typeof easing;
export type ZIndex = typeof zIndex;
export type IconSize = typeof iconSize;
export type Breakpoints = typeof breakpoints;
export type Blur = typeof blur;
export type Glass = typeof glass;

// ============================================================================
// COMPLETE DESIGN TOKENS EXPORT
// ============================================================================

/**
 * Complete design tokens object
 * Import this for full access to all design system constants
 */
export const tokens = {
  colors,
  fontFamilies,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  spacing,
  radius,
  shadows,
  duration,
  easing,
  zIndex,
  iconSize,
  breakpoints,
  blur,
  glass,
} as const;

export default tokens;
