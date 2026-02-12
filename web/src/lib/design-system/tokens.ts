/**
 * ARCANE DESIGN SYSTEM - 120K PREMIUM
 * Tokens de design centralisés pour une cohérence parfaite
 */

export const tokens = {
  // ========================================
  // COLORS - Palette Arcane Premium
  // ========================================
  colors: {
    primary: {
      main: "#080C1D",      // Bleu Nuit - Fond principal
      light: "#0D1124",     // Variante légère
      dark: "#050812",      // Variante foncée
    },
    accent: {
      main: "#E4FF3B",      // Jaune Néon - CTA
      hover: "#D1E836",     // Hover state
      glow: "rgba(228, 255, 59, 0.4)", // Glow effect
    },
    secondary: {
      main: "#9FA1A9",      // Gris métallique
      light: "#B8BAC0",     // Textes secondaires
      border: "#1B2133",    // Bordures subtiles
    },
    glass: {
      bg: "rgba(15, 20, 37, 0.6)",      // Fond glass
      border: "rgba(255, 255, 255, 0.1)", // Bordure glass
      hover: "rgba(255, 255, 255, 0.15)", // Hover glass
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#9FA1A9",
      tertiary: "#6B6D75",
    },
  },

  // ========================================
  // TYPOGRAPHY - Système de type iOS-like
  // ========================================
  typography: {
    fontFamily: {
      headline: "var(--font-ananston-expanded), Inter, sans-serif",
      body: "var(--font-ananston), Inter, sans-serif",
      mono: "Menlo, Monaco, monospace",
    },
    scale: {
      display: { size: "clamp(48px, 8vw, 72px)", lineHeight: 1.1, weight: 700 },
      h1: { size: "clamp(34px, 5vw, 48px)", lineHeight: 1.2, weight: 700 },
      h2: { size: "clamp(28px, 4vw, 40px)", lineHeight: 1.25, weight: 700 },
      h3: { size: "clamp(22px, 3vw, 32px)", lineHeight: 1.3, weight: 600 },
      h4: { size: "clamp(18px, 2.5vw, 24px)", lineHeight: 1.4, weight: 600 },
      body: { size: "16px", lineHeight: 1.6, weight: 400 },
      bodyLarge: { size: "18px", lineHeight: 1.6, weight: 400 },
      small: { size: "14px", lineHeight: 1.5, weight: 400 },
      caption: { size: "12px", lineHeight: 1.4, weight: 400 },
    },
    letterSpacing: {
      tight: "-0.02em",
      normal: "0",
      wide: "0.05em",
      wider: "0.1em",
    },
  },

  // ========================================
  // SPACING - Grille 4pt
  // ========================================
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "32px",
    "4xl": "40px",
    "5xl": "48px",
    "6xl": "64px",
    "7xl": "80px",
    "8xl": "96px",
  },

  // ========================================
  // RADIUS - Coins arrondis
  // ========================================
  radius: {
    sm: "8px",
    md: "12px",   // CTA buttons
    lg: "20px",   // Cards
    xl: "28px",   // Grandes surfaces
    full: "9999px",
  },

  // ========================================
  // SHADOWS - Ombres & Glow
  // ========================================
  shadows: {
    sm: "0 2px 8px rgba(0, 0, 0, 0.15)",
    md: "0 4px 16px rgba(0, 0, 0, 0.2)",
    lg: "0 10px 30px rgba(0, 0, 0, 0.25)",
    xl: "0 20px 50px rgba(0, 0, 0, 0.3)",
    glow: {
      sm: "0 0 12px rgba(228, 255, 59, 0.2)",
      md: "0 0 24px rgba(228, 255, 59, 0.35)",
      lg: "0 0 48px rgba(228, 255, 59, 0.5)",
    },
    inner: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
  },

  // ========================================
  // BLUR - Glass morphism
  // ========================================
  blur: {
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "40px",
  },

  // ========================================
  // ANIMATION - Motion system
  // ========================================
  animation: {
    // Spring physics (type Apple)
    spring: {
      default: { type: "spring", stiffness: 300, damping: 30 },
      bouncy: { type: "spring", stiffness: 400, damping: 25 },
      smooth: { type: "spring", stiffness: 200, damping: 35 },
    },
    // Easing curves
    ease: {
      default: [0.4, 0, 0.2, 1],
      in: [0.4, 0, 1, 1],
      out: [0, 0, 0.2, 1],
      inOut: [0.4, 0, 0.2, 1],
    },
    // Durées
    duration: {
      fast: 0.15,
      default: 0.3,
      slow: 0.5,
      slower: 0.8,
    },
  },

  // ========================================
  // BREAKPOINTS - Responsive
  // ========================================
  breakpoints: {
    xs: "480px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // ========================================
  // Z-INDEX - Couches
  // ========================================
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modal: 400,
    popover: 500,
    toast: 600,
  },
} as const;

// Export types pour TypeScript
export type DesignTokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
export type SpacingToken = keyof typeof tokens.spacing;
export type RadiusToken = keyof typeof tokens.radius;
