export type HardwareSessionType = 'match' | 'training' | 'test';

export interface ThermalTrajectoryCell {
  x: number;
  y: number;
  count: number;
  intensity?: number;
}

export interface ThermalTrajectoryMap {
  fieldWidthM: number;
  fieldHeightM: number;
  gridCols: number;
  gridRows: number;
  cellWidthM: number;
  cellHeightM: number;
  maxCount: number;
  cells: ThermalTrajectoryCell[];
  // legacy compatibility for existing payloads
  cellSizeM?: number;
}

export interface MotionTrajectoryPoint {
  t: number;
  lat: number;
  lon: number;
  x?: number;
  y?: number;
}

export interface MotionTrajectoryData {
  fieldWidthM?: number;
  fieldHeightM?: number;
  points: MotionTrajectoryPoint[];
}

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
  decelerationCount?: number;
  reductionStepsCount?: number;
  thermalTrajectoryMap?: ThermalTrajectoryMap | null;
  sprintVectorData?: any;
  motionTrajectoryData?: MotionTrajectoryData | null;
  qualitySixDimensional?: any;
  rawMetrics?: Record<string, unknown> | null;
  normalizedMetrics?: Record<string, unknown> | null;
}

export interface HardwareSession {
  id: string;
  playerId: string;
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
