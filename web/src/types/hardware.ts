export type HardwareSessionType = 'match' | 'training' | 'test';

export interface HardwareMetrics {
  movementDistanceM?: number;
  sprintDistanceM?: number;
  offenseDefenseRatio?: number;
  avgSpeedKmh?: number;
  maxSpeedKmh?: number;
  sprintTimeS?: number;
  sprintCount?: number;
  totalTimeMin?: number;
  caloriesBurned?: number;
  maxAccelerationG?: number;
  maxDecelerationG?: number;
  accelerationCount?: number;
  reductionStepsCount?: number;
  thermalTrajectoryMap?: any;
  sprintVectorData?: any;
  motionTrajectoryData?: any;
  qualitySixDimensional?: any;
  rawMetrics?: any;
  normalizedMetrics?: any;
}

export interface HardwareSessionPlayer {
  id: string;
  firstName?: string;
  lastName?: string;
  clubId?: string | null;
  clubName?: string | null;
  clubLogo?: string | null;
}

export interface HardwareSession {
  id: string;
  playerId: string;
  player?: HardwareSessionPlayer;
  deviceId: string;
  source: string;
  type: HardwareSessionType;
  startedAt: string;
  endedAt: string;
  metrics: HardwareMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHardwareSessionPayload {
  playerId?: string;
  deviceId: string;
  source: string;
  type: HardwareSessionType;
  startedAt: string;
  endedAt: string;
  metrics?: HardwareMetrics;
}
