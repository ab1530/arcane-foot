-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('BUY_NOW', 'MONITOR', 'FOLLOW_UP', 'NOT_INTERESTED', 'NEEDS_MORE_DATA');

-- AlterTable
ALTER TABLE "scouting_reports" ADD COLUMN     "mentalRating" INTEGER,
ADD COLUMN     "physicalRating" INTEGER,
ADD COLUMN     "playerMinutesPlayed" INTEGER,
ADD COLUMN     "playerPosition" TEXT,
ADD COLUMN     "recommendation" "RecommendationType",
ADD COLUMN     "recommendationNotes" TEXT,
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "similarPlayerIds" TEXT[],
ADD COLUMN     "tacticalRating" INTEGER,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "technicalRating" INTEGER;

-- CreateIndex
CREATE INDEX "scouting_reports_recommendation_idx" ON "scouting_reports"("recommendation");
