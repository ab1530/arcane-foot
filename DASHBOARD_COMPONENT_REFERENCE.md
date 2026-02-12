# Dashboard Component Reference Guide

Quick reference for using the new dashboard components.

---

## DashboardHeader

**Import:**
```tsx
import { DashboardHeader } from '@/components/layout/DashboardHeader';
```

**Basic Usage:**
```tsx
<DashboardHeader
  title="Dashboard"
  subtitle="Welcome to your command center"
  userName="Scout Master"
  userEmail="scout@arcane.football"
  subscriptionTier="PRO"
  notificationCount={3}
  onSearchChange={(value) => console.log(value)}
  onSearchSubmit={(value) => console.log(value)}
  onNotificationClick={() => console.log('notifications')}
  onSettingsClick={() => router.push('/settings')}
  onLogout={() => console.log('logout')}
/>
```

**Props:**
```typescript
interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  subscriptionTier?: 'FREE' | 'BASIC' | 'PRO' | 'GOLD';
  notificationCount?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
  className?: string;
}
```

---

## StatCard

**Import:**
```tsx
import { StatCard } from '@/components/dashboard/StatCard';
```

**Basic Usage:**
```tsx
<StatCard
  label="Total Reports"
  value={42}
  icon={FileText}
  trend="+12%"
  trendDirection="up"
  comparison="vs last month"
  accentColor="purple"
  loading={false}
  onClick={() => router.push('/reports')}
/>
```

**Props:**
```typescript
interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  comparison?: string;
  accentColor?: 'blue' | 'purple' | 'yellow' | 'green' | 'red';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}
```

**Accent Colors:**
- `blue` - Blue 400 (#60A5FA)
- `purple` - Purple 400 (#A78BFA)
- `yellow` - Arcane Yellow (#E4FF3B)
- `green` - Green 400 (#4ADE80)
- `red` - Red 400 (#F87171)

---

## Dashboard Page Layout

**Import:**
```tsx
import { Sidebar } from '@/components/composite/Navigation/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { ArcaneCard } from '@/components/primitives/Card/ArcaneCard';
import { CardHeader } from '@/components/primitives/Card/CardHeader';
import { CardContent } from '@/components/primitives/Card/CardContent';
import { ArcaneButton } from '@/components/primitives/Button/ArcaneButton';
import { List } from '@/components/composite/DataDisplay/List';
import { Skeleton } from '@/components/composite/Progress/Skeleton';
```

**Layout Structure:**
```tsx
<div className="min-h-screen bg-arcane-black">
  {/* Sidebar */}
  <Sidebar
    items={sidebarItems}
    activeId="dashboard"
    collapsed={sidebarCollapsed}
    onCollapsedChange={setSidebarCollapsed}
  />

  {/* Main Content */}
  <div className={cn(
    "transition-all duration-300",
    sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
  )}>
    {/* Header */}
    <DashboardHeader {...headerProps} />

    {/* Content */}
    <main className="container mx-auto px-4 py-8 space-y-8">
      {/* Stats Grid */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard {...statProps} />
        </div>
      </section>

      {/* Quick Actions & AI Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <ArcaneCard variant="standard">
            <CardHeader>Quick Actions</CardHeader>
            <CardContent>
              <ArcaneButton variant="primary">Action</ArcaneButton>
            </CardContent>
          </ArcaneCard>
        </div>

        {/* AI Insights */}
        <div className="lg:col-span-2">
          <ArcaneCard variant="feature">
            <CardHeader>AI Insights</CardHeader>
            <CardContent>
              {/* Content */}
            </CardContent>
          </ArcaneCard>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <ArcaneCard variant="standard">
          <CardHeader>Recent Activity</CardHeader>
          <CardContent>
            <List
              data={activities}
              renderItem={renderActivityItem}
              spacing="sm"
            />
          </CardContent>
        </ArcaneCard>
      </section>
    </main>
  </div>
</div>
```

---

## Common Patterns

### Loading States

```tsx
{loading ? (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} type="custom" height="64px" />
    ))}
  </div>
) : (
  <List data={data} renderItem={renderItem} />
)}
```

### Stat Card Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard {...props1} />
  <StatCard {...props2} />
  <StatCard {...props3} />
  <StatCard {...props4} />
</div>
```

### Section with Header

```tsx
<ArcaneCard variant="standard">
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-arcane-yellow" />
        <Heading level={4} className="text-xl">
          Section Title
        </Heading>
      </div>
      <ArcaneButton variant="ghost" size="sm">
        View All
      </ArcaneButton>
    </div>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</ArcaneCard>
```

### Feature Card with Badge

```tsx
<ArcaneCard variant="feature">
  <CardHeader>
    <div className="flex items-center justify-between">
      <Heading level={4}>Feature Title</Heading>
      <Badge variant="premium" size="sm" icon={<Sparkles />}>
        PREMIUM
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</ArcaneCard>
```

---

## Responsive Breakpoints

```css
sm: 640px   /* Tablet */
md: 768px   /* Desktop */
lg: 1024px  /* Large Desktop */
xl: 1280px  /* Extra Large */
```

**Common Patterns:**
```tsx
// 1 column → 2 columns → 4 columns
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4

// 1 column → 3 columns split (1 + 2)
grid-cols-1 lg:grid-cols-3
lg:col-span-1  // Takes 1/3
lg:col-span-2  // Takes 2/3

// Stack → Row
flex-col lg:flex-row

// Full width → Sidebar offset
transition-all duration-300
lg:ml-20  // Collapsed sidebar
lg:ml-64  // Expanded sidebar
```

---

## Color Palette Quick Reference

```tsx
// Backgrounds
bg-arcane-black      // #0A0A0A
bg-arcane-anthracite // #1B1B1F
bg-arcane-charcoal   // #27272A

// Borders
border-arcane-slate  // #3F3F46

// Text
text-arcane-gray-200 // #E4E4E7
text-arcane-gray-300 // #D4D4D8
text-arcane-gray-400 // #A1A1AA

// Accent
text-arcane-yellow   // #E4FF3B
bg-arcane-yellow     // #E4FF3B

// Semantic
text-success         // #10B981
text-warning         // #F59E0B
text-error           // #EF4444
text-info            // #3B82F6
```

---

## Animation Utilities

```tsx
// Spring easing
transition-all duration-300
style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}

// Hover effects
hover:border-arcane-yellow/20
hover:shadow-xl
hover:-translate-y-0.5
hover:scale-110

// Focus states
focus-visible:ring-2
focus-visible:ring-arcane-yellow
focus-visible:ring-offset-2

// Loading shimmer
animate-shimmer
```

---

## Icons (Lucide React)

```tsx
import {
  FileText,        // Reports
  Users,           // Players
  Trophy,          // XP/Camps
  Activity,        // Matches
  Brain,           // AI
  Zap,             // Actions
  Target,          // Goals
  BarChart3,       // Analytics
  Search,          // Search
  Bell,            // Notifications
  User,            // Profile
  Settings,        // Settings
  LogOut,          // Logout
  Plus,            // Add
  ArrowRight,      // Navigation
  Clock,           // Time
  CheckCircle,     // Success
  AlertCircle,     // Warning
  TrendingUp,      // Positive trend
  TrendingDown,    // Negative trend
  Minus,           // Neutral
  Sparkles,        // Premium/AI
  Crown,           // Subscription
} from 'lucide-react';
```

---

## TypeScript Types

```typescript
// Dashboard Stats
interface DashboardStats {
  totalPlayers: number;
  totalReports: number;
  totalCamps: number;
  activeCamps: number;
  upcomingMatches: number;
  pendingReports: number;
  totalXP: number;
  currentLevel: number;
}

// Recent Activity
interface RecentActivity {
  id: string;
  type: 'player' | 'report' | 'camp' | 'match';
  title: string;
  description: string;
  timestamp: string;
  icon: LucideIcon;
}

// Sidebar Item
interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  badge?: string | number;
  badgeVariant?: 'success' | 'warning' | 'error' | 'info' | 'premium';
  children?: SidebarItem[];
  disabled?: boolean;
  onClick?: () => void;
}
```

---

## Best Practices

### 1. Always Use Loading States
```tsx
{loading ? <Skeleton type="custom" height="64px" /> : <Content />}
```

### 2. Handle Empty States
```tsx
{data.length === 0 ? (
  <div className="text-center py-12">
    <Icon className="h-12 w-12 mx-auto mb-3 opacity-50" />
    <Text color="secondary">No data available</Text>
  </div>
) : (
  <List data={data} />
)}
```

### 3. Implement Error Handling
```tsx
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  console.error('Failed to fetch data:', error);
  toast.error('Failed to load data');
  setData(mockData); // Fallback
}
```

### 4. Use Proper Accessibility
```tsx
<button
  onClick={handleClick}
  aria-label="Descriptive label"
  aria-expanded={isOpen}
>
  <Icon />
</button>
```

### 5. Maintain Responsive Design
```tsx
// Always test: mobile → tablet → desktop
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```

---

## Quick Start Checklist

- [ ] Import required components
- [ ] Set up state management (useState)
- [ ] Implement data fetching (useEffect)
- [ ] Add loading states (Skeleton)
- [ ] Handle empty states
- [ ] Add error handling
- [ ] Test responsive design
- [ ] Verify accessibility
- [ ] Check TypeScript types
- [ ] Review design system adherence

---

**Reference Version:** 1.0
**Last Updated:** November 11, 2025
**Compatible With:** Arcane Design System 2.0
