import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export enum AchievementCategory {
  PLAYER_MILESTONE = 'PLAYER_MILESTONE',
  SCOUT_EXPERTISE = 'SCOUT_EXPERTISE',
  CLUB_ACHIEVEMENT = 'CLUB_ACHIEVEMENT',
  SOCIAL_ENGAGEMENT = 'SOCIAL_ENGAGEMENT',
  PERFORMANCE = 'PERFORMANCE',
}

export enum AchievementRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export enum BadgeType {
  VERIFIED_PLAYER = 'VERIFIED_PLAYER',
  RISING_STAR = 'RISING_STAR',
  ELITE_PLAYER = 'ELITE_PLAYER',
  GOLDEN_EYE = 'GOLDEN_EYE',
  MASTER_SCOUT = 'MASTER_SCOUT',
  TEAM_BUILDER = 'TEAM_BUILDER',
  CHAMPIONSHIP_GLORY = 'CHAMPIONSHIP_GLORY',
  COMMUNITY_HERO = 'COMMUNITY_HERO',
}

export class CreateAchievementDto {
  @ApiProperty({ example: 'FIRST_GOAL' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'First Goal' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Score your first goal in a match' })
  @IsString()
  description: string;

  @ApiProperty({ example: '⚽' })
  @IsString()
  icon: string;

  @ApiProperty({ enum: AchievementCategory })
  @IsEnum(AchievementCategory)
  category: AchievementCategory;

  @ApiProperty({ enum: AchievementRarity })
  @IsEnum(AchievementRarity)
  rarity: AchievementRarity;

  @ApiProperty({ example: 10 })
  @IsNumber()
  points: number;

  @ApiProperty({
    example: { type: 'goals', value: 1, operator: '>=' },
    description: 'JSON condition for unlocking'
  })
  condition: any;

  @ApiProperty({ enum: BadgeType, required: false })
  @IsOptional()
  @IsEnum(BadgeType)
  rewardBadge?: BadgeType;

  @ApiProperty({ example: 'Goal Scorer', required: false })
  @IsOptional()
  @IsString()
  rewardTitle?: string;
}

export class UserActionDto {
  @ApiProperty({ example: 'GOAL_SCORED' })
  @IsString()
  action: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiProperty({
    example: { matchId: 'match123' },
    required: false
  })
  @IsOptional()
  metadata?: any;
}

export class LeaderboardEntryDto {
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  rank: number;
  previousRank?: number;
  isCurrentUser: boolean;
}

export class GamificationProfileDto {
  level: number;
  currentPoints: number;
  pointsToNextLevel: number;
  levelProgress: number; // percentage
  totalAchievements: number;
  unlockedAchievements: number;
  totalBadges: number;
  currentStreak: number;
  maxStreak: number;
  globalRank?: number;
  weeklyRank?: number;
}

export class AchievementProgressDto {
  achievementId: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress: number; // percentage
  currentValue?: number;
  targetValue?: number;
}

export class BadgeDto {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  awardedAt: Date;
  isPinned: boolean;
  displayOrder: number;
}

export class DailyChallengeDto {
  id: string;
  date: Date;
  title: string;
  description: string;
  icon: string;
  type: string;
  target: number;
  reward: number;
  progress: number;
  completed: boolean;
  completedAt?: Date;
  rewardClaimed: boolean;
}

export class UserStatsDto {
  totalPoints: number;
  currentLevel: number;
  levelProgress: number;
  achievementsCount: number;
  badgesCount: number;
  goalsScored: number;
  assistsMade: number;
  matchesPlayed: number;
  cleanSheets: number;
  playersValidated: number;
  playersRejected: number;
  reportsSubmitted: number;
  talentsDiscovered: number;
  daysActive: number;
  lastActiveAt: Date;
  loginStreak: number;
  maxLoginStreak: number;
}