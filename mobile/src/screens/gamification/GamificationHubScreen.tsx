/**
 * GAMIFICATION HUB SCREEN
 * Main gamification dashboard showing level, XP, achievements, and daily challenge
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Trophy, Award, Flame, TrendingUp, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { tokens, typography } from '../../design';
import {
  useUserXP,
  useGamificationStats,
  useDailyChallenge,
  useAchievements,
} from '../../hooks/useGamification';
import {
  LevelBadge,
  XPBar,
  DailyChallengeCard,
  AchievementCard,
  ConfettiAnimation,
} from './components';
import { useLocalization } from '../../contexts/LocalizationContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ============================================================================
// COMPONENT
// ============================================================================

export const GamificationHubScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { dictionary } = useLocalization();
  const t = dictionary.gamification || {
    hub: {
      title: 'Gamification',
      subtitle: 'Track your progress and achievements',
    },
    stats: {
      achievements: 'Achievements',
      totalXP: 'Total XP',
      streak: 'Streak',
      validations: 'Validations',
      daysUnit: 'days',
    },
    dailyChallenge: {
      title: 'Daily Challenge',
      empty: {
        emoji: '🛌',
        title: 'No challenge today',
        subtitle: 'Come back later for bonus points',
      },
    },
    quickActions: {
      title: 'Quick Actions',
      viewAchievements: 'View Achievements',
      leaderboards: 'Leaderboards',
      myBadges: 'My Badges',
    },
    recentUnlocks: {
      title: 'Recent Unlocks',
      seeAll: 'See All',
    },
  };

  const [refreshing, setRefreshing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const { data: xpData, isLoading: xpLoading, refetch: refetchXP } = useUserXP();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGamificationStats();
  const { data: challenge, isLoading: challengeLoading, refetch: refetchChallenge } = useDailyChallenge();
  const { data: achievements, isLoading: achievementsLoading, refetch: refetchAchievements } = useAchievements();

  const isLoading = xpLoading || statsLoading || challengeLoading || achievementsLoading;

  const unlockedAchievements = achievements?.filter(a => !a.isLocked).length ?? 0;
  const totalAchievements = achievements?.length ?? 0;
  const totalXP = stats?.totalXP ?? xpData?.totalXP ?? 0;
  const streakLabel =
    stats?.loginStreak && stats.loginStreak > 0 ? `${stats.loginStreak} ${t.stats.daysUnit}` : '—';
  const validationsLabel =
    stats?.playersValidated !== undefined
      ? formatNumber(stats.playersValidated)
      : '—';

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchXP(),
      refetchStats(),
      refetchChallenge(),
      refetchAchievements(),
    ]);
    setRefreshing(false);
  };

  const recentAchievements = achievements
    ?.filter(a => !a.isLocked && a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 5) || [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.colors.yellow.DEFAULT}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.hub.title}</Text>
          <Text style={styles.headerSubtitle}>{t.hub.subtitle}</Text>
        </View>

        {/* Hero Section - Level Badge */}
        <View style={styles.heroSection}>
          <LevelBadge
            level={xpData?.level || 1}
            title={xpData?.title || 'Scout Rookie'}
            size="large"
          />

          {/* XP Progress */}
          <View style={styles.xpContainer}>
            <XPBar
              currentXP={xpData?.currentXP || 0}
              nextLevelXP={xpData?.nextLevelXP || 1000}
              level={xpData?.level || 1}
              showLabel={true}
              animated={true}
            />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={<Trophy size={24} color={tokens.colors.yellow.DEFAULT} />}
            label={t.stats.achievements}
            value={`${unlockedAchievements}/${totalAchievements}`}
            color={tokens.colors.yellow.DEFAULT}
          />
          <StatCard
            icon={<Star size={24} color={tokens.colors.semantic.success} />}
            label={t.stats.totalXP}
            value={formatNumber(totalXP)}
            color={tokens.colors.semantic.success}
          />
          <StatCard
            icon={<Flame size={24} color={tokens.colors.semantic.warning} />}
            label={t.stats.streak}
            value={streakLabel}
            color={tokens.colors.semantic.warning}
          />
          <StatCard
            icon={<TrendingUp size={24} color={tokens.colors.semantic.info} />}
            label={t.stats.validations}
            value={validationsLabel}
            color={tokens.colors.semantic.info}
          />
        </View>

        {/* Daily Challenge */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.dailyChallenge.title}</Text>
          {challenge ? (
            <DailyChallengeCard
              challenge={challenge}
              onPress={() => navigation.navigate('DailyChallengeModal', { challenge })}
            />
          ) : (
            <View style={styles.emptyChallenge}>
              <Text style={styles.emptyChallengeEmoji}>{t.dailyChallenge.empty.emoji}</Text>
              <Text style={styles.emptyChallengeTitle}>{t.dailyChallenge.empty.title}</Text>
              <Text style={styles.emptyChallengeSubtitle}>
                {t.dailyChallenge.empty.subtitle}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.quickActions.title}</Text>
          <View style={styles.actionsGrid}>
            <ActionButton
              title={t.quickActions.viewAchievements}
              icon={<Trophy size={20} color={tokens.colors.yellow.DEFAULT} />}
              onPress={() => navigation.navigate('Achievements')}
              variant="primary"
            />
            <ActionButton
              title={t.quickActions.leaderboards}
              icon={<TrendingUp size={20} color={tokens.colors.gray.DEFAULT} />}
              onPress={() => navigation.navigate('Leaderboards')}
              variant="secondary"
            />
            <ActionButton
              title={t.quickActions.myBadges}
              icon={<Award size={20} color={tokens.colors.gray.DEFAULT} />}
              onPress={() => navigation.navigate('Badges')}
              variant="secondary"
            />
          </View>
        </View>

        {/* Recent Unlocks */}
        {recentAchievements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.recentUnlocks.title}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Achievements')}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>{t.recentUnlocks.seeAll}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScrollContent}
            >
              {recentAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onPress={() =>
                    navigation.navigate('AchievementDetailsModal', { achievement })
                  }
                  style={styles.achievementCard}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Confetti Animation */}
      <ConfettiAnimation
        visible={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </View>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

interface ActionButtonProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant: 'primary' | 'secondary';
}

const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  icon,
  onPress,
  variant,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.actionButton,
        variant === 'primary' ? styles.actionButtonPrimary : styles.actionButtonSecondary,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.actionButtonText,
          variant === 'primary' && styles.actionButtonTextPrimary,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// HELPERS
// ============================================================================

const formatNumber = (num?: number): string => {
  if (num === undefined || num === null) return '—';
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.arcane.black,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    ...typography.display3,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typography.bodyBase,
    color: tokens.colors.gray[300],
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  xpContainer: {
    width: '100%',
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 16 * 2 - 12) / 2,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    ...typography.heading3,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.heading4,
    marginBottom: 12,
  },
  seeAllText: {
    ...typography.bodySmall,
    color: tokens.colors.yellow.DEFAULT,
    fontWeight: '600',
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonPrimary: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  actionButtonSecondary: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderColor: tokens.colors.surface.borderLight,
  },
  actionButtonText: {
    ...typography.bodyBase,
    fontWeight: '600',
    color: tokens.colors.text.primary,
  },
  actionButtonTextPrimary: {
    color: tokens.colors.arcane.black,
  },
  recentScrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  achievementCard: {
    width: SCREEN_WIDTH * 0.85,
  },
  emptyChallenge: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
    padding: 16,
    alignItems: 'center',
    backgroundColor: tokens.colors.arcane.charcoal,
  },
  emptyChallengeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyChallengeTitle: {
    ...typography.heading5,
    marginBottom: 4,
  },
  emptyChallengeSubtitle: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
    textAlign: 'center',
  },
});

export default GamificationHubScreen;
