-- AlterTable
ALTER TABLE "players"
  ALTER COLUMN "userId" DROP NOT NULL,
  ALTER COLUMN "dateOfBirth" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "firstName" TEXT,
  ADD COLUMN IF NOT EXISTS "lastName" TEXT,
  ADD COLUMN IF NOT EXISTS "birthYear" INTEGER,
  ADD COLUMN IF NOT EXISTS "observedClubName" TEXT,
  ADD COLUMN IF NOT EXISTS "importSource" TEXT;

-- Backfill player identity from linked user when available
UPDATE "players" p
SET
  "firstName" = COALESCE(p."firstName", u."firstName"),
  "lastName" = COALESCE(p."lastName", u."lastName")
FROM "users" u
WHERE p."userId" = u."id"
  AND (p."firstName" IS NULL OR p."lastName" IS NULL);

-- Backfill birth year from date of birth
UPDATE "players"
SET "birthYear" = EXTRACT(YEAR FROM "dateOfBirth")::INTEGER
WHERE "birthYear" IS NULL
  AND "dateOfBirth" IS NOT NULL;

-- Indexes for scout quick import and search
CREATE INDEX IF NOT EXISTS "players_firstName_lastName_idx" ON "players"("firstName", "lastName");
CREATE INDEX IF NOT EXISTS "players_birthYear_idx" ON "players"("birthYear");
CREATE INDEX IF NOT EXISTS "players_observedClubName_idx" ON "players"("observedClubName");
