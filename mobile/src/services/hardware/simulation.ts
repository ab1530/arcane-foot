import { DeviceFile, GpsPoint } from './bleProtocol';
import { mapDeviceFileToHardwareSessionDto } from './sessionMapping';
import type { CreateHardwareSessionPayload } from '../../types/hardware';

export interface SimulationConfig {
  minDistanceKm?: number;
  maxDistanceKm?: number;
  minDurationMin?: number;
  maxDurationMin?: number;
  sampleIntervalSeconds?: number;
}

const toRadians = (deg: number) => (deg * Math.PI) / 180;

const randomBetween = (min: number, max: number) => {
  if (max <= min) return min;
  return min + Math.random() * (max - min);
};
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const MIN_REQUIREMENTS = {
  maxSpeedKmh: 24,
  sprintCount: 10,
  sprintDistanceM: 400,
  accelerationCount: 50,
  decelerationCount: 50,
  minDistanceKm: 5,
  maxDistanceKm: 13,
  minDurationMin: 40,
  maxDurationMin: 105,
};

function buildHeadingStepper() {
  let heading = Math.random() * Math.PI * 2;
  return (distanceStep: number, lat: number, index: number) => {
    heading += randomBetween(-0.25, 0.25);
    if (index % 30 === 0) heading += randomBetween(-0.8, 0.8);
    const latChange = (distanceStep * Math.cos(heading)) / 111_111;
    const lonChange = (distanceStep * Math.sin(heading)) / (111_111 * Math.cos(toRadians(lat)));
    return { latChange, lonChange, heading };
  };
}

function buildSpeedProfile(
  steps: number,
  intervalSeconds: number,
  targetDistanceKm: number,
  isMatchLike: boolean,
): number[] {
  const sprintSegments = Math.floor(randomBetween(3, 9));
  const sprints: [number, number, number][] = []; // [startIdx, endIdx, speedKmh]
  for (let i = 0; i < sprintSegments; i++) {
    const start = Math.floor(randomBetween(0, steps - 10));
    const len = Math.floor(randomBetween(2, 6)); // 2-6 seconds worth of samples
    const speed = randomBetween(25, 33);
    sprints.push([start, Math.min(steps - 1, start + len), speed]);
  }

  const speedBands = {
    walk: [4, 6],
    jog: [8, 13],
    run: [14, 20],
  };

  const weights = isMatchLike
    ? { walk: 0.14, jog: 0.52, run: 0.34 }
    : { walk: 0.18, jog: 0.55, run: 0.27 };

  const picks = (prob: number) => Math.random() < prob;
  const baseSpeeds: number[] = [];

  for (let i = 0; i < steps; i++) {
    const sprint = sprints.find(([s, e]) => i >= s && i <= e);
    if (sprint) {
      baseSpeeds.push(sprint[2]);
      continue;
    }

    let type: keyof typeof speedBands = 'jog';
    if (picks(weights.run)) type = 'run';
    else if (picks(weights.walk)) type = 'walk';

    const [min, max] = speedBands[type];
    baseSpeeds.push(randomBetween(min, max));
  }

  // scale to target distance
  const roughDistanceM = baseSpeeds.reduce(
    (acc, kmh) => acc + (kmh / 3.6) * intervalSeconds,
    0,
  );
  const scale = clamp((targetDistanceKm * 1000) / Math.max(1, roughDistanceM), 0.8, 1.25);
  return baseSpeeds.map((s) => clamp(s * scale, 4, 34));
}

export function generateRandomTrajectory(config?: SimulationConfig): GpsPoint[] {
  const isMatchLike = Math.random() > 0.4;
  const distanceKm = clamp(
    randomBetween(
      config?.minDistanceKm ?? (isMatchLike ? 7 : 5),
      config?.maxDistanceKm ?? (isMatchLike ? 12 : 9),
    ),
    MIN_REQUIREMENTS.minDistanceKm,
    MIN_REQUIREMENTS.maxDistanceKm,
  );
  const durationMin = clamp(
    randomBetween(
      config?.minDurationMin ?? (isMatchLike ? 75 : 55),
      config?.maxDurationMin ?? (isMatchLike ? 100 : 85),
    ),
    MIN_REQUIREMENTS.minDurationMin,
    MIN_REQUIREMENTS.maxDurationMin,
  );
  const intervalSeconds = Math.max(1, config?.sampleIntervalSeconds ?? randomBetween(1, 2));
  const totalDurationSeconds = durationMin * 60;
  const steps = Math.max(2, Math.round(totalDurationSeconds / intervalSeconds));

  const baseLat = 48.85 + (Math.random() - 0.5) * 0.2;
  const baseLon = 2.35 + (Math.random() - 0.5) * 0.3;
  const headingStepper = buildHeadingStepper();

  const dayMs = 24 * 60 * 60 * 1000;
  const totalDurationMs = (steps - 1) * intervalSeconds * 1000;
  const maxStartMs = Math.max(0, dayMs - totalDurationMs - 1);
  const startOffsetMs = Math.floor(Math.random() * maxStartMs);

  const generateOnce = (): GpsPoint[] => {
    const speedsKmh = buildSpeedProfile(steps, intervalSeconds, distanceKm, isMatchLike);
    const points: GpsPoint[] = [];
    let lat = baseLat;
    let lon = baseLon;
    let timeMsUtc = startOffsetMs;

    points.push({ timeMsUtc, latitudeDeg: lat, longitudeDeg: lon });

    for (let i = 0; i < speedsKmh.length; i++) {
      const speedMps = speedsKmh[i] / 3.6;
      const distanceStep = speedMps * intervalSeconds;
      const { latChange, lonChange } = headingStepper(distanceStep, lat, i);

      lat += latChange;
      lon += lonChange;
      timeMsUtc += intervalSeconds * 1000;

      points.push({
        timeMsUtc,
        latitudeDeg: lat,
        longitudeDeg: lon,
      });
    }

    return points;
  };

  return generateOnce();
}

export function buildSimulatedDeviceFile(points: GpsPoint[]): DeviceFile {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const mmdd = month * 100 + day;

  const startTimeMs = points[0]?.timeMsUtc ?? 0;
  const endTimeMs = points[points.length - 1]?.timeMsUtc ?? startTimeMs;

  return {
    id: Math.floor(Math.random() * 65000),
    startDateMmdd: mmdd,
    startTimeMsUtc: startTimeMs,
    endDateMmdd: mmdd,
    endTimeMsUtc: endTimeMs,
    length: points.length,
    state: 'completed',
  };
}

function randomBatteryMilliVolts(): number {
  const min = 3.3;
  const max = 4.2;
  const v = min + Math.random() * (max - min);
  return Math.round(v * 1000);
}

export function buildSimulatedHardwareSessionPayload(
  playerId: string,
  config?: SimulationConfig,
): CreateHardwareSessionPayload {
  let points = generateRandomTrajectory(config);
  let file = buildSimulatedDeviceFile(points);
  let basePayload = mapDeviceFileToHardwareSessionDto(file, points, playerId, {
    sourceOverride: 'SIMULATION',
    deviceIdOverride: `simulation-${file.id}`,
    simulation: true,
    maxSerializedPoints: 1200,
  });
  let baseMetrics = basePayload.metrics ?? {};

  // Ensure minimum realism thresholds; adjust and retry up to 2 times
  for (let attempt = 0; attempt < 2; attempt++) {
    const m = baseMetrics;
    const meets =
      (m.maxSpeedKmh ?? 0) >= MIN_REQUIREMENTS.maxSpeedKmh &&
      (m.sprintCount ?? 0) >= MIN_REQUIREMENTS.sprintCount &&
      (m.sprintDistanceM ?? 0) >= MIN_REQUIREMENTS.sprintDistanceM &&
      (m.accelerationCount ?? 0) >= MIN_REQUIREMENTS.accelerationCount &&
      (m.reductionStepsCount ?? 0) >= MIN_REQUIREMENTS.decelerationCount &&
      (m.movementDistanceM ?? 0) / 1000 >= MIN_REQUIREMENTS.minDistanceKm &&
      (m.movementDistanceM ?? 0) / 1000 <= MIN_REQUIREMENTS.maxDistanceKm &&
      (m.totalTimeMin ?? 0) >= MIN_REQUIREMENTS.minDurationMin &&
      (m.totalTimeMin ?? 0) <= MIN_REQUIREMENTS.maxDurationMin;

    if (meets) break;

    // Re-generate with slightly more aggressive params
    points = generateRandomTrajectory({
      ...config,
      minDistanceKm: Math.max(MIN_REQUIREMENTS.minDistanceKm, (config?.minDistanceKm ?? 6)),
      maxDistanceKm: Math.min(MIN_REQUIREMENTS.maxDistanceKm, (config?.maxDistanceKm ?? 12)),
      minDurationMin: Math.max(MIN_REQUIREMENTS.minDurationMin, (config?.minDurationMin ?? 60)),
      maxDurationMin: Math.min(MIN_REQUIREMENTS.maxDurationMin, (config?.maxDurationMin ?? 95)),
      sampleIntervalSeconds: config?.sampleIntervalSeconds ?? 1.2,
    });
    file = buildSimulatedDeviceFile(points);
    basePayload = mapDeviceFileToHardwareSessionDto(file, points, playerId, {
      sourceOverride: 'SIMULATION',
      deviceIdOverride: `simulation-${file.id}`,
      simulation: true,
      maxSerializedPoints: 1200,
    });
    baseMetrics = basePayload.metrics ?? {};
  }

  return {
    ...basePayload,
    metrics: {
      ...baseMetrics,
      rawMetrics: {
        ...baseMetrics.rawMetrics,
        simulation: true,
        simulatedBatteryMv: randomBatteryMilliVolts(),
        simulatedGpsStatus: 3,
        derivedFromGps: true,
      },
    },
  };
}
