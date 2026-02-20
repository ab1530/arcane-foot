import { DeviceFile, GpsPoint } from './bleProtocol';
import type {
  CreateHardwareSessionPayload,
  HardwareSessionType,
  MotionTrajectoryData,
  ThermalTrajectoryMap,
} from '../../types/hardware';

interface TrajectoryMetrics {
  totalDistanceM: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  durationSeconds: number;
}

const EARTH_RADIUS_M = 6371000; // meters
const FIELD_WIDTH_M = 105;
const FIELD_HEIGHT_M = 68;
const HEATMAP_GRID_COLS = 25;
const HEATMAP_GRID_ROWS = 25;

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

interface DerivedMetrics extends TrajectoryMetrics {
  sprintDistanceM: number;
  sprintTimeS: number;
  sprintCount: number;
  accelerationCount: number;
  decelerationCount: number;
  maxAccelerationG: number;
  maxDecelerationG: number;
  reductionStepsCount: number;
  caloriesBurned: number;
  offenseDefenseRatio: number | null;
  heatmap: ThermalTrajectoryMap;
  projectedPoints: MotionTrajectoryData['points'];
  normalized: { loadScore: number; intensityScore: number; totalDistanceM: number; maxSpeedKmh: number; avgSpeedKmh: number; durationSeconds: number };
  sampleCount: number;
}

const downsamplePoints = <T>(pts: T[], maxPoints = 2000): T[] => {
  if (!pts || pts.length <= maxPoints) return pts;
  const stride = Math.ceil(pts.length / maxPoints);
  const sampled: T[] = [];
  for (let i = 0; i < pts.length; i += stride) {
    sampled.push(pts[i]);
  }
  if (sampled[sampled.length - 1] !== pts[pts.length - 1]) {
    sampled.push(pts[pts.length - 1]);
  }
  return sampled;
};

/**
  * Compute total distance, duration, and basic speed metrics from GPS points.
  */
export function computeTrajectoryMetrics(points: GpsPoint[]): TrajectoryMetrics {
  const derived = computeDerivedMetrics(points);
  const { totalDistanceM, maxSpeedKmh, avgSpeedKmh, durationSeconds } = derived;
  return {
    totalDistanceM,
    maxSpeedKmh,
    avgSpeedKmh,
    durationSeconds,
  };
}

export function computeDerivedMetrics(points: GpsPoint[]): DerivedMetrics {
  if (!points || points.length < 2) {
    return {
      totalDistanceM: 0,
      maxSpeedKmh: 0,
      avgSpeedKmh: 0,
      durationSeconds: 0,
      sprintDistanceM: 0,
      sprintTimeS: 0,
      sprintCount: 0,
      accelerationCount: 0,
      decelerationCount: 0,
      maxAccelerationG: 0,
      maxDecelerationG: 0,
      reductionStepsCount: 0,
      caloriesBurned: 0,
      offenseDefenseRatio: null,
      heatmap: {
        fieldWidthM: FIELD_WIDTH_M,
        fieldHeightM: FIELD_HEIGHT_M,
        gridCols: HEATMAP_GRID_COLS,
        gridRows: HEATMAP_GRID_ROWS,
        cellWidthM: FIELD_WIDTH_M / HEATMAP_GRID_COLS,
        cellHeightM: FIELD_HEIGHT_M / HEATMAP_GRID_ROWS,
        maxCount: 0,
        cells: [],
        cellSizeM: FIELD_WIDTH_M / HEATMAP_GRID_COLS,
      },
      projectedPoints: [],
      normalized: {
        loadScore: 0,
        intensityScore: 0,
        totalDistanceM: 0,
        maxSpeedKmh: 0,
        avgSpeedKmh: 0,
        durationSeconds: 0,
      },
      sampleCount: points?.length ?? 0,
    };
  }

  let totalDistanceM = 0;
  let maxSpeedMps = 0;
  const speedsMps: number[] = [];
  const sprintThresholdMps = 20 / 3.6;
  let sprintDistanceM = 0;
  let sprintTimeS = 0;
  let sprintCount = 0;
  let inSprint = false;

  let accelerationCount = 0;
  let decelerationCount = 0;
  let maxAccel = 0;
  let minAccel = 0;

  const origin = points[0];

  let firstHalfDistance = 0;
  let secondHalfDistance = 0;
  const halfIndex = Math.floor(points.length / 2);

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dtSeconds = (curr.timeMsUtc - prev.timeMsUtc) / 1000;
    if (dtSeconds <= 0) continue;

    const dLat = toRadians(curr.latitudeDeg - prev.latitudeDeg);
    const dLon = toRadians(curr.longitudeDeg - prev.longitudeDeg);
    const lat1 = toRadians(prev.latitudeDeg);
    const lat2 = toRadians(curr.latitudeDeg);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const segment = EARTH_RADIUS_M * c;

    totalDistanceM += segment;

    if (i <= halfIndex) {
      firstHalfDistance += segment;
    } else {
      secondHalfDistance += segment;
    }

    const speedMps = segment / dtSeconds;
    speedsMps.push(speedMps);
    if (speedMps > maxSpeedMps) {
      maxSpeedMps = speedMps;
    }

    const isSprint = speedMps >= sprintThresholdMps;
    if (isSprint) {
      sprintDistanceM += segment;
      sprintTimeS += dtSeconds;
    }
    if (isSprint && !inSprint) {
      sprintCount += 1;
      inSprint = true;
    } else if (!isSprint && inSprint) {
      inSprint = false;
    }
  }

  for (let i = 1; i < speedsMps.length; i++) {
    const prevSpeed = speedsMps[i - 1];
    const currSpeed = speedsMps[i];
    const dtSeconds = (points[i + 1]?.timeMsUtc - points[i]?.timeMsUtc) / 1000;
    if (!dtSeconds || dtSeconds <= 0) continue;
    const accel = (currSpeed - prevSpeed) / dtSeconds;
    if (accel > 2.0) {
      accelerationCount += 1;
    }
    if (accel < -2.0) {
      decelerationCount += 1;
    }
    if (accel > maxAccel) maxAccel = accel;
    if (accel < minAccel) minAccel = accel;
  }

  const durationSeconds = (points[points.length - 1].timeMsUtc - points[0].timeMsUtc) / 1000;
  const avgSpeedMps = durationSeconds > 0 ? totalDistanceM / durationSeconds : 0;
  const maxSpeedKmh = maxSpeedMps * 3.6;
  const avgSpeedKmh = avgSpeedMps * 3.6;

  const durationHours = durationSeconds / 3600;
  const met =
    avgSpeedKmh < 6
      ? 4
      : avgSpeedKmh < 9
      ? 6
      : avgSpeedKmh < 12
      ? 8
      : avgSpeedKmh < 15
      ? 10
      : 12;
  const caloriesBurned = Math.round(met * 75 * durationHours);

  const offenseDefenseRatio =
    firstHalfDistance > 0 && secondHalfDistance > 0
      ? parseFloat((firstHalfDistance / secondHalfDistance).toFixed(2))
      : null;

  const loadScore = clamp(
    (totalDistanceM / 12000) * 60 + (sprintDistanceM / 600) * 25 + accelerationCount * 0.5,
    0,
    100,
  );
  const intensityScore = clamp(
    (maxSpeedKmh / 35) * 60 + (sprintCount / 15) * 40,
    0,
    100,
  );

  const localPoints = points.map((point) => {
    const yM = (point.latitudeDeg - origin.latitudeDeg) * 111_111;
    const xM =
      (point.longitudeDeg - origin.longitudeDeg) *
      111_111 *
      Math.cos(toRadians(origin.latitudeDeg));
    return {
      t: point.timeMsUtc,
      lat: point.latitudeDeg,
      lon: point.longitudeDeg,
      xM,
      yM,
    };
  });

  const minX = Math.min(...localPoints.map((point) => point.xM));
  const maxX = Math.max(...localPoints.map((point) => point.xM));
  const minY = Math.min(...localPoints.map((point) => point.yM));
  const maxY = Math.max(...localPoints.map((point) => point.yM));
  const xRange = Math.max(maxX - minX, 1);
  const yRange = Math.max(maxY - minY, 1);

  const projectedPoints: MotionTrajectoryData['points'] = localPoints.map((point) => ({
    t: point.t,
    lat: point.lat,
    lon: point.lon,
    x: clamp(((point.xM - minX) / xRange) * FIELD_WIDTH_M, 0, FIELD_WIDTH_M),
    y: clamp(((point.yM - minY) / yRange) * FIELD_HEIGHT_M, 0, FIELD_HEIGHT_M),
  }));

  const heatmapCells = new Map<string, { x: number; y: number; count: number }>();
  const cellWidthM = FIELD_WIDTH_M / HEATMAP_GRID_COLS;
  const cellHeightM = FIELD_HEIGHT_M / HEATMAP_GRID_ROWS;

  for (const point of projectedPoints) {
    const x = point.x ?? 0;
    const y = point.y ?? 0;
    const cellX = clamp(Math.floor(x / cellWidthM), 0, HEATMAP_GRID_COLS - 1);
    const cellY = clamp(Math.floor(y / cellHeightM), 0, HEATMAP_GRID_ROWS - 1);
    const key = `${cellX},${cellY}`;
    const current = heatmapCells.get(key);
    if (current) {
      current.count += 1;
    } else {
      heatmapCells.set(key, { x: cellX, y: cellY, count: 1 });
    }
  }

  const cells = Array.from(heatmapCells.values());
  const maxCount = Math.max(...cells.map((cell) => cell.count), 0);

  return {
    totalDistanceM,
    maxSpeedKmh,
    avgSpeedKmh,
    durationSeconds: durationSeconds > 0 ? durationSeconds : 0,
    sprintDistanceM,
    sprintTimeS,
    sprintCount,
    accelerationCount,
    decelerationCount,
    maxAccelerationG: maxAccel / 9.81,
    maxDecelerationG: Math.abs(minAccel) / 9.81,
    reductionStepsCount: decelerationCount,
    caloriesBurned,
    offenseDefenseRatio,
    heatmap: {
      fieldWidthM: FIELD_WIDTH_M,
      fieldHeightM: FIELD_HEIGHT_M,
      gridCols: HEATMAP_GRID_COLS,
      gridRows: HEATMAP_GRID_ROWS,
      cellWidthM,
      cellHeightM,
      maxCount,
      cells: cells.map((cell) => ({
        ...cell,
        intensity: maxCount > 0 ? cell.count / maxCount : 0,
      })),
      cellSizeM: (cellWidthM + cellHeightM) / 2,
    },
    projectedPoints,
    normalized: {
      loadScore,
      intensityScore,
      totalDistanceM,
      maxSpeedKmh,
      avgSpeedKmh,
      durationSeconds: durationSeconds > 0 ? durationSeconds : 0,
    },
    sampleCount: points.length,
  };
}

/**
 * Convert MMDD + ms-of-day UTC to ISO string (UTC).
 */
export function mmddAndMsOfDayToIso(year: number, mmdd: number, msOfDay: number): string {
  const month = Math.floor(mmdd / 100);
  const day = mmdd % 100;
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const result = new Date(date.getTime() + msOfDay);
  return result.toISOString();
}

/**
 * Map a decoded DeviceFile and GPS trajectory to the payload used for POST /hardware/sessions.
 */
export function mapDeviceFileToHardwareSessionDto(
  file: DeviceFile,
  points: GpsPoint[],
  playerId?: string | null,
  options?: {
    sessionType?: HardwareSessionType;
    matchContext?: {
      matchId?: string;
      matchLabel?: string;
    };
    sourceOverride?: string;
    deviceIdOverride?: string;
    simulation?: boolean;
    derivedFromGps?: boolean;
    maxSerializedPoints?: number;
    labMeta?: {
      presetMinutes: 20 | 45 | 90;
      hz: 10;
      profile: 'winger';
      mode: 'off' | 'protocol';
    };
  },
): CreateHardwareSessionPayload {
  const metrics = computeDerivedMetrics(points);
  const year = new Date().getUTCFullYear();

  const startedAt = mmddAndMsOfDayToIso(year, file.startDateMmdd, file.startTimeMsUtc);
  const endedAt = mmddAndMsOfDayToIso(year, file.endDateMmdd, file.endTimeMsUtc);

  const trajectory = {
    points: downsamplePoints(
      metrics.projectedPoints,
      options?.maxSerializedPoints ?? (options?.simulation ? 1200 : undefined),
    ),
    fieldWidthM: FIELD_WIDTH_M,
    fieldHeightM: FIELD_HEIGHT_M,
  };

  return {
    ...(playerId ? { playerId } : {}),
    deviceId: options?.deviceIdOverride ?? `actionmark-${file.id}`,
    source: options?.sourceOverride ?? 'ACTION_MARK',
    type: options?.sessionType ?? 'training',
    startedAt,
    endedAt,
    metrics: {
      movementDistanceM: Math.max(metrics.totalDistanceM, metrics.sprintDistanceM),
      sprintDistanceM: metrics.sprintDistanceM,
      sprintTimeS: metrics.sprintTimeS,
      sprintCount: metrics.sprintCount,
      caloriesBurned: metrics.caloriesBurned,
      offenseDefenseRatio: metrics.offenseDefenseRatio ?? undefined,
      avgSpeedKmh: metrics.avgSpeedKmh,
      maxSpeedKmh: metrics.maxSpeedKmh,
      totalTimeMin: metrics.durationSeconds / 60,
      accelerationCount: metrics.accelerationCount,
      reductionStepsCount: metrics.reductionStepsCount,
      maxAccelerationG: metrics.maxAccelerationG,
      maxDecelerationG: metrics.maxDecelerationG,
      motionTrajectoryData: trajectory,
      thermalTrajectoryMap: metrics.heatmap,
      rawMetrics: {
        deviceFileId: file.id,
        sampleCount: metrics.sampleCount || file.length,
        startDateMmdd: file.startDateMmdd,
        startTimeMsUtc: file.startTimeMsUtc,
        endDateMmdd: file.endDateMmdd,
        endTimeMsUtc: file.endTimeMsUtc,
        derivedFromGps: options?.derivedFromGps ?? true,
        simulation: options?.simulation ?? undefined,
        matchContext: options?.matchContext ?? undefined,
        labMeta: options?.labMeta ?? undefined,
      },
      normalizedMetrics: {
        totalDistanceM: metrics.totalDistanceM,
        maxSpeedKmh: metrics.maxSpeedKmh,
        avgSpeedKmh: metrics.avgSpeedKmh,
        durationSeconds: metrics.durationSeconds,
        loadScore: metrics.normalized.loadScore,
        intensityScore: metrics.normalized.intensityScore,
      },
    },
  };
}
