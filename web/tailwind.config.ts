import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Arcane Brand Colors - CHARTE GRAPHIQUE EXACTE
        arcane: {
          dark: "#080C1D",        // Bleu Nuit - Fond principal (CHARTE)
          darkAlt: "#0D1124",     // Variante légèrement plus claire
          darkBg: "#080C1D",      // Même couleur pour uniformité
          darkCard: "#0F1425",    // Cards légèrement plus claires
          darkBorder: "#1B2133",  // Bordures subtiles mais visibles
          accent: "#E4FF3B",      // Jaune Néon - Accent/CTA (CHARTE)
          accentHover: "#D1E836", // Hover légèrement plus foncé
          accentDim: "#C5D633",   // Version atténuée
          grey: "#9FA1A9",        // Gris - Éléments secondaires (CHARTE)
          greyLight: "#B8BAC0",   // Gris plus clair pour textes
          white: "#FFFFFF",       // Blanc - Texte clair (CHARTE)
        },
        // shadcn/ui theme colors mapped to Arcane
        background: "#080C1D",
        foreground: "#FFFFFF",
        card: {
          DEFAULT: "#080C1D",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "#0F1425",
          foreground: "#FFFFFF",
        },
        primary: {
          DEFAULT: "#E4FF3B",
          foreground: "#080C1D",
        },
        secondary: {
          DEFAULT: "#1B2133",
          foreground: "#E4FF3B",
        },
        muted: {
          DEFAULT: "#1B2133",
          foreground: "#9FA1A9",
        },
        accent: {
          DEFAULT: "#E4FF3B",
          foreground: "#080C1D",
        },
        destructive: {
          DEFAULT: "#FF3B3B",
          foreground: "#FFFFFF",
        },
        border: "#1B2133",
        input: "#1B2133",
        ring: "#E4FF3B",
      },
      fontFamily: {
        // Ananston fonts (will be loaded via @font-face)
        ananston: ["var(--font-ananston)", "Inter", "sans-serif"],
        ananstonExpanded: ["var(--font-ananston-expanded)", "Inter", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",      // 12px - selon charte graphique
        md: "0.75rem",      // 12px - uniformisé
        sm: "0.5rem",       // 8px - petits éléments
        xl: "1rem",         // 16px - grands éléments
        "2xl": "1.5rem",    // 24px - très grands
        "3xl": "1.875rem",  // 30px - sections
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      letterSpacing: {
        wider: "0.05em",
        widest: "0.1em",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
