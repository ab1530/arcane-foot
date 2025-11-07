-- CreateEnum
CREATE TYPE "PassportStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "player_passports" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "PassportStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "publicToken" TEXT NOT NULL,
    "passportData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_passports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_passports_playerId_key" ON "player_passports"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "player_passports_publicToken_key" ON "player_passports"("publicToken");

-- CreateIndex
CREATE INDEX "player_passports_publicToken_idx" ON "player_passports"("publicToken");

-- CreateIndex
CREATE INDEX "player_passports_status_idx" ON "player_passports"("status");

-- CreateIndex
CREATE INDEX "player_passports_playerId_idx" ON "player_passports"("playerId");

-- AddForeignKey
ALTER TABLE "player_passports" ADD CONSTRAINT "player_passports_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
