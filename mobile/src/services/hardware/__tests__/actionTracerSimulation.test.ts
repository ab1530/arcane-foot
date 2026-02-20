import { decodeCompressedGpsStream, DeviceFile } from '../bleProtocol';
import { generateWingerProtocolChunks } from '../actionTracerSimulation';

const makeFile = (id: number, minutes: number, hz = 10): DeviceFile => ({
  id,
  startDateMmdd: 511,
  startTimeMsUtc: 0,
  endDateMmdd: 511,
  endTimeMsUtc: minutes * 60 * 1000,
  length: minutes * 60 * hz,
  state: 'completed',
});

const hasJumpMarker = (chunk: Uint8Array) => {
  if (!chunk.length) return false;
  const startIndex = chunk[0] === 0x43 ? 11 : 1;
  for (let i = startIndex; i + 1 < chunk.length; i += 2) {
    const int8Value = (chunk[i] << 24) >> 24;
    if (int8Value === -128) {
      return true;
    }
  }
  return false;
};

describe('actionTracerSimulation', () => {
  it.each([20, 45, 90] as const)(
    'generates protocol-compliant chunks for %s minutes',
    (minutes) => {
      const hz = 10;
      const file = makeFile(minutes, minutes, hz);

      const chunks = generateWingerProtocolChunks(file, {
        durationMinutes: minutes,
        hz,
        phaseModel: 'winger_match_v1',
      });

      expect(chunks.length).toBeGreaterThan(2);
      expect(chunks[0][0]).toBe(0x43);
      expect(chunks[chunks.length - 1][0]).toBe(0x48);
      expect(chunks.some((chunk) => chunk[0] === 0x44 || chunk[0] === 0x45)).toBe(true);
      expect(chunks.some(hasJumpMarker)).toBe(true);

      const dataChunks = chunks.filter((chunk) => chunk[0] !== 0x48);
      const { points } = decodeCompressedGpsStream(dataChunks, file.startTimeMsUtc);
      expect(points.length).toBe(minutes * 60 * hz + 1);
      expect(points[0].timeMsUtc).toBe(0);
      expect(points[points.length - 1].timeMsUtc).toBeGreaterThan(points[0].timeMsUtc);
    },
  );
});
