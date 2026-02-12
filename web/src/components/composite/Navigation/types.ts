/**
 * Navigation Component Types - Arcane Design System
 * Type definitions for Tier 2 Navigation components
 */

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

// ============================================
// SIDEBAR TYPES
// ============================================

export interface SidebarItem {
  /** Unique identifier for the menu item */
  id: string;
  /** Icon component from lucide-react */
  icon?: LucideIcon;
  /** Display label */
  label: string;
  /** Navigation URL */
  href?: string;
  /** Notification badge text */
  badge?: string | number;
  /** Badge color variant */
  badgeVariant?: "default" | "success" | "warning" | "error" | "info";
  /** Nested sub-items */
  children?: SidebarItem[];
  /** Click handler (if not using href) */
  onClick?: () => void;
  /** Whether the item is disabled */
  disabled?: boolean;
}

export interface SidebarProps {
  /** Navigation items to display */
  items: SidebarItem[];
  /** Currently active item ID */
  activeId?: string;
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Logo element */
  logo?: ReactNode;
  /** Footer element */
  footer?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Mobile overlay mode */
  mobileOpen?: boolean;
  /** Callback when mobile overlay closes */
  onMobileClose?: () => void;
}

// ============================================
// TABS TYPES
// ============================================

export interface TabItem {
  /** Unique identifier for the tab */
  id: string;
  /** Tab label */
  label: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Optional badge */
  badge?: string | number;
  /** Badge color variant */
  badgeVariant?: "default" | "success" | "warning" | "error" | "info";
  /** Tab content */
  content: ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
}

export interface TabsProps {
  /** Tab items to display */
  items: TabItem[];
  /** Currently active tab ID */
  activeId?: string;
  /** Callback when active tab changes */
  onActiveChange?: (id: string) => void;
  /** Orientation: horizontal or vertical */
  orientation?: "horizontal" | "vertical";
  /** Additional CSS classes */
  className?: string;
  /** Whether to show content panels */
  showContent?: boolean;
}

// ============================================
// BREADCRUMBS TYPES
// ============================================

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Navigation URL (omit for current page) */
  href?: string;
  /** Optional icon */
  icon?: LucideIcon;
}

export interface BreadcrumbsProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Custom separator (default: slash) */
  separator?: ReactNode;
  /** Maximum items to show before collapsing */
  maxItems?: number;
  /** Additional CSS classes */
  className?: string;
}

// ============================================
// BOTTOM NAV TYPES
// ============================================

export interface BottomNavItem {
  /** Unique identifier */
  id: string;
  /** Icon component */
  icon: LucideIcon;
  /** Display label */
  label: string;
  /** Navigation URL */
  href?: string;
  /** Notification badge */
  badge?: string | number;
  /** Badge color variant */
  badgeVariant?: "default" | "success" | "warning" | "error" | "info";
  /** Click handler (if not using href) */
  onClick?: () => void;
  /** Whether the item is disabled */
  disabled?: boolean;
}

export interface BottomNavProps {
  /** Navigation items (max 5 recommended) */
  items: BottomNavItem[];
  /** Currently active item ID */
  activeId?: string;
  /** Callback when active item changes */
  onActiveChange?: (id: string) => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================
// SHARED TYPES
// ============================================

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

export interface NavigationTheme {
  /** Primary accent color */
  accent: string;
  /** Background color */
  background: string;
  /** Border color */
  border: string;
  /** Text color */
  text: string;
  /** Active state color */
  active: string;
}
