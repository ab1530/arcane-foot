import { formatActiveMinutes, formatBatteryPercent, formatDistanceKm } from '../qcBand';

describe('qcBand formatting helpers', () => {
  test('formatBatteryPercent clamps and converts to percent', () => {
    expect(formatBatteryPercent(0)).toBe(0);
    expect(formatBatteryPercent(4)).toBe(50);
    expect(formatBatteryPercent(8)).toBe(100);
    expect(formatBatteryPercent(10)).toBe(100);
    expect(formatBatteryPercent(-2)).toBe(0);
    expect(formatBatteryPercent(undefined)).toBeNull();
  });

  test('formatDistanceKm formats meters to km with 1 decimal', () => {
    expect(formatDistanceKm(0)).toBe('0.0');
    expect(formatDistanceKm(2500)).toBe('2.5');
    expect(formatDistanceKm(undefined)).toBe('—');
  });

  test('formatActiveMinutes formats short and long durations', () => {
    expect(formatActiveMinutes(45)).toBe('45 min');
    expect(formatActiveMinutes(125)).toBe('2h05');
    expect(formatActiveMinutes(undefined)).toBe('—');
  });
});

describe('qcBand platform guard', () => {
  test('throws on Android platforms', async () => {
    let promise: Promise<unknown> | undefined;
    jest.isolateModules(() => {
      jest.mock('react-native', () => ({
        Platform: { OS: 'android' },
        NativeModules: {},
        NativeEventEmitter: class {
          addListener() {
            return { remove() {} };
          }
        },
      }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { qcBand: qcBandAndroid } = require('../qcBand');
      promise = qcBandAndroid.startScan();
    });
    await expect(promise).rejects.toThrow('not supported');
  });
});
