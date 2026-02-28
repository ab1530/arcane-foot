ALTER TABLE "scouting_reports"
  ADD COLUMN IF NOT EXISTS "observedFirstName" TEXT,
  ADD COLUMN IF NOT EXISTS "observedLastName" TEXT,
  ADD COLUMN IF NOT EXISTS "observedNationality" TEXT,
  ADD COLUMN IF NOT EXISTS "observedPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "observedEmail" TEXT;
