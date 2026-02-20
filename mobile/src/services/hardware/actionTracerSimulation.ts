import { decodeCompressedGpsStream, DeviceFile, GpsPoint } from './bleProtocol';

const BASE_LAT_RAW = 306_000_000; // 51.0°
const BASE_LON_RAW = 18_000_000; // 3.0°
const DEFAULT_HZ = 10;
const DEFAULT_DURATION_MINUTES = 90;

const clampInt8 = (value: number) => Math.max(-127, Math.min(127, Math.round(value)));

const writeInt16LE = (view: DataView, offset: number, value: number) => {
  view.setUint16(offset, value & 0xffff, true);
};

const writeInt32LE = (view: DataView, offset: number, value: number) => {
  view.setInt32(offset, value | 0, true);
};

export interface WingerSimulationOptions {
  durationMinutes?: number;
  phaseModel?: 'winger_match_v1';
  sampleCount?: number;
  maxPacketBytes?: number;
  hz?: number;
}

const buildWingerDeltas = (
  sampleCount: number,
  hz: number,
  phaseModel: 'winger_match_v1',
): Array<[number, number]> => {
  const deltas: Array<[number, number]> = [];
  const phaseForward = (progress: number) => {
    if (progress < 0.1) return 8;
    if (progress < 0.32) return 19;
    if (progress < 0.5) return -7;
    if (progress < 0.75) return 16;
    if (progress < 0.9) return -10;
    return 7;
  };
  const phaseLateral = (progress: number) => {
    if (progress < 0.15) return -4;
    if (progress < 0.35) return 6;
    if (progress < 0.58) return -5;
    if (progress < 0.82) return 4;
    return -3;
  };
  const safeHz = Math.max(1, hz);

  for (let i = 0; i < sampleCount; i++) {
    const progress = i / Math.max(1, sampleCount - 1);
    const forwardBase = phaseForward(progress);
    const lateralBase = phaseLateral(progress);

    // Deterministic micro-variations to keep a realistic winger trajectory.
    const forwardNoise = Math.sin(i / 9) * 4 + Math.cos(i / 21) * 2;
    const lateralNoise = Math.sin(i / 13) * 3 + Math.cos(i / 31) * 2;
    const burstWindow = i % (safeHz * 36);
    const burst = burstWindow < safeHz * 6 ? 5 : 0;

    let dLat = clampInt8(lateralBase + lateralNoise);
    let dLon = clampInt8(forwardBase + forwardNoise + burst);

    if (phaseModel === 'winger_match_v1' && progress > 0.45 && progress < 0.55) {
      // Mid-match recovery band: slower vertical progression.
      dLon = clampInt8(dLon * 0.55);
      dLat = clampInt8(dLat * 0.9);
    }

    deltas.push([dLat, dLon]);

    // Sparse skip markers to mimic compression jumps.
    if (i > 0 && i % (safeHz * 90) === 0) {
      deltas.push([-128, 2]); // +200 ms
    }
  }

  return deltas;
};

export function generateWingerProtocolChunks(
  file: DeviceFile,
  options?: WingerSimulationOptions,
): Uint8Array[] {
  const hz = Math.max(1, Math.round(options?.hz ?? DEFAULT_HZ));
  const durationMinutes = Math.max(1, Math.round(options?.durationMinutes ?? DEFAULT_DURATION_MINUTES));
  const sampleCount = Math.max(
    120,
    options?.sampleCount ?? durationMinutes * 60 * hz,
  );
  const phaseModel = options?.phaseModel ?? 'winger_match_v1';
  const maxPacketBytes = Math.max(16, options?.maxPacketBytes ?? 20);
  const deltas = buildWingerDeltas(sampleCount, hz, phaseModel);

  const chunks: Uint8Array[] = [];
  const firstDataBytes = Math.max(
    2,
    Math.floor((maxPacketBytes - 11) / 2) * 2, // keep pairs
  );
  const continuationDataBytes = Math.max(
    2,
    Math.floor((maxPacketBytes - 1) / 2) * 2,
  );

  let cursor = 0;
  const firstPairs = Math.min(deltas.length, firstDataBytes / 2);
  const firstChunkLength = 11 + firstPairs * 2;
  const firstChunk = new Uint8Array(firstChunkLength);
  const firstView = new DataView(
    firstChunk.buffer,
    firstChunk.byteOffset,
    firstChunk.byteLength,
  );
  firstChunk[0] = 0x43;
  writeInt16LE(firstView, 1, 0); // relative start at 0
  writeInt32LE(firstView, 3, BASE_LAT_RAW);
  writeInt32LE(firstView, 7, BASE_LON_RAW);

  for (let i = 0; i < firstPairs; i++) {
    const [dLat, dLon] = deltas[cursor++];
    const offset = 11 + i * 2;
    firstView.setInt8(offset, dLat);
    firstView.setInt8(offset + 1, dLon);
  }
  chunks.push(firstChunk);

  let continuationIndex = 0;
  while (cursor < deltas.length) {
    const prefix = continuationIndex % 2 === 0 ? 0x44 : 0x45;
    const pairCount = Math.min(
      Math.floor(continuationDataBytes / 2),
      deltas.length - cursor,
    );
    const chunk = new Uint8Array(1 + pairCount * 2);
    const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    chunk[0] = prefix;

    for (let i = 0; i < pairCount; i++) {
      const [dLat, dLon] = deltas[cursor++];
      const offset = 1 + i * 2;
      view.setInt8(offset, dLat);
      view.setInt8(offset + 1, dLon);
    }

    chunks.push(chunk);
    continuationIndex += 1;
  }

  chunks.push(new Uint8Array([0x48]));
  return chunks;
}

export function decodeWingerProtocolSimulation(
  file: DeviceFile,
  options?: WingerSimulationOptions,
): GpsPoint[] {
  const chunks = generateWingerProtocolChunks(file, options);
  const { points } = decodeCompressedGpsStream(chunks, file.startTimeMsUtc);
  return points;
}
