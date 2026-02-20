import {
  DeviceFile,
  GpsPoint,
  parseFileSummaryPacket,
  decodeCompressedGpsStream,
} from '../hardware/bleProtocol';
import { mapDeviceFileToHardwareSessionDto } from '../hardware/sessionMapping';
import { generateWingerProtocolChunks } from '../hardware/actionTracerSimulation';
import api from '../api';
import { logBridge } from '../../logging/expoLogBridge';
import BleManager from 'react-native-ble-manager';
import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import type { HardwareSessionType } from '../../types/hardware';

export interface BleDeviceSummary {
  id: string;
  name?: string;
}

export type DeviceFileSummary = DeviceFile;

export type LabPresetMinutes = 20 | 45 | 90;

export interface ActionTracerLabOptions {
  presetMinutes: LabPresetMinutes;
  hz: 10;
  profile: 'winger';
  sourceLabel?: 'ACTION_MARK_LAB' | 'ACTION_MARK';
  isLabGenerated: boolean;
}

export interface SyncDeviceFileOptions {
  sessionType?: HardwareSessionType;
  simulationMode?: 'off' | 'protocol';
  labOptions?: ActionTracerLabOptions;
  matchContext?: {
    matchId?: string;
    matchLabel?: string;
  };
  debugDumpRawChunks?: boolean;
}

const TAGS: [string, string] = ['GPS', 'ACTION_TRACER'];
const buildTagHeader = (labMode?: boolean) =>
  `[${[...TAGS, ...(labMode ? ['LAB'] : [])].join('][')}]`;

function isActionMarkDeviceName(name?: string | null): boolean {
  if (!name) return false;
  const [prefix] = name.split('-');
  const upper = (prefix || '').toUpperCase();
  // Align with vendor app prefixes, allow optional leading $
  return (
    upper === '$ACT' ||
    upper === '$ATP' ||
    upper === '$GPS' ||
    upper === 'ACT' ||
    upper === 'ATP' ||
    upper === 'GPS'
  );
}

const SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const NOTIFY_UUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
const WRITE_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';

const FILE_SUMMARY_TIMEOUT_MS = 4500;
const FILE_SUMMARY_IDLE_WINDOW_MS = 700;
const TRAJECTORY_TIMEOUT_MS = 14000;
const TRAJECTORY_IDLE_WINDOW_MS = 1200;
const LAB_MAX_SERIALIZED_POINTS = 450;

const BleManagerModule = NativeModules.BleManager;
const bleEmitter = BleManagerModule
  ? new NativeEventEmitter(BleManagerModule)
  : null;
let bleInitialized = false;

async function ensureBleInitialized() {
  if (!BleManagerModule) {
    throw new Error(
      'BleManager native module not available (build a dev client or enable BLE stub fallback).',
    );
  }
  if (!bleInitialized) {
    await BleManager.start({ showAlert: false });
    bleInitialized = true;
  }
}

async function ensureBlePermissions() {
  if (Platform.OS !== 'android') return;
  await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  ]);
}

const normalizeErrorMessage = (error: unknown) =>
  String((error as any)?.message ?? error ?? '').toLowerCase();

const isAlreadyConnectedError = (error: unknown) => {
  const message = normalizeErrorMessage(error);
  return (
    message.includes('already connected') ||
    message.includes('is connected') ||
    message.includes('connected')
  );
};

const isAlreadyNotifyingError = (error: unknown) => {
  const message = normalizeErrorMessage(error);
  return (
    message.includes('already') ||
    message.includes('notification') ||
    message.includes('notifying')
  );
};

async function ensureDeviceReadyForTransfer(deviceId: string): Promise<void> {
  await ensureBleInitialized();
  await ensureBlePermissions();

  try {
    await BleManager.connect(deviceId);
  } catch (error) {
    if (!isAlreadyConnectedError(error)) {
      throw error;
    }
  }

  await BleManager.retrieveServices(deviceId);

  try {
    await BleManager.startNotification(deviceId, SERVICE_UUID, NOTIFY_UUID);
  } catch (error) {
    if (!isAlreadyNotifyingError(error)) {
      throw error;
    }
  }
}

const isBleAvailable = () => !!BleManagerModule && !!bleEmitter;

const mockScanDevices = (): BleDeviceSummary[] => [
  { id: 'mock-device-1', name: 'Mock ActionMark' },
];

const mockFiles = (startTime = Date.now()): DeviceFileSummary[] => [
  {
    id: 1,
    startDateMmdd: 511,
    startTimeMsUtc: startTime,
    endDateMmdd: 511,
    endTimeMsUtc: startTime + 10 * 60 * 1000,
    length: 100,
    state: 'completed',
  },
];

const mockPoints = (startTime: number): GpsPoint[] => {
  const baseLat = 48.8566;
  const baseLon = 2.3522;
  const points: GpsPoint[] = [];
  const numPoints = 120;
  for (let i = 0; i < numPoints; i++) {
    const t = startTime + i * 5000;
    const lat = baseLat;
    const lon = baseLon + i * 0.0001;
    points.push({ timeMsUtc: t, latitudeDeg: lat, longitudeDeg: lon });
  }
  return points;
};

let labVirtualFileId = 64000;

const allocateLabVirtualFileId = () => {
  labVirtualFileId += 1;
  if (labVirtualFileId > 65534) {
    labVirtualFileId = 60000;
  }
  return labVirtualFileId;
};

const dateToMmddUtc = (date: Date) => (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
const dateToMsOfDayUtc = (date: Date) =>
  date.getUTCHours() * 3600000 +
  date.getUTCMinutes() * 60000 +
  date.getUTCSeconds() * 1000 +
  date.getUTCMilliseconds();

export function createLabVirtualDeviceFile(
  presetMinutes: LabPresetMinutes,
  hz: 10 = 10,
): DeviceFile {
  const now = new Date();
  const durationMs = presetMinutes * 60 * 1000;
  const end = new Date(now.getTime() + durationMs);
  const startTimeMsUtc = dateToMsOfDayUtc(now);
  const endTimeMsUtc = dateToMsOfDayUtc(end);
  const startDateMmdd = dateToMmddUtc(now);
  const endDateMmdd = dateToMmddUtc(end);
  const sampleLength = Math.max(1, Math.round(presetMinutes * 60 * hz));

  return {
    id: allocateLabVirtualFileId(),
    startDateMmdd,
    startTimeMsUtc,
    endDateMmdd,
    endTimeMsUtc,
    length: sampleLength,
    state: 'completed',
  };
}

async function waitForBlePoweredOn(timeoutMs = 8000): Promise<void> {
  await ensureBleInitialized();
  if (!bleEmitter) {
    throw new Error('BLE emitter not available');
  }

  let currentState: string | null = null;

  return new Promise<void>((resolve, reject) => {
    const subscription = bleEmitter.addListener(
      'BleManagerDidUpdateState',
      ({ state }: { state: string }) => {
        currentState = state;
        if (state === 'on') {
          clearTimeout(timer);
          subscription.remove();
          resolve();
        } else if (
          state === 'off' ||
          state === 'unauthorized' ||
          state === 'unsupported'
        ) {
          clearTimeout(timer);
          subscription.remove();
          reject(new Error(`BLE state is ${state}`));
        }
      },
    );

    const timer = setTimeout(() => {
      subscription.remove();
      reject(new Error(`BLE not powered on (state=${currentState ?? 'unknown'})`));
    }, timeoutMs);

    // Trigger initial state emission
    BleManager.checkState();
  });
}

async function waitForTransferWindow(options: {
  timeoutMs: number;
  idleWindowMs: number;
  hasPackets: () => boolean;
  isComplete: () => boolean;
  getLastPacketAt: () => number;
}): Promise<'complete' | 'idle' | 'timeout'> {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startedAt;

      if (options.isComplete()) {
        clearInterval(interval);
        resolve('complete');
        return;
      }

      if (elapsed >= options.timeoutMs) {
        clearInterval(interval);
        resolve('timeout');
        return;
      }

      if (
        options.hasPackets() &&
        now - options.getLastPacketAt() >= options.idleWindowMs
      ) {
        clearInterval(interval);
        resolve('idle');
      }
    }, 100);
  });
}

async function dumpRawChunksToSandbox(
  chunks: Uint8Array[],
  context: string,
  metadata: Record<string, unknown>,
  enabled?: boolean,
) {
  if (!enabled || chunks.length === 0 || !FileSystem.documentDirectory) {
    return;
  }

  try {
    const dir = `${FileSystem.documentDirectory}action-tracker-debug`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const path = `${dir}/${Date.now()}-${context}.json`;
    const payload = {
      ...metadata,
      createdAt: new Date().toISOString(),
      chunkCount: chunks.length,
      chunks: chunks.map((chunk) => Array.from(chunk)),
    };

    await FileSystem.writeAsStringAsync(path, JSON.stringify(payload));
    logBridge.info(
      `[${TAGS.join('][')}] debug dump written path=${path} chunks=${chunks.length}`,
      'DATA',
    );
  } catch (error: any) {
    logBridge.warn(
      `[${TAGS.join('][')}] debug dump failed: ${error?.message ?? String(error)}`,
      'DATA',
    );
  }
}

/**
 * Scan for ActionTracer devices.
 */
export async function scanForActionTracerDevices(): Promise<BleDeviceSummary[]> {
  try {
    if (!isBleAvailable()) {
      const devices = mockScanDevices();
      logBridge.info(
        `[${TAGS.join('][')}] scan (stub) success: ${devices.length} devices`,
        'DATA',
      );
      return devices;
    }

    await ensureBleInitialized();
    await ensureBlePermissions();
    await waitForBlePoweredOn();

    await BleManager.scan([], 5, true);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const peripherals = await BleManager.getDiscoveredPeripherals();
    const devices: BleDeviceSummary[] = peripherals
      .filter((p) => isActionMarkDeviceName(p.name))
      .map((p) => ({
        id: p.id,
        name: p.name ?? 'ActionMark',
      }));

    if (devices.length === 0 && peripherals.length > 0) {
      const debugList = peripherals.map((p) => ({
        id: p.id,
        name: p.name,
        rssi: (p as any).rssi,
      }));
      logBridge.info(
        `[${TAGS.join('][')}] scan debug – discovered peripherals: ${JSON.stringify(
          debugList,
        )}`,
        'DATA',
      );
    }

    logBridge.info(
      `[${TAGS.join('][')}] scan success: ${devices.length} devices`,
      'DATA',
    );
    return devices;
  } catch (error: any) {
    logBridge.error(
      `[${TAGS.join('][')}] scan error: ${error?.message ?? error}`,
      'DATA',
    );
    throw error;
  }
}

/**
 * Connect to ActionTracer device.
 */
export async function connectToActionTracer(deviceId: string): Promise<void> {
  try {
    if (!isBleAvailable()) {
      logBridge.info(
        `[${TAGS.join('][')}] connect (stub) success: ${deviceId}`,
        'DATA',
      );
      return;
    }

    await ensureBleInitialized();
    await ensureBlePermissions();

    await BleManager.connect(deviceId);
    await BleManager.retrieveServices(deviceId);
    await BleManager.startNotification(deviceId, SERVICE_UUID, NOTIFY_UUID);

    logBridge.info(`[${TAGS.join('][')}] connect success: ${deviceId}`, 'DATA');
  } catch (error: any) {
    logBridge.error(
      `[${TAGS.join('][')}] connect error: ${error?.message ?? error}`,
      'DATA',
    );
    throw error;
  }
}

/**
 * Read file summary from the tracker (0x30 -> 0x51).
 */
export async function readDeviceFiles(deviceId: string): Promise<DeviceFileSummary[]> {
  const startedAt = Date.now();

  try {
    if (!isBleAvailable()) {
      const files = mockFiles();
      logBridge.info(
        `[${TAGS.join('][')}] readDeviceFiles (stub) success: ${files.length} files`,
        'DATA',
      );
      return files;
    }

    await ensureDeviceReadyForTransfer(deviceId);

    const packets: Uint8Array[] = [];
    let lastPacketAt = 0;

    if (!bleEmitter) {
      throw new Error('BLE emitter not available');
    }

    const subscription = bleEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value, peripheral, characteristic }) => {
        if (peripheral !== deviceId || characteristic !== NOTIFY_UUID) return;
        if (!value || value.length === 0) return;
        if (value[0] !== 0x51) return;

        packets.push(Uint8Array.from(value));
        lastPacketAt = Date.now();
      },
    );

    await BleManager.write(deviceId, SERVICE_UUID, WRITE_UUID, [0x30]);

    const stopReason = await waitForTransferWindow({
      timeoutMs: FILE_SUMMARY_TIMEOUT_MS,
      idleWindowMs: FILE_SUMMARY_IDLE_WINDOW_MS,
      hasPackets: () => packets.length > 0,
      isComplete: () => false,
      getLastPacketAt: () => lastPacketAt,
    });

    subscription.remove();

    const year = new Date().getUTCFullYear();
    const files: DeviceFileSummary[] = packets.flatMap((packet) =>
      parseFileSummaryPacket(packet, year),
    );

    const elapsed = Date.now() - startedAt;
    logBridge.info(
      `[${TAGS.join('][')}] readDeviceFiles packets=${packets.length} files=${files.length} reason=${stopReason} elapsedMs=${elapsed}`,
      'DATA',
    );

    return files;
  } catch (error: any) {
    logBridge.error(
      `[${TAGS.join('][')}] readDeviceFiles error: ${error?.message ?? error}`,
      'DATA',
    );
    throw error;
  }
}

/**
 * Download a session trajectory (0x42 -> 0x43/0x44/0x45 ... 0x48).
 */
export async function downloadSessionTrajectory(
  deviceId: string,
  file: DeviceFile,
  options?: SyncDeviceFileOptions,
): Promise<GpsPoint[]> {
  const startedAt = Date.now();
  const simulationMode = options?.simulationMode ?? 'off';
  const isLabMode = simulationMode === 'protocol';
  const tagHeader = buildTagHeader(isLabMode);

  try {
    if (simulationMode === 'protocol') {
      const labOptions = options?.labOptions;
      const chunks = generateWingerProtocolChunks(file, {
        durationMinutes: labOptions?.presetMinutes,
        hz: labOptions?.hz ?? 10,
        phaseModel: 'winger_match_v1',
      });
      const { points } = decodeCompressedGpsStream(chunks, file.startTimeMsUtc);

      await dumpRawChunksToSandbox(
        chunks,
        `sim-${file.id}`,
        {
          deviceId,
          fileId: file.id,
          mode: simulationMode,
          source: 'simulation',
        },
        options?.debugDumpRawChunks,
      );

      const elapsed = Date.now() - startedAt;
      logBridge.info(
        `${tagHeader} downloadSessionTrajectory mode=protocol chunks=${chunks.length} points=${points.length} elapsedMs=${elapsed}`,
        'DATA',
      );

      return points;
    }

    if (!isBleAvailable()) {
      const points = mockPoints(file.startTimeMsUtc || Date.now());
      logBridge.info(
        `[${TAGS.join('][')}] downloadSessionTrajectory (stub) points=${points.length}`,
        'DATA',
      );
      return points;
    }

    await ensureDeviceReadyForTransfer(deviceId);

    const fileId = file.id;
    const hz = 10;
    const payload = [0x42, fileId & 0xff, (fileId >> 8) & 0xff, hz];

    const chunks: Uint8Array[] = [];
    let lastPacketAt = 0;
    let endMarkerReceived = false;

    if (!bleEmitter) {
      throw new Error('BLE emitter not available');
    }

    const subscription = bleEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value, peripheral, characteristic }) => {
        if (peripheral !== deviceId || characteristic !== NOTIFY_UUID) return;
        if (!value || value.length === 0) return;

        const prefix = value[0];
        if (prefix === 0x43 || prefix === 0x44 || prefix === 0x45) {
          chunks.push(Uint8Array.from(value));
          lastPacketAt = Date.now();
        } else if (prefix === 0x48) {
          endMarkerReceived = true;
          lastPacketAt = Date.now();
        }
      },
    );

    await BleManager.write(deviceId, SERVICE_UUID, WRITE_UUID, payload);

    const stopReason = await waitForTransferWindow({
      timeoutMs: TRAJECTORY_TIMEOUT_MS,
      idleWindowMs: TRAJECTORY_IDLE_WINDOW_MS,
      hasPackets: () => chunks.length > 0,
      isComplete: () => endMarkerReceived,
      getLastPacketAt: () => lastPacketAt,
    });

    subscription.remove();

    await dumpRawChunksToSandbox(
      chunks,
      `real-${file.id}`,
      {
        deviceId,
        fileId: file.id,
        mode: simulationMode,
        source: 'ble',
        stopReason,
        endMarkerReceived,
      },
      options?.debugDumpRawChunks,
    );

    const { points } = decodeCompressedGpsStream(chunks, file.startTimeMsUtc);
    const elapsed = Date.now() - startedAt;

    logBridge.info(
      `[${TAGS.join('][')}] downloadSessionTrajectory mode=ble chunks=${chunks.length} points=${points.length} endMarker=${endMarkerReceived} reason=${stopReason} elapsedMs=${elapsed}`,
      'DATA',
    );

    return points;
  } catch (error: any) {
    logBridge.error(
      `[${TAGS.join('][')}] downloadSessionTrajectory error: ${error?.message ?? error}`,
      'DATA',
    );
    throw error;
  }
}

/**
 * High-level sync: download trajectory, map to DTO, post to backend.
 */
export async function syncDeviceFileToBackend(
  playerId: string | null | undefined,
  deviceId: string,
  file: DeviceFile,
  options?: SyncDeviceFileOptions,
): Promise<void> {
  const startedAt = Date.now();
  const isLabMode = (options?.simulationMode ?? 'off') === 'protocol';
  const tagHeader = buildTagHeader(isLabMode);

  try {
    const points = await downloadSessionTrajectory(deviceId, file, options);

    const payload = mapDeviceFileToHardwareSessionDto(file, points, playerId, {
      sessionType: options?.sessionType,
      matchContext: options?.matchContext,
      sourceOverride: isLabMode
        ? options?.labOptions?.sourceLabel ?? 'ACTION_MARK_LAB'
        : undefined,
      simulation: options?.labOptions?.isLabGenerated ?? isLabMode,
      labMeta: options?.labOptions
        ? {
            presetMinutes: options.labOptions.presetMinutes,
            hz: options.labOptions.hz,
            profile: options.labOptions.profile,
            mode: options.simulationMode ?? 'protocol',
          }
        : undefined,
      maxSerializedPoints: isLabMode ? LAB_MAX_SERIALIZED_POINTS : undefined,
    });

    await api.createHardwareSession(payload);

    const elapsed = Date.now() - startedAt;
    logBridge.info(
      `${tagHeader} sync success file=${file.id} points=${points.length} sessionType=${payload.type} mode=${options?.simulationMode ?? 'off'} elapsedMs=${elapsed}`,
      'DATA',
    );
  } catch (error: any) {
    logBridge.error(
      `${tagHeader} sync error: ${error?.message ?? error}`,
      'DATA',
    );
    throw error;
  }
}
