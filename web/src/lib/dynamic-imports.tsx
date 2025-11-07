/**
 * Dynamic imports for heavy components
 * Improves initial page load by splitting code into smaller chunks
 */

import dynamic from 'next/dynamic';

// Chart components (loaded only when needed)
export const DynamicLineChart = dynamic(
  () => import('@/components/charts/LineChart').then((mod) => mod.LineChart),
  {
    loading: () => <div className="h-64 bg-arcane-darkBorder/30 animate-pulse rounded-lg" />,
    ssr: false,
  }
);

export const DynamicBarChart = dynamic(
  () => import('@/components/charts/BarChart').then((mod) => mod.BarChart),
  {
    loading: () => <div className="h-64 bg-arcane-darkBorder/30 animate-pulse rounded-lg" />,
    ssr: false,
  }
);

export const DynamicPieChart = dynamic(
  () => import('@/components/charts/PieChart').then((mod) => mod.PieChart),
  {
    loading: () => <div className="h-64 bg-arcane-darkBorder/30 animate-pulse rounded-lg" />,
    ssr: false,
  }
);

export const DynamicAreaChart = dynamic(
  () => import('@/components/charts/AreaChart').then((mod) => mod.AreaChart),
  {
    loading: () => <div className="h-64 bg-arcane-darkBorder/30 animate-pulse rounded-lg" />,
    ssr: false,
  }
);

// Modal components (loaded only when opened)
export const DynamicCreateMatchModal = dynamic(
  () => import('@/components/calendar/create-match-modal').then((mod) => mod.CreateMatchModal),
  {
    loading: () => null,
    ssr: false,
  }
);

export const DynamicAssignScoutModal = dynamic(
  () => import('@/components/calendar/assign-scout-modal').then((mod) => mod.AssignScoutModal),
  {
    loading: () => null,
    ssr: false,
  }
);

export const DynamicCreateReportModal = dynamic(
  () => import('@/components/reports/create-report-modal').then((mod) => mod.CreateReportModal),
  {
    loading: () => null,
    ssr: false,
  }
);

// Notification center (loaded on demand)
export const DynamicNotificationCenter = dynamic(
  () => import('@/components/notifications/NotificationCenter'),
  {
    loading: () => (
      <div className="h-10 w-10 bg-arcane-darkBorder/30 animate-pulse rounded-lg" />
    ),
    ssr: false,
  }
);

// Global search (loaded on demand)
export const DynamicGlobalSearch = dynamic(
  () => import('@/components/search/GlobalSearch'),
  {
    loading: () => (
      <div className="h-10 w-40 bg-arcane-darkBorder/30 animate-pulse rounded-lg" />
    ),
    ssr: false,
  }
);
