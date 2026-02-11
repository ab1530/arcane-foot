# Tier 2 Components - Quick Reference Guide

Visual reference for all Data Display and Progress components.

---

## 📊 DataDisplay Components

### Table
```
┌─────────────────────────────────────────────────────────────┐
│ ☐  Name ↕      Position (filter)   Rating ↕      Age ↕     │ ← Sortable/Filterable Headers
├─────────────────────────────────────────────────────────────┤
│ ☐  Messi       RW                   93           36         │
│ ☐  Ronaldo     ST                   91           38         │
│ ☑  Mbappé      ST                   92           25         │ ← Selected Row
│ ☐  Haaland     ST                   91           23         │
│ ☐  De Bruyne   CAM                  91           32         │
└─────────────────────────────────────────────────────────────┘
  Rows per page: [25 ▼]  1-5 of 100    [First] [Prev] [Next] [Last]
```

**Import:**
```tsx
import { Table } from '@/components/composite/DataDisplay';
```

**Props:**
```tsx
data: T[]                    // Array of data
columns: Column<T>[]         // Column definitions
loading?: boolean            // Show skeletons
emptyMessage?: string        // Empty state text
onRowClick?: (row, i) => void
selectable?: boolean
onSelectionChange?: (rows) => void
pagination?: boolean
defaultPageSize?: 10|25|50|100
stickyHeader?: boolean
```

---

### DataGrid
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Messi     │  │  Ronaldo    │  │   Mbappé    │
│     93      │  │     91      │  │     92      │
│ RW • 36 yrs │  │ ST • 38 yrs │  │ ST • 25 yrs │
└─────────────┘  └─────────────┘  └─────────────┘
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Haaland    │  │ De Bruyne   │  │   Salah     │
│     91      │  │     91      │  │     89      │
│ ST • 23 yrs │  │ CAM • 32 yrs│  │ RW • 31 yrs │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Import:**
```tsx
import { DataGrid } from '@/components/composite/DataDisplay';
```

**Props:**
```tsx
data: T[]                    // Array of data
renderItem: (item, i) => JSX // Custom renderer
loading?: boolean
emptyMessage?: string
columns?: 1|2|3|4           // Grid columns (responsive)
gap?: 'sm'|'md'|'lg'        // 12px|16px|24px
infiniteScroll?: boolean
onLoadMore?: () => void
```

---

### List
```
┌─────────────────────────────────────────────────────┐
│  ⭕ 93  Lionel Messi              36 years           │
│         RW • Inter Miami          Age                │
├─────────────────────────────────────────────────────┤
│  ⭕ 91  Cristiano Ronaldo         38 years           │
│         ST • Al Nassr             Age                │
├─────────────────────────────────────────────────────┤
│  ⭕ 92  Kylian Mbappé              25 years          │
│         ST • Real Madrid          Age                │
├─────────────────────────────────────────────────────┤
│  ⭕ 91  Erling Haaland            23 years           │
│         ST • Man City             Age                │
└─────────────────────────────────────────────────────┘
```

**Import:**
```tsx
import { List } from '@/components/composite/DataDisplay';
```

**Props:**
```tsx
data: T[]                    // Array of data
renderItem: (item, i) => JSX // Custom renderer
loading?: boolean
emptyMessage?: string
dividers?: boolean           // Lines between items
spacing?: 'sm'|'md'|'lg'    // 8px|16px|24px
virtualized?: boolean        // For 1000+ items
itemHeight?: number          // Required if virtualized
containerHeight?: number     // Required if virtualized
```

---

## ⏳ Progress Components

### ProgressBar

**Determinate:**
```
Upload Progress                                           75%
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░
```

**Indeterminate:**
```
Processing...
░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░
         ↑ Slides left to right infinitely
```

**Import:**
```tsx
import { ProgressBar } from '@/components/composite/Progress';
```

**Props:**
```tsx
value?: number              // 0-100
max?: number               // Default: 100
indeterminate?: boolean    // Sliding animation
size?: 'sm'|'md'|'lg'     // 6px|10px|16px
label?: string            // Top label
showPercentage?: boolean  // Show "75%"
gradient?: boolean        // Yellow → Green
```

**Sizes:**
```
sm:  ▓▓▓▓▓▓░░░  (6px height)
md:  ▓▓▓▓▓▓░░░  (10px height)
lg:  ▓▓▓▓▓▓░░░  (16px height)
```

---

### CircularProgress

**Determinate:**
```
      ⬤
    ◜───◝
   │ 75% │
   │     │
    ◟───◞
```

**Indeterminate:**
```
      ⬤
    ◜──
   │
   │
    ──◞
   ↻ Spins continuously
```

**Import:**
```tsx
import { CircularProgress } from '@/components/composite/Progress';
```

**Props:**
```tsx
value?: number              // 0-100
max?: number               // Default: 100
indeterminate?: boolean    // Spinning animation
size?: 'sm'|'md'|'lg'|'xl' // 48|64|96|128px
showLabel?: boolean        // Center percentage
thickness?: number         // Stroke width (default: 6)
gradient?: boolean         // Yellow → Green
```

**Sizes:**
```
sm:  ⬤   (48px)
md:  ⬤   (64px)
lg:  ⬤   (96px)
xl:  ⬤   (128px)
```

---

### Skeleton

**Text:**
```
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    ↑ Shimmer animation moves across →
```

**Card:**
```
┌──────────────────────────────┐
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │
└──────────────────────────────┘
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
▒▒▒▒▒▒▒▒▒▒
```

**Avatar:**
```
 ⬤  (circle)
▒▒▒
▒▒▒
 ▒
```

**Import:**
```tsx
import { Skeleton } from '@/components/composite/Progress';
```

**Props:**
```tsx
type?: 'text'|'card'|'avatar'|'custom'
lines?: number              // For text type
width?: string             // CSS width
height?: string            // CSS height
rounded?: 'none'|'sm'|'md'|'lg'|'full'
```

**Types:**
```tsx
<Skeleton type="text" lines={3} />
<Skeleton type="card" />
<Skeleton type="avatar" width="64px" />
<Skeleton type="custom" width="200px" height="100px" />
```

---

### Spinner

```
    ╱─╲      Small (16px)
   │   │
    ╲─╱
     ↻

     ╱──╲     Medium (32px)
    │    │
    │    │
     ╲──╱
      ↻

      ╱───╲    Large (48px)
     │     │
     │     │
     │     │
      ╲───╱
       ↻
```

**Import:**
```tsx
import { Spinner } from '@/components/composite/Progress';
```

**Props:**
```tsx
size?: 'sm'|'md'|'lg'      // 16px|32px|48px
color?: 'yellow'|'white'|'gray'
centered?: boolean         // Center in container
```

**Colors:**
```
Yellow: ◐  (default, arcane-yellow)
White:  ◐  (white)
Gray:   ◐  (arcane-gray-400)
```

---

## 🎨 Color Palette

```
Primary:
  arcane-yellow    ■ #E4FF3B  (Accent, Progress)

Backgrounds:
  arcane-black     ■ #0A0A0A  (Page background)
  arcane-anthracite■ #1B1B1F  (Card background)
  arcane-charcoal  ■ #27272A  (Surface)
  arcane-slate     ■ #3F3F46  (Borders)

Text:
  gray-200         ■ #E4E4E7  (Primary text)
  gray-400         ■ #A1A1AA  (Secondary text)
  gray-500         ■ #71717A  (Tertiary text)

Semantic:
  success          ■ #10B981  (Green, used in gradients)
  error            ■ #EF4444  (Red)
  warning          ■ #F59E0B  (Orange)
  info             ■ #3B82F6  (Blue)
```

---

## 📐 Sizing System

**Spacing:**
```
sm:   12px  (0.75rem)
md:   16px  (1rem)
lg:   24px  (1.5rem)
```

**Border Radius:**
```
sm:   6px   (rounded-sm)
md:   8px   (rounded-md)
lg:   12px  (rounded-lg)
xl:   16px  (rounded-xl)
2xl:  24px  (rounded-2xl)
full: 9999px (rounded-full)
```

**Font Sizes:**
```
xs:   12px  (text-xs)
sm:   14px  (text-sm)
base: 16px  (text-base)
lg:   18px  (text-lg)
xl:   20px  (text-xl)
2xl:  24px  (text-2xl)
3xl:  30px  (text-3xl)
4xl:  36px  (text-4xl)
```

---

## ⚡ Animation Timing

```
Fast:    150ms  (Quick hover effects)
Normal:  250ms  (Default transitions)
Slow:    350ms  (Deliberate animations)
Slower:  500ms  (Progress bars)

Easing:
  spring:  cubic-bezier(0.16, 1, 0.3, 1)
  in-out:  cubic-bezier(0.4, 0, 0.2, 1)
```

---

## 🔄 Common Patterns

### Loading Table
```tsx
{isLoading ? (
  <Table loading columns={columns} data={[]} />
) : (
  <Table data={players} columns={columns} />
)}
```

### Infinite Scroll Grid
```tsx
<DataGrid
  data={items}
  columns={3}
  infiniteScroll
  onLoadMore={async () => {
    const more = await fetchMore();
    setItems([...items, ...more]);
  }}
  renderItem={(item) => <Card {...item} />}
/>
```

### Upload Progress
```tsx
<div className="space-y-4">
  <div className="flex items-center gap-4">
    <CircularProgress value={progress} size="sm" />
    <span>Uploading...</span>
  </div>
  <ProgressBar
    value={progress}
    showPercentage
    gradient
  />
</div>
```

### Content Loading
```tsx
{loading ? (
  <Skeleton type="card" />
) : (
  <PlayerCard player={player} />
)}
```

### Page Spinner
```tsx
{loading && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <Spinner size="lg" color="yellow" />
  </div>
)}
```

---

## 📦 Import Patterns

**Individual imports:**
```tsx
import { Table } from '@/components/composite/DataDisplay';
import { ProgressBar } from '@/components/composite/Progress';
```

**Group imports:**
```tsx
import {
  Table,
  DataGrid,
  List
} from '@/components/composite/DataDisplay';

import {
  ProgressBar,
  CircularProgress,
  Skeleton,
  Spinner
} from '@/components/composite/Progress';
```

**Type imports:**
```tsx
import type {
  TableProps,
  Column,
  ProgressBarProps
} from '@/components/composite/DataDisplay';
```

---

## 🎯 Performance Tips

**Table:**
- Use pagination for 100+ rows
- Enable only needed features (sorting/filtering)
- Use memoized column accessors

**DataGrid:**
- Use infinite scroll for 100+ items
- Implement item key for React optimization
- Use responsive columns

**List:**
- Use regular mode for < 50 items
- Use virtualized mode for 100+ items
- Set proper itemHeight for smooth scrolling

**Progress:**
- All components use CSS animations
- No performance overhead
- GPU accelerated

---

## 🔍 Troubleshooting

**Table not sorting:**
- Check `sortable: true` on column
- Ensure data is array of objects

**Infinite scroll not triggering:**
- Check `onLoadMore` is defined
- Ensure more data available

**Virtual list jumping:**
- Set consistent `itemHeight`
- All items must be same height

**Skeleton not animating:**
- Verify Tailwind config has shimmer animation
- Check `tailwindcss-animate` plugin installed

**Progress bar not filling:**
- Check `value` is between 0-max
- Ensure value is number, not string

---

## 📚 Related Components

**Already Built:**
- Primitives: Card, Button, Badge, Input, Typography
- Forms: Checkbox, Radio, Switch, Form
- Navigation: Tabs, Sidebar, Breadcrumbs, BottomNav
- Feedback: Modal, Toast, Tooltip, Popover, AlertDialog

**Use With:**
- Table + Modal: Row details
- DataGrid + Skeleton: Loading grid
- ProgressBar + Toast: Upload notifications
- List + Search: Filtered lists

---

## 🎓 Best Practices

1. **Loading States:** Always show skeletons, never blank screens
2. **Empty States:** Provide helpful empty state messages
3. **Performance:** Use virtualization for 100+ items
4. **Accessibility:** Components include ARIA labels
5. **Responsive:** All components work on mobile
6. **Type Safety:** Use TypeScript generics
7. **Consistency:** Use design system colors/spacing

---

**Need Help?**
- See: `/web/src/components/composite/README.md`
- Examples: `SHOWCASE_EXAMPLE.tsx` files
- Types: `types.ts` files
