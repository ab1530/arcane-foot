/**
 * Design System Barrel Export
 * Central export point for all design system modules
 */

// Export STATIC constants (for StyleSheet.create())
export * from './constants';

// Export base tokens (leaf module, no dependencies)
export { tokens, colors, fontSize, fontWeight, shadows } from './tokens';

// Export typography presets (depends on tokens)
export { typographyPresets as typography } from './typography';

// Export complete theme (depends on tokens and typography)
export { theme, spacing, radius } from './theme';
export type { Theme, Colors, Spacing, Radius, Shadows } from './theme';

// Re-export all token types
export type * from './tokens';
