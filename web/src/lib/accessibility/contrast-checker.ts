/**
 * ARCANE FOOTBALL - ACCESSIBILITY UTILITIES
 * WCAG AA Contrast Checker
 *
 * WCAG AA Requirements:
 * - Normal text (< 18pt): 4.5:1 contrast ratio
 * - Large text (≥ 18pt or ≥ 14pt bold): 3:1 contrast ratio
 * - UI components and graphics: 3:1 contrast ratio
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 * Formula from WCAG 2.1 guidelines
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid hex color format');
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standards
 */
export function meetsWCAG_AA(
  foreground: string,
  background: string,
  options: {
    largeText?: boolean;
    graphical?: boolean;
  } = {}
): boolean {
  const ratio = getContrastRatio(foreground, background);

  // Graphical objects and UI components: 3:1
  if (options.graphical) {
    return ratio >= 3;
  }

  // Large text (18pt+ or 14pt+ bold): 3:1
  if (options.largeText) {
    return ratio >= 3;
  }

  // Normal text: 4.5:1
  return ratio >= 4.5;
}

/**
 * Check if contrast meets WCAG AAA standards (enhanced)
 */
export function meetsWCAG_AAA(
  foreground: string,
  background: string,
  options: {
    largeText?: boolean;
  } = {}
): boolean {
  const ratio = getContrastRatio(foreground, background);

  // Large text: 4.5:1
  if (options.largeText) {
    return ratio >= 4.5;
  }

  // Normal text: 7:1
  return ratio >= 7;
}

/**
 * Get accessibility level (AAA, AA, Fail)
 */
export function getAccessibilityLevel(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): 'AAA' | 'AA' | 'Fail' {
  if (meetsWCAG_AAA(foreground, background, { largeText: isLargeText })) {
    return 'AAA';
  }
  if (meetsWCAG_AA(foreground, background, { largeText: isLargeText })) {
    return 'AA';
  }
  return 'Fail';
}

/**
 * Suggest a darker or lighter version of a color to meet contrast requirements
 */
export function suggestContrastColor(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) {
    throw new Error('Invalid hex color format');
  }

  const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  // Determine if we need a lighter or darker color
  const targetLum = bgLum > 0.5
    ? (bgLum + 0.05) / targetRatio - 0.05  // Need darker
    : targetRatio * (bgLum + 0.05) - 0.05;  // Need lighter

  // Simple approximation: adjust all channels equally
  const adjustment = targetLum > getLuminance(fgRgb.r, fgRgb.g, fgRgb.b) ? 1.2 : 0.8;

  const newR = Math.min(255, Math.max(0, Math.round(fgRgb.r * adjustment)));
  const newG = Math.min(255, Math.max(0, Math.round(fgRgb.g * adjustment)));
  const newB = Math.min(255, Math.max(0, Math.round(fgRgb.b * adjustment)));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Arcane Football - Predefined Color Contrast Tests
 */
export const ARCANE_CONTRAST_TESTS = {
  // Primary combinations
  whiteonDark: {
    fg: '#FFFFFF',
    bg: '#080C1D',
    ratio: getContrastRatio('#FFFFFF', '#080C1D'),
    passes: meetsWCAG_AA('#FFFFFF', '#080C1D'),
  },
  accentOnDark: {
    fg: '#E4FF3B',
    bg: '#080C1D',
    ratio: getContrastRatio('#E4FF3B', '#080C1D'),
    passes: meetsWCAG_AA('#E4FF3B', '#080C1D'),
  },
  greyOnDark: {
    fg: '#9FA1A9',
    bg: '#080C1D',
    ratio: getContrastRatio('#9FA1A9', '#080C1D'),
    passes: meetsWCAG_AA('#9FA1A9', '#080C1D'),
  },
  darkOnAccent: {
    fg: '#080C1D',
    bg: '#E4FF3B',
    ratio: getContrastRatio('#080C1D', '#E4FF3B'),
    passes: meetsWCAG_AA('#080C1D', '#E4FF3B'),
  },
  // Card combinations
  whiteOnCard: {
    fg: '#FFFFFF',
    bg: '#0F1425',
    ratio: getContrastRatio('#FFFFFF', '#0F1425'),
    passes: meetsWCAG_AA('#FFFFFF', '#0F1425'),
  },
  greyOnCard: {
    fg: '#9FA1A9',
    bg: '#0F1425',
    ratio: getContrastRatio('#9FA1A9', '#0F1425'),
    passes: meetsWCAG_AA('#9FA1A9', '#0F1425'),
  },
};

/**
 * Print contrast report to console (dev tool)
 */
export function printContrastReport(): void {
  console.group('🎨 Arcane Football - WCAG AA Contrast Report');

  Object.entries(ARCANE_CONTRAST_TESTS).forEach(([name, test]) => {
    const level = getAccessibilityLevel(test.fg, test.bg);
    const icon = level === 'AAA' ? '🟢' : level === 'AA' ? '🟡' : '🔴';

    console.log(
      `${icon} ${name}: ${test.ratio.toFixed(2)}:1 (${level}) - ${test.passes ? 'PASS' : 'FAIL'}`
    );
  });

  console.groupEnd();
}
