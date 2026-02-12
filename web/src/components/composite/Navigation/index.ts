/**
 * Navigation Components - Arcane Design System
 * Tier 2 Navigation components for web application
 *
 * @module Navigation
 */

// Sidebar
export { Sidebar } from "./Sidebar";
export { default as SidebarDefault } from "./Sidebar";

// Tabs
export { Tabs, SimpleTabs } from "./Tabs";
export { default as TabsDefault } from "./Tabs";

// Breadcrumbs
export { Breadcrumbs, CompactBreadcrumbs, MinimalBreadcrumbs } from "./Breadcrumbs";
export { default as BreadcrumbsDefault } from "./Breadcrumbs";

// BottomNav
export {
  BottomNav,
  BottomNavSpacer,
  FloatingBottomNav,
} from "./BottomNav";
export { default as BottomNavDefault } from "./BottomNav";

// Types
export type {
  // Sidebar types
  SidebarItem,
  SidebarProps,

  // Tabs types
  TabItem,
  TabsProps,

  // Breadcrumbs types
  BreadcrumbItem,
  BreadcrumbsProps,

  // BottomNav types
  BottomNavItem,
  BottomNavProps,

  // Shared types
  BadgeVariant,
  NavigationTheme,
} from "./types";
