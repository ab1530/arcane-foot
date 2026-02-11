-- Add Gamification System - Achievements
-- This migration creates the achievements system for player/scout milestones

-- Create AchievementCategory enum
CREATE TYPE "AchievementCategory" AS ENUM (
  'PLAYER_MILESTONE',
  'SCOUT_EXPERTISE',
  'CLUB_ACHIEVEMENT',
  'SOCIAL_ENGAGEMENT',
  'PERFORMANCE'
);

-- Create AchievementRarity enum
CREATE TYPE "AchievementRarity" AS ENUM (
  'COMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC'
);

-- Create BadgeType enum
CREATE TYPE "BadgeType" AS ENUM (
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'DIAMOND'
);

-- Create achievements table
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "category" "AchievementCategory" NOT NULL,
    "rarity" "AchievementRarity" NOT NULL DEFAULT 'COMMON',
    "points" INTEGER NOT NULL DEFAULT 0,
    "condition" JSONB,
    "rewardBadge" "BadgeType",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on code
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- Create indexes for efficient querying
CREATE INDEX "achievements_category_idx" ON "achievements"("category");
CREATE INDEX "achievements_rarity_idx" ON "achievements"("rarity");

-- Create user_achievements table (for tracking user progress)
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "maxProgress" INTEGER NOT NULL DEFAULT 100,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on userId + achievementId
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- Create indexes for user_achievements
CREATE INDEX "user_achievements_achievementId_idx" ON "user_achievements"("achievementId");
CREATE INDEX "user_achievements_isCompleted_idx" ON "user_achievements"("isCompleted");
CREATE INDEX "user_achievements_userId_idx" ON "user_achievements"("userId");

-- Add foreign key constraint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
