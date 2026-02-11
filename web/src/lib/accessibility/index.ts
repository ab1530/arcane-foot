/**
 * ARCANE FOOTBALL - ACCESSIBILITY UTILITIES
 * Centralized exports for all accessibility tools and utilities
 */

// Contrast checking utilities
export {
  getContrastRatio,
  meetsWCAG_AA,
  meetsWCAG_AAA,
  getAccessibilityLevel,
  suggestContrastColor,
  printContrastReport,
  ARCANE_CONTRAST_TESTS,
} from './contrast-checker';

// Accessibility hooks
export {
  useFocusTrap,
  useAnnouncer,
  useSkipLinks,
  usePrefersReducedMotion,
  useFormErrorFocus,
  useAriaLive,
  useAccessibleId,
  useKeyboardNavigation,
} from './hooks';

// Re-export components (to be created in components/accessibility)
export { SkipLinks, ScreenReaderOnly, VisuallyHidden, LiveRegion } from '@/components/accessibility/SkipLinks';
