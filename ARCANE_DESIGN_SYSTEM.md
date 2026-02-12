# ⚡ ARCANE DESIGN SYSTEM 2.0

**"The Wyscout of tomorrow, with Apple's fluidity and Claude's intelligence"**

**Version:** 2.0.0
**Last Updated:** 2025-11-11
**Status:** Production Ready

---

## 🎯 BRAND IDENTITY

### Core Values
```
⚽ Performance  - Precision and energy of professional sports
🧠 Intelligence - Clear, logical, confidence-inspiring interfaces
💎 Elegance     - Premium, refined, powerful aesthetics
🔗 Fluidity     - Seamless transitions, instant feedback, frictionless navigation
```

### Design Philosophy
> **"Data-driven clarity meets premium aesthetics"**

Arcane is where AI-powered football intelligence meets world-class design.
Every interface element serves a purpose. Every animation has meaning.
Every color choice conveys trust, energy, or insight.

**Inspirations:**
- 🍎 Apple Fitness / Beats Studio → Minimalist elegance
- ⚽ Wyscout / StatsBomb → Data-driven clarity
- 🤖 ElevenLabs / Runway → Technological premium
- 👟 Nike Training Club → Energy, contrast, confidence

---

## 🎨 COLOR SYSTEM

### Primary Palette

#### Dark Foundation
```css
--arcane-black: #0A0A0A;        /* Deep black background */
--arcane-anthracite: #1B1B1F;   /* Subtle gray secondary */
--arcane-charcoal: #27272A;     /* Card backgrounds */
--arcane-slate: #3F3F46;        /* Dividers, borders */
```

#### Electric Accent
```css
--arcane-yellow: #E4FF3B;       /* Primary brand accent */
--arcane-yellow-glow: #E4FF3B40; /* Glow effect (25% opacity) */
--arcane-yellow-dim: #E4FF3B20;  /* Subtle highlights (12%) */
```

#### Neutral Grays
```css
--arcane-gray-50: #FAFAFA;      /* Pure white text */
--arcane-gray-100: #F4F4F5;     /* Headings */
--arcane-gray-200: #E4E4E7;     /* Primary text */
--arcane-gray-300: #D4D4D8;     /* Secondary text */
--arcane-gray-400: #A1A1AA;     /* Tertiary text */
--arcane-gray-500: #71717A;     /* Disabled text */
--arcane-gray-600: #52525B;     /* Subtle elements */
```

### Semantic Colors

#### Status & Feedback
```css
--color-success: #10B981;       /* Green - success states */
--color-success-bg: #10B98120;  /* Success backgrounds */

--color-warning: #F59E0B;       /* Amber - warnings */
--color-warning-bg: #F59E0B20;

--color-error: #EF4444;         /* Red - errors */
--color-error-bg: #EF444420;

--color-info: #3B82F6;          /* Blue - information */
--color-info-bg: #3B82F620;
```

#### Feature Colors (Module-specific)
```css
--color-scouting: #3B82F6;      /* Blue - scouting features */
--color-ai: #8B5CF6;            /* Purple - AI features */
--color-coaching: #10B981;      /* Green - coaching */
--color-gamification: #F59E0B;  /* Gold - achievements */
--color-analytics: #06B6D4;     /* Cyan - analytics */
--color-marketplace: #EC4899;   /* Pink - marketplace */
```

### Gradients

#### Primary Gradients
```css
--gradient-primary: linear-gradient(135deg, #E4FF3B 0%, #10B981 100%);
--gradient-dark: linear-gradient(180deg, #0A0A0A 0%, #1B1B1F 100%);
--gradient-glow: radial-gradient(circle, #E4FF3B40 0%, transparent 70%);
```

#### Feature Gradients
```css
--gradient-ai: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
--gradient-performance: linear-gradient(135deg, #10B981 0%, #06B6D4 100%);
--gradient-premium: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);
```

### Color Usage Guidelines

#### Text Hierarchy
```
H1/H2 Headings:  --arcane-gray-100 (almost white)
Body Text:       --arcane-gray-200 (light gray)
Secondary Text:  --arcane-gray-300 (medium gray)
Disabled:        --arcane-gray-500 (dark gray)
```

#### Backgrounds
```
Page Background:    --arcane-black
Card Background:    --arcane-charcoal
Modal Background:   --arcane-anthracite
Overlay:           rgba(10, 10, 10, 0.8)
```

#### Interactive States
```
Default:    --arcane-yellow
Hover:      brightness(110%)
Active:     brightness(90%)
Disabled:   --arcane-gray-500
```

---

## 📝 TYPOGRAPHY

### Font Families

```css
--font-display: 'Poppins', system-ui, sans-serif;    /* Headings, titles */
--font-sans: 'Inter', system-ui, sans-serif;         /* Subtitles, UI */
--font-body: 'Manrope', system-ui, sans-serif;       /* Body text, paragraphs */
--font-mono: 'JetBrains Mono', monospace;            /* Code, data */
```

### Type Scale

```css
/* Display (Hero sections) */
--text-7xl: 4.5rem;    /* 72px - Hero */
--text-6xl: 3.75rem;   /* 60px - Page titles */

/* Headings */
--text-5xl: 3rem;      /* 48px - H1 */
--text-4xl: 2.25rem;   /* 36px - H2 */
--text-3xl: 1.875rem;  /* 30px - H3 */
--text-2xl: 1.5rem;    /* 24px - H4 */
--text-xl: 1.25rem;    /* 20px - H5 */

/* Body */
--text-lg: 1.125rem;   /* 18px - Large text */
--text-base: 1rem;     /* 16px - Base text */
--text-sm: 0.875rem;   /* 14px - Small text */
--text-xs: 0.75rem;    /* 12px - Captions */
```

### Font Weights

```css
--font-black: 900;     /* Extra bold headers */
--font-bold: 700;      /* Bold emphasis */
--font-semibold: 600;  /* Semi-bold UI elements */
--font-medium: 500;    /* Medium weight */
--font-regular: 400;   /* Normal text */
--font-light: 300;     /* Light text */
```

### Line Heights

```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Letter Spacing

```css
--tracking-tighter: -0.05em;
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;
```

### Typography Components

#### Heading Styles
```css
.heading-hero {
  font-family: var(--font-display);
  font-size: var(--text-6xl);
  font-weight: var(--font-black);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--arcane-gray-100);
}

.heading-1 {
  font-family: var(--font-display);
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--arcane-gray-100);
}

.heading-2 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  color: var(--arcane-gray-200);
}
```

#### Body Text
```css
.text-body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-regular);
  line-height: var(--leading-relaxed);
  color: var(--arcane-gray-300);
}

.text-small {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-regular);
  line-height: var(--leading-normal);
  color: var(--arcane-gray-400);
}
```

---

## 📐 SPACING & LAYOUT

### Spacing Scale (8-point grid)

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Border Radius

```css
--radius-sm: 0.375rem;   /* 6px - Small elements */
--radius-md: 0.5rem;     /* 8px - Buttons, inputs */
--radius-lg: 0.75rem;    /* 12px - Cards */
--radius-xl: 1rem;       /* 16px - Large cards */
--radius-2xl: 1.5rem;    /* 24px - Modals */
--radius-full: 9999px;   /* Pills, avatars */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.4);

/* Glow effects */
--shadow-glow-yellow: 0 0 20px rgba(228, 255, 59, 0.3);
--shadow-glow-ai: 0 0 20px rgba(139, 92, 246, 0.3);
--shadow-glow-success: 0 0 20px rgba(16, 185, 129, 0.3);
```

### Glassmorphism

```css
.glass-card {
  background: rgba(27, 27, 31, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(228, 255, 59, 0.1);
  box-shadow: var(--shadow-lg);
}

.glass-overlay {
  background: rgba(10, 10, 10, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

### Grid System

#### Web (12 columns)
```css
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
}

/* Common layouts */
.layout-sidebar {
  grid-template-columns: 280px 1fr; /* Fixed sidebar + fluid content */
}

.layout-content {
  grid-template-columns: 1fr 360px; /* Main content + sticky sidebar */
}

.layout-dashboard {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}
```

#### Mobile (Stack vertical)
```css
.stack-mobile {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
```

### Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large */
```

---

## 🎭 COMPONENTS

### Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--arcane-yellow);
  color: var(--arcane-black);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-primary:hover {
  background: var(--arcane-yellow);
  filter: brightness(110%);
  box-shadow: var(--shadow-glow-yellow);
  transform: translateY(-1px);
}

.btn-primary:active {
  filter: brightness(90%);
  transform: translateY(0);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: var(--arcane-gray-200);
  border: 1px solid var(--arcane-slate);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-secondary:hover {
  border-color: var(--arcane-yellow);
  color: var(--arcane-yellow);
  background: var(--arcane-yellow-dim);
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: var(--arcane-gray-300);
  border: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: var(--arcane-charcoal);
  color: var(--arcane-gray-100);
}
```

### Cards

#### Standard Card
```css
.card {
  background: var(--arcane-charcoal);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  border: 1px solid rgba(228, 255, 59, 0.08);
  box-shadow: var(--shadow-lg);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.card:hover {
  border-color: rgba(228, 255, 59, 0.2);
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}
```

#### Glass Card
```css
.card-glass {
  background: rgba(27, 27, 31, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(228, 255, 59, 0.1);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
}
```

#### Feature Card (with accent)
```css
.card-feature {
  background: var(--arcane-charcoal);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  border-left: 4px solid var(--arcane-yellow);
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

.card-feature::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
    var(--arcane-yellow) 0%,
    transparent 100%
  );
}
```

### Inputs

#### Text Input
```css
.input {
  background: var(--arcane-anthracite);
  border: 1px solid var(--arcane-slate);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  color: var(--arcane-gray-200);
  font-family: var(--font-body);
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--arcane-yellow);
  box-shadow: 0 0 0 3px var(--arcane-yellow-dim);
}

.input::placeholder {
  color: var(--arcane-gray-500);
}
```

#### Search Input (with icon)
```css
.input-search {
  position: relative;
}

.input-search input {
  padding-left: var(--space-10);
  background: var(--arcane-anthracite);
  border: 1px solid var(--arcane-slate);
  border-radius: var(--radius-md);
}

.input-search svg {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--arcane-gray-500);
}
```

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.badge-success {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.badge-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.badge-premium {
  background: var(--arcane-yellow-dim);
  color: var(--arcane-yellow);
}
```

### Progress Bars

#### Linear Progress
```css
.progress {
  width: 100%;
  height: 8px;
  background: var(--arcane-anthracite);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: var(--radius-full);
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

#### Circular Progress
```css
.progress-circle {
  position: relative;
  width: 120px;
  height: 120px;
}

.progress-circle svg {
  transform: rotate(-90deg);
}

.progress-circle-bg {
  stroke: var(--arcane-anthracite);
  stroke-width: 8;
  fill: none;
}

.progress-circle-fill {
  stroke: var(--arcane-yellow);
  stroke-width: 8;
  fill: none;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Tooltips

```css
.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip-content {
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-2) var(--space-3);
  background: var(--arcane-charcoal);
  color: var(--arcane-gray-200);
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
}

.tooltip:hover .tooltip-content {
  opacity: 1;
}
```

---

## ✨ ANIMATIONS & TRANSITIONS

### Easing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.16, 1, 0.3, 1);  /* Primary easing */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Duration

```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--duration-slower: 500ms;
```

### Micro-interactions

#### Hover Lift
```css
.hover-lift {
  transition: transform var(--duration-normal) var(--ease-spring);
}

.hover-lift:hover {
  transform: translateY(-2px);
}
```

#### Glow on Hover
```css
.hover-glow {
  transition: box-shadow var(--duration-normal) ease;
}

.hover-glow:hover {
  box-shadow: var(--shadow-glow-yellow);
}
```

#### Scale on Press
```css
.press-scale {
  transition: transform var(--duration-fast) var(--ease-spring);
}

.press-scale:active {
  transform: scale(0.95);
}
```

### Page Transitions (Framer Motion)

```tsx
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3
    }
  }
};
```

### Loading States

#### Skeleton Loader
```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--arcane-anthracite) 0%,
    var(--arcane-charcoal) 50%,
    var(--arcane-anthracite) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
  border-radius: var(--radius-md);
}
```

#### Spinner
```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  border: 3px solid var(--arcane-anthracite);
  border-top-color: var(--arcane-yellow);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 0.8s linear infinite;
}
```

---

## 🎯 ICONOGRAPHY

### Icon System
**Library:** Lucide React (outline icons, 2px stroke)

```tsx
import { Search, User, Home, Settings } from 'lucide-react';

// Default size: 20px
// Stroke width: 2px
// Color: Inherits from parent
```

### Icon Sizes

```css
--icon-xs: 16px;
--icon-sm: 20px;
--icon-md: 24px;
--icon-lg: 32px;
--icon-xl: 48px;
```

### Usage Guidelines

```tsx
// Standard icon
<Search size={20} strokeWidth={2} />

// With color
<User size={20} color="var(--arcane-yellow)" />

// In button
<button className="btn-primary">
  <Search size={18} />
  <span>Search</span>
</button>
```

---

## 📱 RESPONSIVE DESIGN

### Mobile-First Approach

```css
/* Base styles (mobile) */
.container {
  padding: var(--space-4);
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: var(--space-6);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    padding: var(--space-8);
  }
}
```

### Touch Targets

```css
/* Minimum touch target: 44x44px (iOS guidelines) */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## 🎨 DATA VISUALIZATION

### Chart Colors

```css
--chart-primary: #E4FF3B;
--chart-secondary: #10B981;
--chart-tertiary: #3B82F6;
--chart-quaternary: #8B5CF6;
--chart-quinary: #F59E0B;

/* Gradients for area charts */
--chart-gradient-1: linear-gradient(180deg, #E4FF3B40 0%, transparent 100%);
--chart-gradient-2: linear-gradient(180deg, #10B98140 0%, transparent 100%);
```

### AI Visualization Styles

#### Radar Chart (ArkaneIndex)
```tsx
const radarConfig = {
  backgroundColor: 'transparent',
  borderColor: 'var(--arcane-yellow)',
  borderWidth: 2,
  pointBackgroundColor: 'var(--arcane-yellow)',
  pointBorderColor: '#fff',
  pointHoverBackgroundColor: '#fff',
  pointHoverBorderColor: 'var(--arcane-yellow)',
};
```

#### Heatmap (ScoutAI)
```css
.heatmap-cell {
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.heatmap-cell:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-glow-yellow);
}
```

---

## 🎭 DARK MODE ONLY

Arcane is **exclusively dark mode** by design.
The dark aesthetic is core to the brand identity.

### Reasons:
1. ⚽ **Focus on data** - Reduced eye strain for long analysis sessions
2. 💎 **Premium feel** - Dark interfaces convey sophistication
3. ⚡ **Performance** - Better contrast for visualizations
4. 🔋 **Battery life** - Energy savings on OLED screens

---

## 📋 ACCESSIBILITY

### WCAG 2.1 AA Compliance

#### Color Contrast
```
Text on Background:
- Large text (18px+): 3:1 minimum
- Normal text: 4.5:1 minimum
- Interactive elements: 3:1 minimum

Yellow (#E4FF3B) on Black (#0A0A0A): 15.8:1 ✅
Gray-200 (#E4E4E7) on Black: 13.5:1 ✅
Gray-300 (#D4D4D8) on Charcoal (#27272A): 8.2:1 ✅
```

#### Focus States
```css
*:focus-visible {
  outline: 2px solid var(--arcane-yellow);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

#### Screen Reader Support
```tsx
// Always include aria labels
<button aria-label="Search players">
  <Search size={20} />
</button>

// Use semantic HTML
<nav aria-label="Main navigation">
  <ul>...</ul>
</nav>
```

---

## 🚀 IMPLEMENTATION GUIDE

### CSS Variables Setup

```css
:root {
  /* Import all design tokens */
  @import 'tokens/colors.css';
  @import 'tokens/typography.css';
  @import 'tokens/spacing.css';
  @import 'tokens/shadows.css';
}
```

### Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        arcane: {
          black: '#0A0A0A',
          anthracite: '#1B1B1F',
          charcoal: '#27272A',
          yellow: '#E4FF3B',
          // ... all colors
        },
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        'arcane-sm': '0.375rem',
        'arcane-md': '0.5rem',
        'arcane-lg': '0.75rem',
        'arcane-xl': '1rem',
      },
      boxShadow: {
        'glow-yellow': '0 0 20px rgba(228, 255, 59, 0.3)',
        // ... all shadows
      },
    },
  },
};
```

### React/Next.js Integration

```tsx
// app/layout.tsx
import { Poppins, Inter, Manrope } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
});

export default function RootLayout({ children }) {
  return (
    <html className={`${poppins.variable} ${inter.variable} ${manrope.variable}`}>
      <body className="bg-arcane-black text-arcane-gray-200">
        {children}
      </body>
    </html>
  );
}
```

---

## 📚 COMPONENT LIBRARY

### Storybook Setup

```bash
# Install Storybook
npx storybook@latest init

# Run Storybook
npm run storybook
```

### Component Documentation

Each component should include:
- ✅ Usage examples
- ✅ Props documentation
- ✅ Accessibility notes
- ✅ Interaction states
- ✅ Responsive behavior

---

## ✅ QUALITY CHECKLIST

### Before Shipping
- [ ] All colors meet WCAG AA contrast ratios
- [ ] Focus states visible on all interactive elements
- [ ] Keyboard navigation works throughout
- [ ] Screen reader tested
- [ ] Responsive across all breakpoints
- [ ] Animations are performant (60fps)
- [ ] Loading states implemented
- [ ] Error states designed
- [ ] Empty states designed
- [ ] Dark mode enforced globally

---

## 🎯 NEXT STEPS

1. **Implement Design Tokens** → Create CSS/SCSS variables
2. **Build Component Library** → Storybook with all primitives
3. **Update All Screens** → Apply new design system
4. **Test Accessibility** → WCAG 2.1 AA compliance
5. **Document Patterns** → Usage guidelines for team

---

**Design System Maintained By:** Design & Engineering Lead
**Last Updated:** 2025-11-11
**Status:** ✅ Ready for Implementation
