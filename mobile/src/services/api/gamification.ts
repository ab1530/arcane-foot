/**
 * GAMIFICATION API SERVICE
 * Bridges the mobile gamification experience with the NestJS backend.
 *
 * @version 1.1.0
 * @date 2025-11-12
 */

import { api } from '../api';
import {
  AchievementCategory,
  AchievementRarity,
  LeaderboardType,
} from '../../types/gamification';
import type {
  Achievement,
  BackendAchievement,
  BackendUserAchievement,
  Badge,
  ClaimAchievementResponse,
  CompleteChallengeResponse,
  DailyChallenge,
  GamificationStats,
  GetAchievementsResponse,
  GetBadgesResponse,
  GetLeaderboardResponse,
  LeaderboardEntry,
  UserXP,
} from '../../types/gamification';

// ============================================================================
// HELPERS
// ============================================================================

const ACHIEVEMENT_ICONS: Partial<Record<AchievementCategory, string>> = {
  [AchievementCategory.PLAYER_MILESTONE]: '🎯',
  [AchievementCategory.SCOUT_EXPERTISE]: '🔍',
  [AchievementCategory.CLUB_ACHIEVEMENT]: '🏟️',
  [AchievementCategory.SOCIAL_ENGAGEMENT]: '🤝',
  [AchievementCategory.PERFORMANCE]: '⚡',
};

const CHALLENGE_ICONS: Record<string, string> = {
  score_goals: '⚽',
  validate_players: '🕵️',
  make_assists: '🎯',
  complete_profile: '🪪',
};

const SCORE_LABELS: Partial<Record<LeaderboardType, string>> = {
  [LeaderboardType.ALL_TIME]: 'XP',
  [LeaderboardType.WEEKLY_OVERALL]: 'pts',
  [LeaderboardType.WEEKLY_SCOUT]: 'validations',
  [LeaderboardType.MONTHLY_PLAYER]: 'pts',
  [LeaderboardType.SEASON_CLUB]: 'score',
};

const isAchievementCategory = (value?: string): value is AchievementCategory => {
  if (!value) return false;
  return (Object.values(AchievementCategory) as string[]).includes(value);
};

const toAchievementCategory = (value?: string): AchievementCategory => {
  if (isAchievementCategory(value)) {
    return value as AchievementCategory;
  }
  return AchievementCategory.PLAYER_MILESTONE;
};

const toRarity = (value?: string): AchievementRarity => {
  if (!value) return AchievementRarity.COMMON;
  const normalized = value.toLowerCase() as AchievementRarity;
  return (Object.values(AchievementRarity) as string[]).includes(normalized)
    ? normalized
    : AchievementRarity.COMMON;
};

const formatUserName = (user?: { firstName?: string | null; lastName?: string | null }): string => {
  if (!user) return 'Unknown';
  const first = user.firstName?.trim() ?? '';
  const last = user.lastName?.trim() ?? '';
  const full = `${first} ${last}`.trim();
  return full || 'Unknown';
};

const getLevelTitle = (level: number): string => {
  if (level >= 25) return 'Arcane Legend';
  if (level >= 20) return 'Master Scout';
  if (level >= 15) return 'Elite Analyst';
  if (level >= 10) return 'Pro Scout';
  if (level >= 5) return 'Rising Talent';
  return 'Scout Rookie';
};

const mapAchievement = (
  achievement: BackendAchievement,
  unlockedAt?: string | null
): Achievement => {
  const category = toAchievementCategory(
    typeof achievement.category === 'string' ? achievement.category : undefined
  );
  const icon = achievement.icon || ACHIEVEMENT_ICONS[category] || '🏆';
  const targetValue =
    typeof achievement.condition?.value === 'number' ? achievement.condition.value : undefined;
  const progress =
    targetValue && targetValue > 0
      ? {
          current: unlockedAt ? targetValue : 0,
          total: targetValue,
        }
      : undefined;

  return {
    id: achievement.id,
    title: achievement.name,
    description: achievement.description,
    icon,
    category,
    rarity: toRarity(achievement.rarity),
    xpReward: achievement.points ?? 0,
    progress,
    unlockedAt: unlockedAt ?? null,
    isLocked: !unlockedAt,
    tips: achievement.tips,
  };
};

const mergeAchievements = (
  payload?: GetAchievementsResponse | Achievement[] | null
): Achievement[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const collection = new Map<string, Achievement>();

  (payload.unlocked ?? []).forEach((item: BackendUserAchievement) => {
    if (!item?.achievements) return;
    const normalized = mapAchievement(item.achievements, item.unlockedAt);
    collection.set(normalized.id, normalized);
  });

  (payload.availableAchievements ?? []).forEach((item: BackendAchievement) => {
    if (!item) return;
    if (collection.has(item.id)) return;
    collection.set(item.id, mapAchievement(item, null));
  });

  return Array.from(collection.values());
};

const mapDailyChallenge = (payload?: any): DailyChallenge | null => {
  if (!payload) return null;

  const total = Math.max(payload.targetValue ?? 1, 1);

  return {
    id: payload.id,
    title: payload.title,
    description: payload.description,
    icon: CHALLENGE_ICONS[payload.challengeType] || '🔥',
    xpReward: payload.rewardPoints ?? 0,
    progress: {
      current: payload.userProgress ?? 0,
      total,
    },
    expiresAt: payload.expiresAt ?? payload.date ?? new Date().toISOString(),
    isCompleted: Boolean(payload.isCompleted),
    isClaimed: Boolean(payload.isClaimed),
    challengeType: payload.challengeType,
  };
};

const mapLeaderboardEntries = (
  response?: GetLeaderboardResponse | LeaderboardEntry[] | null,
  category?: string
): LeaderboardEntry[] => {
  if (!response) return [];
  if (Array.isArray(response)) {
    return response as LeaderboardEntry[];
  }

  const scoreLabel = SCORE_LABELS[category as LeaderboardType] || 'pts';

  return (response.entries ?? []).map(entry => ({
    id: entry.id,
    userId: entry.userId,
    name: formatUserName(entry.users ?? undefined),
    avatar: entry.users?.avatar ?? undefined,
    rank: entry.rank ?? 0,
    score: entry.score ?? 0,
    scoreLabel,
    period: response.currentPeriod,
  }));
};

const mapStats = (payload?: any): GamificationStats => {
  return {
    totalXP: payload?.totalPoints ?? 0,
    currentLevel: payload?.currentLevel ?? 1,
    currentLevelPoints: payload?.currentLevelPoints ?? 0,
    nextLevelPoints: payload?.nextLevelPoints ?? 100,
    achievementsCount: payload?.achievementsCount ?? 0,
    badgesCount: payload?.badgesCount ?? 0,
    goalsScored: payload?.goalsScored ?? 0,
    matchesPlayed: payload?.matchesPlayed ?? 0,
    playersValidated: payload?.playersValidated ?? 0,
    reportsSubmitted: payload?.reportsSubmitted ?? 0,
    loginStreak: payload?.loginStreak ?? 0,
    lastLoginDate: payload?.lastLoginDate ?? null,
  };
};

interface GamificationProfileResponse {
  stats?: any;
  achievementsCount?: number;
  profileCompleteness?: number;
}

const mapProfileToUserXP = (payload?: GamificationProfileResponse): UserXP => {
  const stats = mapStats(payload?.stats);
  return {
    level: stats.currentLevel,
    title: getLevelTitle(stats.currentLevel),
    currentXP: stats.currentLevelPoints,
    nextLevelXP: stats.nextLevelPoints,
    totalXP: stats.totalXP,
    profileCompletion: payload?.profileCompleteness,
  };
};

// ============================================================================
// GAMIFICATION SERVICE
// ============================================================================

export const gamificationService = {
  /**
   * Fetch user achievements (unlocked + available)
   */
  getAchievements: async (): Promise<Achievement[]> => {
    const response = await api.getRaw<GetAchievementsResponse>('/gamification/achievements');
    return mergeAchievements(response);
  },

  /**
   * Convenience helper returning only locked achievements
   */
  getAvailableAchievements: async (): Promise<Achievement[]> => {
    const achievements = await gamificationService.getAchievements();
    return achievements.filter(achievement => achievement.isLocked);
  },

  /**
   * Claim achievement placeholder (backend unlocks automatically)
   */
  claimAchievement: async (): Promise<ClaimAchievementResponse> => {
    throw new Error('La validation manuelle des succès est gérée automatiquement côté backend.');
  },

  /**
   * Fetch leaderboard entries for a category
   */
  getLeaderboard: async (
    type: LeaderboardType | string,
    params?: { limit?: number }
  ): Promise<LeaderboardEntry[]> => {
    const category = (type || LeaderboardType.ALL_TIME).toString().toUpperCase();
    const response = await api.getRaw<GetLeaderboardResponse>(
      `/gamification/leaderboard/${category}`,
      {
        params: { limit: params?.limit ?? 100 },
      }
    );
    return mapLeaderboardEntries(response, category);
  },

  /**
   * Fetch badge collection (placeholder data on backend today)
   */
  getBadges: async (): Promise<Badge[]> => {
    const response = await api.getRaw<GetBadgesResponse>('/gamification/badges');
    if (!response) return [];
    if (Array.isArray(response)) return response as Badge[];
    return Array.isArray(response.badges) ? response.badges : [];
  },

  /**
   * Pin badge on profile (server-side placeholder implementation)
   */
  pinBadge: async (id: string): Promise<any> => {
    return api.postRaw(`/gamification/badge/${id}/pin`);
  },

  /**
   * Local no-op until backend exposes an unpin route
   */
  unpinBadge: async (id: string): Promise<any> => {
    console.warn(
      `[gamification] Unpin badge (${id}) is not supported by the backend yet.`,
    );
    return { success: true, unsupported: true };
  },

  /**
   * Fetch gamification profile to drive level badge + XP progress
   */
  getUserXP: async (): Promise<UserXP> => {
    const profile = await api.getRaw<GamificationProfileResponse>('/gamification/profile');
    return mapProfileToUserXP(profile);
  },

  /**
   * Fetch current daily challenge (returns null if not configured)
   */
  getDailyChallenge: async (): Promise<DailyChallenge | null> => {
    const data = await api.getRaw<any>('/gamification/daily-challenge');
    return mapDailyChallenge(data);
  },

  /**
   * Claim reward for the current daily challenge
   */
  completeChallenge: async (): Promise<CompleteChallengeResponse> => {
    return api.postRaw<CompleteChallengeResponse>('/gamification/daily-challenge/claim');
  },

  /**
   * Fetch canonical stats straight from backend (no client-side aggregation)
   */
  getStats: async (): Promise<GamificationStats> => {
    const stats = await api.getRaw<any>('/gamification/stats');
    return mapStats(stats);
  },
};

export default gamificationService;
