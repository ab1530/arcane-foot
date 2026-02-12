-- CreateTable
CREATE TABLE "club_need_requests" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "parsed" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_need_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "club_need_requests_createdById_idx" ON "club_need_requests"("createdById");

-- CreateIndex
CREATE INDEX "club_need_requests_createdAt_idx" ON "club_need_requests"("createdAt");

-- AddForeignKey
ALTER TABLE "club_need_requests" ADD CONSTRAINT "club_need_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
