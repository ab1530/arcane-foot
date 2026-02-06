-- CreateTable
CREATE TABLE "hardware_sessions" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "movementDistanceM" DOUBLE PRECISION,
    "sprintDistanceM" DOUBLE PRECISION,
    "offenseDefenseRatio" DOUBLE PRECISION,
    "avgSpeedKmh" DOUBLE PRECISION,
    "maxSpeedKmh" DOUBLE PRECISION,
    "sprintTimeS" DOUBLE PRECISION,
    "sprintCount" INTEGER,
    "totalTimeMin" DOUBLE PRECISION,
    "caloriesBurned" DOUBLE PRECISION,
    "maxAccelerationG" DOUBLE PRECISION,
    "maxDecelerationG" DOUBLE PRECISION,
    "accelerationCount" INTEGER,
    "reductionStepsCount" INTEGER,
    "thermalTrajectoryMap" JSONB,
    "sprintVectorData" JSONB,
    "motionTrajectoryData" JSONB,
    "qualitySixDimensional" JSONB,
    "rawMetrics" JSONB,
    "normalizedMetrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hardware_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hardware_sessions_playerId_idx" ON "hardware_sessions"("playerId");

-- CreateIndex
CREATE INDEX "hardware_sessions_startedAt_idx" ON "hardware_sessions"("startedAt");

-- AddForeignKey
ALTER TABLE "hardware_sessions" ADD CONSTRAINT "hardware_sessions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
