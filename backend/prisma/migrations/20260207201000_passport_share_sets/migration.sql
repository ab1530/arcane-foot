-- CreateTable
CREATE TABLE "passport_share_sets" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT,
    "clubName" TEXT,
    "items" JSONB NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passport_share_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "passport_share_sets_token_key" ON "passport_share_sets"("token");

-- CreateIndex
CREATE INDEX "passport_share_sets_createdById_idx" ON "passport_share_sets"("createdById");

-- CreateIndex
CREATE INDEX "passport_share_sets_createdAt_idx" ON "passport_share_sets"("createdAt");

-- AddForeignKey
ALTER TABLE "passport_share_sets" ADD CONSTRAINT "passport_share_sets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

