-- Add External Data Sync Fields to Clubs Table
-- These fields enable synchronization with external football data sources (APIs)

-- Add externalId column (unique identifier from external source)
ALTER TABLE "clubs" ADD COLUMN "externalId" TEXT;

-- Add externalSource column (name of the external data provider)
ALTER TABLE "clubs" ADD COLUMN "externalSource" TEXT;

-- Add lastSyncAt column (timestamp of last successful sync)
ALTER TABLE "clubs" ADD COLUMN "lastSyncAt" TIMESTAMP(3);

-- Add unique constraint on externalId
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_externalId_key" UNIQUE ("externalId");

-- Create indexes for efficient querying
CREATE INDEX "clubs_externalId_idx" ON "clubs"("externalId");
CREATE INDEX "clubs_externalSource_externalId_idx" ON "clubs"("externalSource", "externalId");
