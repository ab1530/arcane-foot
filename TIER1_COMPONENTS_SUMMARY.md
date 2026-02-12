# Arcane Design System - Tier 1 Primitives

**Status:** ✅ Complete
**Created:** 2025-11-11
**Location:** `web/src/components/primitives/`
**Total Components:** 5 categories, 11 components

---

## 📦 Component Overview

This document provides a comprehensive guide to the Tier 1 premium UI components built for the Arcane Design System. All components follow:
- ✅ TypeScript with full type safety
- ✅ Tailwind CSS with Arcane design tokens
- ✅ ARIA labels for accessibility
- ✅ Smooth animations with cubic-bezier(0.16, 1, 0.3, 1)
- ✅ JSDoc documentation
- ✅ Dark mode only (Arcane brand)

---

## 🎯 1. Button Components

### 1.1 ArcaneButton

Premium button with multiple variants, sizes, and states.

**Location:** `web/src/components/primitives/Button/ArcaneButton.tsx`

**Features:**
- 4 variants: primary, secondary, ghost, danger
- 3 sizes: sm, md, lg
- Icon support (left and right)
- Loading state with spinner
- Glow effect on hover
- Full accessibility support

**Usage Examples:**

```tsx
import { ArcaneButton } from '@/components/primitives';
import { Search, ChevronRight } from 'lucide-react';

// Primary button
<ArcaneButton variant="primary" size="md">
  Search Players
</ArcaneButton>

// With left icon
<ArcaneButton variant="primary" icon={<Search />}>
  Search Players
</ArcaneButton>

// With right icon
<ArcaneButton variant="secondary" iconRight={<ChevronRight />}>
  View Details
</ArcaneButton>

// Loading state
<ArcaneButton variant="primary" loading>
  Processing...
</ArcaneButton>

// Ghost variant
<ArcaneButton variant="ghost" size="sm">
  Cancel
</ArcaneButton>

// Danger variant
<ArcaneButton variant="danger" size="lg">
  Delete Account
</ArcaneButton>

// Full width
<ArcaneButton variant="primary" fullWidth>
  Submit
</ArcaneButton>
```

**Props:**
```typescript
interface BaseButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  children?: ReactNode;
}
```

---

### 1.2 IconButton

Circular icon-only button for actions.

**Location:** `web/src/components/primitives/Button/IconButton.tsx`

**Features:**
- Circular design
- Badge overlay support
- Tooltip integration
- All button variants
- Smooth scale animation

**Usage Examples:**

```tsx
import { IconButton } from '@/components/primitives';
import { Heart, Bell, Settings, Trash2 } from 'lucide-react';

// Basic icon button
<IconButton
  icon={<Heart />}
  variant="ghost"
  aria-label="Add to favorites"
/>

// With badge
<IconButton
  icon={<Bell />}
  variant="primary"
  badge={5}
  aria-label="View notifications"
/>

// With tooltip
<IconButton
  icon={<Settings />}
  variant="secondary"
  tooltip="Settings"
  aria-label="Open settings"
/>

// Danger variant
<IconButton
  icon={<Trash2 />}
  variant="danger"
  aria-label="Delete item"
/>

// Different sizes
<IconButton icon={<Heart />} size="sm" aria-label="Like" />
<IconButton icon={<Heart />} size="md" aria-label="Like" />
<IconButton icon={<Heart />} size="lg" aria-label="Like" />
```

**Props:**
```typescript
interface IconButtonProps {
  icon: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  badge?: number | string;
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  'aria-label': string; // Required!
  tooltip?: string;
}
```

---

## 🎴 2. Card Components

### 2.1 ArcaneCard

Premium card component with multiple variants and effects.

**Location:** `web/src/components/primitives/Card/ArcaneCard.tsx`

**Features:**
- 4 variants: standard, glass, feature, stat
- Hover lift effect
- Border glow on hover
- Gradient overlay option
- Smooth animations

**Usage Examples:**

```tsx
import { ArcaneCard, CardHeader, CardContent, CardFooter } from '@/components/primitives';

// Standard card
<ArcaneCard variant="standard">
  <CardHeader>Player Statistics</CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
  <CardFooter>
    <ArcaneButton size="sm">View More</ArcaneButton>
  </CardFooter>
</ArcaneCard>

// Glass card with hover effects
<ArcaneCard variant="glass" hover glow>
  <CardContent>
    <h3>Premium Feature</h3>
    <p>This card has a glass morphism effect</p>
  </CardContent>
</ArcaneCard>

// Feature card with accent border
<ArcaneCard variant="feature" hover>
  <CardHeader>AI Insights</CardHeader>
  <CardContent>
    <p>Featured content with yellow accent</p>
  </CardContent>
</ArcaneCard>

// Stat card with gradient
<ArcaneCard variant="stat" gradient>
  <CardContent>
    <h4>Total Reports</h4>
    <p className="text-4xl font-bold">234</p>
  </CardContent>
</ArcaneCard>

// Interactive card with onClick
<ArcaneCard variant="standard" hover glow onClick={() => console.log('clicked')}>
  <CardContent>
    <p>Click me!</p>
  </CardContent>
</ArcaneCard>
```

**Props:**
```typescript
interface ArcaneCardProps {
  variant?: 'standard' | 'glass' | 'feature' | 'stat';
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}
```

---

### 2.2 Card Subcomponents

**CardHeader, CardContent, CardFooter**

Semantic sections for organizing card content.

**Locations:**
- `web/src/components/primitives/Card/CardHeader.tsx`
- `web/src/components/primitives/Card/CardContent.tsx`
- `web/src/components/primitives/Card/CardFooter.tsx`

**Complete Example:**

```tsx
<ArcaneCard variant="standard" hover glow>
  <CardHeader>
    <Heading level={3}>Player Profile</Heading>
  </CardHeader>

  <CardContent>
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <img src="/avatar.jpg" alt="Player" className="w-16 h-16 rounded-full" />
        <div>
          <Text size="lg" weight="semibold">John Doe</Text>
          <Text size="sm" color="secondary">Forward</Text>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Text size="xs" color="tertiary">Goals</Text>
          <Text size="lg" weight="bold">12</Text>
        </div>
        <div>
          <Text size="xs" color="tertiary">Assists</Text>
          <Text size="lg" weight="bold">8</Text>
        </div>
        <div>
          <Text size="xs" color="tertiary">Rating</Text>
          <Text size="lg" weight="bold">8.5</Text>
        </div>
      </div>
    </div>
  </CardContent>

  <CardFooter>
    <ArcaneButton variant="primary" size="sm" fullWidth>
      View Full Profile
    </ArcaneButton>
    <IconButton icon={<Heart />} variant="ghost" aria-label="Add to favorites" />
  </CardFooter>
</ArcaneCard>
```

---

## 📝 3. Input Component

### 3.1 ArcaneInput

Premium input field with comprehensive features.

**Location:** `web/src/components/primitives/Input/ArcaneInput.tsx`

**Features:**
- Multiple input types
- Icon support (left and right)
- Error states with messages
- Helper text
- Clear button
- Password visibility toggle
- Full accessibility

**Usage Examples:**

```tsx
import { ArcaneInput } from '@/components/primitives';
import { Mail, Lock, Search, User } from 'lucide-react';

// Text input with label
<ArcaneInput
  type="text"
  label="Full Name"
  placeholder="Enter your name"
  required
/>

// Email with icon
<ArcaneInput
  type="email"
  label="Email Address"
  placeholder="you@example.com"
  icon={<Mail />}
  required
/>

// Password with visibility toggle
<ArcaneInput
  type="password"
  label="Password"
  placeholder="Enter password"
  icon={<Lock />}
  helperText="Must be at least 8 characters"
/>

// Search with clear button
<ArcaneInput
  type="text"
  placeholder="Search players..."
  icon={<Search />}
  clearable
  onClear={() => console.log('cleared')}
/>

// With error state
<ArcaneInput
  type="email"
  label="Email"
  value="invalid-email"
  error="Please enter a valid email address"
  icon={<Mail />}
/>

// Full width input
<ArcaneInput
  type="text"
  placeholder="Full width input"
  fullWidth
/>

// Number input with min/max
<ArcaneInput
  type="number"
  label="Age"
  min={18}
  max={100}
  placeholder="Enter age"
/>

// Controlled input
const [value, setValue] = useState('');
<ArcaneInput
  type="text"
  label="Controlled Input"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

**Props:**
```typescript
interface ArcaneInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  variant?: 'default' | 'error';
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  icon?: ReactNode;
  iconRight?: ReactNode;
  error?: string;
  helperText?: string;
  clearable?: boolean;
  onClear?: () => void;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
  name?: string;
  id?: string;
  'aria-label'?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  autoComplete?: string;
  autoFocus?: boolean;
}
```

---

## 🏷️ 4. Badge Component

### 4.1 Badge

Status and category indicator with multiple variants.

**Location:** `web/src/components/primitives/Badge/Badge.tsx`

**Features:**
- 5 variants: success, warning, error, info, premium
- 3 sizes: sm, md, lg
- Icon support
- Pill shape design

**Usage Examples:**

```tsx
import { Badge } from '@/components/primitives';
import { CheckCircle, AlertTriangle, XCircle, Info, Star } from 'lucide-react';

// Success badge
<Badge variant="success" size="md">
  Active
</Badge>

// Warning badge
<Badge variant="warning" size="md">
  Pending
</Badge>

// Error badge
<Badge variant="error" size="md">
  Inactive
</Badge>

// Info badge
<Badge variant="info" size="md">
  New
</Badge>

// Premium badge
<Badge variant="premium" size="md">
  Pro
</Badge>

// With icons
<Badge variant="success" icon={<CheckCircle />}>
  Verified
</Badge>

<Badge variant="warning" icon={<AlertTriangle />}>
  Warning
</Badge>

<Badge variant="error" icon={<XCircle />}>
  Failed
</Badge>

<Badge variant="premium" icon={<Star />}>
  Premium
</Badge>

// Different sizes
<Badge variant="info" size="sm">Small</Badge>
<Badge variant="info" size="md">Medium</Badge>
<Badge variant="info" size="lg">Large</Badge>

// In a list
<div className="flex gap-2">
  <Badge variant="success">Defender</Badge>
  <Badge variant="info">Age 25</Badge>
  <Badge variant="premium">Premium Player</Badge>
</div>
```

**Props:**
```typescript
interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}
```

---

## 📰 5. Typography Components

### 5.1 Heading

Semantic heading component with gradient support.

**Location:** `web/src/components/primitives/Typography/Heading.tsx`

**Features:**
- 6 heading levels (h1-h6)
- Gradient text option
- 4 gradient types
- Responsive sizing

**Usage Examples:**

```tsx
import { Heading } from '@/components/primitives';

// Standard headings
<Heading level={1}>Welcome to Arcane</Heading>
<Heading level={2}>Player Statistics</Heading>
<Heading level={3}>Recent Activity</Heading>
<Heading level={4}>Match Details</Heading>
<Heading level={5}>Team Info</Heading>
<Heading level={6}>Notes</Heading>

// With gradient (primary)
<Heading level={1} gradient>
  Welcome to Arcane
</Heading>

// AI gradient
<Heading level={2} gradient gradientType="ai">
  AI-Powered Insights
</Heading>

// Performance gradient
<Heading level={2} gradient gradientType="performance">
  Performance Analytics
</Heading>

// Premium gradient
<Heading level={2} gradient gradientType="premium">
  Premium Features
</Heading>

// Custom className
<Heading level={3} className="text-center">
  Centered Heading
</Heading>
```

**Props:**
```typescript
interface HeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  gradient?: boolean;
  gradientType?: 'primary' | 'ai' | 'performance' | 'premium';
  className?: string;
  children: ReactNode;
}
```

---

### 5.2 Text

Body text component with size, color, and weight variants.

**Location:** `web/src/components/primitives/Typography/Text.tsx`

**Features:**
- 5 sizes: xs, sm, md, lg, xl
- 4 colors: primary, secondary, tertiary, accent
- 4 weights: regular, medium, semibold, bold
- Flexible rendering (p, span, div, label)

**Usage Examples:**

```tsx
import { Text } from '@/components/primitives';

// Default body text
<Text>This is default body text</Text>

// Different sizes
<Text size="xs">Extra small text</Text>
<Text size="sm">Small text</Text>
<Text size="md">Medium text (default)</Text>
<Text size="lg">Large text</Text>
<Text size="xl">Extra large text</Text>

// Different colors
<Text color="primary">Primary text (default)</Text>
<Text color="secondary">Secondary text</Text>
<Text color="tertiary">Tertiary text</Text>
<Text color="accent">Accent text (yellow)</Text>

// Different weights
<Text weight="regular">Regular weight</Text>
<Text weight="medium">Medium weight</Text>
<Text weight="semibold">Semibold weight</Text>
<Text weight="bold">Bold weight</Text>

// Render as different elements
<Text as="p">Paragraph</Text>
<Text as="span">Inline span</Text>
<Text as="div">Div container</Text>
<Text as="label">Label element</Text>

// Combined styling
<Text size="lg" color="secondary" weight="semibold">
  Large, secondary, semibold text
</Text>

// In a card
<div>
  <Text size="xl" weight="bold" color="primary">
    Player Name
  </Text>
  <Text size="sm" color="tertiary">
    Position • Age 25 • Spain
  </Text>
</div>
```

**Props:**
```typescript
interface TextProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  as?: 'p' | 'span' | 'div' | 'label';
  className?: string;
  children: ReactNode;
}
```

---

### 5.3 GradientText

Text with gradient effect.

**Location:** `web/src/components/primitives/Typography/GradientText.tsx`

**Features:**
- 4 gradient types
- Inline span element
- Semibold by default

**Usage Examples:**

```tsx
import { GradientText } from '@/components/primitives';

// Primary gradient
<GradientText gradient="primary">
  AI-Powered Insights
</GradientText>

// AI gradient
<GradientText gradient="ai">
  Advanced Analytics
</GradientText>

// Performance gradient
<GradientText gradient="performance">
  Track Your Progress
</GradientText>

// Premium gradient
<GradientText gradient="premium">
  Unlock Premium Features
</GradientText>

// In a heading
<h2 className="text-3xl">
  Welcome to <GradientText>Arcane</GradientText>
</h2>

// In a paragraph
<p className="text-lg">
  Experience <GradientText gradient="ai">next-generation</GradientText> scouting
</p>
```

**Props:**
```typescript
interface GradientTextProps {
  gradient?: 'primary' | 'ai' | 'performance' | 'premium';
  className?: string;
  children: ReactNode;
}
```

---

## 🎨 Complete Example: Player Card

Here's a complete example combining multiple components:

```tsx
import {
  ArcaneCard,
  CardHeader,
  CardContent,
  CardFooter,
  Heading,
  Text,
  GradientText,
  Badge,
  ArcaneButton,
  IconButton,
} from '@/components/primitives';
import { Heart, Share2, TrendingUp } from 'lucide-react';

export function PlayerCard({ player }) {
  return (
    <ArcaneCard variant="standard" hover glow>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Heading level={3}>{player.name}</Heading>
          <IconButton
            icon={<Heart />}
            variant="ghost"
            aria-label="Add to favorites"
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Player Image */}
          <div className="relative w-full aspect-square rounded-lg overflow-hidden">
            <img
              src={player.image}
              alt={player.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Badges */}
          <div className="flex gap-2">
            <Badge variant="success" icon={<TrendingUp />}>
              {player.position}
            </Badge>
            <Badge variant="info">Age {player.age}</Badge>
            {player.isPremium && (
              <Badge variant="premium">Premium</Badge>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Text size="xs" color="tertiary">Goals</Text>
              <Text size="lg" weight="bold" color="primary">
                {player.goals}
              </Text>
            </div>
            <div>
              <Text size="xs" color="tertiary">Assists</Text>
              <Text size="lg" weight="bold" color="primary">
                {player.assists}
              </Text>
            </div>
            <div>
              <Text size="xs" color="tertiary">Rating</Text>
              <Text size="lg" weight="bold" color="accent">
                {player.rating}
              </Text>
            </div>
          </div>

          {/* Description */}
          <Text size="sm" color="secondary">
            {player.description}
          </Text>

          {/* AI Insight */}
          <div className="p-3 bg-ai/10 rounded-lg border border-ai/20">
            <Text size="xs" color="tertiary" weight="semibold">
              <GradientText gradient="ai">AI Insight</GradientText>
            </Text>
            <Text size="sm" color="secondary">
              {player.aiInsight}
            </Text>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <ArcaneButton
          variant="primary"
          size="sm"
          fullWidth
          onClick={() => console.log('View profile')}
        >
          View Full Profile
        </ArcaneButton>
        <IconButton
          icon={<Share2 />}
          variant="ghost"
          aria-label="Share player"
        />
      </CardFooter>
    </ArcaneCard>
  );
}
```

---

## 📂 File Structure

```
web/src/components/primitives/
├── index.ts                          # Main export file
├── Button/
│   ├── ArcaneButton.tsx             # Primary button component
│   ├── IconButton.tsx               # Icon-only button
│   ├── types.ts                     # Button types
│   └── index.ts                     # Button exports
├── Card/
│   ├── ArcaneCard.tsx               # Card container
│   ├── CardHeader.tsx               # Card header section
│   ├── CardContent.tsx              # Card content section
│   ├── CardFooter.tsx               # Card footer section
│   ├── types.ts                     # Card types
│   └── index.ts                     # Card exports
├── Input/
│   ├── ArcaneInput.tsx              # Input field component
│   ├── types.ts                     # Input types
│   └── index.ts                     # Input exports
├── Badge/
│   ├── Badge.tsx                    # Badge component
│   ├── types.ts                     # Badge types
│   └── index.ts                     # Badge exports
└── Typography/
    ├── Heading.tsx                  # Heading component
    ├── Text.tsx                     # Text component
    ├── GradientText.tsx             # Gradient text component
    ├── types.ts                     # Typography types
    └── index.ts                     # Typography exports
```

---

## 🚀 Quick Start

### Import Components

```tsx
// Import all at once
import {
  ArcaneButton,
  IconButton,
  ArcaneCard,
  CardHeader,
  CardContent,
  CardFooter,
  ArcaneInput,
  Badge,
  Heading,
  Text,
  GradientText,
} from '@/components/primitives';

// Or import individually
import { ArcaneButton } from '@/components/primitives/Button';
import { ArcaneCard } from '@/components/primitives/Card';
```

### Basic Form Example

```tsx
import { ArcaneInput, ArcaneButton, Heading, Text } from '@/components/primitives';
import { Mail, Lock } from 'lucide-react';

export function LoginForm() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="space-y-2">
        <Heading level={2}>Welcome Back</Heading>
        <Text color="secondary">
          Sign in to your account to continue
        </Text>
      </div>

      <form className="space-y-4">
        <ArcaneInput
          type="email"
          label="Email"
          placeholder="you@example.com"
          icon={<Mail />}
          required
        />

        <ArcaneInput
          type="password"
          label="Password"
          placeholder="Enter your password"
          icon={<Lock />}
          required
        />

        <ArcaneButton type="submit" fullWidth>
          Sign In
        </ArcaneButton>

        <ArcaneButton variant="ghost" fullWidth>
          Forgot Password?
        </ArcaneButton>
      </form>
    </div>
  );
}
```

---

## ✅ Features Checklist

All components include:

- ✅ **TypeScript Support** - Full type safety with exported interfaces
- ✅ **Tailwind CSS** - Uses Arcane design tokens
- ✅ **Accessibility** - ARIA labels, keyboard navigation, focus states
- ✅ **Dark Mode** - Designed exclusively for dark backgrounds
- ✅ **Responsive** - Works on mobile, tablet, and desktop
- ✅ **Animations** - Smooth transitions with cubic-bezier easing
- ✅ **JSDoc Comments** - Full documentation in code
- ✅ **Variants** - Multiple style options for different contexts
- ✅ **States** - Hover, active, disabled, loading, error
- ✅ **Flexible** - Composable with className prop

---

## 🎨 Design Tokens Used

### Colors
- `arcane-black` - Deep black backgrounds
- `arcane-anthracite` - Secondary backgrounds
- `arcane-charcoal` - Card backgrounds
- `arcane-slate` - Borders and dividers
- `arcane-yellow` - Primary brand accent
- `arcane-gray-{100-600}` - Text hierarchy
- `success`, `warning`, `error`, `info` - Semantic colors
- `ai`, `scouting`, `coaching`, etc. - Feature colors

### Animations
- `cubic-bezier(0.16, 1, 0.3, 1)` - Spring easing
- `duration-200` - Fast transitions
- `hover:-translate-y-0.5` - Lift effect
- `shadow-glow-yellow` - Glow effects

### Typography
- `font-display` (Poppins) - Headings
- `font-sans` (Inter) - UI elements
- `font-body` (Manrope) - Body text

---

## 📚 Next Steps

### Tier 2 Components (Coming Next)
- Navigation (Sidebar, Tabs, Breadcrumbs)
- Modals and Dialogs
- Tooltips and Popovers
- Progress indicators
- Form components (Select, Checkbox, Radio)

### Testing
- Add Storybook stories for each component
- Write unit tests
- Create visual regression tests

### Documentation
- Create component playground
- Add more usage examples
- Document common patterns

---

## 🤝 Contributing

When adding new components:
1. Follow the existing file structure
2. Add TypeScript types in `types.ts`
3. Use Arcane design tokens
4. Include JSDoc comments
5. Add to main `index.ts` export
6. Update this documentation

---

**Created by:** Claude Code
**Last Updated:** 2025-11-11
**Version:** 1.0.0
**Status:** ✅ Production Ready
