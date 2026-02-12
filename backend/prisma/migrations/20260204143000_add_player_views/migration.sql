-- CreateTable
CREATE TABLE "player_views" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,

    CONSTRAINT "player_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_views_viewerId_playerId_key" ON "player_views"("viewerId", "playerId");

-- CreateIndex
CREATE INDEX "player_views_viewerId_idx" ON "player_views"("viewerId");

-- CreateIndex
CREATE INDEX "player_views_playerId_idx" ON "player_views"("playerId");

-- CreateIndex
CREATE INDEX "player_views_viewedAt_idx" ON "player_views"("viewedAt");

-- AddForeignKey
ALTER TABLE "player_views" ADD CONSTRAINT "player_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_views" ADD CONSTRAINT "player_views_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
