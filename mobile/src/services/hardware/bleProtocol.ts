/**
 * Pure TypeScript BLE protocol decoder for the ActionMark tracker.
 * This module does not perform any BLE I/O; it only decodes raw byte payloads.
 */

export type DeviceFileState = 'not_started' | 'recording' | 'completed';

export interface DeviceFile {
  id: number;
  startDateMmdd: number;
  startTimeMsUtc: number;
  endDateMmdd: number;
  endTimeMsUtc: number;
  length: number;
  state: DeviceFileState;
}

export interface GpsPoint {
  timeMsUtc: number;
  latitudeDeg: number;
  longitudeDeg: number;
}

export interface GpsDecodeState {
  timeMsUtc: number;
  latRaw: number;
  lonRaw: number;
}

const DEGREES_DIVISOR = 6000000.0; // raw units to degrees
const ENTRY_SIZE = 21; // bytes per file entry in 0x51 payload

const toDeviceFileState = (value: number): DeviceFileState => {
  switch (value) {
    case 1:
      return 'recording';
    case 2:
      return 'completed';
    case 0:
    default:
      return 'not_started';
  }
};

const rawToDegrees = (value: number) => value / DEGREES_DIVISOR;

/**
 * Parse a 0x51 file summary packet into device file descriptors.
 * @param value Uint8Array beginning with 0x51
 * @param currentYear optional year (not used for conversion here)
 */
export function parseFileSummaryPacket(value: Uint8Array, currentYear: number): DeviceFile[] {
  if (!value || value.length < 1 || value[0] !== 0x51) {
    return [];
  }

  const dv = new DataView(value.buffer, value.byteOffset, value.byteLength);
  const files: DeviceFile[] = [];

  for (let offset = 1; offset + ENTRY_SIZE <= value.length; offset += ENTRY_SIZE) {
    const startDateMmdd = dv.getInt32(offset, true);
    const startTimeMsUtc = dv.getInt32(offset + 4, true);
    const endDateMmdd = dv.getInt32(offset + 8, true);
    const endTimeMsUtc = dv.getInt32(offset + 12, true);
    let length = dv.getUint16(offset + 16, true);
    const id = dv.getUint16(offset + 18, true);
    const statusByte = dv.getUint8(offset + 20);

    if (statusByte & 0x80) {
      length += 65536;
    }

    const state = toDeviceFileState(statusByte & 0x7f);

    files.push({
      id,
      startDateMmdd,
      startTimeMsUtc,
      endDateMmdd,
      endTimeMsUtc,
      length,
      state,
    });
  }

  return files;
}

/**
 * Parse a compressed GPS data chunk (0x43 packet).
 * @param value raw packet
 * @param fileStartTimeMsUtc absolute start time of the file (ms UTC of day or absolute)
 * @param previousState state from previous chunk (time/latRaw/lonRaw)
 */
export function parseCompressedGpsChunk(
  value: Uint8Array,
  fileStartTimeMsUtc: number,
  previousState?: GpsDecodeState,
): { points: GpsPoint[]; state: GpsDecodeState } {
  if (!value || value.length === 0) {
    return {
      points: [],
      state: previousState ?? { timeMsUtc: fileStartTimeMsUtc, latRaw: 0, lonRaw: 0 },
    };
  }

  const prefix = value[0];
  const isHeaderPacket = prefix === 0x43 && !previousState;
  const isContinuationPacket =
    prefix === 0x44 || prefix === 0x45 || (prefix === 0x43 && !!previousState);

  if (!isHeaderPacket && !isContinuationPacket) {
    return {
      points: [],
      state: previousState ?? { timeMsUtc: fileStartTimeMsUtc, latRaw: 0, lonRaw: 0 },
    };
  }

  const dv = new DataView(value.buffer, value.byteOffset, value.byteLength);
  const points: GpsPoint[] = [];

  let timeMsUtc: number;
  let latRaw: number;
  let lonRaw: number;
  let startIndex: number;

  if (previousState) {
    ({ timeMsUtc, latRaw, lonRaw } = previousState);
    startIndex = 1;
  } else {
    if (!isHeaderPacket) {
      return {
        points: [],
        state: { timeMsUtc: fileStartTimeMsUtc, latRaw: 0, lonRaw: 0 },
      };
    }
    if (value.length < 11) {
      return { points: [], state: { timeMsUtc: fileStartTimeMsUtc, latRaw: 0, lonRaw: 0 } };
    }
    const relativeStart = dv.getUint16(1, true);
    timeMsUtc = fileStartTimeMsUtc + relativeStart * 100;
    latRaw = dv.getInt32(3, true);
    lonRaw = dv.getInt32(7, true);

    points.push({
      timeMsUtc,
      latitudeDeg: rawToDegrees(latRaw),
      longitudeDeg: rawToDegrees(lonRaw),
    });

    startIndex = 11;
  }

  for (let idx = startIndex; idx + 1 < value.length; idx += 2) {
    const latDelta = dv.getInt8(idx);
    const lonDelta = dv.getInt8(idx + 1);

    if (latDelta === -128) {
      const jumpCount = lonDelta & 0xff;
      timeMsUtc += jumpCount * 100;
      continue;
    }

    timeMsUtc += 100;
    latRaw += latDelta * 2;
    lonRaw += lonDelta * 2;

    points.push({
      timeMsUtc,
      latitudeDeg: rawToDegrees(latRaw),
      longitudeDeg: rawToDegrees(lonRaw),
    });
  }

  return {
    points,
    state: { timeMsUtc, latRaw, lonRaw },
  };
}

/**
 * Decode a full compressed GPS stream (sequence of 0x43 packets, ending with 0x48).
 */
export function decodeCompressedGpsStream(
  chunks: Uint8Array[],
  fileStartTimeMsUtc: number,
): { points: GpsPoint[] } {
  const allPoints: GpsPoint[] = [];
  let state: GpsDecodeState | undefined;

  for (const chunk of chunks) {
    if (!chunk || chunk.length === 0) {
      continue;
    }

    const prefix = chunk[0];
    if (prefix === 0x43 || prefix === 0x44 || prefix === 0x45) {
      if ((prefix === 0x44 || prefix === 0x45) && !state) {
        // Invalid sequence: continuation before header.
        continue;
      }
      const { points, state: nextState } = parseCompressedGpsChunk(chunk, fileStartTimeMsUtc, state);
      allPoints.push(...points);
      if (points.length > 0 || state) {
        state = nextState;
      }
    } else if (prefix === 0x48) {
      break; // end of transfer
    } else {
      // Unknown prefix, skip
      continue;
    }
  }

  return { points: allPoints };
}
