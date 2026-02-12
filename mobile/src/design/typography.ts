/**
 * ARCANE DESIGN SYSTEM 2.0 - TYPOGRAPHY CONFIGURATION
 * Complete typography system for React Native/Expo
 *
 * Fonts: Poppins (Display), Inter (Sans), Manrope (Body)
 * Source: Expo Google Fonts
 *
 * @version 2.0.0
 * @date 2025-11-11
 * @status Production Ready
 */

import { TextStyle } from 'react-native';
import { fontFamilies, fontSize, fontWeight, lineHeight, letterSpacing } from './tokens';

// ============================================================================
// TYPOGRAPHY PRESETS
// ============================================================================

/**
 * Pre-configured text styles following Arcane Design System
 * Use these presets for consistent typography across the app
 */

// ----------------------------------------------------------------------------
// DISPLAY STYLES (Hero Sections)
// ----------------------------------------------------------------------------

export const displayHero: TextStyle = {
  fontFamily: fontFamilies.display,
  fontSize: fontSize['6xl'],
  fontWeight: fontWeight.black,
  lineHeight: fontSize['6xl'] * lineHeight.tight,
  letterSpacing: letterSpacing.tight,
  color: '#F4F4F5', // gray-100
};

export const displayLarge: TextStyle = {
  fontFamily: fontFamilies.display,
  fontSize: fontSize['5xl'],
  fontWeight: fontWeight.black,
  lineHeight: fontSize['5xl'] * lineHeight.tight,
  letterSpacing: letterSpacing.tight,
  color: '#F4F4F5', // gray-100
};

// ----------------------------------------------------------------------------
// HEADING STYLES
// ----------------------------------------------------------------------------

export const heading1: TextStyle = {
  fontFamily: fontFamilies.display,
  fontSize: fontSize['5xl'],
  fontWeight: fontWeight.bold,
  lineHeight: fontSize['5xl'] * lineHeight.tight,
  letterSpacing: letterSpacing.normal,
  color: '#F4F4F5', // gray-100
};

export const heading2: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSize['3xl'],
  fontWeight: fontWeight.semibold,
  lineHeight: fontSize['3xl'] * lineHeight.snug,
  letterSpacing: letterSpacing.normal,
  color: '#E4E4E7', // gray-200
};

export const heading3: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSize['2xl'],
  fontWeight: fontWeight.semibold,
  lineHeight: fontSize['2xl'] * lineHeight.snug,
  letterSpacing: letterSpacing.normal,
  color: '#E4E4E7', // gray-200
};

export const heading4: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSize.xl,
  fontWeight: fontWeight.semibold,
  lineHeight: fontSize.xl * lineHeight.normal,
  letterSpacing: letterSpacing.normal,
  color: '#E4E4E7', // gray-200
};

export const heading5: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSize.lg,
  fontWeight: fontWeight.medium,
  lineHeight: fontSize.lg * lineHeight.normal,
  letterSpacing: letterSpacing.normal,
  color: '#E4E4E7', // gray-200
};

export const heading6: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSize.base,
  fontWeight: fontWeight.medium,
  lineHeight: fontSize.base * lineHeight.normal,
  letterSpacing: letterSpacing.normal,
  color: '#E4E4E7', // gray-200
};

// ----------------------------------------------------------------------------
// BODY TEXT STYLES
// ----------------------------------------------------------------------------

export const bodyLarge: TextStyle = {
  fontFamily: fontFamilies.body,
  fontSize: fontSize.lg,
  fontWeight: fontWeight.regular,
  lineHeight: fontSize.lg * lineHeight.relaxed,
  letterSpacing: letterSpacing.normal,
  color: '#D4D4D8', // gray-300
};

export const bodyBase: TextStyle = {
  fontFamily: fontFamilies.body,
  fontSize: fontSize.base,
  fontWeight: fontWeight.regular,
  lineHeight: fontSize.base * lineHeight.relaxed,
  letterSpacing: letterSpacing.normal,
  color: '#D4D4D8', // gray-300
};

export const bodySmall: TextStyle = {
  fontFamily: fontFamilies.body,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.regular,
  lineHeight: fontSize.sm * lineHeight.normal,
  letterSpacing: letterSpacing.normal,
  color: '#A1A1AA', // gray-400
};

// ----------------------------------------------------------------------------
// UI TEXT STYLES
// ----------------------------------------------------------------------------

export const buttonText: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSize.base,
  fontWeight: fontWeight.semibold,
  lineHeight: fontSize.base * lineHeight.normal,
  letterSpacing: letterSpacing.normal,
};

export const buttonSmall: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.semibold,
  lineHeight: fontSize.sm * lineHeight.normal,
  letterSpacing: letterSpacing.normal,
};

export const buttonLarge: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSize.lg,
  fontWeight: fontWeight.semibold,
  lineHeight: fontSize.lg * lineHeight.normal,
  letterSpacing: letterSpacing.normal,
};

export const label: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  lineHeight: fontSize.sm * lineHeight.normal,
  letterSpacing: letterSpacing.normal,
  color: '#E4E4E7', // gray-200
};

export const caption: TextStyle = {
  fontFamily: fontFamilies.body,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.regular,
  lineHeight: fontSize.xs * lineHeight.normal,
  letterSpacing: letterSpacing.normal,
  color: '#A1A1AA', // gray-400
};

export const overline: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.semibold,
  lineHeight: fontSize.xs * lineHeight.normal,
  letterSpacing: letterSpacing.widest,
  textTransform: 'uppercase',
  color: '#71717A', // gray-500
};

// ----------------------------------------------------------------------------
// SPECIALIZED STYLES
// ----------------------------------------------------------------------------

export const badge: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.semibold,
  lineHeight: fontSize.xs * lineHeight.normal,
  letterSpacing: letterSpacing.wide,
  textTransform: 'uppercase',
};

export const code: TextStyle = {
  fontFamily: fontFamilies.mono,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.regular,
  lineHeight: fontSize.sm * lineHeight.normal,
  letterSpacing: letterSpacing.normal,
  color: '#E4FF3B', // yellow
};

export const link: TextStyle = {
  fontFamily: fontFamilies.body,
  fontSize: fontSize.base,
  fontWeight: fontWeight.medium,
  lineHeight: fontSize.base * lineHeight.normal,
  letterSpacing: letterSpacing.normal,
  color: '#E4FF3B', // yellow
  textDecorationLine: 'underline',
};

// ----------------------------------------------------------------------------
// DATA VISUALIZATION TEXT
// ----------------------------------------------------------------------------

export const chartLabel: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.medium,
  lineHeight: fontSize.xs * lineHeight.normal,
  letterSpacing: letterSpacing.normal,
  color: '#A1A1AA', // gray-400
};

export const chartValue: TextStyle = {
  fontFamily: fontFamilies.display,
  fontSize: fontSize.xl,
  fontWeight: fontWeight.bold,
  lineHeight: fontSize.xl * lineHeight.tight,
  letterSpacing: letterSpacing.normal,
  color: '#F4F4F5', // gray-100
};

export const statLabel: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.medium,
  lineHeight: fontSize.xs * lineHeight.normal,
  letterSpacing: letterSpacing.wide,
  textTransform: 'uppercase',
  color: '#71717A', // gray-500
};

export const statValue: TextStyle = {
  fontFamily: fontFamilies.display,
  fontSize: fontSize['2xl'],
  fontWeight: fontWeight.bold,
  lineHeight: fontSize['2xl'] * lineHeight.tight,
  letterSpacing: letterSpacing.tight,
  color: '#F4F4F5', // gray-100
};

// ============================================================================
// TYPOGRAPHY PRESET COLLECTION
// ============================================================================

/**
 * Complete typography preset system
 * Import individual presets or use the complete collection
 */
export const typographyPresets = {
  // Display
  displayHero,
  displayLarge,

  // Headings
  heading1,
  heading2,
  heading3,
  heading4,
  heading5,
  heading6,
  h1: heading1,
  h2: heading2,
  h3: heading3,
  h4: heading4,
  h5: heading5,
  h6: heading6,

  // Body
  bodyLarge,
  bodyBase,
  bodySmall,
  body: bodyBase,

  // UI
  buttonText,
  buttonSmall,
  buttonLarge,
  button: buttonText,
  label,
  caption,
  overline,

  // Specialized
  badge,
  code,
  link,

  // Data Visualization
  chartLabel,
  chartValue,
  statLabel,
  statValue,
} as const;

// ============================================================================
// FONT LOADING CONFIGURATION
// ============================================================================

/**
 * Expo Google Fonts configuration
 *
 * INSTALLATION REQUIRED:
 * npm install @expo-google-fonts/poppins @expo-google-fonts/inter @expo-google-fonts/manrope expo-font
 *
 * USAGE IN APP.TSX:
 * ```tsx
 * import { useFonts } from 'expo-font';
 * import {
 *   Poppins_400Regular,
 *   Poppins_600SemiBold,
 *   Poppins_700Bold,
 *   Poppins_900Black,
 * } from '@expo-google-fonts/poppins';
 * import {
 *   Inter_400Regular,
 *   Inter_500Medium,
 *   Inter_600SemiBold,
 * } from '@expo-google-fonts/inter';
 * import {
 *   Manrope_400Regular,
 *   Manrope_500Medium,
 *   Manrope_600SemiBold,
 * } from '@expo-google-fonts/manrope';
 *
 * const [fontsLoaded] = useFonts({
 *   Poppins_400Regular,
 *   Poppins_600SemiBold,
 *   Poppins_700Bold,
 *   Poppins_900Black,
 *   Inter_400Regular,
 *   Inter_500Medium,
 *   Inter_600SemiBold,
 *   Manrope_400Regular,
 *   Manrope_500Medium,
 *   Manrope_600SemiBold,
 * });
 *
 * if (!fontsLoaded) {
 *   return <AppLoading />;
 * }
 * ```
 */
export const fontConfig = {
  poppins: [
    'Poppins_400Regular',
    'Poppins_600SemiBold',
    'Poppins_700Bold',
    'Poppins_900Black',
  ],
  inter: [
    'Inter_400Regular',
    'Inter_500Medium',
    'Inter_600SemiBold',
  ],
  manrope: [
    'Manrope_400Regular',
    'Manrope_500Medium',
    'Manrope_600SemiBold',
  ],
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create custom text style with Arcane typography
 * Useful for one-off text styles that need customization
 */
export const createTextStyle = (options: {
  family?: keyof typeof fontFamilies;
  size?: keyof typeof fontSize;
  weight?: keyof typeof fontWeight;
  lineHeightMultiplier?: keyof typeof lineHeight;
  spacing?: keyof typeof letterSpacing;
  color?: string;
}): TextStyle => {
  const {
    family = 'body',
    size = 'base',
    weight = 'regular',
    lineHeightMultiplier = 'normal',
    spacing = 'normal',
    color = '#D4D4D8', // gray-300
  } = options;

  return {
    fontFamily: fontFamilies[family],
    fontSize: fontSize[size],
    fontWeight: fontWeight[weight],
    lineHeight: fontSize[size] * lineHeight[lineHeightMultiplier],
    letterSpacing: letterSpacing[spacing],
    color,
  };
};

/**
 * Type-safe typography accessor
 */
export type TypographyPreset = keyof typeof typographyPresets;

/**
 * Get typography preset by name
 */
export const getTypography = (preset: TypographyPreset): TextStyle => {
  return typographyPresets[preset];
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Typography = typeof typographyPresets;
export type FontConfig = typeof fontConfig;

export default typographyPresets;
