"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Users,
  Trophy,
  TrendingUp,
  Plus,
  Search as SearchIcon,
  BarChart3,
  Brain,
  Zap,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Activity,
} from "lucide-react";

// Arcane Design System Components
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/composite/Navigation/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { ArcaneCard } from "@/components/primitives/Card/ArcaneCard";
import { CardHeader } from "@/components/primitives/Card/CardHeader";
import { CardContent } from "@/components/primitives/Card/CardContent";
import { ArcaneButton } from "@/components/primitives/Button/ArcaneButton";
import { Heading } from "@/components/primitives/Typography/Heading";
import { Text } from "@/components/primitives/Typography/Text";
import { Badge } from "@/components/primitives/Badge/Badge";
import { List } from "@/components/composite/DataDisplay/List";
import { Skeleton } from "@/components/composite/Progress/Skeleton";
import { useLanguage } from "@/contexts/language-context";
import { ProtectedPage } from "@/components/guards/ProtectedPage";

// Hooks and Utils
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDashboardStats } from "@/hooks/useData";

// Types
interface RecentActivity {
  id: string;
  type: "player" | "report" | "camp" | "match";
  title: string;
  description: string;
  timestamp: string;
  icon: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const { subscription, getTierName, hasMinimumTier } = useSubscription();
  const { logout, user } = useAuth();
  const {
    data: dashboardData,
    isLoading: analyticsLoading,
    isError: analyticsError,
  } = useDashboardStats();

  // State
  const [gamification, setGamification] = useState<{ totalPoints: number; currentLevel: number }>({
    totalPoints: 0,
    currentLevel: 1,
  });
  const [gamificationLoading, setGamificationLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { dictionary, t, language } = useLanguage();
  const dashboardCopy = dictionary.dashboard;
  const locale = language === "fr" ? "fr-FR" : "en-US";

  // Gamification stats for XP/level
  useEffect(() => {
    let cancelled = false;
    const fetchGamification = async () => {
      try {
        setGamificationLoading(true);
        const response = await apiClient.getGamificationProfile().catch(() => null);
        if (!cancelled && response?.stats) {
          setGamification({
            totalPoints: response.stats.totalPoints || 0,
            currentLevel: response.stats.currentLevel || 1,
          });
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) {
          setGamificationLoading(false);
        }
      }
    };
    fetchGamification();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (analyticsError) {
      const errorText =
        (dashboardCopy.toasts as { error?: string })?.error || "Failed to load dashboard data";
      toast.error(errorText, {
        description: "Please try refreshing the page",
      });
    }
  }, [analyticsError, dashboardCopy.toasts]);

  const analytics = dashboardData || {};
  const stats = useMemo(() => {
    const overview = analytics.overview || {};
    return {
      totalPlayers: analytics.totalPlayers ?? overview.totalPlayers ?? 0,
      totalReports:
        analytics.totalReports ??
        analytics.totalScoutingReports ??
        overview.totalScoutingReports ??
        0,
      totalCamps: overview.totalEvents ?? 0,
      activeCamps: analytics.activeCamps ?? overview.totalEvents ?? 0,
      upcomingMatches: analytics.totalMatches ?? overview.totalMatches ?? 0,
      pendingReports: analytics.pendingReports ?? analytics.reportsLast7Days ?? 0,
      totalXP: gamification.totalPoints,
      currentLevel: gamification.currentLevel,
    };
  }, [analytics, gamification]);

  const recentActivity = useMemo<RecentActivity[]>(() => {
    const items = dashboardCopy.activity.items;
    const activity: RecentActivity[] = [];
    const localized = (en: string, fr: string) => (language === "fr" ? fr : en);

    if (analytics.reportsLast7Days !== undefined) {
      activity.push({
        id: "reports_week",
        type: "report",
        title: items.reportCreated.title,
        description: `${analytics.reportsLast7Days.toLocaleString(locale)} ${localized(
          "reports created this week",
          "rapports créés cette semaine",
        )}`,
        timestamp: new Date().toISOString(),
        icon: FileText,
      });
    }

    if (analytics.recentActivity?.newUsersLast7Days !== undefined) {
      activity.push({
        id: "new_users",
        type: "player",
        title: items.playerAdded.title,
        description: `${analytics.recentActivity.newUsersLast7Days.toLocaleString(locale)} ${localized(
          "new users in the last 7 days",
          "nouveaux utilisateurs ces 7 derniers jours",
        )}`,
        timestamp: new Date().toISOString(),
        icon: Users,
      });
    }

    if (analytics.recentActivity?.newScoutingReportsLast7Days !== undefined) {
      activity.push({
        id: "new_reports",
        type: "report",
        title: items.reportCreated.title,
        description: `${analytics.recentActivity.newScoutingReportsLast7Days.toLocaleString(
          locale,
        )} ${localized("reports submitted by scouts", "rapports soumis par les scouts")}`,
        timestamp: new Date().toISOString(),
        icon: FileText,
      });
    }

    if (analytics.recentActivity?.newClubRequestsLast7Days !== undefined) {
      activity.push({
        id: "club_requests",
        type: "camp",
        title: items.campAvailable.title,
        description: `${analytics.recentActivity.newClubRequestsLast7Days.toLocaleString(
          locale,
        )} ${localized("club requests this week", "demandes de clubs cette semaine")}`,
        timestamp: new Date().toISOString(),
        icon: Trophy,
      });
    }

    return activity;
  }, [analytics, dashboardCopy.activity.items, language, locale]);

  const loading = analyticsLoading || gamificationLoading;

  // Sidebar navigation items
  const sidebarItems = [
    {
      id: "dashboard",
      label: dashboardCopy.sidebar.dashboard,
      icon: BarChart3,
      href: "/dashboard",
    },
    {
      id: "players",
      label: dashboardCopy.sidebar.players,
      icon: Users,
      href: "/players",
      badge: stats.totalPlayers > 0 ? stats.totalPlayers : undefined,
    },
    {
      id: "reports",
      label: dashboardCopy.sidebar.reports,
      icon: FileText,
      href: "/reports",
      badge: stats.pendingReports > 0 ? stats.pendingReports : undefined,
      badgeVariant: "warning" as const,
    },
    {
      id: "camps",
      label: dashboardCopy.sidebar.camps,
      icon: Trophy,
      href: "/camps",
    },
    {
      id: "ai",
      label: dashboardCopy.sidebar.ai,
      icon: Brain,
      children: [
        {
          id: "ai-index",
          label: dashboardCopy.sidebar.aiIndex,
          icon: Target,
          href: "/ai/arkane-index",
        },
        {
          id: "ai-gpt",
          label: dashboardCopy.sidebar.aiGpt,
          icon: Zap,
          href: "/ai/arkane-gpt",
        },
      ],
    },
  ];

  // Handlers
  const handleSearch = (value: string) => {
    setSearchValue(value);
    // Implement search logic
  };

  const handleSearchSubmit = (value: string) => {
    console.log("Search submitted:", value);
    // Navigate to search results or filter content
  };

  const handleSettingsClick = () => {
    router.push("/settings");
  };

  const handleLogout = () => {
    toast.success(dashboardCopy.toasts.logout);
    logout(); // Use the auth context logout function
  };

  const xpToNextLevel = Math.max(0, 1000 - (stats.totalXP % 1000)) || 1000;

  const statCardConfig = [
    {
      key: 'totalReports',
      label: dashboardCopy.stats.totalReports.label,
      value: stats.totalReports,
      icon: FileText,
      trend: dashboardCopy.stats.totalReports.trend,
      trendDirection: 'up' as const,
      comparison: dashboardCopy.stats.totalReports.comparison,
      accentColor: 'purple' as const,
      action: () => router.push('/reports'),
    },
    {
      key: 'totalPlayers',
      label: dashboardCopy.stats.totalPlayers.label,
      value: stats.totalPlayers,
      icon: Users,
      trend: dashboardCopy.stats.totalPlayers.trend,
      trendDirection: 'up' as const,
      comparison: dashboardCopy.stats.totalPlayers.comparison,
      accentColor: 'blue' as const,
      action: () => router.push('/players'),
    },
    {
      key: 'matches',
      label: dashboardCopy.stats.matches.label,
      value: stats.upcomingMatches,
      icon: Activity,
      trend: dashboardCopy.stats.matches.trend,
      trendDirection: 'neutral' as const,
      comparison: dashboardCopy.stats.matches.comparison,
      accentColor: 'green' as const,
      action: () => router.push('/calendar'),
    },
    {
      key: 'totalXP',
      label: dashboardCopy.stats.totalXP.label,
      value: stats.totalXP,
      icon: Trophy,
      trend: t('dashboard.stats.totalXP.trend', { level: stats.currentLevel }),
      trendDirection: 'up' as const,
      comparison: t('dashboard.stats.totalXP.comparison', { xp: xpToNextLevel }),
      accentColor: 'yellow' as const,
      action: () => router.push('/profile'),
    },
  ];

  const quickActionLabels = dashboardCopy.quickActions.items;

  const quickActionConfig = [
    {
      id: 'createReport',
      icon: Plus,
      variant: 'primary' as const,
      action: () => router.push('/reports/new'),
    },
    {
      id: 'findCoach',
      icon: SearchIcon,
      variant: 'secondary' as const,
      action: () => router.push('/coaches'),
    },
    {
      id: 'viewAnalytics',
      icon: BarChart3,
      variant: 'secondary' as const,
      action: () => router.push('/analytics'),
    },
  ];

  const aiFeatureMeta = {
    'arkane-index': {
      icon: Brain,
      gradient: 'from-yellow-500 to-orange-500',
      href: '/ai/arkane-index',
      minTier: 'GOLD',
    },
    'arkane-gpt': {
      icon: Zap,
      gradient: 'from-green-500 to-emerald-500',
      href: '/ai/arkane-gpt',
      minTier: 'BASIC',
    },
    'scout-ai': {
      icon: Target,
      gradient: 'from-blue-500 to-cyan-500',
      href: '/reports',
      minTier: 'PRO',
    },
  } as const;

  const aiFeatures = dashboardCopy.ai.features.map((feature) => ({
    ...feature,
    ...aiFeatureMeta[feature.id as keyof typeof aiFeatureMeta],
  }));

  // Activity item renderer
  const renderActivityItem = (activity: RecentActivity, index: number) => {
    const Icon = activity.icon;
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg",
          "hover:bg-arcane-charcoal/50 transition-colors cursor-pointer"
        )}
      >
        <div className="h-10 w-10 rounded-lg bg-arcane-yellow/20 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-arcane-yellow" />
        </div>
        <div className="flex-1 min-w-0">
          <Text size="sm" weight="semibold" className="mb-1">
            {activity.title}
          </Text>
          <Text size="xs" color="secondary" className="truncate mb-1">
            {activity.description}
          </Text>
          <Text size="xs" color="tertiary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(activity.timestamp).toLocaleDateString(locale, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: language !== "fr",
            })}
          </Text>
        </div>
      </div>
    );
  };

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-arcane-black">
        {/* Sidebar */}
        <Sidebar
        items={sidebarItems}
        activeId="dashboard"
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        logo={
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-arcane-yellow flex items-center justify-center">
              <span className="text-arcane-black font-black text-xl">A</span>
            </div>
            {(!sidebarCollapsed || mobileSidebarOpen) && (
              <Heading level={5} className="text-arcane-yellow">
                ARCANE
              </Heading>
            )}
          </div>
        }
      />

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        {/* Header */}
        <DashboardHeader
          title={dashboardCopy.header.title}
          subtitle={dashboardCopy.header.subtitle}
          userName={user?.fullName || "User"}
          userEmail={user?.email || ""}
          userAvatar={user?.avatar}
          subscriptionTier={subscription?.tier || "FREE"}
          searchValue={searchValue}
          onSearchChange={handleSearch}
          onSearchSubmit={handleSearchSubmit}
          onSettingsClick={handleSettingsClick}
          onLogout={handleLogout}
        />

        {/* Dashboard Content */}
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Stats Grid - 4 Columns */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCardConfig.map((card) => (
                <StatCard
                  key={card.key}
                  label={card.label}
                  value={card.value}
                  icon={card.icon}
                  trend={card.trend}
                  trendDirection={card.trendDirection}
                  comparison={card.comparison}
                  accentColor={card.accentColor}
                  loading={loading}
                  onClick={card.action}
                />
              ))}
            </div>
          </section>

          {/* Quick Actions & AI Insights */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <ArcaneCard variant="standard" className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-arcane-yellow" />
                    <Heading level={4} className="text-xl">
                      {dashboardCopy.quickActions.title}
                    </Heading>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickActionConfig.map((action) => (
                    <ArcaneButton
                      key={action.id}
                      variant={action.variant}
                      size="md"
                      icon={<action.icon />}
                      fullWidth
                      onClick={action.action}
                    >
                      {quickActionLabels[action.id as keyof typeof quickActionLabels]}
                    </ArcaneButton>
                  ))}
                </CardContent>
              </ArcaneCard>
            </div>

            {/* AI Insights Widget */}
            <div className="lg:col-span-2">
              <ArcaneCard variant="feature" className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-arcane-yellow" />
                      <Heading level={4} className="text-xl">
                        {dashboardCopy.ai.title}
                      </Heading>
                    </div>
                    <Badge variant="premium" size="sm" icon={<Sparkles />}>
                      {dashboardCopy.ai.badge}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* AI Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {aiFeatures.map((feature) => {
                        const Icon = feature.icon;
                        const hasAccess = hasMinimumTier(feature.minTier as any);

                        return (
                          <div
                            key={feature.id}
                            onClick={() =>
                              hasAccess
                                ? router.push(feature.href)
                                : toast.error(t('dashboard.ai.requirement', { tier: feature.minTier }))
                            }
                              className={cn(
                                "p-4 rounded-lg border border-arcane-slate/30",
                                "bg-arcane-anthracite/50",
                                "hover:border-arcane-yellow/30 hover:bg-arcane-charcoal/50",
                                "transition-all duration-200 cursor-pointer",
                                !hasAccess && "opacity-75"
                              )}
                          >
                            <div
                              className={cn(
                                "h-10 w-10 rounded-lg mb-3",
                                "flex items-center justify-center",
                                `bg-gradient-to-br ${feature.gradient}`
                              )}
                            >
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <Text size="sm" weight="semibold" className="mb-1">
                              {feature.name}
                            </Text>
                            <Text size="xs" color="tertiary">
                              {feature.description}
                            </Text>
                          </div>
                        );
                      })}
                    </div>

                    {/* View All Button */}
                    <div className="pt-2">
                      <ArcaneButton
                        variant="ghost"
                        size="sm"
                        iconRight={<ArrowRight />}
                        onClick={() => router.push("/ai")}
                      >
                        {dashboardCopy.ai.cta}
                      </ArcaneButton>
                    </div>
                  </div>
                </CardContent>
              </ArcaneCard>
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <ArcaneCard variant="standard">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-arcane-yellow" />
                    <Heading level={4} className="text-xl">
                      {dashboardCopy.activity.title}
                    </Heading>
                  </div>
                  <ArcaneButton
                    variant="ghost"
                    size="sm"
                    iconRight={<ArrowRight />}
                    onClick={() => router.push("/activity")}
                  >
                    {dashboardCopy.activity.viewAll}
                  </ArcaneButton>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} type="custom" height="64px" />
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <List
                    data={recentActivity}
                    renderItem={renderActivityItem}
                    spacing="sm"
                    emptyMessage={dashboardCopy.activity.empty}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto mb-3 text-arcane-gray-500 opacity-50" />
                    <Text color="secondary">{dashboardCopy.activity.empty}</Text>
                  </div>
                )}
              </CardContent>
            </ArcaneCard>
          </section>
        </main>
      </div>
    </div>
    </ProtectedPage>
  );
}
