import type { Config } from "tailwindcss";
import tokens from "../design/tokens.json";

const arcaneColors = tokens.colors;
const pxToRem = (px: number) => `${px / 16}rem`;
const spacingScale = Object.fromEntries(
  Object.entries(tokens.spacing).map(([key, value]) => [key, `${Number(value) / 16}rem`])
) as Record<string, string>;
const radiusScale = Object.fromEntries(
  Object.entries(tokens.radius).map(([key, value]) =>
    key === "full" ? [key, "9999px"] : [key, `${Number(value) / 16}rem`]
  )
) as Record<string, string>;
const fontSizeScale: Record<
  string,
  [string, { lineHeight: string; letterSpacing?: string }]
> = {
  "7xl": [pxToRem(tokens.fontSize["7xl"]), { lineHeight: `${tokens.lineHeight.none}`, letterSpacing: "-0.025em" }],
  "6xl": [pxToRem(tokens.fontSize["6xl"]), { lineHeight: `${tokens.lineHeight.tight}`, letterSpacing: "-0.025em" }],
  "5xl": [pxToRem(tokens.fontSize["5xl"]), { lineHeight: `${tokens.lineHeight.tight}` }],
  "4xl": [pxToRem(tokens.fontSize["4xl"]), { lineHeight: `${tokens.lineHeight.snug}` }],
  "3xl": [pxToRem(tokens.fontSize["3xl"]), { lineHeight: `${tokens.lineHeight.snug}` }],
  "2xl": [pxToRem(tokens.fontSize["2xl"]), { lineHeight: `${tokens.lineHeight.normal}` }],
  "xl": [pxToRem(tokens.fontSize["xl"]), { lineHeight: `${tokens.lineHeight.normal}` }],
  "lg": [pxToRem(tokens.fontSize["lg"]), { lineHeight: `${tokens.lineHeight.relaxed}` }],
  "base": [pxToRem(tokens.fontSize["base"]), { lineHeight: `${tokens.lineHeight.relaxed}` }],
  "sm": [pxToRem(tokens.fontSize["sm"]), { lineHeight: `${tokens.lineHeight.normal}` }],
  "xs": [pxToRem(tokens.fontSize["xs"]), { lineHeight: `${tokens.lineHeight.normal}` }],
};
const letterSpacingScale = Object.fromEntries(
  Object.entries(tokens.letterSpacing).map(([key, value]) => [
    key,
    value === 0 ? "0" : `${value / 16}em`,
  ])
);
const lineHeightScale = Object.fromEntries(
  Object.entries(tokens.lineHeight).map(([key, value]) => [key, `${value}`])
);
const durationScale = Object.fromEntries(
  Object.entries(tokens.duration).map(([key, value]) => [key, `${value}ms`])
);

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
        arcane: {
          ...arcaneColors.arcane,
          gray: arcaneColors.gray,
          yellow: arcaneColors.yellow,
        },
        success: {
          DEFAULT: arcaneColors.semantic.success,
          bg: arcaneColors.semantic.successBg,
        },
        warning: {
          DEFAULT: arcaneColors.semantic.warning,
          bg: arcaneColors.semantic.warningBg,
        },
        error: {
          DEFAULT: arcaneColors.semantic.error,
          bg: arcaneColors.semantic.errorBg,
        },
        info: {
          DEFAULT: arcaneColors.semantic.info,
          bg: arcaneColors.semantic.infoBg,
        },
        scouting: arcaneColors.feature.scouting,
        ai: arcaneColors.feature.ai,
        coaching: arcaneColors.feature.coaching,
        gamification: arcaneColors.feature.gamification,
        analytics: arcaneColors.feature.analytics,
        marketplace: arcaneColors.feature.marketplace,
        background: arcaneColors.arcane.black,
        foreground: arcaneColors.gray["200"],
        card: {
          DEFAULT: arcaneColors.arcane.charcoal,
          foreground: arcaneColors.gray["200"],
        },
        popover: {
          DEFAULT: arcaneColors.arcane.anthracite,
          foreground: arcaneColors.gray["200"],
        },
        primary: {
          DEFAULT: arcaneColors.yellow.DEFAULT,
          foreground: arcaneColors.arcane.black,
        },
        secondary: {
          DEFAULT: arcaneColors.arcane.slate,
          foreground: arcaneColors.yellow.DEFAULT,
        },
        muted: {
          DEFAULT: arcaneColors.arcane.slate,
          foreground: arcaneColors.gray["400"],
        },
        accent: {
          DEFAULT: arcaneColors.yellow.DEFAULT,
          foreground: arcaneColors.arcane.black,
        },
        destructive: {
          DEFAULT: arcaneColors.semantic.error,
          foreground: arcaneColors.gray["50"],
        },
        border: arcaneColors.arcane.slate,
        input: arcaneColors.arcane.slate,
        ring: arcaneColors.yellow.DEFAULT,
      },

      fontFamily: {
        display: ["var(--font-display)", tokens.fontFamilies.display, "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", tokens.fontFamilies.sans, "system-ui", "sans-serif"],
        body: ["var(--font-body)", tokens.fontFamilies.body, "system-ui", "sans-serif"],
        mono: [tokens.fontFamilies.mono, "monospace"],
      },

      fontSize: fontSizeScale,

      fontWeight: tokens.fontWeight,

      borderRadius: radiusScale,

      spacing: spacingScale,

      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        "glow-yellow": "0 0 20px rgba(228, 255, 59, 0.3)",
        "glow-ai": "0 0 20px rgba(139, 92, 246, 0.3)",
        "glow-success": "0 0 20px rgba(16, 185, 129, 0.3)",
      },

      transitionTimingFunction: {
        "in": "cubic-bezier(0.4, 0, 1, 1)",
        "out": "cubic-bezier(0, 0, 0.2, 1)",
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
        "spring": "cubic-bezier(0.16, 1, 0.3, 1)",
        "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },

      transitionDuration: durationScale,

      letterSpacing: letterSpacingScale,

      lineHeight: lineHeightScale,

      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #E4FF3B 0%, #10B981 100%)",
        "gradient-dark": "linear-gradient(180deg, #0A0A0A 0%, #1B1B1F 100%)",
        "gradient-glow": "radial-gradient(circle, rgba(228, 255, 59, 0.25) 0%, transparent 70%)",
        "gradient-ai": "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)",
        "gradient-performance": "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
        "gradient-premium": "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
      },

      animation: {
        shimmer: 'shimmer 2s infinite',
      },

      keyframes: {
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
