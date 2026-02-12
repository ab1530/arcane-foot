/**
 * GAMIFICATION HOOKS
 * React Query hooks for gamification features
 * Provides reactive data management with caching and optimistic updates
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { gamificationService } from '../services/api/gamification';
import type {
  Achievement,
  Badge,
  LeaderboardEntry,
  UserXP,
  DailyChallenge,
  ClaimAchievementResponse,
  CompleteChallengeResponse,
  GamificationStats,
} from '../types/gamification';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const GAMIFICATION_KEYS = {
  achievements: ['gamification', 'achievements'] as const,
  availableAchievements: ['gamification', 'achievements', 'available'] as const,
  leaderboard: (type: string, filters?: any) => ['gamification', 'leaderboard', type, filters] as const,
  badges: ['gamification', 'badges'] as const,
  xp: ['gamification', 'xp'] as const,
  challenge: ['gamification', 'challenge', 'daily'] as const,
  stats: ['gamification', 'stats'] as const,
};

// ============================================================================
// ACHIEVEMENTS HOOKS
// ============================================================================

/**
 * Get user achievements
 */
export const useAchievements = () => {
  return useQuery<Achievement[], Error>({
    queryKey: GAMIFICATION_KEYS.achievements,
    queryFn: gamificationService.getAchievements,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Get available achievements
 */
export const useAvailableAchievements = () => {
  return useQuery<Achievement[], Error>({
    queryKey: GAMIFICATION_KEYS.availableAchievements,
    queryFn: gamificationService.getAvailableAchievements,
    staleTime: 60000,
  });
};

/**
 * Claim achievement mutation
 */
export const useClaimAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation<ClaimAchievementResponse, Error, string>({
    mutationFn: gamificationService.claimAchievement,
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.achievements });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.xp });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.stats });

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show success toast
      if (data.leveledUp) {
        Toast.show({
          type: 'success',
          text1: `Level Up! 🎉`,
          text2: `You're now level ${data.newLevel}!`,
          visibilityTime: 4000,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Achievement Claimed! 🏆',
          text2: `+${data.xpGained} XP earned`,
          visibilityTime: 3000,
        });
      }
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Failed to claim achievement',
        text2: error.message || 'Please try again',
      });
    },
  });
};

// ============================================================================
// LEADERBOARD HOOKS
// ============================================================================

/**
 * Get leaderboard by type
 */
export const useLeaderboard = (type: string, filters?: any) => {
  return useQuery<LeaderboardEntry[], Error>({
    queryKey: GAMIFICATION_KEYS.leaderboard(type, filters),
    queryFn: () => gamificationService.getLeaderboard(type, filters),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for real-time updates
  });
};

// ============================================================================
// BADGES HOOKS
// ============================================================================

/**
 * Get user badges
 */
export const useBadges = () => {
  return useQuery<Badge[], Error>({
    queryKey: GAMIFICATION_KEYS.badges,
    queryFn: gamificationService.getBadges,
    staleTime: 60000,
  });
};

/**
 * Pin badge mutation
 */
export const usePinBadge = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: gamificationService.pinBadge,
    onMutate: async (badgeId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: GAMIFICATION_KEYS.badges });

      const previousBadges = queryClient.getQueryData<Badge[]>(GAMIFICATION_KEYS.badges);

      if (previousBadges) {
        queryClient.setQueryData<Badge[]>(
          GAMIFICATION_KEYS.badges,
          previousBadges.map(badge =>
            badge.id === badgeId ? { ...badge, isPinned: true } : badge
          )
        );
      }

      return { previousBadges };
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Toast.show({
        type: 'success',
        text1: 'Badge Pinned! 📌',
        text2: 'Badge now visible on your profile',
        visibilityTime: 2000,
      });
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousBadges) {
        queryClient.setQueryData(GAMIFICATION_KEYS.badges, context.previousBadges);
      }
      Toast.show({
        type: 'error',
        text1: 'Failed to pin badge',
        text2: error.message || 'Please try again',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.badges });
    },
  });
};

/**
 * Unpin badge mutation
 */
export const useUnpinBadge = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: gamificationService.unpinBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.badges });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Toast.show({
        type: 'info',
        text1: 'Badge Unpinned',
        visibilityTime: 2000,
      });
    },
  });
};

// ============================================================================
// XP HOOKS
// ============================================================================

/**
 * Get user XP and level
 */
export const useUserXP = () => {
  return useQuery<UserXP, Error>({
    queryKey: GAMIFICATION_KEYS.xp,
    queryFn: gamificationService.getUserXP,
    staleTime: 60000,
  });
};

// ============================================================================
// DAILY CHALLENGE HOOKS
// ============================================================================

/**
 * Get daily challenge
 */
export const useDailyChallenge = () => {
  return useQuery<DailyChallenge | null, Error>({
    queryKey: GAMIFICATION_KEYS.challenge,
    queryFn: gamificationService.getDailyChallenge,
    staleTime: 300000, // 5 minutes
    refetchInterval: 60000, // Refetch every minute to update timer
  });
};

/**
 * Complete challenge mutation
 */
export const useCompleteChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation<CompleteChallengeResponse, Error, void>({
    mutationFn: () => gamificationService.completeChallenge(),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.challenge });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.xp });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.stats });

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Défi complété ! 🎊',
        text2: `+${data.pointsAwarded} XP gagnés`,
        visibilityTime: 3000,
      });
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Failed to complete challenge',
        text2: error.message || 'Please try again',
      });
    },
  });
};

// ============================================================================
// STATS HOOKS
// ============================================================================

/**
 * Get gamification stats summary
 */
export const useGamificationStats = () => {
  return useQuery<GamificationStats, Error>({
    queryKey: GAMIFICATION_KEYS.stats,
    queryFn: gamificationService.getStats,
    staleTime: 60000,
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Custom hook to get all gamification data
 * Useful for the hub screen
 */
export const useGamificationHub = () => {
  const achievements = useAchievements();
  const xp = useUserXP();
  const badges = useBadges();
  const challenge = useDailyChallenge();
  const stats = useGamificationStats();

  return {
    achievements,
    xp,
    badges,
    challenge,
    stats,
    isLoading:
      achievements.isLoading ||
      xp.isLoading ||
      badges.isLoading ||
      challenge.isLoading ||
      stats.isLoading,
    isError:
      achievements.isError ||
      xp.isError ||
      badges.isError ||
      challenge.isError ||
      stats.isError,
  };
};

export default {
  useAchievements,
  useAvailableAchievements,
  useClaimAchievement,
  useLeaderboard,
  useBadges,
  usePinBadge,
  useUnpinBadge,
  useUserXP,
  useDailyChallenge,
  useCompleteChallenge,
  useGamificationStats,
  useGamificationHub,
};
