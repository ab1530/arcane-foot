/**
 * GAMIFICATION TYPES
 * Canonical type definitions shared across gamification features
 *
 * @version 1.1.0
 * @date 2025-11-12
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum AchievementRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum AchievementCategory {
  ALL = 'ALL',
  PLAYER_MILESTONE = 'PLAYER_MILESTONE',
  SCOUT_EXPERTISE = 'SCOUT_EXPERTISE',
  CLUB_ACHIEVEMENT = 'CLUB_ACHIEVEMENT',
  SOCIAL_ENGAGEMENT = 'SOCIAL_ENGAGEMENT',
  PERFORMANCE = 'PERFORMANCE',
}

export enum LeaderboardType {
  ALL_TIME = 'ALL_TIME',
  WEEKLY_OVERALL = 'WEEKLY_OVERALL',
  WEEKLY_SCOUT = 'WEEKLY_SCOUT',
  MONTHLY_PLAYER = 'MONTHLY_PLAYER',
  SEASON_CLUB = 'SEASON_CLUB',
}

export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  SAME = 'same',
}

// ============================================================================
// INTERFACES (UI-FRIENDLY MODELS)
// ============================================================================

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
  unlockedAt?: string | null;
  isLocked: boolean;
  tips?: string[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  rarity: AchievementRarity;
  description: string;
  earnedAt?: string;
  isPinned?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  rank: number;
  score: number;
  scoreLabel: string;
  period?: string;
  trend?: TrendDirection;
  trendChange?: number;
}

export interface UserXP {
  level: number;
  title: string;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  profileCompletion?: number;
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
  challengeType?: string;
}

export interface GamificationStats {
  totalXP: number;
  currentLevel: number;
  currentLevelPoints: number;
  nextLevelPoints: number;
  achievementsCount: number;
  badgesCount: number;
  goalsScored: number;
  matchesPlayed: number;
  playersValidated: number;
  reportsSubmitted: number;
  loginStreak: number;
  lastLoginDate?: string | null;
}

export interface BadgeCollection {
  badges: Badge[];
  total: number;
  rarityBreakdown: {
    [key in AchievementRarity]: number;
  };
}

// ============================================================================
// RAW API RESPONSE TYPES
// ============================================================================

export interface BackendAchievement {
  id: string;
  name: string;
  description: string;
  icon?: string | null;
  category: AchievementCategory | string;
  rarity: string;
  points: number;
  condition?: Record<string, any>;
  rewardBadge?: string | null;
  tips?: string[];
}

export interface BackendUserAchievement {
  id: string;
  achievementId: string;
  unlockedAt?: string | null;
  achievements: BackendAchievement;
}

export interface GetAchievementsResponse {
  unlocked: BackendUserAchievement[];
  total: number;
  unlockedCount: number;
  availableAchievements: BackendAchievement[];
}

export interface GetLeaderboardResponse {
  entries: Array<{
    id: string;
    userId: string;
    category: LeaderboardType | string;
    period: string;
    rank: number;
    score: number;
    users?: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string | null;
    } | null;
  }>;
  currentPeriod?: string;
  userRank?: number | null;
}

export interface GetBadgesResponse {
  badges: Badge[];
  collection?: BadgeCollection;
  total?: number;
  message?: string;
}

export interface ClaimAchievementResponse {
  success: boolean;
  xpGained?: number;
  leveledUp?: boolean;
  newLevel?: number;
  message?: string;
}

export interface CompleteChallengeResponse {
  success: boolean;
  pointsAwarded: number;
}
