/**
 * React Query Hooks for Gamification
 *
 * Custom hooks for managing gamification data with React Query.
 * Includes caching, automatic refetching, and optimistic updates.
 */

'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { gamificationApi, Achievement, Badge, LeaderboardEntry, UserXP, DailyChallenge, LeaderboardFilters } from '@/lib/api/gamification';
import { toast } from 'sonner';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const GAMIFICATION_KEYS = {
  all: ['gamification'] as const,
  achievements: () => [...GAMIFICATION_KEYS.all, 'achievements'] as const,
  availableAchievements: () => [...GAMIFICATION_KEYS.all, 'achievements', 'available'] as const,
  leaderboards: () => [...GAMIFICATION_KEYS.all, 'leaderboards'] as const,
  leaderboard: (type: string, filters?: LeaderboardFilters) =>
    [...GAMIFICATION_KEYS.leaderboards(), type, filters] as const,
  badges: () => [...GAMIFICATION_KEYS.all, 'badges'] as const,
  xp: () => [...GAMIFICATION_KEYS.all, 'xp'] as const,
  dailyChallenge: () => [...GAMIFICATION_KEYS.all, 'challenge', 'daily'] as const,
  stats: () => [...GAMIFICATION_KEYS.all, 'stats'] as const,
};

// ============================================================================
// ACHIEVEMENTS HOOKS
// ============================================================================

/**
 * Get all achievements (unlocked and locked)
 */
export const useAchievements = (options?: Omit<UseQueryOptions<Achievement[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.achievements(),
    queryFn: gamificationApi.getAchievements,
    staleTime: 60000, // 1 minute
    ...options,
  });
};

/**
 * Get available achievements (can still be earned)
 */
export const useAvailableAchievements = (options?: Omit<UseQueryOptions<Achievement[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.availableAchievements(),
    queryFn: gamificationApi.getAvailableAchievements,
    staleTime: 60000,
    ...options,
  });
};

/**
 * Claim an achievement
 */
export const useClaimAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gamificationApi.claimAchievement,
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.achievements() });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.xp() });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.stats() });

      // Show success message with XP gained
      toast.success(`Achievement claimed! +${data.xpGained} XP`, {
        description: data.achievement.title,
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to claim achievement', {
        description: error.message || 'Please try again later',
      });
    },
  });
};

// ============================================================================
// LEADERBOARD HOOKS
// ============================================================================

/**
 * Get all leaderboard types
 */
export const useLeaderboards = (options?: Omit<UseQueryOptions<{ types: string[]; current: LeaderboardEntry[]; currentPeriod?: string }>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.leaderboards(),
    queryFn: gamificationApi.getLeaderboards,
    staleTime: 30000, // 30 seconds for real-time feel
    ...options,
  });
};

/**
 * Get specific leaderboard by type
 */
export const useLeaderboard = (
  type: string,
  filters?: LeaderboardFilters,
  options?: Omit<UseQueryOptions<{ entries: LeaderboardEntry[]; userPosition?: LeaderboardEntry; currentPeriod?: string; userRank?: number | null }>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.leaderboard(type, filters),
    queryFn: () => gamificationApi.getLeaderboard(type, filters),
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30s
    ...options,
  });
};

// ============================================================================
// BADGE HOOKS
// ============================================================================

/**
 * Get all user badges
 */
export const useBadges = (options?: Omit<UseQueryOptions<Badge[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.badges(),
    queryFn: gamificationApi.getBadges,
    staleTime: 60000,
    ...options,
  });
};

/**
 * Pin or unpin a badge
 */
export const usePinBadge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: boolean }) => gamificationApi.pinBadge(id, pin),
    onMutate: async ({ id, pin }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: GAMIFICATION_KEYS.badges() });

      // Snapshot previous value
      const previousBadges = queryClient.getQueryData<Badge[]>(GAMIFICATION_KEYS.badges());

      // Optimistically update
      queryClient.setQueryData<Badge[]>(GAMIFICATION_KEYS.badges(), (old) => {
        if (!old) return old;
        return old.map((badge) => (badge.id === id ? { ...badge, isPinned: pin } : badge));
      });

      return { previousBadges };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousBadges) {
        queryClient.setQueryData(GAMIFICATION_KEYS.badges(), context.previousBadges);
      }
      toast.error('Failed to update badge', {
        description: error.message || 'Please try again later',
      });
    },
    onSuccess: (data, { pin }) => {
      toast.success(pin ? 'Badge pinned!' : 'Badge unpinned', {
        description: data.badge.name,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.badges() });
    },
  });
};

// ============================================================================
// XP & LEVEL HOOKS
// ============================================================================

/**
 * Get user XP and level
 */
export const useUserXP = (options?: Omit<UseQueryOptions<UserXP>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.xp(),
    queryFn: gamificationApi.getUserXP,
    staleTime: 60000,
    ...options,
  });
};

// ============================================================================
// DAILY CHALLENGE HOOKS
// ============================================================================

/**
 * Get today's daily challenge
 */
export const useDailyChallenge = (options?: Omit<UseQueryOptions<DailyChallenge | null>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.dailyChallenge(),
    queryFn: gamificationApi.getDailyChallenge,
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    ...options,
  });
};

/**
 * Complete a daily challenge
 */
export const useCompleteChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gamificationApi.completeChallenge,
    onSuccess: (data, challengeId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.dailyChallenge() });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.xp() });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.stats() });

      const cachedChallenge = queryClient.getQueryData<DailyChallenge | null>(GAMIFICATION_KEYS.dailyChallenge());

      // Show success with confetti
      toast.success(`Challenge completed! +${data.xpGained} XP`, {
        description: cachedChallenge?.title || 'Daily challenge reward claimed',
        duration: 5000,
      });

      // Trigger confetti animation (will be handled by component)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('challenge-completed', {
            detail: { ...data, challenge: cachedChallenge, challengeId },
          })
        );
      }
    },
    onError: (error: any) => {
      toast.error('Failed to complete challenge', {
        description: error.message || 'Please try again later',
      });
    },
  });
};

// ============================================================================
// STATS HOOKS
// ============================================================================

/**
 * Get achievement statistics
 */
export const useAchievementStats = (options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.stats(),
    queryFn: gamificationApi.getAchievementStats,
    staleTime: 60000,
    ...options,
  });
};

// ============================================================================
// COMBINED HOOKS
// ============================================================================

/**
 * Get all gamification data for dashboard
 */
export const useGamificationDashboard = () => {
  const achievements = useAchievements();
  const badges = useBadges();
  const xp = useUserXP();
  const dailyChallenge = useDailyChallenge();
  const stats = useAchievementStats();

  return {
    achievements,
    badges,
    xp,
    dailyChallenge,
    stats,
    isLoading:
      achievements.isLoading ||
      badges.isLoading ||
      xp.isLoading ||
      dailyChallenge.isLoading ||
      stats.isLoading,
    isError:
      achievements.isError ||
      badges.isError ||
      xp.isError ||
      dailyChallenge.isError ||
      stats.isError,
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Prefetch achievements data
 */
export const usePrefetchAchievements = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: GAMIFICATION_KEYS.achievements(),
      queryFn: gamificationApi.getAchievements,
      staleTime: 60000,
    });
  };
};

/**
 * Invalidate all gamification queries
 */
export const useInvalidateGamification = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.all });
  };
};
