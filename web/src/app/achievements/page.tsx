'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Star,
  TrendingUp,
  Target,
  Medal,
  Search,
  Filter,
  Award,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

// Arcane Design System Components
import { Sidebar } from '@/components/composite/Navigation/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { ArcaneCard } from '@/components/primitives/Card/ArcaneCard';
import { CardHeader } from '@/components/primitives/Card/CardHeader';
import { CardContent } from '@/components/primitives/Card/CardContent';
import { ArcaneButton } from '@/components/primitives/Button/ArcaneButton';
import { ArcaneInput } from '@/components/primitives/Input/ArcaneInput';
import { Heading } from '@/components/primitives/Typography/Heading';
import { Text } from '@/components/primitives/Typography/Text';
import { GradientText } from '@/components/primitives/Typography/GradientText';
import { Badge } from '@/components/primitives/Badge/Badge';
import { Tabs } from '@/components/composite/Navigation/Tabs';
import { Skeleton } from '@/components/composite/Progress/Skeleton';
import { StatCard } from '@/components/dashboard/StatCard';

// Gamification Components
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { XPBar } from '@/components/gamification/XPBar';
import { DailyChallenge } from '@/components/gamification/DailyChallenge';

// Hooks and Utils
import { useAchievements, useUserXP, useDailyChallenge, useAchievementStats, useClaimAchievement, useCompleteChallenge } from '@/hooks/useGamification';
import { useSubscription } from '@/hooks/useSubscription';
import { AchievementCategory } from '@/lib/api/gamification';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';

type SortOption = 'recent' | 'rarity' | 'progress' | 'name';

export default function AchievementsPage() {
  const router = useRouter();
  const { subscription } = useSubscription();
  const { dictionary, t, language } = useLanguage();
  const achievementsCopy = dictionary.achievements;
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  // State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);

  // Queries
  const { data: achievements, isLoading: achievementsLoading } = useAchievements();
  const { data: userXP, isLoading: xpLoading } = useUserXP();
  const { data: dailyChallenge, isLoading: challengeLoading } = useDailyChallenge();
  const { data: stats, isLoading: statsLoading } = useAchievementStats();

  // Mutations
  const claimAchievement = useClaimAchievement();
  const completeChallenge = useCompleteChallenge();

  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    if (!achievements) return [];

    let filtered = [...achievements];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    // Filter by search
    if (searchValue) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchValue.toLowerCase()) ||
          a.description.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    // Filter by locked/unlocked
    if (showOnlyUnlocked) {
      filtered = filtered.filter((a) => !a.isLocked);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          if (a.unlockedAt && b.unlockedAt) {
            return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
          }
          return a.isLocked ? 1 : -1;
        case 'rarity':
          const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        case 'progress':
          const aProgress = a.progress ? a.progress.current / a.progress.total : 0;
          const bProgress = b.progress ? b.progress.current / b.progress.total : 0;
          return bProgress - aProgress;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [achievements, selectedCategory, searchValue, showOnlyUnlocked, sortBy]);

  // Category tabs
  const categoryTabs = [
    { id: 'all', label: achievementsCopy.tabs.all, icon: Trophy },
    { id: 'scouting', label: achievementsCopy.tabs.scouting, icon: Target },
    { id: 'coaching', label: achievementsCopy.tabs.coaching, icon: Award },
    { id: 'reports', label: achievementsCopy.tabs.reports, icon: Sparkles },
    { id: 'social', label: achievementsCopy.tabs.social, icon: Medal },
    { id: 'special', label: achievementsCopy.tabs.special, icon: Star },
  ];

  // Sidebar items
  const sidebarItems = [
    { id: 'achievements', label: achievementsCopy.sidebar.achievements, icon: Trophy, href: '/achievements' },
    { id: 'leaderboards', label: achievementsCopy.sidebar.leaderboards, icon: TrendingUp, href: '/achievements/leaderboards' },
    { id: 'badges', label: achievementsCopy.sidebar.badges, icon: Medal, href: '/achievements/badges' },
  ];

  const isLoading = achievementsLoading || xpLoading || statsLoading;

  return (
    <div className="min-h-screen bg-arcane-black">
      {/* Sidebar */}
      <Sidebar
        items={sidebarItems}
        activeId="achievements"
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
          title={achievementsCopy.header.title}
          subtitle={achievementsCopy.header.subtitle}
          userName="Scout Master"
          userEmail="scout@arcane.football"
          subscriptionTier={subscription?.tier || 'FREE'}
          notificationCount={3}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearchSubmit={() => {}}
        />

        {/* Page Content */}
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Hero Section - Level & XP */}
          <section>
            <ArcaneCard variant="feature" className="relative overflow-hidden">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-arcane-yellow/10 via-transparent to-transparent" />

              <CardContent className="p-8 relative">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                  {/* Level Badge */}
                  <div className="flex justify-center lg:justify-start">
                    {isLoading ? (
                      <Skeleton type="custom" width="160px" height="160px" className="rounded-full" />
                    ) : (
                      <LevelBadge
                        level={userXP?.level || 1}
                        title={userXP?.title || 'Scout'}
                        size="xl"
                        animated
                      />
                    )}
                  </div>

                  {/* XP Progress */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <GradientText
                        size="4xl"
                        weight="black"
                        gradient="from-arcane-yellow to-yellow-500"
                        className="mb-2"
                      >
                        {t('achievements.hero.levelLabel', { level: userXP?.level || 1 })}
                      </GradientText>
                      <Text size="lg" color="secondary">
                        {userXP?.title || achievementsCopy.hero.titleFallback}
                      </Text>
                    </div>

                    {isLoading ? (
                      <Skeleton type="custom" height="60px" />
                    ) : (
                      <XPBar
                        currentXP={userXP?.currentXP || 0}
                        nextLevelXP={userXP?.nextLevelXP || 1000}
                        level={userXP?.level || 1}
                        animated
                      />
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <ArcaneButton
                        variant="secondary"
                        size="sm"
                        iconRight={<ChevronRight />}
                        onClick={() => router.push('/achievements/leaderboards')}
                      >
                        {achievementsCopy.hero.buttons.leaderboards}
                      </ArcaneButton>
                      <ArcaneButton
                        variant="secondary"
                        size="sm"
                        iconRight={<ChevronRight />}
                        onClick={() => router.push('/achievements/badges')}
                      >
                        {achievementsCopy.hero.buttons.badges}
                      </ArcaneButton>
                    </div>
                  </div>
                </div>
              </CardContent>
            </ArcaneCard>
          </section>

          {/* Stats Row */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label={achievementsCopy.stats.unlocked.label}
                value={isLoading ? 0 : `${stats?.unlockedAchievements || 0}/${stats?.totalAchievements || 0}`}
                icon={Trophy}
                trend={`${((stats?.unlockedAchievements || 0) / (stats?.totalAchievements || 1) * 100).toFixed(0)}%`}
                trendDirection="neutral"
                comparison={achievementsCopy.stats.unlocked.comparison}
                accentColor="yellow"
                loading={isLoading}
              />
              <StatCard
                label={achievementsCopy.stats.totalXP.label}
                value={stats?.totalXP || 0}
                icon={Star}
                trend={achievementsCopy.stats.totalXP.trend}
                trendDirection="up"
                comparison={achievementsCopy.stats.totalXP.comparison}
                accentColor="purple"
                loading={isLoading}
              />
              <StatCard
                label={achievementsCopy.stats.streak.label}
                value={t('achievements.stats.streak.value', { count: stats?.currentStreak || 0 })}
                icon={TrendingUp}
                trend={achievementsCopy.stats.streak.trend}
                trendDirection="up"
                comparison={achievementsCopy.stats.streak.comparison}
                accentColor="green"
                loading={isLoading}
              />
              <StatCard
                label={achievementsCopy.stats.rank.label}
                value={t('achievements.stats.rank.value', { rank: stats?.rankPosition || 0 })}
                icon={Medal}
                trend={achievementsCopy.stats.rank.trend}
                trendDirection="up"
                comparison={achievementsCopy.stats.rank.comparison}
                accentColor="blue"
                loading={isLoading}
              />
            </div>
          </section>

          {/* Daily Challenge & Recent Unlocks */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Challenge - 2/3 width */}
            <div className="lg:col-span-2">
              {challengeLoading ? (
                <Skeleton type="custom" height="300px" />
              ) : dailyChallenge ? (
                <DailyChallenge
                  challenge={dailyChallenge}
                  onClaim={() => completeChallenge.mutate(dailyChallenge.id)}
                />
              ) : (
                <ArcaneCard variant="standard">
                  <CardContent className="p-12 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-3 text-arcane-gray-500 opacity-50" />
                    <Text color="secondary">{achievementsCopy.challenge.empty}</Text>
                  </CardContent>
                </ArcaneCard>
              )}
            </div>

            {/* Recent Unlocks - 1/3 width */}
            <div>
              <ArcaneCard variant="standard">
                <CardHeader>
                  <Heading level={5}>{achievementsCopy.recentUnlocks.title}</Heading>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoading ? (
                    <>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} type="custom" height="80px" />
                      ))}
                    </>
                  ) : (
                    <>
                      {achievements
                        ?.filter((a) => !a.isLocked)
                        .slice(0, 5)
                        .map((achievement) => (
                          <div
                            key={achievement.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-arcane-charcoal/50 transition-colors"
                          >
                            <span className="text-2xl">{achievement.icon}</span>
                            <div className="flex-1 min-w-0">
                              <Text size="sm" weight="semibold" className="truncate">
                                {achievement.title}
                              </Text>
                              <Text size="xs" color="tertiary">
                                {t('achievements.recentUnlocks.xp', { xp: achievement.xpReward })}
                              </Text>
                            </div>
                          </div>
                        ))}
                    </>
                  )}
                </CardContent>
              </ArcaneCard>
            </div>
          </section>

          {/* Filters & Search */}
          <section>
            <ArcaneCard variant="standard">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                  {/* Search */}
                  <div className="flex-1 w-full">
                    <ArcaneInput
                      type="text"
                      placeholder={achievementsCopy.filters.searchPlaceholder}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      icon={<Search />}
                    />
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Text size="sm" color="secondary" className="mr-2">
                      {achievementsCopy.filters.sortLabel}
                    </Text>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-3 py-2 bg-arcane-anthracite border border-arcane-slate rounded-lg text-sm text-arcane-gray-200 focus:outline-none focus:border-arcane-yellow"
                    >
                      <option value="recent">{achievementsCopy.filters.sortOptions.recent}</option>
                      <option value="rarity">{achievementsCopy.filters.sortOptions.rarity}</option>
                      <option value="progress">{achievementsCopy.filters.sortOptions.progress}</option>
                      <option value="name">{achievementsCopy.filters.sortOptions.name}</option>
                    </select>

                    {/* Toggle Unlocked Only */}
                    <ArcaneButton
                      variant={showOnlyUnlocked ? 'primary' : 'ghost'}
                      size="sm"
                      icon={<Filter />}
                      onClick={() => setShowOnlyUnlocked(!showOnlyUnlocked)}
                    >
                      {achievementsCopy.filters.unlockedOnly}
                    </ArcaneButton>
                  </div>
                </div>
              </CardContent>
            </ArcaneCard>
          </section>

          {/* Category Tabs */}
          <section>
            <div className="flex flex-wrap gap-3">
              {categoryTabs.map((tab) => {
                const isActive = selectedCategory === tab.id;
                const Icon = tab.icon;
                return (
                  <ArcaneButton
                    key={tab.id}
                    variant={isActive ? "primary" : "ghost"}
                    size="sm"
                    icon={<Icon className="h-4 w-4" />}
                    onClick={() => setSelectedCategory(tab.id as AchievementCategory | "all")}
                  >
                    {tab.label}
                  </ArcaneButton>
                );
              })}
            </div>
          </section>

          {/* Achievements Grid */}
          <section>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} type="custom" height="280px" />
                ))}
              </div>
            ) : filteredAchievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <AchievementCard
                      achievement={achievement}
                      onClick={() => {
                        toast.info(achievementsCopy.toasts.detailSoon);
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <ArcaneCard variant="standard">
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-3 text-arcane-gray-500 opacity-50" />
                  <Text color="secondary">{achievementsCopy.empty.title}</Text>
                  <Text size="sm" color="tertiary" className="mt-2">
                    {achievementsCopy.empty.description}
                  </Text>
                </CardContent>
              </ArcaneCard>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
