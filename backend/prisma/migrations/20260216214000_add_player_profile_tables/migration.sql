-- CreateEnum
CREATE TYPE "ProfileContentStatus" AS ENUM ('DRAFT', 'VERIFIED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProfileTeamLevel" AS ENUM ('YOUTH', 'SENIOR', 'NATIONAL');

-- CreateEnum
CREATE TYPE "ProfileNationalTeamLevel" AS ENUM ('U17', 'U19', 'U21', 'A');

-- CreateTable
CREATE TABLE "player_profile_meta" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "mainPosition" TEXT,
    "otherPositions" JSONB,
    "agentName" TEXT,
    "pronunciation" TEXT,
    "outfitter" TEXT,
    "socialLinks" JSONB,
    "externalMarketUrl" TEXT,
    "lastUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_profile_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_profile_performance_rows" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "season" TEXT,
    "competitionName" TEXT NOT NULL,
    "competitionLogoUrl" TEXT,
    "possibleGames" INTEGER,
    "appearances" INTEGER,
    "goals" INTEGER,
    "assists" INTEGER,
    "yellowCards" INTEGER,
    "secondYellowCards" INTEGER,
    "redCards" INTEGER,
    "startingXIPercent" DOUBLE PRECISION,
    "minutesPercent" DOUBLE PRECISION,
    "goalParticipationPercent" DOUBLE PRECISION,
    "contentStatus" "ProfileContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_profile_performance_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_transfer_events" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "season" TEXT,
    "transferDate" TIMESTAMP(3),
    "fromClubName" TEXT,
    "toClubName" TEXT NOT NULL,
    "marketValueAtTime" DOUBLE PRECISION,
    "feeAmount" DOUBLE PRECISION,
    "feeCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "transferType" TEXT,
    "notes" TEXT,
    "contentStatus" "ProfileContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_transfer_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_career_entries" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "clubName" TEXT NOT NULL,
    "teamLevel" "ProfileTeamLevel" NOT NULL,
    "isLoan" BOOLEAN NOT NULL DEFAULT false,
    "contentStatus" "ProfileContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_career_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_achievements_entries" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "competition" TEXT,
    "season" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "contentStatus" "ProfileContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_achievements_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_national_team_entries" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "teamLevel" "ProfileNationalTeamLevel" NOT NULL,
    "caps" INTEGER,
    "goals" INTEGER,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "contentStatus" "ProfileContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_national_team_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_news_entries" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT,
    "publishedAtSource" TIMESTAMP(3),
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "contentStatus" "ProfileContentStatus" NOT NULL DEFAULT 'DRAFT',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_news_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_rumour_entries" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT,
    "destinationClub" TEXT,
    "probabilityPercent" INTEGER,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "contentStatus" "ProfileContentStatus" NOT NULL DEFAULT 'DRAFT',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_rumour_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_profile_meta_playerId_key" ON "player_profile_meta"("playerId");
CREATE INDEX "player_profile_meta_playerId_idx" ON "player_profile_meta"("playerId");

CREATE INDEX "player_profile_performance_rows_playerId_contentStatus_createdAt_idx" ON "player_profile_performance_rows"("playerId", "contentStatus", "createdAt");
CREATE INDEX "player_profile_performance_rows_createdById_idx" ON "player_profile_performance_rows"("createdById");
CREATE INDEX "player_profile_performance_rows_updatedById_idx" ON "player_profile_performance_rows"("updatedById");
CREATE INDEX "player_profile_performance_rows_verifiedById_idx" ON "player_profile_performance_rows"("verifiedById");
CREATE INDEX "player_profile_performance_rows_season_idx" ON "player_profile_performance_rows"("season");

CREATE INDEX "player_transfer_events_playerId_contentStatus_createdAt_idx" ON "player_transfer_events"("playerId", "contentStatus", "createdAt");
CREATE INDEX "player_transfer_events_createdById_idx" ON "player_transfer_events"("createdById");
CREATE INDEX "player_transfer_events_updatedById_idx" ON "player_transfer_events"("updatedById");
CREATE INDEX "player_transfer_events_verifiedById_idx" ON "player_transfer_events"("verifiedById");
CREATE INDEX "player_transfer_events_transferDate_idx" ON "player_transfer_events"("transferDate");

CREATE INDEX "player_career_entries_playerId_contentStatus_createdAt_idx" ON "player_career_entries"("playerId", "contentStatus", "createdAt");
CREATE INDEX "player_career_entries_createdById_idx" ON "player_career_entries"("createdById");
CREATE INDEX "player_career_entries_updatedById_idx" ON "player_career_entries"("updatedById");
CREATE INDEX "player_career_entries_verifiedById_idx" ON "player_career_entries"("verifiedById");
CREATE INDEX "player_career_entries_startDate_idx" ON "player_career_entries"("startDate");

CREATE INDEX "player_achievements_entries_playerId_contentStatus_createdAt_idx" ON "player_achievements_entries"("playerId", "contentStatus", "createdAt");
CREATE INDEX "player_achievements_entries_createdById_idx" ON "player_achievements_entries"("createdById");
CREATE INDEX "player_achievements_entries_updatedById_idx" ON "player_achievements_entries"("updatedById");
CREATE INDEX "player_achievements_entries_verifiedById_idx" ON "player_achievements_entries"("verifiedById");
CREATE INDEX "player_achievements_entries_season_idx" ON "player_achievements_entries"("season");

CREATE INDEX "player_national_team_entries_playerId_contentStatus_createdAt_idx" ON "player_national_team_entries"("playerId", "contentStatus", "createdAt");
CREATE INDEX "player_national_team_entries_createdById_idx" ON "player_national_team_entries"("createdById");
CREATE INDEX "player_national_team_entries_updatedById_idx" ON "player_national_team_entries"("updatedById");
CREATE INDEX "player_national_team_entries_verifiedById_idx" ON "player_national_team_entries"("verifiedById");
CREATE INDEX "player_national_team_entries_fromDate_idx" ON "player_national_team_entries"("fromDate");

CREATE INDEX "player_news_entries_playerId_contentStatus_createdAt_idx" ON "player_news_entries"("playerId", "contentStatus", "createdAt");
CREATE INDEX "player_news_entries_createdById_idx" ON "player_news_entries"("createdById");
CREATE INDEX "player_news_entries_updatedById_idx" ON "player_news_entries"("updatedById");
CREATE INDEX "player_news_entries_verifiedById_idx" ON "player_news_entries"("verifiedById");
CREATE INDEX "player_news_entries_publishedAtSource_idx" ON "player_news_entries"("publishedAtSource");

CREATE INDEX "player_rumour_entries_playerId_contentStatus_createdAt_idx" ON "player_rumour_entries"("playerId", "contentStatus", "createdAt");
CREATE INDEX "player_rumour_entries_createdById_idx" ON "player_rumour_entries"("createdById");
CREATE INDEX "player_rumour_entries_updatedById_idx" ON "player_rumour_entries"("updatedById");
CREATE INDEX "player_rumour_entries_verifiedById_idx" ON "player_rumour_entries"("verifiedById");
CREATE INDEX "player_rumour_entries_sourceDate_idx" ON "player_rumour_entries"("sourceDate");

-- AddForeignKey
ALTER TABLE "player_profile_meta"
  ADD CONSTRAINT "player_profile_meta_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "player_profile_performance_rows"
  ADD CONSTRAINT "player_profile_performance_rows_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_profile_performance_rows"
  ADD CONSTRAINT "player_profile_performance_rows_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_profile_performance_rows"
  ADD CONSTRAINT "player_profile_performance_rows_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_profile_performance_rows"
  ADD CONSTRAINT "player_profile_performance_rows_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "player_transfer_events"
  ADD CONSTRAINT "player_transfer_events_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_transfer_events"
  ADD CONSTRAINT "player_transfer_events_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_transfer_events"
  ADD CONSTRAINT "player_transfer_events_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_transfer_events"
  ADD CONSTRAINT "player_transfer_events_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "player_career_entries"
  ADD CONSTRAINT "player_career_entries_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_career_entries"
  ADD CONSTRAINT "player_career_entries_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_career_entries"
  ADD CONSTRAINT "player_career_entries_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_career_entries"
  ADD CONSTRAINT "player_career_entries_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "player_achievements_entries"
  ADD CONSTRAINT "player_achievements_entries_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_achievements_entries"
  ADD CONSTRAINT "player_achievements_entries_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_achievements_entries"
  ADD CONSTRAINT "player_achievements_entries_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_achievements_entries"
  ADD CONSTRAINT "player_achievements_entries_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "player_national_team_entries"
  ADD CONSTRAINT "player_national_team_entries_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_national_team_entries"
  ADD CONSTRAINT "player_national_team_entries_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_national_team_entries"
  ADD CONSTRAINT "player_national_team_entries_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_national_team_entries"
  ADD CONSTRAINT "player_national_team_entries_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "player_news_entries"
  ADD CONSTRAINT "player_news_entries_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_news_entries"
  ADD CONSTRAINT "player_news_entries_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_news_entries"
  ADD CONSTRAINT "player_news_entries_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_news_entries"
  ADD CONSTRAINT "player_news_entries_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "player_rumour_entries"
  ADD CONSTRAINT "player_rumour_entries_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_rumour_entries"
  ADD CONSTRAINT "player_rumour_entries_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_rumour_entries"
  ADD CONSTRAINT "player_rumour_entries_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_rumour_entries"
  ADD CONSTRAINT "player_rumour_entries_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
