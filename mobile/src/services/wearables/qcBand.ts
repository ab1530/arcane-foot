import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { logBridge } from '../../logging/expoLogBridge';

const TAGS = ['WEARABLE', 'QCBAND'];

export type QCBandDevice = {
  id: string;
  name?: string;
  rssi?: number;
};

export type QCBandSteps = {
  steps: number;
  calories: number;
  distanceM: number;
  timeMin: number;
};

export type QCBandBattery = {
  level: number; // 0..8 from SDK
  percent?: number;
  charging: boolean;
};

export type QCBandExercise = {
  startAtUnix: number;
  durationS?: number;
  steps?: number;
  calories?: number;
  distanceM?: number;
};

type NativeModuleShape = {
  startScan: (timeoutMs: number) => Promise<Array<QCBandDevice>>;
  scan?: (timeoutMs: number) => Promise<Array<QCBandDevice>>; // legacy
  stopScan: () => void;
  connect: (id: string) => Promise<void>;
  connectLastSeenDevice: () => Promise<void>;
  getLastSeenDevice: () => Promise<{ id: string; name?: string } | null>;
  disconnect: () => Promise<void>;
  getBattery: () => Promise<QCBandBattery>;
  getCurrentSteps: () => Promise<QCBandSteps>;
  getTodayStats: (dayIndex: number) => Promise<QCBandSteps>;
  getExerciseHistory: (lastUnixSeconds: number, limit: number) => Promise<QCBandExercise[]>;
  startRealtimeHeartRate: () => Promise<void>;
  stopRealtimeHeartRate: () => Promise<void>;
};

const native: NativeModuleShape | undefined =
  Platform.OS === 'ios' ? (NativeModules.QCBandModule as NativeModuleShape) : undefined;

if (Platform.OS === 'ios') {
  const moduleNames = Object.keys(NativeModules || {});
  logBridge.info(
    `[${TAGS.join('][')}] Platform=${Platform.OS} modules=${moduleNames.slice(0, 8).join(',')}${
      moduleNames.length > 8 ? ` (+${moduleNames.length - 8})` : ''
    } nativePresent=${!!native}`,
    'DATA',
  );
  if (!native) {
    logBridge.warn(`[${TAGS.join('][')}] native module missing (QCBandModule undefined)`, 'DATA');
  }
}

const emitter = Platform.OS === 'ios' && native ? new NativeEventEmitter(NativeModules.QCBandModule) : null;

const ensureSupported = (): NativeModuleShape => {
  if (!native || Platform.OS !== 'ios') {
    logBridge.warn(`[${TAGS.join('][')}] native module unavailable (platform=${Platform.OS})`, 'DATA');
    throw new Error('QC Band not supported on this platform');
  }
  return native;
};

export const formatBatteryPercent = (level?: number): number | null => {
  if (level === undefined || level === null) return null;
  const clamped = Math.max(0, Math.min(8, level));
  return Math.round((clamped / 8) * 100);
};

export const formatDistanceKm = (distanceM?: number): string => {
  if (distanceM === undefined || distanceM === null) return '—';
  return (distanceM / 1000).toFixed(1);
};

export const formatActiveMinutes = (minutes?: number): string => {
  if (minutes === undefined || minutes === null || Number.isNaN(minutes)) return '—';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h${mins.toString().padStart(2, '0')}`;
};

export type HeartRateListener = (bpm: number) => void;

export const qcBand = {
  async startScan(timeoutMs = 10000): Promise<QCBandDevice[]> {
    const mod = ensureSupported();
    logBridge.info(`[${TAGS.join('][')}] scan start`, 'DATA');
    const scanFn = mod.startScan ?? mod.scan;
    if (!scanFn) throw new Error('QC Band scan not available');
    try {
      const devices = await scanFn(timeoutMs);
      logBridge.info(`[${TAGS.join('][')}] scan success: ${devices.length} devices`, 'DATA');
      return devices;
    } catch (error: any) {
      logBridge.error(
        `[${TAGS.join('][')}] scan error: ${error?.message ?? String(error)}`,
        'DATA',
      );
      throw error;
    }
  },
  async scan(timeoutMs = 10000): Promise<QCBandDevice[]> {
    return this.startScan(timeoutMs);
  },
  stopScan() {
    try {
      const mod = ensureSupported();
      mod.stopScan();
    } catch (err) {
      // ignore on unsupported platform
    }
  },
  async connect(id: string): Promise<void> {
    const mod = ensureSupported();
    logBridge.info(`[${TAGS.join('][')}] connect ${id}`, 'DATA');
    try {
      return await mod.connect(id);
    } catch (error: any) {
      logBridge.error(
        `[${TAGS.join('][')}] connect error: ${error?.message ?? String(error)} id=${id}`,
        'DATA',
      );
      throw error;
    }
  },
  async connectLastSeen(): Promise<void> {
    const mod = ensureSupported();
    logBridge.info(`[${TAGS.join('][')}] connect last seen`, 'DATA');
    try {
      return await mod.connectLastSeenDevice();
    } catch (error: any) {
      logBridge.error(
        `[${TAGS.join('][')}] connect last seen error: ${error?.message ?? String(error)}`,
        'DATA',
      );
      throw error;
    }
  },
  async getLastSeenDevice(): Promise<{ id: string; name?: string } | null> {
    const mod = ensureSupported();
    const res = await mod.getLastSeenDevice();
    if (res && (res as any).id) {
      logBridge.info(`[${TAGS.join('][')}] last seen device ${res.id}`, 'DATA');
    }
    return res;
  },
  async disconnect(): Promise<void> {
    const mod = ensureSupported();
    logBridge.info(`[${TAGS.join('][')}] disconnect`, 'DATA');
    try {
      return await mod.disconnect();
    } catch (error: any) {
      logBridge.error(
        `[${TAGS.join('][')}] disconnect error: ${error?.message ?? String(error)}`,
        'DATA',
      );
      throw error;
    }
  },
  async getBattery(): Promise<QCBandBattery> {
    const mod = ensureSupported();
    try {
      const res = await mod.getBattery();
      logBridge.info(`[${TAGS.join('][')}] battery ${res.level}`, 'DATA');
      return res;
    } catch (error: any) {
      logBridge.error(
        `[${TAGS.join('][')}] battery error: ${error?.message ?? String(error)}`,
        'DATA',
      );
      throw error;
    }
  },
  async getCurrentSteps(): Promise<QCBandSteps> {
    const mod = ensureSupported();
    try {
      const res = await mod.getCurrentSteps();
      logBridge.info(`[${TAGS.join('][')}] current steps ${res.steps}`, 'DATA');
      return res;
    } catch (error: any) {
      logBridge.error(
        `[${TAGS.join('][')}] steps error: ${error?.message ?? String(error)}`,
        'DATA',
      );
      throw error;
    }
  },
  async getTodayStats(dayIndex = 0): Promise<QCBandSteps> {
    const mod = ensureSupported();
    try {
      const res = await mod.getTodayStats(dayIndex);
      logBridge.info(`[${TAGS.join('][')}] today stats steps=${res.steps} idx=${dayIndex}`, 'DATA');
      return res;
    } catch (error: any) {
      logBridge.error(
        `[${TAGS.join('][')}] today stats error: ${error?.message ?? String(error)} idx=${dayIndex}`,
        'DATA',
      );
      throw error;
    }
  },
  async getExerciseHistory(lastUnixSeconds: number, limit = 10): Promise<QCBandExercise[]> {
    const mod = ensureSupported();
    try {
      const res = await mod.getExerciseHistory(lastUnixSeconds, limit);
      logBridge.info(`[${TAGS.join('][')}] exercise history count=${res.length}`, 'DATA');
      return res;
    } catch (error: any) {
      logBridge.error(
        `[${TAGS.join('][')}] history error: ${error?.message ?? String(error)} lastUnix=${lastUnixSeconds} limit=${limit}`,
        'DATA',
      );
      throw error;
    }
  },
  async startRealtimeHeartRate(): Promise<void> {
    const mod = ensureSupported();
    logBridge.info(`[${TAGS.join('][')}] start realtime HR`, 'DATA');
    try {
      return await mod.startRealtimeHeartRate();
    } catch (error: any) {
      logBridge.error(
        `[${TAGS.join('][')}] start HR error: ${error?.message ?? String(error)}`,
        'DATA',
      );
      throw error;
    }
  },
  async stopRealtimeHeartRate(): Promise<void> {
    const mod = ensureSupported();
    logBridge.info(`[${TAGS.join('][')}] stop realtime HR`, 'DATA');
    try {
      return await mod.stopRealtimeHeartRate();
    } catch (error: any) {
      logBridge.error(
        `[${TAGS.join('][')}] stop HR error: ${error?.message ?? String(error)}`,
        'DATA',
      );
      throw error;
    }
  },
  addHeartRateListener(handler: HeartRateListener) {
    if (!emitter) return { remove: () => {} };
    const sub = emitter.addListener('qcband_hr', (payload: any) => {
      const bpm = typeof payload?.bpm === 'number' ? payload.bpm : Number(payload?.bpm);
      if (!Number.isNaN(bpm)) {
        handler(bpm);
      }
    });
    return sub;
  },
};
