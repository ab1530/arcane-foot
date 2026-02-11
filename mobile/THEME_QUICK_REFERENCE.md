# Mobile Theme Quick Reference Card

## Import Statement

```typescript
// ✅ NEW (Use this)
import { colors, spacing, typography, radius, shadows, animations, theme } from '@/design/theme';

// ❌ OLD (Deprecated)
import { COLORS, SPACING, FONTS, BORDER_RADIUS, SHADOWS, ANIMATION } from '@/constants/theme';
```

---

## Colors

### Background
```typescript
colors.background.primary    // #080C1D - Main background (Arcane brand)
colors.background.secondary  // #0A0E1F - Secondary background
colors.background.tertiary   // #1A1F35 - Borders, dividers
colors.background.elevated   // #1F1F1F - Elevated surfaces
colors.background.overlay    // rgba(8, 12, 29, 0.8) - Modal overlay
```

### Brand
```typescript
colors.brand.primary         // #E4FF3B - Arcane yellow
colors.brand.primaryLight    // #F0FF6B - Light yellow
colors.brand.primaryDark     // #C8E611 - Dark yellow
colors.brand.accent          // #00FFB3 - Neon cyan
```

### Text
```typescript
colors.text.primary          // #FFFFFF - Main text
colors.text.secondary        // rgba(255, 255, 255, 0.7) - Secondary text
colors.text.tertiary         // rgba(255, 255, 255, 0.5) - Tertiary text
colors.text.muted            // rgba(255, 255, 255, 0.3) - Muted text
colors.text.inverse          // #0A0A0A - Inverse text (on accent)
```

### Surface (Glass Effects)
```typescript
colors.surface.glass         // rgba(255, 255, 255, 0.03)
colors.surface.glassLight    // rgba(255, 255, 255, 0.05)
colors.surface.glassMedium   // rgba(255, 255, 255, 0.08)
colors.surface.glassHeavy    // rgba(255, 255, 255, 0.12)
colors.surface.border        // rgba(255, 255, 255, 0.1)
colors.surface.borderLight   // rgba(255, 255, 255, 0.05)
```

### Semantic
```typescript
colors.semantic.success      // #22C55E - Success state
colors.semantic.successLight // rgba(34, 197, 94, 0.1) - Success bg
colors.semantic.warning      // #F59E0B - Warning state
colors.semantic.warningLight // rgba(245, 158, 11, 0.1) - Warning bg
colors.semantic.error        // #EF4444 - Error state
colors.semantic.errorLight   // rgba(239, 68, 68, 0.1) - Error bg
colors.semantic.info         // #3B82F6 - Info state
colors.semantic.infoLight    // rgba(59, 130, 246, 0.1) - Info bg
```

---

## Spacing (8px base system)

```typescript
spacing.none    // 0px
spacing.xxs     // 2px
spacing.xs      // 4px
spacing.sm      // 8px
spacing.md      // 12px ⭐ Base spacing
spacing.lg      // 16px
spacing.xl      // 24px
spacing["2xl"]  // 32px
spacing["3xl"]  // 40px
spacing["4xl"]  // 48px
spacing["5xl"]  // 56px
spacing["6xl"]  // 64px
```

---

## Typography

### Font Sizes
```typescript
// Display
typography.sizes.display1    // 56px
typography.sizes.display2    // 48px
typography.sizes.display3    // 40px

// Headings
typography.sizes.h1          // 32px
typography.sizes.h2          // 28px
typography.sizes.h3          // 24px
typography.sizes.h4          // 20px
typography.sizes.h5          // 18px
typography.sizes.h6          // 16px

// Body
typography.sizes.xl          // 18px
typography.sizes.lg          // 16px
typography.sizes.base        // 14px ⭐ Base font size
typography.sizes.sm          // 13px
typography.sizes.xs          // 12px
typography.sizes.xxs         // 10px
```

### Font Weights
```typescript
typography.weights.regular   // '400'
typography.weights.medium    // '500'
typography.weights.semiBold  // '600'
typography.weights.bold      // '700'
typography.weights.heavy     // '800'
typography.weights.black     // '900'
```

### Line Heights
```typescript
typography.lineHeights.tight    // 1.1
typography.lineHeights.snug     // 1.2
typography.lineHeights.normal   // 1.5
typography.lineHeights.relaxed  // 1.625
typography.lineHeights.loose    // 2
```

---

## Border Radius

```typescript
radius.none     // 0px
radius.xs       // 4px
radius.sm       // 8px
radius.md       // 12px ⭐ Base radius
radius.lg       // 16px
radius.xl       // 24px
radius["2xl"]   // 32px
radius["3xl"]   // 40px
radius.full     // 9999px (circle)
```

---

## Shadows

```typescript
shadows.none    // No shadow
shadows.xs      // Minimal shadow
shadows.sm      // Small shadow
shadows.md      // Medium shadow ⭐
shadows.lg      // Large shadow
shadows.xl      // Extra large shadow
shadows["2xl"]  // Huge shadow
shadows.glow    // Accent glow effect
```

---

## Animations

### Durations
```typescript
animations.durations.instant   // 0ms
animations.durations.fast      // 200ms
animations.durations.normal    // 300ms ⭐
animations.durations.slow      // 500ms
animations.durations.slower    // 800ms
animations.durations.slowest   // 1000ms
```

### Spring Configs
```typescript
animations.springs.gentle      // Gentle spring
animations.springs.wobbly      // Wobbly spring
animations.springs.stiff       // Stiff spring
animations.springs.slow        // Slow spring
animations.springs.bouncy      // Bouncy spring
```

---

## Layout

### Screen Dimensions
```typescript
theme.layout.screen.width      // Device width
theme.layout.screen.height     // Device height
```

### Safe Area
```typescript
theme.layout.safeArea.top      // 44 (iOS) / 24 (Android)
theme.layout.safeArea.bottom   // 34 (iOS) / 0 (Android)
```

### Content Width
```typescript
theme.layout.contentWidth.xs   // 320px
theme.layout.contentWidth.sm   // 384px
theme.layout.contentWidth.md   // 448px
theme.layout.contentWidth.lg   // 512px
theme.layout.contentWidth.xl   // 576px
theme.layout.contentWidth.full // Full screen width
```

---

## Z-Index Scale

```typescript
theme.zIndex.hide      // -1
theme.zIndex.base      // 0
theme.zIndex.dropdown  // 10
theme.zIndex.sticky    // 20
theme.zIndex.fixed     // 30
theme.zIndex.overlay   // 40
theme.zIndex.modal     // 50
theme.zIndex.popover   // 60
theme.zIndex.tooltip   // 70
theme.zIndex.toast     // 80
theme.zIndex.loading   // 90
theme.zIndex.max       // 999
```

---

## Common Patterns

### Glass Card
```typescript
{
  backgroundColor: colors.surface.glassLight,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.surface.border,
  ...shadows.md,
}
```

### Primary Button
```typescript
{
  backgroundColor: colors.brand.primary,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  borderRadius: radius.md,
  ...shadows.md,
}
```

### Text Input
```typescript
{
  backgroundColor: colors.surface.glassLight,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.surface.border,
  padding: spacing.md,
  color: colors.text.primary,
  fontSize: typography.sizes.base,
}
```

### Modal Overlay
```typescript
{
  backgroundColor: colors.background.overlay,
  ...StyleSheet.absoluteFillObject,
}
```

---

## Usage Example

```typescript
import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius, shadows } from '@/design/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    padding: spacing.lg,
    ...shadows.md,
  },
  title: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },
  button: {
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    ...shadows.md,
  },
  buttonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.background.primary,
  },
});
```

---

## Pro Tips

1. **Always use theme values** - Never hardcode colors, spacing, or sizes
2. **Semantic colors** - Use semantic colors for status indicators
3. **Glass effects** - Combine glass surfaces with blur for premium feel
4. **Consistent spacing** - Stick to the 8px base system
5. **Typography hierarchy** - Use consistent font sizes for similar content
6. **Shadows sparingly** - Use shadows to indicate elevation, not decoration
7. **Animations** - Keep animations fast and responsive (200-300ms)

---

**Note:** Always import from `@/design/theme` - the old theme at `@/constants/theme` is deprecated.
