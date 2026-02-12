/*
  Warnings:

  - You are about to drop the column `competition` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `venue` on the `matches` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MatchAssignmentStatus" AS ENUM ('ASSIGNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchAssignmentRole" AS ENUM ('PRIMARY_SCOUT', 'ASSISTANT', 'ANALYST', 'VIDEO_ANALYST');

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "competition",
DROP COLUMN "venue",
ADD COLUMN     "attendance" INTEGER,
ADD COLUMN     "competitionId" TEXT,
ADD COLUMN     "competitionOld" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "matchDate" TIMESTAMP(3),
ADD COLUMN     "matchTime" TEXT,
ADD COLUMN     "referee" TEXT,
ADD COLUMN     "round" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "venueId" TEXT,
ADD COLUMN     "venueOld" TEXT;

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "capacity" INTEGER,
    "surfaceType" TEXT,
    "clubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "country" TEXT,
    "level" TEXT,
    "type" TEXT,
    "season" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_assignments" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "scoutId" TEXT NOT NULL,
    "status" "MatchAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "role" "MatchAssignmentRole" NOT NULL DEFAULT 'PRIMARY_SCOUT',
    "arrivalTime" TIMESTAMP(3),
    "seatingSection" TEXT,
    "accessCredentials" TEXT,
    "targetPlayerNames" TEXT[],
    "completedAt" TIMESTAMP(3),
    "reportSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "venues_city_idx" ON "venues"("city");

-- CreateIndex
CREATE INDEX "venues_clubId_idx" ON "venues"("clubId");

-- CreateIndex
CREATE INDEX "competitions_season_idx" ON "competitions"("season");

-- CreateIndex
CREATE INDEX "competitions_country_idx" ON "competitions"("country");

-- CreateIndex
CREATE INDEX "match_assignments_matchId_idx" ON "match_assignments"("matchId");

-- CreateIndex
CREATE INDEX "match_assignments_scoutId_idx" ON "match_assignments"("scoutId");

-- CreateIndex
CREATE INDEX "match_assignments_status_idx" ON "match_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "match_assignments_matchId_scoutId_key" ON "match_assignments"("matchId", "scoutId");

-- CreateIndex
CREATE INDEX "matches_matchDate_idx" ON "matches"("matchDate");

-- CreateIndex
CREATE INDEX "matches_venueId_idx" ON "matches"("venueId");

-- CreateIndex
CREATE INDEX "matches_competitionId_idx" ON "matches"("competitionId");

-- CreateIndex
CREATE INDEX "matches_createdById_idx" ON "matches"("createdById");

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_assignments" ADD CONSTRAINT "match_assignments_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_assignments" ADD CONSTRAINT "match_assignments_scoutId_fkey" FOREIGN KEY ("scoutId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_assignments" ADD CONSTRAINT "match_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
