-- AlterTable
ALTER TABLE "passport_share_sets"
ADD COLUMN "sourceFeature" TEXT,
ADD COLUMN "sourceRequestId" TEXT,
ADD COLUMN "sourceRequestLineNumber" INTEGER;

-- CreateIndex
CREATE INDEX "passport_share_sets_sourceRequestId_sourceRequestLineNumber_createdAt_idx"
ON "passport_share_sets"("sourceRequestId", "sourceRequestLineNumber", "createdAt");
