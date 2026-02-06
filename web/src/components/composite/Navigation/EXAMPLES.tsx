/**
 * Navigation Components - Complete Usage Examples
 * Arcane Design System
 *
 * This file contains complete working examples for all Navigation components.
 */

"use client";

import { useState } from "react";
import {
  Sidebar,
  Tabs,
  Breadcrumbs,
  BottomNav,
  BottomNavSpacer,
  FloatingBottomNav,
  SimpleTabs,
  CompactBreadcrumbs,
  MinimalBreadcrumbs,
} from "./index";
import type {
  SidebarItem,
  TabItem,
  BreadcrumbItem,
  BottomNavItem,
} from "./index";
import {
  Home,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  Trophy,
  Bell,
  Settings,
  LogOut,
  User,
  Search,
  Mail,
  Phone,
  MapPin,
  Shield,
  Activity,
  BarChart,
} from "lucide-react";
import Link from "next/link";

// ==============================================
// EXAMPLE 1: Complete Dashboard Layout
// ==============================================

export function DashboardLayoutExample() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarItems: SidebarItem[] = [
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
      id: "analytics",
      icon: TrendingUp,
      label: "Analytics",
      children: [
        {
          id: "analytics-overview",
          label: "Overview",
          href: "/analytics/overview",
        },
        {
          id: "analytics-performance",
          label: "Performance",
          href: "/analytics/performance",
          badge: "New",
          badgeVariant: "success",
        },
        {
          id: "analytics-reports",
          label: "Reports",
          href: "/analytics/reports",
        },
      ],
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
        },
        {
          id: "team-coaches",
          label: "Coaches",
          href: "/team/coaches",
        },
      ],
    },
    {
      id: "achievements",
      icon: Trophy,
      label: "Achievements",
      href: "/achievements",
    },
    {
      id: "notifications",
      icon: Bell,
      label: "Notifications",
      href: "/notifications",
      badge: "5",
      badgeVariant: "warning",
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
      {!collapsed && (
        <span className="text-2xl font-bold text-white tracking-tight">ARCANE</span>
      )}
    </Link>
  );

  const footer = (
    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-arcane-gray-300 hover:text-white hover:bg-arcane-charcoal/30 transition-all">
      <LogOut className="h-5 w-5" />
      {!collapsed && <span className="font-medium">Logout</span>}
    </button>
  );

  return (
    <>
      <Sidebar
        items={sidebarItems}
        activeId="dashboard"
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        logo={logo}
        footer={footer}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div className={`transition-all duration-300 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        {/* Your page content */}
      </div>
    </>
  );
}

// ==============================================
// EXAMPLE 2: Profile Page with Tabs
// ==============================================

export function ProfilePageExample() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs: TabItem[] = [
    {
      id: "overview",
      label: "Overview",
      icon: User,
      content: (
        <div className="p-6 bg-arcane-charcoal rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Profile Overview</h2>
          <p className="text-arcane-gray-300">View and edit your profile information.</p>
          {/* Profile content */}
        </div>
      ),
    },
    {
      id: "activity",
      label: "Activity",
      icon: Activity,
      badge: "12",
      badgeVariant: "info",
      content: (
        <div className="p-6 bg-arcane-charcoal rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
          <p className="text-arcane-gray-300">View your recent activity and interactions.</p>
          {/* Activity content */}
        </div>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      content: (
        <div className="p-6 bg-arcane-charcoal rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Account Settings</h2>
          <p className="text-arcane-gray-300">Manage your account preferences and settings.</p>
          {/* Settings content */}
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
        <div className="p-6 bg-arcane-charcoal rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Notifications</h2>
          <p className="text-arcane-gray-300">Manage your notification preferences.</p>
          {/* Notifications content */}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <Tabs
        items={tabs}
        activeId={activeTab}
        onActiveChange={setActiveTab}
      />
    </div>
  );
}

// ==============================================
// EXAMPLE 3: Vertical Tabs Sidebar
// ==============================================

export function VerticalTabsExample() {
  const verticalTabs: TabItem[] = [
    {
      id: "general",
      label: "General",
      icon: Settings,
      content: <div className="p-6">General settings content</div>,
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      content: <div className="p-6">Security settings content</div>,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: "3",
      content: <div className="p-6">Notification settings content</div>,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart,
      content: <div className="p-6">Analytics settings content</div>,
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
      <Tabs items={verticalTabs} orientation="vertical" />
    </div>
  );
}

// ==============================================
// EXAMPLE 4: Breadcrumbs Navigation
// ==============================================

export function BreadcrumbsExample() {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Home",
      href: "/",
      icon: Home,
    },
    {
      label: "Team",
      href: "/team",
      icon: Users,
    },
    {
      label: "Players",
      href: "/team/players",
    },
    {
      label: "John Doe",
      icon: User,
      // Current page - no href
    },
  ];

  return (
    <div className="container mx-auto p-6">
      {/* Default breadcrumbs */}
      <Breadcrumbs items={breadcrumbs} maxItems={4} />

      {/* Compact variant */}
      <div className="mt-6">
        <CompactBreadcrumbs items={breadcrumbs} />
      </div>

      {/* Minimal variant */}
      <div className="mt-6">
        <MinimalBreadcrumbs items={breadcrumbs} separator="/" />
      </div>
    </div>
  );
}

// ==============================================
// EXAMPLE 5: Long Breadcrumbs with Collapse
// ==============================================

export function LongBreadcrumbsExample() {
  const longBreadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/", icon: Home },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Analytics", href: "/analytics" },
    { label: "Reports", href: "/analytics/reports" },
    { label: "Performance", href: "/analytics/reports/performance" },
    { label: "Player Stats", href: "/analytics/reports/performance/players" },
    { label: "John Doe" }, // Current page
  ];

  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs items={longBreadcrumbs} maxItems={4} />
    </div>
  );
}

// ==============================================
// EXAMPLE 6: Mobile Bottom Navigation
// ==============================================

export function MobileLayoutExample() {
  const [activeTab, setActiveTab] = useState("home");

  const bottomNavItems: BottomNavItem[] = [
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
      id: "notifications",
      icon: Bell,
      label: "Alerts",
      href: "/notifications",
      badge: "5",
      badgeVariant: "error",
    },
    {
      id: "profile",
      icon: User,
      label: "Profile",
      href: "/profile",
    },
  ];

  return (
    <div>
      {/* Main content */}
      <main className="min-h-screen pb-20 lg:pb-0">
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold text-white">Mobile Layout Example</h1>
          <p className="text-arcane-gray-300 mt-2">
            View this on mobile to see the bottom navigation.
          </p>
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav
        items={bottomNavItems}
        activeId={activeTab}
        onActiveChange={setActiveTab}
      />

      {/* Alternative: Floating variant */}
      {/* <FloatingBottomNav
        items={bottomNavItems}
        activeId={activeTab}
        onActiveChange={setActiveTab}
      /> */}
    </div>
  );
}

// ==============================================
// EXAMPLE 7: Combined Layout (Desktop + Mobile)
// ==============================================

export function CompleteAppLayoutExample() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState("home");
  const [activePageTab, setActivePageTab] = useState("overview");

  // Sidebar items
  const sidebarItems: SidebarItem[] = [
    { id: "dashboard", icon: Home, label: "Dashboard", href: "/" },
    { id: "reports", icon: FileText, label: "Reports", href: "/reports", badge: "3" },
    { id: "calendar", icon: Calendar, label: "Calendar", href: "/calendar" },
    { id: "analytics", icon: TrendingUp, label: "Analytics", href: "/analytics" },
    { id: "settings", icon: Settings, label: "Settings", href: "/settings" },
  ];

  // Bottom nav items (mobile)
  const bottomNavItems: BottomNavItem[] = [
    { id: "home", icon: Home, label: "Home", href: "/" },
    { id: "reports", icon: FileText, label: "Reports", href: "/reports", badge: "3" },
    { id: "calendar", icon: Calendar, label: "Calendar", href: "/calendar" },
    { id: "profile", icon: User, label: "Profile", href: "/profile" },
  ];

  // Page tabs
  const pageTabs: TabItem[] = [
    {
      id: "overview",
      label: "Overview",
      icon: Activity,
      content: <div className="p-6">Overview content</div>,
    },
    {
      id: "stats",
      label: "Statistics",
      icon: BarChart,
      content: <div className="p-6">Statistics content</div>,
    },
    {
      id: "messages",
      label: "Messages",
      icon: Mail,
      badge: "2",
      content: <div className="p-6">Messages content</div>,
    },
  ];

  // Breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/", icon: Home },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Overview" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <Sidebar
        items={sidebarItems}
        activeId="dashboard"
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        logo={
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-arcane-yellow flex items-center justify-center">
              <span className="text-arcane-black font-bold text-xl">A</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-2xl font-bold text-white">ARCANE</span>
            )}
          </Link>
        }
      />

      {/* Main content area */}
      <div
        className={`min-h-screen transition-all duration-300 pb-20 lg:pb-0 ${
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <div className="container mx-auto p-6">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbs} className="mb-6" />

          {/* Page title */}
          <h1 className="text-4xl font-bold text-white mb-8">Dashboard Overview</h1>

          {/* Page tabs */}
          <Tabs
            items={pageTabs}
            activeId={activePageTab}
            onActiveChange={setActivePageTab}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        items={bottomNavItems}
        activeId={activeBottomTab}
        onActiveChange={setActiveBottomTab}
      />
    </>
  );
}

// ==============================================
// EXAMPLE 8: Simple Tabs (Manual Content Control)
// ==============================================

export function SimpleTabsExample() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs: TabItem[] = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
      content: <></>, // Not used with SimpleTabs
    },
    {
      id: "contacts",
      label: "Contacts",
      icon: Users,
      badge: "10",
      content: <></>,
    },
    {
      id: "messages",
      label: "Messages",
      icon: Mail,
      badge: "3",
      badgeVariant: "error",
      content: <></>,
    },
  ];

  return (
    <div className="container mx-auto p-6">
      {/* Tabs without content panels */}
      <SimpleTabs
        items={tabs}
        activeId={activeTab}
        onActiveChange={setActiveTab}
      />

      {/* Manually controlled content */}
      <div className="mt-6 p-6 bg-arcane-charcoal rounded-lg">
        {activeTab === "profile" && <div>Profile Content</div>}
        {activeTab === "contacts" && <div>Contacts Content</div>}
        {activeTab === "messages" && <div>Messages Content</div>}
      </div>
    </div>
  );
}

// ==============================================
// Export all examples
// ==============================================

export default {
  DashboardLayoutExample,
  ProfilePageExample,
  VerticalTabsExample,
  BreadcrumbsExample,
  LongBreadcrumbsExample,
  MobileLayoutExample,
  CompleteAppLayoutExample,
  SimpleTabsExample,
};
