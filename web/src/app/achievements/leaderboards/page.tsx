'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Trophy, Medal, Target, Award, Globe, Filter, Users } from 'lucide-react';

// Arcane Design System Components
import { Sidebar } from '@/components/composite/Navigation/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { ArcaneCard } from '@/components/primitives/Card/ArcaneCard';
import { CardHeader } from '@/components/primitives/Card/CardHeader';
import { CardContent } from '@/components/primitives/Card/CardContent';
import { ArcaneButton } from '@/components/primitives/Button/ArcaneButton';
import { Heading } from '@/components/primitives/Typography/Heading';
import { Text } from '@/components/primitives/Typography/Text';
import { GradientText } from '@/components/primitives/Typography/GradientText';
import { Badge } from '@/components/primitives/Badge/Badge';
import { Tabs } from '@/components/composite/Navigation/Tabs';
import { Skeleton } from '@/components/composite/Progress/Skeleton';

// Gamification Components
import { LeaderboardTable } from '@/components/gamification/LeaderboardTable';

// Hooks and Utils
import { useLeaderboard } from '@/hooks/useGamification';
import { useSubscription } from '@/hooks/useSubscription';
import { LeaderboardFilters } from '@/lib/api/gamification';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';

type LeaderboardType = 'total-xp' | 'reports' | 'scouting' | 'coaching' | 'weekly' | 'monthly';
type TimePeriod = 'week' | 'month' | 'all-time';
type Role = 'scout' | 'coach' | 'analyst' | 'all';

export default function LeaderboardsPage() {
  const router = useRouter();
  const { subscription } = useSubscription();
  const { dictionary, t } = useLanguage();
  const achievementsCopy = dictionary.achievements;
  const leaderboardsCopy = achievementsCopy.leaderboards;

  // State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('total-xp');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all-time');
  const [roleFilter, setRoleFilter] = useState<Role>('all');
  const [regionFilter, setRegionFilter] = useState<string>('');

  // Build filters
  const filters: LeaderboardFilters = {
    period: timePeriod,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    region: regionFilter || undefined,
  };

  // Query
  const { data, isLoading } = useLeaderboard(leaderboardType, filters);
  const currentUserId = 'current-user-id'; // This would come from auth context
  const leaderboardTypeCopy =
    leaderboardsCopy.types[leaderboardType] ?? leaderboardsCopy.types['total-xp'];

  // Leaderboard type tabs
  const leaderboardTabs = [
    { id: 'total-xp', label: leaderboardsCopy.tabs.totalXp, icon: Trophy },
    { id: 'reports', label: leaderboardsCopy.tabs.reports, icon: Target },
    { id: 'scouting', label: leaderboardsCopy.tabs.scouting, icon: Award },
    { id: 'coaching', label: leaderboardsCopy.tabs.coaching, icon: Medal },
    { id: 'weekly', label: leaderboardsCopy.tabs.weekly, icon: TrendingUp },
    { id: 'monthly', label: leaderboardsCopy.tabs.monthly, icon: TrendingUp },
  ];

  // Sidebar items
  const sidebarItems = [
    { id: 'achievements', label: achievementsCopy.sidebar.achievements, icon: Trophy, href: '/achievements' },
    { id: 'leaderboards', label: achievementsCopy.sidebar.leaderboards, icon: TrendingUp, href: '/achievements/leaderboards' },
    { id: 'badges', label: achievementsCopy.sidebar.badges, icon: Medal, href: '/achievements/badges' },
  ];

  return (
    <div className="min-h-screen bg-arcane-black">
      {/* Sidebar */}
      <Sidebar
        items={sidebarItems}
        activeId="leaderboards"
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <div
        className={cn('transition-all duration-300', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')}
      >
        {/* Header */}
        <DashboardHeader
          title={leaderboardsCopy.header.title}
          subtitle={leaderboardsCopy.header.subtitle}
          userName="Scout Master"
          userEmail="scout@arcane.football"
          subscriptionTier={subscription?.tier || 'FREE'}
          notificationCount={3}
        />

        {/* Page Content */}
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Hero Section */}
          <section>
            <ArcaneCard variant="feature" className="relative overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent" />

              <CardContent className="p-8 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <GradientText
                      size="4xl"
                      weight="black"
                      gradient="from-purple-500 to-blue-500"
                      className="mb-2"
                    >
                      {leaderboardsCopy.hero.title}
                    </GradientText>
                    <Text size="lg" color="secondary">
                      {leaderboardsCopy.hero.subtitle}
                    </Text>
                  </div>
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <Trophy className="h-24 w-24 text-arcane-yellow" />
                  </motion.div>
                </div>
              </CardContent>
            </ArcaneCard>
          </section>

          {/* User Position Card */}
          {data?.userPosition && !isLoading && (
            <section>
              <ArcaneCard
                variant="standard"
                className="border-arcane-yellow/30 bg-arcane-yellow/5"
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-arcane-yellow" />
                    <Heading level={5}>{leaderboardsCopy.userCard.title}</Heading>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-arcane-yellow/20 border-2 border-arcane-yellow flex items-center justify-center">
                        <Text size="2xl" weight="black" className="text-arcane-yellow">
                          #{data.userPosition.rank}
                        </Text>
                      </div>
                      <div>
                        <Text size="lg" weight="semibold">
                          {data.userPosition.name}
                        </Text>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="premium" size="sm">
                            {t('achievements.leaderboards.userCard.level', {
                              level: data.userPosition.level,
                            })}
                          </Badge>
                          <Text size="sm" color="secondary">
                            {t('achievements.leaderboards.userCard.xp', {
                              xp: data.userPosition.xp.toLocaleString(),
                            })}
                          </Text>
                        </div>
                      </div>
                    </div>
                    <ArcaneButton
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push('/profile')}
                    >
                      {leaderboardsCopy.userCard.cta}
                    </ArcaneButton>
                  </div>
                </CardContent>
              </ArcaneCard>
            </section>
          )}

          {/* Filters Section */}
          <section>
            <ArcaneCard variant="standard">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                  {/* Time Period Filter */}
                  <div className="flex items-center gap-2">
                    <Text size="sm" color="secondary">
                      {leaderboardsCopy.filters.period}
                    </Text>
                    <select
                      value={timePeriod}
                      onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
                      className="px-3 py-2 bg-arcane-anthracite border border-arcane-slate rounded-lg text-sm text-arcane-gray-200 focus:outline-none focus:border-arcane-yellow"
                    >
                      <option value="week">{leaderboardsCopy.filters.periodOptions.week}</option>
                      <option value="month">{leaderboardsCopy.filters.periodOptions.month}</option>
                      <option value="all-time">{leaderboardsCopy.filters.periodOptions.all}</option>
                    </select>
                  </div>

                  {/* Role Filter */}
                  <div className="flex items-center gap-2">
                    <Text size="sm" color="secondary">
                      {leaderboardsCopy.filters.role}
                    </Text>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as Role)}
                      className="px-3 py-2 bg-arcane-anthracite border border-arcane-slate rounded-lg text-sm text-arcane-gray-200 focus:outline-none focus:border-arcane-yellow"
                    >
                      <option value="all">{leaderboardsCopy.filters.roleOptions.all}</option>
                      <option value="scout">{leaderboardsCopy.filters.roleOptions.scout}</option>
                      <option value="coach">{leaderboardsCopy.filters.roleOptions.coach}</option>
                      <option value="analyst">{leaderboardsCopy.filters.roleOptions.analyst}</option>
                    </select>
                  </div>

                  {/* Region Filter */}
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-arcane-gray-400" />
                    <Text size="sm" color="secondary">
                      {leaderboardsCopy.filters.region}
                    </Text>
                    <select
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value)}
                      className="px-3 py-2 bg-arcane-anthracite border border-arcane-slate rounded-lg text-sm text-arcane-gray-200 focus:outline-none focus:border-arcane-yellow"
                    >
                      <option value="">{leaderboardsCopy.filters.regionOptions['']}</option>
                      <option value="north-america">{leaderboardsCopy.filters.regionOptions['north-america']}</option>
                      <option value="europe">{leaderboardsCopy.filters.regionOptions.europe}</option>
                      <option value="asia">{leaderboardsCopy.filters.regionOptions.asia}</option>
                      <option value="africa">{leaderboardsCopy.filters.regionOptions.africa}</option>
                      <option value="south-america">{leaderboardsCopy.filters.regionOptions['south-america']}</option>
                      <option value="oceania">{leaderboardsCopy.filters.regionOptions.oceania}</option>
                    </select>
                  </div>

                  <div className="flex-1" />

                  {/* Reset Filters */}
                  <ArcaneButton
                    variant="ghost"
                    size="sm"
                    icon={<Filter />}
                    onClick={() => {
                      setTimePeriod('all-time');
                      setRoleFilter('all');
                      setRegionFilter('');
                    }}
                  >
                    {leaderboardsCopy.filters.reset}
                  </ArcaneButton>
                </div>
              </CardContent>
            </ArcaneCard>
          </section>

          {/* Leaderboard Type Tabs */}
          <section>
            <div className="flex flex-wrap gap-3">
              {leaderboardTabs.map((tab) => {
                const isActive = leaderboardType === tab.id;
                const Icon = tab.icon;
                return (
                  <ArcaneButton
                    key={tab.id}
                    variant={isActive ? "primary" : "ghost"}
                    size="sm"
                    icon={<Icon className="h-4 w-4" />}
                    onClick={() => setLeaderboardType(tab.id as LeaderboardType)}
                  >
                    {tab.label}
                  </ArcaneButton>
                );
              })}
            </div>
          </section>

          {/* Leaderboard Header */}
          <section>
            <div className="flex items-center justify-between">
              <div>
                <Heading level={3} className="mb-1">
                  {leaderboardTypeCopy.title}
                </Heading>
                <Text color="secondary">{leaderboardTypeCopy.description}</Text>
              </div>
              <Badge variant="info" size="md">
                {t('achievements.leaderboards.table.count', {
                  count: data?.entries.length || 0,
                })}
              </Badge>
            </div>
          </section>

          {/* Leaderboard Table */}
          <section>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} type="custom" height="80px" />
                ))}
              </div>
            ) : (
              <LeaderboardTable
                entries={data?.entries || []}
                currentUserId={currentUserId}
                loading={isLoading}
                onUserClick={(userId) => router.push(`/profile/${userId}`)}
                showTop3Podium={true}
              />
            )}
          </section>

          {/* Info Card */}
          <section>
            <ArcaneCard variant="glass">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-info/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <Heading level={5} className="mb-2">
                      {leaderboardsCopy.info.title}
                    </Heading>
                    <Text size="sm" color="secondary" className="mb-3">
                      {leaderboardsCopy.info.description}
                    </Text>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Text size="sm" weight="semibold" className="mb-1">
                          {leaderboardsCopy.info.bullets.totalXp.title}
                        </Text>
                        <Text size="xs" color="tertiary">
                          {leaderboardsCopy.info.bullets.totalXp.description}
                        </Text>
                      </div>
                      <div>
                        <Text size="sm" weight="semibold" className="mb-1">
                          {leaderboardsCopy.info.bullets.reports.title}
                        </Text>
                        <Text size="xs" color="tertiary">
                          {leaderboardsCopy.info.bullets.reports.description}
                        </Text>
                      </div>
                      <div>
                        <Text size="sm" weight="semibold" className="mb-1">
                          {leaderboardsCopy.info.bullets.time.title}
                        </Text>
                        <Text size="xs" color="tertiary">
                          {leaderboardsCopy.info.bullets.time.description}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </ArcaneCard>
          </section>
        </main>
      </div>
    </div>
  );
}
