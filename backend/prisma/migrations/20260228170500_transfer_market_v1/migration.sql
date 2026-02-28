-- CreateEnum
CREATE TYPE "TransferRequestKind" AS ENUM ('LEGACY_RAW', 'TRANSFER_REQUEST');

-- CreateEnum
CREATE TYPE "TransferRequestStatus" AS ENUM ('OPEN', 'IN_DISCUSSION', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransferRequestVisibility" AS ENUM ('PRIVATE', 'SHARED');

-- CreateEnum
CREATE TYPE "TransferSuggestionStatus" AS ENUM ('PROPOSED', 'SHORTLISTED', 'REJECTED');

-- AlterTable
ALTER TABLE "club_need_requests"
ADD COLUMN "requestKind" "TransferRequestKind" NOT NULL DEFAULT 'LEGACY_RAW',
ADD COLUMN "clubId" TEXT,
ADD COLUMN "clubName" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "league" TEXT,
ADD COLUMN "status" "TransferRequestStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "visibility" "TransferRequestVisibility" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN "requirementsJson" JSONB,
ADD COLUMN "deadlineAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "club_need_request_suggestions" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "scoutId" TEXT NOT NULL,
    "comment" TEXT,
    "status" "TransferSuggestionStatus" NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_need_request_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_need_request_activities" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_need_request_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "club_need_requests_clubId_idx" ON "club_need_requests"("clubId");

-- CreateIndex
CREATE INDEX "club_need_requests_status_idx" ON "club_need_requests"("status");

-- CreateIndex
CREATE INDEX "club_need_requests_priority_idx" ON "club_need_requests"("priority");

-- CreateIndex
CREATE INDEX "club_need_requests_visibility_idx" ON "club_need_requests"("visibility");

-- CreateIndex
CREATE INDEX "club_need_requests_league_idx" ON "club_need_requests"("league");

-- CreateIndex
CREATE INDEX "club_need_requests_requestKind_country_league_status_visibility_createdAt_idx"
ON "club_need_requests"("requestKind", "country", "league", "status", "visibility", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "club_need_request_suggestions_requestId_playerId_scoutId_key"
ON "club_need_request_suggestions"("requestId", "playerId", "scoutId");

-- CreateIndex
CREATE INDEX "club_need_request_suggestions_requestId_createdAt_idx"
ON "club_need_request_suggestions"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "club_need_request_suggestions_status_idx"
ON "club_need_request_suggestions"("status");

-- CreateIndex
CREATE INDEX "club_need_request_suggestions_scoutId_idx"
ON "club_need_request_suggestions"("scoutId");

-- CreateIndex
CREATE INDEX "club_need_request_activities_requestId_createdAt_idx"
ON "club_need_request_activities"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "club_need_request_activities_actorId_createdAt_idx"
ON "club_need_request_activities"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "club_need_requests"
ADD CONSTRAINT "club_need_requests_clubId_fkey"
FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_need_request_suggestions"
ADD CONSTRAINT "club_need_request_suggestions_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "club_need_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_need_request_suggestions"
ADD CONSTRAINT "club_need_request_suggestions_playerId_fkey"
FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_need_request_suggestions"
ADD CONSTRAINT "club_need_request_suggestions_scoutId_fkey"
FOREIGN KEY ("scoutId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_need_request_activities"
ADD CONSTRAINT "club_need_request_activities_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "club_need_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_need_request_activities"
ADD CONSTRAINT "club_need_request_activities_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
