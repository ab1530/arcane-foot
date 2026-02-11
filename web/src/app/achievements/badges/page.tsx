'use client';

import React, { useState, useMemo } from 'react';
import { Trophy, Medal, Star, Search, Pin, Award, Sparkles, Shield, TrendingUp } from 'lucide-react';

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
import { Badge as UIBadge } from '@/components/primitives/Badge/Badge';
import { Tabs } from '@/components/composite/Navigation/Tabs';
import { Skeleton } from '@/components/composite/Progress/Skeleton';

// Gamification Components
import { BadgeDisplay } from '@/components/gamification/BadgeDisplay';
import { RarityBadge } from '@/components/gamification/RarityBadge';

// Hooks and Utils
import { useBadges, usePinBadge } from '@/hooks/useGamification';
import { useSubscription } from '@/hooks/useSubscription';
import { AchievementRarity } from '@/lib/api/gamification';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/language-context';

export default function BadgesPage() {
  const { subscription } = useSubscription();
  const { dictionary, t } = useLanguage();
  const achievementsCopy = dictionary.achievements;
  const badgesCopy = achievementsCopy.badges;

  // State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | 'all'>('all');
  const [showOnlyPinned, setShowOnlyPinned] = useState(false);
  const [showOnlyEarned, setShowOnlyEarned] = useState(false);

  // Queries
  const { data: badges, isLoading } = useBadges();
  const pinBadge = usePinBadge();

  // Filter badges
  const filteredBadges = useMemo(() => {
    if (!badges) return [];

    let filtered = [...badges];

    // Filter by rarity
    if (selectedRarity !== 'all') {
      filtered = filtered.filter((b) => b.rarity === selectedRarity);
    }

    // Filter by search
    if (searchValue) {
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          b.description.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    // Filter by pinned
    if (showOnlyPinned) {
      filtered = filtered.filter((b) => b.isPinned);
    }

    // Filter by earned
    if (showOnlyEarned) {
      filtered = filtered.filter((b) => b.earnedAt);
    }

    return filtered;
  }, [badges, selectedRarity, searchValue, showOnlyPinned, showOnlyEarned]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!badges) return { total: 0, earned: 0, pinned: 0, rarityBreakdown: {} };

    const earned = badges.filter((b) => b.earnedAt).length;
    const pinned = badges.filter((b) => b.isPinned).length;
    const rarityBreakdown = badges.reduce((acc, badge) => {
      if (badge.earnedAt) {
        acc[badge.rarity] = (acc[badge.rarity] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total: badges.length,
      earned,
      pinned,
      rarityBreakdown,
    };
  }, [badges]);

  // Rarity tabs
  const rarityTabs = [
    { id: 'all', label: badgesCopy.tabs.all, icon: Trophy },
    { id: 'common', label: badgesCopy.tabs.common, icon: Shield },
    { id: 'rare', label: badgesCopy.tabs.rare, icon: Star },
    { id: 'epic', label: badgesCopy.tabs.epic, icon: Sparkles },
    { id: 'legendary', label: badgesCopy.tabs.legendary, icon: Award },
  ];

  // Sidebar items
  const sidebarItems = [
    { id: 'achievements', label: achievementsCopy.sidebar.achievements, icon: Trophy, href: '/achievements' },
    { id: 'leaderboards', label: achievementsCopy.sidebar.leaderboards, icon: TrendingUp, href: '/achievements/leaderboards' },
    { id: 'badges', label: achievementsCopy.sidebar.badges, icon: Medal, href: '/achievements/badges' },
  ];

  // Handle pin/unpin
  const handlePinToggle = (badgeId: string, currentlyPinned: boolean) => {
    const pinnedCount = badges?.filter((b) => b.isPinned).length || 0;

    if (!currentlyPinned && pinnedCount >= 5) {
      toast.error(badgesCopy.toasts.pinLimit);
      return;
    }

    pinBadge.mutate({ id: badgeId, pin: !currentlyPinned });
  };

  // Pinned badges (for showcase)
  const pinnedBadges = badges?.filter((b) => b.isPinned) || [];
  const recentlyEarned = badges
    ?.filter((b) => b.earnedAt)
    .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())
    .slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-arcane-black">
      {/* Sidebar */}
      <Sidebar
        items={sidebarItems}
        activeId="badges"
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
          title={badgesCopy.header.title}
          subtitle={badgesCopy.header.subtitle}
          userName="Scout Master"
          userEmail="scout@arcane.football"
          subscriptionTier={subscription?.tier || 'FREE'}
          notificationCount={3}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        {/* Page Content */}
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Hero Section */}
          <section>
            <ArcaneCard variant="feature" className="relative overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-transparent" />

              <CardContent className="p-8 relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Collection Stats */}
                  <div>
                    <Heading level={2} className="text-4xl font-black mb-2">
                      <GradientText gradient="premium">
                        {badgesCopy.hero.title}
                      </GradientText>
                    </Heading>
                    <Text size="lg" color="secondary" className="mb-6">
                      {t('achievements.badges.hero.subtitle', {
                        earned: stats.earned,
                        total: stats.total,
                      })}
                    </Text>

                    {/* Rarity Breakdown */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-gray-500" />
                        <Text size="sm" color="secondary">
                          {badgesCopy.hero.rarity.common}: {stats.rarityBreakdown.common || 0}
                        </Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <Text size="sm" color="secondary">
                          {badgesCopy.hero.rarity.rare}: {stats.rarityBreakdown.rare || 0}
                        </Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-purple-500" />
                        <Text size="sm" color="secondary">
                          {badgesCopy.hero.rarity.epic}: {stats.rarityBreakdown.epic || 0}
                        </Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <Text size="sm" color="secondary">
                          {badgesCopy.hero.rarity.legendary}: {stats.rarityBreakdown.legendary || 0}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* Recently Earned Badges */}
                  <div>
                    <Heading level={5} className="mb-4">
                      {badgesCopy.hero.recentlyEarned}
                    </Heading>
                    <div className="flex items-center gap-3 flex-wrap">
                      {isLoading ? (
                        <>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} type="custom" width="64px" height="64px" className="rounded-full" />
                          ))}
                        </>
                      ) : recentlyEarned.length > 0 ? (
                        recentlyEarned.map((badge) => (
                          <BadgeDisplay
                            key={badge.id}
                            badge={badge}
                            size="md"
                            variant="minimal"
                            showDetails={false}
                          />
                        ))
                      ) : (
                        <Text size="sm" color="tertiary">
                          {badgesCopy.hero.noneEarned}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </ArcaneCard>
          </section>

          {/* Pinned Badges Showcase */}
          {pinnedBadges.length > 0 && (
            <section>
              <ArcaneCard variant="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pin className="h-5 w-5 text-arcane-yellow" />
                      <Heading level={4}>{badgesCopy.pinned.title}</Heading>
                    </div>
                    <UIBadge variant="premium" size="sm">
                      {t('achievements.badges.pinned.counter', { count: pinnedBadges.length })}
                    </UIBadge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 flex-wrap">
                    {pinnedBadges.map((badge) => (
                      <motion.div
                        key={badge.id}
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <BadgeDisplay
                          badge={badge}
                          size="lg"
                          variant="minimal"
                          showDetails={false}
                          onClick={() => toast.info(badgesCopy.toasts.detailSoon)}
                        />
                      </motion.div>
                    ))}
                  </div>
                  <Text size="xs" color="tertiary" className="mt-4">
                    {badgesCopy.pinned.helper}
                  </Text>
                </CardContent>
              </ArcaneCard>
            </section>
          )}

          {/* Filters */}
          <section>
            <ArcaneCard variant="standard">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                  {/* Search */}
                  <div className="flex-1 w-full">
                    <ArcaneInput
                      type="text"
                      placeholder={badgesCopy.filters.searchPlaceholder}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      icon={<Search />}
                    />
                  </div>

                  {/* Filter Toggles */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <ArcaneButton
                      variant={showOnlyPinned ? 'primary' : 'ghost'}
                      size="sm"
                      icon={<Pin />}
                      onClick={() => setShowOnlyPinned(!showOnlyPinned)}
                    >
                      {badgesCopy.filters.pinnedToggle}
                    </ArcaneButton>
                    <ArcaneButton
                      variant={showOnlyEarned ? 'primary' : 'ghost'}
                      size="sm"
                      icon={<Medal />}
                      onClick={() => setShowOnlyEarned(!showOnlyEarned)}
                    >
                      {badgesCopy.filters.earnedToggle}
                    </ArcaneButton>
                  </div>
                </div>
              </CardContent>
            </ArcaneCard>
          </section>

          {/* Rarity Tabs */}
          <section>
            <div className="flex flex-wrap gap-3">
              {rarityTabs.map((tab) => {
                const isActive = selectedRarity === tab.id;
                const Icon = tab.icon;
                return (
                  <ArcaneButton
                    key={tab.id}
                    variant={isActive ? "primary" : "ghost"}
                    size="sm"
                    icon={<Icon className="h-4 w-4" />}
                    onClick={() => setSelectedRarity(tab.id as AchievementRarity | "all")}
                  >
                    {tab.label}
                  </ArcaneButton>
                );
              })}
            </div>
          </section>

          {/* Badges Grid */}
          <section>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} type="custom" height="300px" />
                ))}
              </div>
            ) : filteredBadges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <BadgeDisplay
                      badge={badge}
                      size="md"
                      showPin={!!badge.earnedAt}
                      onPin={() => handlePinToggle(badge.id, badge.isPinned)}
                      onClick={() => toast.info(badgesCopy.toasts.detailSoon)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <ArcaneCard variant="standard">
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-3 text-arcane-gray-500 opacity-50" />
                  <Text color="secondary">{badgesCopy.empty.title}</Text>
                  <Text size="sm" color="tertiary" className="mt-2">
                    {badgesCopy.empty.description}
                  </Text>
                </CardContent>
              </ArcaneCard>
            )}
          </section>

          {/* Info Card */}
          <section>
            <ArcaneCard variant="glass">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-info/20 flex items-center justify-center flex-shrink-0">
                    <Medal className="h-6 w-6 text-info" />
                  </div>
                  <div className="flex-1">
                    <Heading level={5} className="mb-2">
                      {badgesCopy.info.title}
                    </Heading>
                    <Text size="sm" color="secondary" className="mb-4">
                      {badgesCopy.info.description}
                    </Text>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <RarityBadge rarity="common" size="sm" className="mb-2" />
                        <Text size="xs" color="tertiary">
                          {badgesCopy.info.bullets.common}
                        </Text>
                      </div>
                      <div>
                        <RarityBadge rarity="rare" size="sm" className="mb-2" />
                        <Text size="xs" color="tertiary">
                          {badgesCopy.info.bullets.rare}
                        </Text>
                      </div>
                      <div>
                        <RarityBadge rarity="epic" size="sm" className="mb-2" />
                        <Text size="xs" color="tertiary">
                          {badgesCopy.info.bullets.epic}
                        </Text>
                      </div>
                      <div>
                        <RarityBadge rarity="legendary" size="sm" className="mb-2" />
                        <Text size="xs" color="tertiary">
                          {badgesCopy.info.bullets.legendary}
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
