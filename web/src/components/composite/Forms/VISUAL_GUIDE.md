# Form Components - Visual Guide

Visual reference for all Form components with design specifications.

---

## Color Palette

```
Active/Checked:   #E4FF3B (Arcane Yellow)
Focus Ring:       #E4FF3B with 2px width
Error:            #EF4444 (Red)
Border Default:   #3F3F46 (Slate)
Border Hover:     #A1A1AA (Gray 400)
Background:       #27272A (Charcoal)
Input BG:         #1B1B1F (Anthracite)
Text Primary:     #E4E4E7 (Gray 200)
Text Secondary:   #A1A1AA (Gray 400)
```

---

## Checkbox

### Visual States

```
┌─────────────────────────────────────────┐
│  Unchecked (Default)                    │
│  ┌──┐                                   │
│  │  │  Checkbox Label                   │
│  └──┘                                   │
│  Gray border (#3F3F46)                  │
│  Dark background (#27272A)              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Checked                                 │
│  ┌──┐                                   │
│  │✓│  Checkbox Label                   │
│  └──┘                                   │
│  Yellow background (#E4FF3B)            │
│  Check icon in black                    │
│  Yellow glow effect                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Indeterminate                           │
│  ┌──┐                                   │
│  │─│  Select All                        │
│  └──┘                                   │
│  Yellow background (#E4FF3B)            │
│  Minus icon in black                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Error State                             │
│  ┌──┐                                   │
│  │  │  Required Field *                 │
│  └──┘                                   │
│  ⚠ This field is required               │
│  Red error text (#EF4444)               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  With Helper Text                        │
│  ┌──┐                                   │
│  │✓│  Subscribe to newsletter           │
│  └──┘                                   │
│  Get weekly updates about new features  │
│  Gray helper text (#A1A1AA)             │
└─────────────────────────────────────────┘
```

### Size Variants

```
Small (sm):
┌─┐  16x16px checkbox
│✓│  12x12px icon
└─┘  14px label text

Medium (md) - Default:
┌──┐  20x20px checkbox
│✓│  14px icon
└──┘  16px label text

Large (lg):
┌───┐  24x24px checkbox
│ ✓│  16px icon
└───┘  18px label text
```

---

## Radio

### Visual States

```
┌─────────────────────────────────────────┐
│  Unselected (Default)                   │
│  ◯  Radio Option                        │
│  Gray border (#3F3F46)                  │
│  Dark background (#27272A)              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Selected                                │
│  ◉  Radio Option                        │
│  Yellow border (#E4FF3B)                │
│  Yellow inner dot                       │
│  Dark background (#27272A)              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  With Icon & Description                 │
│  ⭐ ◉  Pro Plan                          │
│      Best for teams - $29/month         │
│  Icon, label, and description           │
│  Gray description text (#A1A1AA)        │
└─────────────────────────────────────────┘
```

### RadioGroup Layout

```
Vertical (Default):
┌─────────────────────┐
│ Select a plan       │
│                     │
│ ◯  Free Plan        │
│    Perfect for...   │
│                     │
│ ◉  Pro Plan         │
│    Best for teams   │
│                     │
│ ◯  Team Plan        │
│    Enterprise...    │
└─────────────────────┘

Horizontal:
┌───────────────────────────────────┐
│ Select a plan                     │
│                                   │
│ ◯ Free  ◉ Pro  ◯ Team            │
└───────────────────────────────────┘
```

---

## Switch

### Visual States

```
┌─────────────────────────────────────────┐
│  Off (Default)                           │
│  ┌────────┐                             │
│  │○       │  Toggle Label                │
│  └────────┘                             │
│  Gray track (#3F3F46)                   │
│  White thumb (left)                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  On (Checked)                            │
│  ┌────────┐                             │
│  │      ●│  Toggle Label                │
│  └────────┘                             │
│  Yellow track (#E4FF3B)                 │
│  Black thumb (right)                    │
│  Yellow glow effect                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Loading State                           │
│  ┌────────┐                             │
│  │    ⟳ ●│  Processing...               │
│  └────────┘                             │
│  Spinner inside thumb                   │
│  Cannot be toggled while loading        │
└─────────────────────────────────────────┘
```

### Size Variants

```
Small (sm):
┌─────┐  36x20px track
│○    │  16x16px thumb
└─────┘

Medium (md) - Default:
┌──────┐  44x24px track
│○     │  20x20px thumb
└──────┘

Large (lg):
┌────────┐  56x28px track
│○       │  24x24px thumb
└────────┘
```

---

## Form Layout

### Basic Form Structure

```
┌──────────────────────────────────────────┐
│  Create Account                          │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Username *                          │ │
│  │ ┌────────────────────────────────┐ │ │
│  │ │ Enter username...              │ │ │
│  │ └────────────────────────────────┘ │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Email *                             │ │
│  │ ┌────────────────────────────────┐ │ │
│  │ │ your@email.com                 │ │ │
│  │ └────────────────────────────────┘ │ │
│  │ We'll never share your email       │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌──┐                                   │
│  │✓│  I agree to terms                 │
│  └──┘                                   │
│                                          │
│  ────────────────────────────────────   │
│                                          │
│  [ Cancel ]  [ CREATE ACCOUNT ]         │
└──────────────────────────────────────────┘
```

### Form with Error

```
┌──────────────────────────────────────────┐
│  Login                                   │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Email *                             │ │
│  │ ┌────────────────────────────────┐ │ │
│  │ │ invalid-email                  │ │ │  ← Red border
│  │ └────────────────────────────────┘ │ │
│  │ ⚠ Invalid email address            │ │  ← Error message
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Password *                          │ │
│  │ ┌────────────────────────────────┐ │ │
│  │ │ ••••                           │ │ │
│  │ └────────────────────────────────┘ │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [ Cancel ]  [ LOGIN ]                  │
└──────────────────────────────────────────┘
```

### Multi-Column Layout

```
┌──────────────────────────────────────────────────┐
│  Profile Settings                                │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │ First Name      │  │ Last Name       │      │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │      │
│  │ │ John        │ │  │ │ Doe         │ │      │
│  │ └─────────────┘ │  │ └─────────────┘ │      │
│  └─────────────────┘  └─────────────────┘      │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Email                                      │ │
│  │ ┌────────────────────────────────────────┐ │ │
│  │ │ john.doe@example.com                   │ │ │
│  │ └────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [ Cancel ]  [ SAVE CHANGES ]                   │
└──────────────────────────────────────────────────┘
```

---

## Interactive States

### Focus States

```
Default:
┌────────────────┐
│ Input field    │
└────────────────┘

Focused:
┌────────────────┐
│ Input field    │  ← 2px yellow ring
└────────────────┘    offset by 2px
  Ring color: #E4FF3B
```

### Hover States

```
Checkbox/Radio:
Default → Hover
Gray border → Lighter gray border
#3F3F46 → #A1A1AA

Switch:
Default → Hover
Gray track → Darker gray track
#3F3F46 → #52525B

Button:
Default → Hover
Yellow BG → Yellow BG + Glow
#E4FF3B → #E4FF3B + shadow
```

---

## Animation Specifications

### Checkbox Animation

```
State Change: Unchecked → Checked
Duration: 200ms
Easing: cubic-bezier(0.16, 1, 0.3, 1)

Animation:
1. Background: transparent → yellow (200ms)
2. Border: gray → yellow (200ms)
3. Icon: scale(0) → scale(1) (200ms)
   Transform origin: center
```

### Radio Animation

```
State Change: Unselected → Selected
Duration: 200ms
Easing: cubic-bezier(0.16, 1, 0.3, 1)

Animation:
1. Border: gray → yellow (200ms)
2. Inner dot: scale(0) → scale(1) (200ms)
   Transform origin: center
```

### Switch Animation

```
State Change: Off → On
Duration: 200ms
Easing: cubic-bezier(0.16, 1, 0.3, 1)

Animation:
1. Track: gray → yellow (200ms)
2. Thumb:
   - Slide: translateX(0) → translateX(20px) (200ms)
   - Color: white → black (200ms)
```

### Error Animation

```
Error Appearance
Duration: 200ms
Easing: ease-out

Animation:
1. Fade in: opacity 0 → 1 (200ms)
2. Slide down: translateY(-4px) → translateY(0) (200ms)
```

---

## Spacing & Typography

### Form Spacing

```
Vertical spacing between fields: 24px (6 Tailwind units)
Label to input spacing: 6px (1.5 Tailwind units)
Error/helper text to input: 6px (1.5 Tailwind units)
Form padding: 32px (8 Tailwind units)
Actions border top: 1px solid #3F3F46
Actions padding top: 24px (6 Tailwind units)
```

### Typography

```
Form Title:
  Size: 24px (1.5rem)
  Weight: 700 (bold)
  Color: #E4FF3B (yellow)

Field Label:
  Size: 16px (1rem)
  Weight: 500 (medium)
  Color: #E4E4E7 (gray-200)

Input Text:
  Size: 16px (1rem)
  Weight: 400 (regular)
  Color: #FFFFFF (white)

Helper Text:
  Size: 14px (0.875rem)
  Weight: 400 (regular)
  Color: #A1A1AA (gray-400)

Error Text:
  Size: 14px (0.875rem)
  Weight: 400 (regular)
  Color: #EF4444 (error)

Button Text:
  Size: 14px (0.875rem)
  Weight: 600 (semibold)
  Transform: uppercase
  Letter spacing: 0.05em
```

---

## Component Dimensions

### Checkbox

```
Small:    16x16px (checkbox), 12x12px (icon)
Medium:   20x20px (checkbox), 14px (icon)
Large:    24x24px (checkbox), 16px (icon)

Border: 2px solid
Border radius: 6px (rounded-md)
```

### Radio

```
Small:    16x16px (button), 8x8px (dot)
Medium:   20x20px (button), 10x10px (dot)
Large:    24x24px (button), 12x12px (dot)

Border: 2px solid
Border radius: 9999px (rounded-full)
```

### Switch

```
Small:    36x20px (track), 16x16px (thumb)
Medium:   44x24px (track), 20x20px (thumb)
Large:    56x28px (track), 24x24px (thumb)

Border radius: 9999px (rounded-full)
Thumb position: 2px from edge
Travel distance:
  Small: 16px
  Medium: 20px
  Large: 28px
```

### Input Fields

```
Height: 40px (py-2.5)
Padding: 16px horizontal (px-4)
Border: 2px solid
Border radius: 8px (rounded-lg)

Focus state:
  Border color: #E4FF3B
  Ring: 2px, offset 2px
```

### Buttons

```
Height: 40px (py-2.5)
Padding: 20px horizontal (px-5)
Border radius: 8px (rounded-lg)
Min width: 100px

Primary (Submit):
  Background: #E4FF3B
  Text: #0A0A0A
  Hover: Glow effect

Secondary (Cancel):
  Background: transparent
  Border: 2px solid #3F3F46
  Text: #E4E4E7
```

---

## Accessibility Indicators

### Required Field

```
Label text followed by red asterisk:
Username *
         ↑
    Color: #EF4444
```

### Optional Field

```
Label text followed by gray text:
Newsletter (Optional)
           ↑
    Color: #A1A1AA
    Size: 12px
```

### Focus Indicator

```
All interactive elements:
- 2px yellow ring (#E4FF3B)
- 2px offset from element
- Visible on keyboard focus
- Not visible on mouse click
```

### Error Icon

```
⚠ Icon before error message
Size: 16x16px
Color: #EF4444
```

---

## Dark Mode Optimization

All components are designed for dark mode:

```
Background colors:
- Form container: #27272A (Charcoal)
- Input fields: #1B1B1F (Anthracite)
- Disabled fields: 50% opacity

Text colors:
- Primary text: #E4E4E7 (Gray 200) - High contrast
- Secondary text: #A1A1AA (Gray 400) - Medium contrast
- Disabled text: 50% opacity

Borders:
- Default: #3F3F46 (Slate)
- Hover: #A1A1AA (Gray 400)
- Focus: #E4FF3B (Yellow)
- Error: #EF4444 (Red)
```

---

## Component Relationships

```
Form
├── FormField
│   ├── Label
│   ├── Input/Textarea/Select
│   ├── Error Message
│   └── Helper Text
├── Checkbox
│   ├── Checkbox Box
│   ├── Label
│   ├── Error Message
│   └── Helper Text
├── RadioGroup
│   ├── Group Label
│   ├── Radio
│   │   ├── Radio Button
│   │   ├── Label
│   │   └── Description
│   ├── Error Message
│   └── Helper Text
├── Switch
│   ├── Switch Track
│   ├── Switch Thumb
│   ├── Label
│   ├── Error Message
│   └── Helper Text
└── FormActions
    ├── Cancel Button
    ├── Submit Button
    └── Custom Actions
```

---

## Print-Ready Color Swatches

```
■ #E4FF3B  Arcane Yellow (Active/Checked)
■ #0A0A0A  Arcane Black (Background)
■ #1B1B1F  Anthracite (Input Background)
■ #27272A  Charcoal (Card Background)
■ #3F3F46  Slate (Border)
■ #52525B  Gray 600 (Border Hover)
■ #71717A  Gray 500 (Disabled)
■ #A1A1AA  Gray 400 (Helper Text)
■ #D4D4D8  Gray 300 (Light Text)
■ #E4E4E7  Gray 200 (Primary Text)
■ #FFFFFF  White (Input Text)
■ #EF4444  Error Red
■ #10B981  Success Green
```

---

## Grid System

```
Form Container:
Max width: 672px (2xl)
Padding: 32px (8 units)

Two-column layout:
Grid template: 1fr 1fr
Gap: 16px (4 units)

Responsive breakpoints:
< 640px: Single column
≥ 640px: Can use two columns
≥ 768px: Recommended two columns
```

---

## Best Practices Summary

1. **Always provide labels** for form inputs
2. **Use yellow accent** for checked/active states
3. **Maintain 2px borders** for consistency
4. **Apply 200ms animations** with spring easing
5. **Show focus rings** for keyboard navigation
6. **Use proper contrast ratios** for text
7. **Provide error feedback** immediately
8. **Include helper text** when helpful
9. **Keep forms simple** and focused
10. **Test keyboard navigation** thoroughly

---

This visual guide provides all the specifications needed to maintain design consistency across the Form components.
