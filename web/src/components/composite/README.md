# Tier 2 Composite Components

Arcane Design System - Data Display and Progress Components

## Overview

This directory contains Tier 2 composite components built on top of the primitives. These components provide advanced functionality for displaying data and showing loading states.

## Components

### DataDisplay Components

#### 1. Table
Advanced data table with sorting, filtering, pagination, and row selection.

**Features:**
- Click column headers to sort (ascending → descending → no sort)
- Filter columns with text input
- Pagination controls (10, 25, 50, 100 rows per page)
- Row selection with checkboxes
- Sticky header on scroll
- Loading skeleton state
- Empty state with custom message
- Responsive (horizontal scroll on mobile)
- TypeScript generic types for type-safe data

**Usage:**
```tsx
import { Table } from '@/components/composite/DataDisplay';

interface Player {
  name: string;
  position: string;
  rating: number;
}

<Table<Player>
  data={players}
  columns={[
    { id: 'name', header: 'Player Name', sortable: true, filterable: true },
    { id: 'position', header: 'Position', filterable: true, align: 'center' },
    {
      id: 'rating',
      header: 'Rating',
      sortable: true,
      align: 'center',
      accessor: (player) => <span className="text-arcane-yellow">{player.rating}</span>
    },
  ]}
  selectable
  pagination
  defaultPageSize={25}
  stickyHeader
  onRowClick={(player) => console.log(player)}
  onSelectionChange={(selected) => console.log(selected)}
/>
```

**Performance:**
- Uses `useMemo` for sorting and filtering
- Efficient pagination (only renders visible rows)
- Optimized re-renders with proper state management

---

#### 2. DataGrid
Responsive grid layout for displaying data items as cards.

**Features:**
- Responsive columns (1-4, auto-adjusts to screen size)
- Custom item renderer
- Loading state with skeletons
- Empty state
- Infinite scroll support
- Configurable gap spacing
- TypeScript generic types

**Usage:**
```tsx
import { DataGrid } from '@/components/composite/DataDisplay';

<DataGrid
  data={players}
  columns={3}
  gap="lg"
  renderItem={(player) => (
    <PlayerCard player={player} />
  )}
  infiniteScroll
  onLoadMore={loadMorePlayers}
/>
```

**Performance:**
- Intersection Observer for infinite scroll
- Efficient re-renders with useCallback
- Lazy loading support

---

#### 3. List
Vertical list layout with optional virtual scrolling for long lists.

**Features:**
- Vertical list layout
- Optional dividers between items
- Custom spacing (sm, md, lg)
- Virtual scrolling for performance with 1000+ items
- Empty state
- Loading state
- TypeScript generic types

**Usage:**
```tsx
import { List } from '@/components/composite/DataDisplay';

// Regular list
<List
  data={players}
  dividers
  spacing="md"
  renderItem={(player) => <PlayerListItem player={player} />}
/>

// Virtual scrolling for long lists
<List
  data={players}
  virtualized
  itemHeight={80}
  containerHeight={600}
  renderItem={(player) => <PlayerListItem player={player} />}
/>
```

**Performance:**
- Virtual scrolling renders only visible items
- Smooth 60fps scrolling
- Buffer for smooth scrolling experience

---

### Progress Components

#### 4. ProgressBar
Linear progress bar with animations and gradient support.

**Features:**
- Animated progress filling
- Optional label and percentage display
- Gradient support (yellow → green)
- Indeterminate state for unknown progress
- Three sizes: sm, md, lg
- Smooth 500ms transition

**Usage:**
```tsx
import { ProgressBar } from '@/components/composite/Progress';

// Determinate progress
<ProgressBar
  value={75}
  label="Upload Progress"
  showPercentage
  gradient
  size="md"
/>

// Indeterminate loading
<ProgressBar
  indeterminate
  label="Processing..."
/>
```

**Performance:**
- CSS transitions (GPU accelerated)
- No JavaScript animations
- 60fps smooth progress

---

#### 5. CircularProgress
Circular progress indicator with gradient stroke.

**Features:**
- Circular SVG progress
- Sizes: sm (48px), md (64px), lg (96px), xl (128px)
- Gradient stroke (yellow → green)
- Center label showing percentage
- Animated stroke drawing
- Indeterminate spinning state
- Adjustable thickness

**Usage:**
```tsx
import { CircularProgress } from '@/components/composite/Progress';

// Determinate progress
<CircularProgress
  value={75}
  size="lg"
  showLabel
  gradient
  thickness={8}
/>

// Indeterminate loading
<CircularProgress
  indeterminate
  size="md"
/>
```

**Performance:**
- SVG rendering (hardware accelerated)
- CSS transitions for smooth animation
- Minimal DOM updates

---

#### 6. Skeleton
Loading placeholder with shimmer animation.

**Features:**
- Multiple types: text, card, avatar, custom
- Shimmer animation (2s infinite)
- Multiple lines for text skeleton
- Custom shapes and sizes
- Configurable border radius

**Usage:**
```tsx
import { Skeleton } from '@/components/composite/Progress';

// Text skeleton
<Skeleton type="text" lines={3} />

// Card skeleton
<Skeleton type="card" />

// Avatar skeleton
<Skeleton type="avatar" width="64px" height="64px" />

// Custom skeleton
<Skeleton
  type="custom"
  width="200px"
  height="100px"
  rounded="lg"
/>
```

**Performance:**
- CSS animations (GPU accelerated)
- Minimal DOM elements
- Efficient shimmer effect

---

#### 7. Spinner
Simple loading spinner with smooth rotation.

**Features:**
- Three sizes: sm, md, lg
- Color variations: yellow, white, gray
- Smooth rotation animation
- Optional centered in container
- Accessible with ARIA labels

**Usage:**
```tsx
import { Spinner } from '@/components/composite/Progress';

// Default spinner
<Spinner />

// Centered spinner
<Spinner size="lg" centered />

// Custom color
<Spinner color="white" size="md" />
```

**Performance:**
- CSS animation (GPU accelerated)
- Single DOM element
- Negligible performance impact

---

## Design System Integration

All components follow the Arcane Design System 2.0:

**Colors:**
- Primary: `#E4FF3B` (Arcane Yellow)
- Background: `#0A0A0A` (Arcane Black)
- Surface: `#27272A` (Arcane Charcoal)
- Border: `#3F3F46` (Arcane Slate)
- Success: `#10B981` (Green)

**Typography:**
- Font families from theme (Poppins, Inter, Manrope)
- Consistent sizing and spacing

**Animations:**
- Spring easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Normal duration: 250ms
- Slow duration: 500ms
- Smooth 60fps animations

**Accessibility:**
- ARIA labels and live regions
- Keyboard navigation support
- Screen reader friendly
- Semantic HTML

---

## File Structure

```
composite/
├── DataDisplay/
│   ├── Table.tsx
│   ├── DataGrid.tsx
│   ├── List.tsx
│   ├── types.ts
│   ├── index.ts
│   └── SHOWCASE_EXAMPLE.tsx
├── Progress/
│   ├── ProgressBar.tsx
│   ├── CircularProgress.tsx
│   ├── Skeleton.tsx
│   ├── Spinner.tsx
│   ├── types.ts
│   ├── index.ts
│   └── SHOWCASE_EXAMPLE.tsx
└── README.md
```

---

## TypeScript Support

All components are fully typed with TypeScript generics:

```tsx
// Generic Table
<Table<PlayerType> data={players} columns={...} />

// Generic DataGrid
<DataGrid<PlayerType> data={players} renderItem={...} />

// Generic List
<List<PlayerType> data={players} renderItem={...} />
```

Type inference works automatically:
```tsx
const players: Player[] = [...];

<Table
  data={players}
  columns={[
    { id: 'name', header: 'Name' } // TypeScript knows 'name' is valid
  ]}
/>
```

---

## Performance Notes

### DataDisplay Components

**Table:**
- Sorting: O(n log n) - uses native Array.sort()
- Filtering: O(n) - single pass through data
- Pagination: O(1) - array slicing
- Renders: Only visible rows (10-100 based on page size)
- Recommended max: 10,000 rows with pagination

**DataGrid:**
- Renders: All items (use pagination/infinite scroll for large datasets)
- Intersection Observer: 100px threshold for infinite scroll
- Recommended max: 100 items without infinite scroll

**List:**
- Regular mode: Renders all items
- Virtual mode: Renders only visible items + buffer (6 extra)
- Recommended max regular: 50 items
- Recommended max virtual: 10,000+ items

### Progress Components

All progress components use:
- CSS animations (GPU accelerated)
- No JavaScript animation loops
- Minimal re-renders
- 60fps smooth performance

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Features used:
- CSS Grid (all components)
- Intersection Observer (DataGrid infinite scroll)
- CSS Animations (all progress components)
- CSS Transitions (all components)

---

## Examples

See showcase files:
- `/DataDisplay/SHOWCASE_EXAMPLE.tsx`
- `/Progress/SHOWCASE_EXAMPLE.tsx`

---

## Tailwind Configuration

The shimmer animation requires this Tailwind config:

```ts
// tailwind.config.ts
animation: {
  shimmer: 'shimmer 2s infinite',
},
keyframes: {
  shimmer: {
    '100%': {
      transform: 'translateX(100%)',
    },
  },
}
```

This has been added to the project's Tailwind configuration.

---

## Future Enhancements

Potential improvements:
- Table: Column resizing, row reordering
- DataGrid: Masonry layout option
- List: Drag-and-drop reordering
- Progress: More gradient options
- All: Additional animation variants

---

## Support

For issues or questions:
1. Check the showcase examples
2. Review type definitions in `types.ts`
3. Refer to this documentation
4. Check component source code (heavily commented)
