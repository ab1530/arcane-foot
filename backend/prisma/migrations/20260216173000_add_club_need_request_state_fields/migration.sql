-- AlterTable
ALTER TABLE "club_need_requests"
ADD COLUMN "matchesSnapshot" JSONB,
ADD COLUMN "lineStates" JSONB;
