import { DeviceFile, GpsPoint, parseFileSummaryPacket, decodeCompressedGpsStream } from '../hardware/bleProtocol';
import { mapDeviceFileToHardwareSessionDto } from '../hardware/sessionMapping';
import api from '../api';
import { logBridge } from '../../logging/expoLogBridge';
import BleManager from 'react-native-ble-manager';
import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';

export interface BleDeviceSummary {
  id: string;
  name?: string;
}

export type DeviceFileSummary = DeviceFile;

const TAGS: [string, string] = ['GPS', 'ACTION_TRACER'];

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

const BleManagerModule = NativeModules.BleManager;
const bleEmitter = BleManagerModule ? new NativeEventEmitter(BleManagerModule) : null;
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

const isBleAvailable = () => !!BleManagerModule && !!bleEmitter;

const mockScanDevices = (): BleDeviceSummary[] => [{ id: 'mock-device-1', name: 'Mock ActionMark' }];

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
        } else if (state === 'off' || state === 'unauthorized' || state === 'unsupported') {
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

/**
 * Scan for ActionTracer devices (stub).
 */
export async function scanForActionTracerDevices(): Promise<BleDeviceSummary[]> {
  try {
    if (!isBleAvailable()) {
      const devices = mockScanDevices();
      logBridge.info(`[${TAGS.join('][')}] scan (stub) success: ${devices.length} devices`, 'DATA');
      return devices;
    }

    await ensureBleInitialized();
    await ensureBlePermissions();
    await waitForBlePoweredOn();

    await BleManager.scan([], 5, true);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const peripherals = await BleManager.getDiscoveredPeripherals([]);
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
        `[${TAGS.join('][')}] scan debug – discovered peripherals: ${JSON.stringify(debugList)}`,
        'DATA',
      );
    }

    logBridge.info(`[${TAGS.join('][')}] scan success: ${devices.length} devices`, 'DATA');
    return devices;
  } catch (error: any) {
    logBridge.error(`[${TAGS.join('][')}] scan error: ${error?.message ?? error}`, 'DATA');
    throw error;
  }
}

/**
 * Connect to a device (stub).
 */
export async function connectToActionTracer(deviceId: string): Promise<void> {
  try {
    if (!isBleAvailable()) {
      logBridge.info(`[${TAGS.join('][')}] connect (stub) success: ${deviceId}`, 'DATA');
      return;
    }

    await ensureBleInitialized();
    await ensureBlePermissions();

    await BleManager.connect(deviceId);
    await BleManager.retrieveServices(deviceId);
    await BleManager.startNotification(deviceId, SERVICE_UUID, NOTIFY_UUID);

    logBridge.info(`[${TAGS.join('][')}] connect success: ${deviceId}`, 'DATA');
  } catch (error: any) {
    logBridge.error(`[${TAGS.join('][')}] connect error: ${error?.message ?? error}`, 'DATA');
    throw error;
  }
}

/**
 * Read device files (stub with synthetic 0x51 data).
 */
export async function readDeviceFiles(deviceId: string): Promise<DeviceFileSummary[]> {
  try {
    if (!isBleAvailable()) {
      const files = mockFiles();
      logBridge.info(`[${TAGS.join('][')}] readDeviceFiles (stub) success: ${files.length} files`, 'DATA');
      return files;
    }

    await ensureBleInitialized();
    await ensureBlePermissions();

    const packets: Uint8Array[] = [];

    if (!bleEmitter) {
      throw new Error('BLE emitter not available');
    }

    const subscription = bleEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value, peripheral, characteristic }) => {
        if (peripheral !== deviceId || characteristic !== NOTIFY_UUID) return;
        if (!value || value.length === 0) return;
        if (value[0] === 0x51) {
          packets.push(Uint8Array.from(value));
        }
      },
    );

    await BleManager.write(deviceId, SERVICE_UUID, WRITE_UUID, [0x30]);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    subscription.remove();

    const year = new Date().getUTCFullYear();
    const files: DeviceFileSummary[] = packets.flatMap((p) => parseFileSummaryPacket(p, year));

    logBridge.info(`[${TAGS.join('][')}] readDeviceFiles success: ${files.length} files`, 'DATA');
    return files;
  } catch (error: any) {
    logBridge.error(`[${TAGS.join('][')}] readDeviceFiles error: ${error?.message ?? error}`, 'DATA');
    throw error;
  }
}

/**
 * Download a session trajectory.
 */
export async function downloadSessionTrajectory(deviceId: string, file: DeviceFile): Promise<GpsPoint[]> {
  try {
    if (!isBleAvailable()) {
      const points = mockPoints(file.startTimeMsUtc || Date.now());
      logBridge.info(`[${TAGS.join('][')}] downloadSessionTrajectory (stub) points=${points.length}`, 'DATA');
      return points;
    }

    await ensureBleInitialized();
    await ensureBlePermissions();

    const fileId = file.id;
    const hz = 10;
    const payload = [0x42, fileId & 0xff, (fileId >> 8) & 0xff, hz];

    const chunks: Uint8Array[] = [];

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
        } else if (prefix === 0x48) {
          // end marker received
        }
      },
    );

    await BleManager.write(deviceId, SERVICE_UUID, WRITE_UUID, payload);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    subscription.remove();

    const { points } = decodeCompressedGpsStream(chunks, file.startTimeMsUtc);

    logBridge.info(`[${TAGS.join('][')}] downloadSessionTrajectory points=${points.length}`, 'DATA');
    return points;
  } catch (error: any) {
    logBridge.error(`[${TAGS.join('][')}] downloadSessionTrajectory error: ${error?.message ?? error}`, 'DATA');
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
): Promise<void> {
  try {
    const points = await downloadSessionTrajectory(deviceId, file);
    const payload = mapDeviceFileToHardwareSessionDto(file, points, playerId);
    await api.createHardwareSession(payload);
    logBridge.info(
      `[${TAGS.join('][')}] sync success file=${file.id} points=${points.length}`,
      'DATA',
    );
  } catch (error: any) {
    logBridge.error(`[${TAGS.join('][')}] sync error: ${error?.message ?? error}`, 'DATA');
    throw error;
  }
}
