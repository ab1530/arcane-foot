# Arcane Primitives - Tier 1 Components

Premium UI components for the Arcane Design System.

## Quick Start

```tsx
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
```

## Components

### Buttons
- **ArcaneButton** - Primary button with variants (primary, secondary, ghost, danger)
- **IconButton** - Circular icon-only button with badge support

### Cards
- **ArcaneCard** - Premium card container with variants (standard, glass, feature, stat)
- **CardHeader** - Card header section
- **CardContent** - Card content section
- **CardFooter** - Card footer with actions

### Inputs
- **ArcaneInput** - Input field with icons, error states, and password toggle

### Badges
- **Badge** - Status indicator with variants (success, warning, error, info, premium)

### Typography
- **Heading** - Semantic headings (h1-h6) with gradient support
- **Text** - Body text with size, color, and weight options
- **GradientText** - Text with gradient effects

## Documentation

For complete documentation with examples, see:
`/Users/lakhdari/Desktop/AppFoot/TIER1_COMPONENTS_SUMMARY.md`

## Features

✅ TypeScript with full type safety
✅ Tailwind CSS with Arcane tokens
✅ ARIA accessibility
✅ Smooth animations
✅ Dark mode optimized
✅ Fully documented

## Example Usage

```tsx
<ArcaneCard variant="standard" hover glow>
  <CardHeader>
    <Heading level={3}>Player Profile</Heading>
  </CardHeader>
  <CardContent>
    <Text>Player details here</Text>
  </CardContent>
  <CardFooter>
    <ArcaneButton variant="primary">View More</ArcaneButton>
  </CardFooter>
</ArcaneCard>
```
