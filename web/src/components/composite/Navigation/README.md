# Navigation Components - Arcane Design System

Tier 2 Navigation components for the Arcane Design System web platform.

## Overview

This package contains four comprehensive navigation components:

1. **Sidebar** - Collapsible navigation with nested menus
2. **Tabs** - Horizontal/vertical tabs with content panels
3. **Breadcrumbs** - Hierarchical navigation path
4. **BottomNav** - Mobile bottom navigation bar

All components follow the Arcane design system principles with:
- Yellow accent colors (`var(--arcane-yellow)`)
- 8pt spacing grid
- Spring easing animations (`cubic-bezier(0.16, 1, 0.3, 1)`)
- Dark theme optimized
- Full accessibility support
- TypeScript types included

## Installation

```tsx
import {
  Sidebar,
  Tabs,
  Breadcrumbs,
  BottomNav,
} from "@/components/composite/Navigation";
```

## Components

---

## 1. Sidebar

A collapsible navigation sidebar with nested menu support, badge notifications, and responsive mobile overlay.

### Features

- Collapsible behavior (expand/collapse)
- Nested menu support with smooth animations
- Active state highlighting with yellow accent
- Badge notifications on menu items
- Icon + label for each item
- Mobile responsive (full overlay on mobile)
- Keyboard navigation support

### Usage

```tsx
"use client";

import { useState } from "react";
import { Sidebar, SidebarItem } from "@/components/composite/Navigation";
import { Home, FileText, Calendar, Settings, Users } from "lucide-react";
import Link from "next/link";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: SidebarItem[] = [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      id: "reports",
      icon: FileText,
      label: "Reports",
      href: "/reports",
      badge: "3",
      badgeVariant: "error",
    },
    {
      id: "calendar",
      icon: Calendar,
      label: "Calendar",
      href: "/calendar",
    },
    {
      id: "team",
      icon: Users,
      label: "Team",
      children: [
        {
          id: "team-players",
          label: "Players",
          href: "/team/players",
        },
        {
          id: "team-scouts",
          label: "Scouts",
          href: "/team/scouts",
          badge: "2",
          badgeVariant: "info",
        },
        {
          id: "team-coaches",
          label: "Coaches",
          href: "/team/coaches",
        },
      ],
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      href: "/settings",
    },
  ];

  const logo = (
    <Link href="/" className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-arcane-yellow flex items-center justify-center">
        <span className="text-arcane-black font-bold text-xl">A</span>
      </div>
      <span className="text-2xl font-bold text-white tracking-tight">ARCANE</span>
    </Link>
  );

  const footer = (
    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-arcane-gray-300 hover:text-white hover:bg-arcane-charcoal/30 transition-all">
      <LogOut className="h-5 w-5" />
      <span className="font-medium">Logout</span>
    </button>
  );

  return (
    <>
      <Sidebar
        items={navItems}
        activeId="dashboard"
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        logo={logo}
        footer={footer}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile menu trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40"
      >
        <Menu className="h-6 w-6" />
      </button>
    </>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `SidebarItem[]` | Required | Navigation items to display |
| `activeId` | `string` | - | Currently active item ID |
| `collapsed` | `boolean` | `false` | Whether sidebar is collapsed |
| `onCollapsedChange` | `(collapsed: boolean) => void` | - | Callback when collapse state changes |
| `logo` | `ReactNode` | - | Logo element |
| `footer` | `ReactNode` | - | Footer element |
| `className` | `string` | - | Additional CSS classes |
| `mobileOpen` | `boolean` | `false` | Mobile overlay mode |
| `onMobileClose` | `() => void` | - | Callback when mobile overlay closes |

---

## 2. Tabs

A flexible tabs component with horizontal/vertical orientation, icon support, and smooth content transitions.

### Features

- Horizontal tabs (default)
- Vertical tabs (variant)
- Icon support on tabs
- Badge notifications
- Active indicator with yellow underline/sideline
- Keyboard navigation (arrow keys, Home, End)
- Content panels with smooth transitions

### Usage

#### Horizontal Tabs

```tsx
import { Tabs, TabItem } from "@/components/composite/Navigation";
import { User, Settings, Bell } from "lucide-react";

export default function ProfilePage() {
  const tabs: TabItem[] = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
      content: (
        <div>
          <h2>Profile Information</h2>
          <p>Edit your profile details here.</p>
        </div>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      content: (
        <div>
          <h2>Settings</h2>
          <p>Manage your account settings.</p>
        </div>
      ),
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: "5",
      badgeVariant: "error",
      content: (
        <div>
          <h2>Notifications</h2>
          <p>You have 5 unread notifications.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <Tabs items={tabs} />
    </div>
  );
}
```

#### Vertical Tabs

```tsx
<Tabs
  items={tabs}
  orientation="vertical"
  activeId="profile"
  onActiveChange={(id) => console.log("Active tab:", id)}
/>
```

#### Simple Tabs (without content panels)

```tsx
import { SimpleTabs } from "@/components/composite/Navigation";

// When you want to control content display manually
<SimpleTabs
  items={tabs}
  activeId={activeTab}
  onActiveChange={setActiveTab}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `TabItem[]` | Required | Tab items to display |
| `activeId` | `string` | First tab | Currently active tab ID |
| `onActiveChange` | `(id: string) => void` | - | Callback when active tab changes |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Tab orientation |
| `className` | `string` | - | Additional CSS classes |
| `showContent` | `boolean` | `true` | Whether to show content panels |

---

## 3. Breadcrumbs

A hierarchical navigation component showing the current page's location within the site structure.

### Features

- Hierarchical navigation display
- Custom separator (default: chevron)
- Max items with collapse (...)
- Clickable items (except current)
- Current page highlighted
- Responsive (collapse on mobile)
- Icon support for items

### Usage

#### Default Breadcrumbs

```tsx
import { Breadcrumbs, BreadcrumbItem } from "@/components/composite/Navigation";
import { Home, Users, User } from "lucide-react";

export default function PlayerDetailPage() {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Home",
      href: "/",
      icon: Home,
    },
    {
      label: "Players",
      href: "/players",
      icon: Users,
    },
    {
      label: "John Doe",
      icon: User,
      // No href - current page
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs items={breadcrumbs} maxItems={4} />

      {/* Page content */}
    </div>
  );
}
```

#### Custom Separator

```tsx
<Breadcrumbs
  items={breadcrumbs}
  separator={<span className="text-arcane-gray-500">›</span>}
/>
```

#### Compact Breadcrumbs (Back Navigation)

```tsx
import { CompactBreadcrumbs } from "@/components/composite/Navigation";

// Shows only current page with back arrow to parent
<CompactBreadcrumbs items={breadcrumbs} />
```

#### Minimal Breadcrumbs (Text Only)

```tsx
import { MinimalBreadcrumbs } from "@/components/composite/Navigation";

// No backgrounds, minimal styling
<MinimalBreadcrumbs
  items={breadcrumbs}
  separator="/"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `BreadcrumbItem[]` | Required | Breadcrumb items |
| `separator` | `ReactNode` | Chevron | Custom separator element |
| `maxItems` | `number` | `4` | Maximum items before collapsing |
| `className` | `string` | - | Additional CSS classes |

---

## 4. BottomNav

A fixed bottom navigation component optimized for mobile devices.

### Features

- Fixed bottom navigation (mobile-first)
- Icon + label for each tab
- Badge notifications
- Active indicator with yellow accent
- Smooth transitions between tabs
- Max 5 tabs recommended
- Touch-optimized tap targets
- Haptic feedback support (on capable devices)

### Usage

#### Default BottomNav

```tsx
import { BottomNav, BottomNavItem, BottomNavSpacer } from "@/components/composite/Navigation";
import { Home, Search, Calendar, User, Settings } from "lucide-react";

export default function MobileLayout() {
  const [activeTab, setActiveTab] = useState("home");

  const navItems: BottomNavItem[] = [
    {
      id: "home",
      icon: Home,
      label: "Home",
      href: "/",
    },
    {
      id: "search",
      icon: Search,
      label: "Search",
      href: "/search",
    },
    {
      id: "calendar",
      icon: Calendar,
      label: "Calendar",
      href: "/calendar",
      badge: "3",
      badgeVariant: "warning",
    },
    {
      id: "profile",
      icon: User,
      label: "Profile",
      href: "/profile",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      href: "/settings",
    },
  ];

  return (
    <div>
      {/* Page content */}
      <main className="pb-16">
        {/* Your content here */}
      </main>

      {/* Bottom navigation */}
      <BottomNav
        items={navItems}
        activeId={activeTab}
        onActiveChange={setActiveTab}
      />

      {/* Or use the spacer component */}
      <BottomNavSpacer />
    </div>
  );
}
```

#### Floating BottomNav (Modern Variant)

```tsx
import { FloatingBottomNav } from "@/components/composite/Navigation";

// Floats above content with rounded corners and shadow
<FloatingBottomNav
  items={navItems}
  activeId={activeTab}
  onActiveChange={setActiveTab}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `BottomNavItem[]` | Required | Navigation items (max 5 recommended) |
| `activeId` | `string` | First item | Currently active item ID |
| `onActiveChange` | `(id: string) => void` | - | Callback when active item changes |
| `className` | `string` | - | Additional CSS classes |

---

## TypeScript Types

All components are fully typed. Import types as needed:

```tsx
import type {
  SidebarItem,
  SidebarProps,
  TabItem,
  TabsProps,
  BreadcrumbItem,
  BreadcrumbsProps,
  BottomNavItem,
  BottomNavProps,
  BadgeVariant,
} from "@/components/composite/Navigation";
```

---

## Design Tokens Used

All components use the Arcane Design System tokens:

### Colors
- `--arcane-yellow` - Primary accent (active states)
- `--arcane-yellow-glow` - Glow effects
- `--arcane-black` - Background
- `--arcane-charcoal` - Card backgrounds
- `--arcane-slate` - Borders
- `--arcane-gray-*` - Text colors

### Spacing
- 8pt grid system (`--space-*`)

### Animations
- Spring easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Duration: `--duration-normal` (250ms)

### Typography
- Font families: `--font-display`, `--font-sans`, `--font-body`
- Font weights: `--font-medium`, `--font-semibold`, `--font-bold`

---

## Accessibility

All components follow WCAG 2.1 AA standards:

- ✅ Keyboard navigation support
- ✅ ARIA labels and roles
- ✅ Focus indicators
- ✅ Screen reader support
- ✅ Reduced motion support
- ✅ Color contrast (yellow on dark: 8.5:1 ratio)

### Keyboard Shortcuts

**Tabs:**
- `Arrow Left/Right` or `Arrow Up/Down` - Navigate between tabs
- `Home` - First tab
- `End` - Last tab

**Sidebar:**
- `Tab` - Navigate items
- `Enter` / `Space` - Activate item
- `Arrow Down` - Expand nested menu
- `Arrow Up` - Collapse nested menu

---

## Best Practices

### Sidebar
- Use icons for better visual hierarchy
- Limit nesting to 2 levels
- Group related items together
- Provide clear labels

### Tabs
- Keep tab labels short (1-2 words)
- Limit to 5-7 tabs for horizontal
- Use vertical tabs for more items
- Provide icons for better recognition

### Breadcrumbs
- Always include Home as first item
- Keep labels concise
- Don't exceed 5 levels deep
- Last item should be current page (no link)

### BottomNav
- **Maximum 5 items** for optimal UX
- Use clear, recognizable icons
- Keep labels to 1 word if possible
- Reserve for primary navigation only
- Don't combine with tab bars

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- CSS Grid
- CSS Custom Properties
- Framer Motion (for animations)

---

## Examples

See the `examples/` directory for complete working examples:
- Full application layout with Sidebar
- Dashboard with Tabs
- Multi-level navigation with Breadcrumbs
- Mobile app with BottomNav

---

## License

Part of the Arcane Design System - Internal use only
