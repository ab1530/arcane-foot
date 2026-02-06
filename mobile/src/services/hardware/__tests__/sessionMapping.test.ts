import { DeviceFile, GpsPoint } from '../bleProtocol';
import {
  computeTrajectoryMetrics,
  mapDeviceFileToHardwareSessionDto,
  mmddAndMsOfDayToIso,
} from '../sessionMapping';

describe('sessionMapping - computeTrajectoryMetrics', () => {
  it('returns zeros for empty points', () => {
    const result = computeTrajectoryMetrics([]);
    expect(result).toEqual({
      totalDistanceM: 0,
      maxSpeedKmh: 0,
      avgSpeedKmh: 0,
      durationSeconds: 0,
    });
  });

  it('returns zeros for identical points', () => {
    const points: GpsPoint[] = [
      { timeMsUtc: 0, latitudeDeg: 1, longitudeDeg: 2 },
      { timeMsUtc: 1000, latitudeDeg: 1, longitudeDeg: 2 },
    ];
    const result = computeTrajectoryMetrics(points);
    expect(result.totalDistanceM).toBeCloseTo(0);
    expect(result.maxSpeedKmh).toBeCloseTo(0);
    expect(result.avgSpeedKmh).toBeCloseTo(0);
  });

  it('computes distance and speeds for small movement', () => {
    const points: GpsPoint[] = [
      { timeMsUtc: 0, latitudeDeg: 0, longitudeDeg: 0 },
      { timeMsUtc: 1000, latitudeDeg: 0, longitudeDeg: 0.001 }, // ~111m east
    ];
    const result = computeTrajectoryMetrics(points);
    expect(result.totalDistanceM).toBeGreaterThan(100);
    expect(result.totalDistanceM).toBeLessThan(120);
    expect(result.durationSeconds).toBeCloseTo(1);
    expect(result.maxSpeedKmh).toBeGreaterThan(300); // 111m/s ~ 400 km/h (high because short distance/time)
  });
});

describe('sessionMapping - mmddAndMsOfDayToIso', () => {
  it('builds ISO date from mmdd and ms of day', () => {
    const iso = mmddAndMsOfDayToIso(2025, 511, 3600 * 1000); // May 11, 01:00:00 UTC
    expect(iso.startsWith('2025-05-11T01:00:00')).toBe(true);
  });
});

describe('sessionMapping - mapDeviceFileToHardwareSessionDto', () => {
  it('maps device file and points to payload', () => {
    const file: DeviceFile = {
      id: 7,
      startDateMmdd: 511,
      startTimeMsUtc: 0,
      endDateMmdd: 511,
      endTimeMsUtc: 2000,
      length: 10,
      state: 'completed',
    };
    const points: GpsPoint[] = [
      { timeMsUtc: 0, latitudeDeg: 0, longitudeDeg: 0 },
      { timeMsUtc: 1000, latitudeDeg: 0, longitudeDeg: 0.001 },
      { timeMsUtc: 2000, latitudeDeg: 0.001, longitudeDeg: 0.001 },
    ];

    const payload = mapDeviceFileToHardwareSessionDto(file, points, 'player-123');

    expect(payload.playerId).toBe('player-123');
    expect(payload.deviceId).toBe('actionmark-7');
    expect(payload.metrics?.movementDistanceM).toBeGreaterThan(0);
    expect(payload.metrics?.motionTrajectoryData).toBeDefined();
    expect(payload.metrics?.rawMetrics?.deviceFileId).toBe(7);
    expect(payload.metrics?.normalizedMetrics?.totalDistanceM).toBeCloseTo(
      payload.metrics?.movementDistanceM || 0,
    );
    expect(payload.startedAt).toBeTruthy();
    expect(payload.endedAt).toBeTruthy();
  });
});
