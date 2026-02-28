DO $$
BEGIN
  CREATE TYPE "MissionType" AS ENUM ('PRIORITY', 'VOLUNTARY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "match_assignments"
ADD COLUMN IF NOT EXISTS "missionType" "MissionType" NOT NULL DEFAULT 'PRIORITY';
