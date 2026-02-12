import {
  decodeCompressedGpsStream,
  parseCompressedGpsChunk,
  parseFileSummaryPacket,
  DeviceFile,
  GpsPoint,
} from '../bleProtocol';

const buildFileEntry = (
  startDate: number,
  startTime: number,
  endDate: number,
  endTime: number,
  length: number,
  id: number,
  status: number,
) => {
  const buffer = new ArrayBuffer(21);
  const dv = new DataView(buffer);
  dv.setInt32(0, startDate, true);
  dv.setInt32(4, startTime, true);
  dv.setInt32(8, endDate, true);
  dv.setInt32(12, endTime, true);
  dv.setUint16(16, length, true);
  dv.setUint16(18, id, true);
  dv.setUint8(20, status);
  return new Uint8Array(buffer);
};

describe('bleProtocol - file summary parsing', () => {
  it('parses a single 0x51 packet with one file and extended length', () => {
    const entry = buildFileEntry(0x00000511, 1000, 0x00000512, 2000, 1234, 42, 0x82); // 0x80 ext + state=2
    const packet = new Uint8Array([0x51, ...entry]);

    const files = parseFileSummaryPacket(packet, 2025);

    expect(files).toHaveLength(1);
    const file = files[0] as DeviceFile;
    expect(file.id).toBe(42);
    expect(file.length).toBe(1234 + 65536);
    expect(file.state).toBe('completed');
    expect(file.startDateMmdd).toBe(0x00000511);
    expect(file.startTimeMsUtc).toBe(1000);
  });

  it('ignores incomplete trailing data', () => {
    const entryA = buildFileEntry(0x00000511, 1000, 0x00000512, 2000, 10, 1, 0x01);
    const incomplete = new Uint8Array([1, 2, 3]); // less than entry size
    const packet = new Uint8Array([0x51, ...entryA, ...incomplete]);

    const files = parseFileSummaryPacket(packet, 2025);

    expect(files).toHaveLength(1);
    expect(files[0].id).toBe(1);
    expect(files[0].state).toBe('recording');
  });
});

const toBytesLE = (value: number, byteLength: number) => {
  const buffer = new ArrayBuffer(byteLength);
  const dv = new DataView(buffer);
  if (byteLength === 2) {
    dv.setUint16(0, value, true);
  } else if (byteLength === 4) {
    dv.setInt32(0, value, true);
  }
  return new Uint8Array(buffer);
};

describe('bleProtocol - compressed GPS chunk parsing', () => {
  it('parses first chunk with initial point and deltas', () => {
    const relativeStart = 5; // 0.5s
    const latRaw = 6_000_000; // 1 deg
    const lonRaw = 12_000_000; // 2 deg
    const latDelta = 1; // +2 raw
    const lonDelta = -1; // -2 raw

    const packet = new Uint8Array([
      0x43,
      ...toBytesLE(relativeStart, 2),
      ...toBytesLE(latRaw, 4),
      ...toBytesLE(lonRaw, 4),
      latDelta & 0xff,
      lonDelta & 0xff,
    ]);

    const { points, state } = parseCompressedGpsChunk(packet, 0);

    expect(points).toHaveLength(2);
    const p0 = points[0] as GpsPoint;
    const p1 = points[1] as GpsPoint;
    expect(p0.timeMsUtc).toBe(500);
    expect(p0.latitudeDeg).toBeCloseTo(1);
    expect(p0.longitudeDeg).toBeCloseTo(2);

    expect(p1.timeMsUtc).toBe(600);
    expect(p1.latitudeDeg).toBeCloseTo(1.000000333, 6);
    expect(p1.longitudeDeg).toBeCloseTo(1.999999667, 6);

    expect(state.latRaw).toBe(latRaw + latDelta * 2);
    expect(state.lonRaw).toBe(lonRaw + lonDelta * 2);
  });

  it('handles time jumps and subsequent chunks', () => {
    const relativeStart = 0;
    const latRaw = 6_000_000;
    const lonRaw = 12_000_000;
    // first packet: initial point + jump + delta
    const packet1 = new Uint8Array([
      0x43,
      ...toBytesLE(relativeStart, 2),
      ...toBytesLE(latRaw, 4),
      ...toBytesLE(lonRaw, 4),
      0x80, // -128 => jump marker
      0x05, // jump count => +500ms
      0x02, // latDelta
      0x02, // lonDelta
    ]);

    const first = parseCompressedGpsChunk(packet1, 0);
    expect(first.points).toHaveLength(2); // initial + one delta
    expect(first.points[1].timeMsUtc).toBe(600); // 0 + jump(500) + 100

    // second packet: continuing deltas
    const packet2 = new Uint8Array([0x43, 0xff, 0x00]); // latDelta=-1 lonDelta=0
    const second = parseCompressedGpsChunk(packet2, 0, first.state);
    expect(second.points).toHaveLength(1);
    expect(second.points[0].timeMsUtc).toBe(700);
  });
});

describe('bleProtocol - decodeCompressedGpsStream', () => {
  it('aggregates multiple chunks and stops on 0x48', () => {
    const baseChunk = new Uint8Array([
      0x43,
      0x00,
      0x00,
      ...toBytesLE(6_000_000, 4),
      ...toBytesLE(12_000_000, 4),
      0x01,
      0x01,
    ]);
    const deltaChunk = new Uint8Array([0x43, 0x01, 0xff]); // delta pair only
    const endChunk = new Uint8Array([0x48]);

    const { points } = decodeCompressedGpsStream([baseChunk, deltaChunk, endChunk], 0);
    expect(points.length).toBe(3); // initial + first delta + second delta
  });
});
