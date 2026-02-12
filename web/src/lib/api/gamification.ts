/**
 * Gamification API Client
 *
 * Handles all gamification-related API calls including achievements,
 * leaderboards, badges, XP, and daily challenges.
 */

import { apiClient } from '@/lib/api-client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'scouting' | 'coaching' | 'reports' | 'social' | 'special';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  progress?: {
    current: number;
    total: number;
  };
  unlockedAt?: string;
  isLocked: boolean;
  requirements?: string;
  earnedBy?: number; // Number of users who earned this
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  rarity: AchievementRarity;
  description: string;
  earnedAt?: string;
  isPinned: boolean;
  category?: string;
  requirement?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  achievementCount: number;
  badgeCount: number;
  trend?: 'up' | 'down' | 'same';
  trendChange?: number;
}

export interface UserXP {
  currentXP: number;
  level: number;
  nextLevelXP: number;
  totalXP: number;
  title: string; // e.g., "Scout Elite", "Master Scout"
  levelProgress: number; // Percentage 0-100
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  progress: {
    current: number;
    total: number;
  };
  expiresAt: string;
  isCompleted: boolean;
  isClaimed: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface LeaderboardFilters {
  period?: 'week' | 'month' | 'all-time';
  region?: string;
  role?: 'scout' | 'coach' | 'analyst';
  limit?: number;
}

export interface AchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  totalXP: number;
  currentStreak: number;
  rankPosition: number;
}

interface BackendLeaderboardEntry {
  id?: string;
  userId: string;
  rank: number;
  score: number;
  previousRank?: number | null;
  achievementCount?: number | null;
  badgeCount?: number | null;
  users?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  } | null;
}

interface BackendLeaderboardResponse {
  entries: BackendLeaderboardEntry[];
  currentPeriod: string;
  userRank?: number | null;
}

interface BackendLeaderboardOverview {
  types: string[];
  current: BackendLeaderboardEntry[];
  currentPeriod?: string;
}

interface GamificationProfileResponse {
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
  stats?: {
    totalPoints?: number;
    currentLevel?: number;
    currentLevelPoints?: number;
    nextLevelPoints?: number;
    loginStreak?: number;
  };
  achievementsCount?: number;
  profileCompleteness?: number;
}

interface BackendDailyChallenge {
  id: string;
  title: string;
  description: string;
  challengeType?: string;
  targetValue: number;
  rewardPoints: number;
  expiresAt: string;
  userProgress?: number;
  isCompleted?: boolean;
  isClaimed?: boolean;
}

interface ClaimDailyChallengeResponse {
  success: boolean;
  pointsAwarded: number;
}

const API_BASE_URL_ENV = process.env.NEXT_PUBLIC_API_URL || '';
const API_PREFIX = /\/api\/?$/i.test(API_BASE_URL_ENV) ? '' : '/api';

const withApiPrefix = (path: string) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_PREFIX}${normalized}`;
};

const getStoredUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('arcane_user');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.id || parsed?.userId || null;
  } catch {
    return null;
  }
};

const mapDailyChallenge = (challenge: BackendDailyChallenge): DailyChallenge => ({
  id: challenge.id,
  title: challenge.title,
  description: challenge.description,
  icon: '🎯',
  xpReward: challenge.rewardPoints,
  progress: {
    current: challenge.userProgress ?? 0,
    total: challenge.targetValue ?? 1,
  },
  expiresAt: challenge.expiresAt,
  isCompleted: Boolean(challenge.isCompleted),
  isClaimed: Boolean(challenge.isClaimed),
  difficulty: challenge.challengeType?.toLowerCase().includes('hard')
    ? 'hard'
    : challenge.challengeType?.toLowerCase().includes('easy')
      ? 'easy'
      : 'medium',
});

function formatLeaderboardEntry(entry: BackendLeaderboardEntry): LeaderboardEntry {
  const score = entry.score ?? 0;
  const displayName =
    `${entry.users?.firstName ?? ''} ${entry.users?.lastName ?? ''}`.trim() || 'Unknown Player';
  const previousRank = typeof entry.previousRank === 'number' ? entry.previousRank : null;
  const trendDelta = previousRank !== null ? previousRank - (entry.rank ?? 0) : 0;
  let trend: LeaderboardEntry['trend'];

  if (previousRank !== null) {
    if (trendDelta > 0) trend = 'up';
    else if (trendDelta < 0) trend = 'down';
    else trend = 'same';
  }

  return {
    rank: entry.rank ?? 0,
    userId: entry.userId,
    name: displayName,
    avatar: entry.users?.avatar || undefined,
    xp: score,
    level: calculateLevel(score),
    achievementCount: entry.achievementCount ?? 0,
    badgeCount: entry.badgeCount ?? 0,
    trend,
    trendChange: trendDelta || undefined,
  };
}

// ============================================================================
// API CLIENT
// ============================================================================

export const gamificationApi = {
  // ============================================================================
  // ACHIEVEMENTS
  // ============================================================================

  /**
   * Get all user achievements (unlocked and locked)
   * GET /gamification/achievements
   */
  getAchievements: async (): Promise<Achievement[]> => {
    try {
      const response = await apiClient.request<Achievement[]>(withApiPrefix('/gamification/achievements'), {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      throw error;
    }
  },

  /**
   * Get available achievements (achievements user can still earn)
   * GET /gamification/achievements/available
   */
  getAvailableAchievements: async (): Promise<Achievement[]> => {
    try {
      const response = await apiClient.request<Achievement[]>(withApiPrefix('/gamification/achievements/available'), {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch available achievements:', error);
      throw error;
    }
  },

  /**
   * Claim an achievement reward
   * POST /gamification/achievements/:id/claim
   */
  claimAchievement: async (id: string): Promise<{ achievement: Achievement; xpGained: number }> => {
    try {
      const response = await apiClient.request<{ achievement: Achievement; xpGained: number }>(
        withApiPrefix(`/gamification/achievements/${id}/claim`),
        {
          method: 'POST',
        }
      );
      return response;
    } catch (error) {
      console.error('Failed to claim achievement:', error);
      throw error;
    }
  },

  // ============================================================================
  // LEADERBOARDS
  // ============================================================================

  /**
   * Get all leaderboard types
   * GET /api/gamification/leaderboards
   */
  getLeaderboards: async (): Promise<{ types: string[]; current: LeaderboardEntry[]; currentPeriod?: string }> => {
    try {
      const response = await apiClient.request<BackendLeaderboardOverview>(
        withApiPrefix('/gamification/leaderboards'),
        {
          method: 'GET',
        }
      );
      return {
        types: response?.types || [],
        current: (response?.current || []).map(formatLeaderboardEntry),
        currentPeriod: response?.currentPeriod,
      };
    } catch (error) {
      console.error('Failed to fetch leaderboards:', error);
      throw error;
    }
  },

  /**
   * Get specific leaderboard by type
   * GET /gamification/leaderboard/:category
   */
  getLeaderboard: async (
    type: string,
    params?: LeaderboardFilters
  ): Promise<{ entries: LeaderboardEntry[]; userPosition?: LeaderboardEntry; currentPeriod?: string; userRank?: number | null }> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const query = queryParams.toString();
      const endpoint = withApiPrefix(`/gamification/leaderboard/${type}${query ? `?${query}` : ''}`);

      const response = await apiClient.request<BackendLeaderboardResponse>(endpoint, {
        method: 'GET',
      });

      const entries = (response?.entries || []).map(formatLeaderboardEntry);
      const currentUserId = getStoredUserId();
      const userPosition = currentUserId ? entries.find((entry) => entry.userId === currentUserId) : undefined;

      return {
        entries,
        userPosition,
        currentPeriod: response?.currentPeriod,
        userRank: response?.userRank ?? userPosition?.rank ?? null,
      };
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      throw error;
    }
  },

  // ============================================================================
  // BADGES
  // ============================================================================

  /**
   * Get all user badges
   * GET /gamification/badges
   */
  getBadges: async (): Promise<Badge[]> => {
    try {
      const response = await apiClient.request<Badge[]>(withApiPrefix('/gamification/badges'), {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch badges:', error);
      throw error;
    }
  },

  /**
   * Pin or unpin a badge to profile
   * POST /gamification/badge/:id/pin
   */
  pinBadge: async (id: string, pin: boolean = true): Promise<{ badge: Badge; message: string }> => {
    try {
      const response = await apiClient.request<{ badge: Badge; message: string }>(
        withApiPrefix(`/gamification/badge/${id}/pin`),
        {
          method: 'POST',
          body: { pin },
        }
      );
      return response;
    } catch (error) {
      console.error('Failed to pin badge:', error);
      throw error;
    }
  },

  // ============================================================================
  // XP & LEVELS
  // ============================================================================

  /**
   * Get user XP and level information
   * GET /gamification/profile
   */
  getUserXP: async (): Promise<UserXP> => {
    try {
      const response = await apiClient.request<GamificationProfileResponse>(
        withApiPrefix('/gamification/profile'),
        {
          method: 'GET',
        }
      );

      const stats = response?.stats ?? {};
      const totalXP = stats.totalPoints ?? 0;
      const level = stats.currentLevel ?? calculateLevel(totalXP);
      const nextLevelXP = stats.nextLevelPoints ?? calculateNextLevelXP(level);
      const currentXP = stats.currentLevelPoints ?? 0;

      return {
        currentXP,
        level,
        nextLevelXP,
        totalXP,
        title: getLevelTitle(level),
        levelProgress: nextLevelXP > 0 ? Math.min(100, Math.round((currentXP / nextLevelXP) * 100)) : 0,
      };
    } catch (error) {
      console.error('Failed to fetch user XP:', error);
      throw error;
    }
  },

  // ============================================================================
  // DAILY CHALLENGES
  // ============================================================================

  /**
   * Get today's daily challenge
   * GET /gamification/daily-challenge
   */
  getDailyChallenge: async (): Promise<DailyChallenge | null> => {
    try {
      const response = await apiClient.request<BackendDailyChallenge | null>(
        withApiPrefix('/gamification/daily-challenge'),
        {
          method: 'GET',
        }
      );
      return response ? mapDailyChallenge(response) : null;
    } catch (error) {
      console.error('Failed to fetch daily challenge:', error);
      throw error;
    }
  },

  /**
   * Claim the current daily challenge reward
   * POST /gamification/daily-challenge/claim
   */
  completeChallenge: async (id: string): Promise<{ xpGained: number; success: boolean }> => {
    try {
      const response = await apiClient.request<ClaimDailyChallengeResponse>(
        withApiPrefix('/gamification/daily-challenge/claim'),
        {
          method: 'POST',
          body: { challengeId: id },
        }
      );
      return {
        xpGained: response.pointsAwarded,
        success: response.success,
      };
    } catch (error) {
      console.error('Failed to complete challenge:', error);
      throw error;
    }
  },

  // ============================================================================
  // STATS & ANALYTICS
  // ============================================================================

  /**
   * Get achievement statistics
   * (Helper function combining multiple endpoints)
   */
  getAchievementStats: async (): Promise<AchievementStats> => {
    try {
      const [achievements, xpData] = await Promise.all([
        gamificationApi.getAchievements(),
        gamificationApi.getUserXP(),
      ]);

      const unlockedCount = achievements.filter((a) => !a.isLocked).length;

      return {
        totalAchievements: achievements.length,
        unlockedAchievements: unlockedCount,
        totalXP: xpData.totalXP,
        currentStreak: 7, // This would come from backend
        rankPosition: 156, // This would come from backend
      };
    } catch (error) {
      console.error('Failed to fetch achievement stats:', error);
      throw error;
    }
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color based on rarity
 */
export const getRarityColor = (rarity: AchievementRarity): string => {
  const colors = {
    common: '#71717A',    // Gray
    rare: '#3B82F6',      // Blue
    epic: '#8B5CF6',      // Purple
    legendary: '#F59E0B', // Gold
  };
  return colors[rarity];
};

/**
 * Get rarity label
 */
export const getRarityLabel = (rarity: AchievementRarity): string => {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
};

/**
 * Calculate level from XP
 */
export const calculateLevel = (xp: number): number => {
  // Simple formula: level = floor(sqrt(xp / 100))
  return Math.floor(Math.sqrt(xp / 100));
};

/**
 * Calculate XP needed for next level
 */
export const calculateNextLevelXP = (level: number): number => {
  // Inverse of level formula
  return (level + 1) * (level + 1) * 100;
};

/**
 * Get level title based on level
 */
export const getLevelTitle = (level: number): string => {
  if (level >= 50) return 'Legendary Scout';
  if (level >= 40) return 'Master Scout';
  if (level >= 30) return 'Expert Scout';
  if (level >= 20) return 'Elite Scout';
  if (level >= 10) return 'Professional Scout';
  if (level >= 5) return 'Scout';
  return 'Novice Scout';
};

/**
 * Format large numbers (e.g., 12500 -> 12.5K)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Get time remaining in human-readable format
 */
export const getTimeRemaining = (expiresAt: string): string => {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Get achievement category icon
 */
export const getCategoryIcon = (category: AchievementCategory): string => {
  const icons = {
    scouting: '🔍',
    coaching: '⚽',
    reports: '📝',
    social: '👥',
    special: '⭐',
  };
  return icons[category] || '🏆';
};
