-- Add missing columns to clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "externalId" TEXT UNIQUE;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "externalSource" TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to competitions table
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS "externalId" TEXT UNIQUE;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS "externalSource" TEXT;

-- Add missing columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS "externalId" TEXT UNIQUE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "externalSource" TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT DEFAULT 'PENDING';
ALTER TABLE players ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "verifiedById" TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "conversionNotes" TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS "clubs_externalId_idx" ON clubs("externalId");
CREATE INDEX IF NOT EXISTS "clubs_externalSource_externalId_idx" ON clubs("externalSource", "externalId");

CREATE INDEX IF NOT EXISTS "competitions_externalId_idx" ON competitions("externalId");
CREATE INDEX IF NOT EXISTS "competitions_externalSource_externalId_idx" ON competitions("externalSource", "externalId");

CREATE INDEX IF NOT EXISTS "players_externalId_idx" ON players("externalId");
CREATE INDEX IF NOT EXISTS "players_externalSource_externalId_idx" ON players("externalSource", "externalId");
CREATE INDEX IF NOT EXISTS "players_verificationStatus_idx" ON players("verificationStatus");