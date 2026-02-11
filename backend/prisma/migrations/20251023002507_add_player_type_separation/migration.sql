-- CreateEnum
CREATE TYPE "PlayerType" AS ENUM ('AGENCY', 'PUBLIC');

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "parentEmail" TEXT,
ADD COLUMN     "parentName" TEXT,
ADD COLUMN     "parentPhone" TEXT,
ADD COLUMN     "playerType" "PlayerType" NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "players_playerType_idx" ON "players"("playerType");
