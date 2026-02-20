import { mapDeviceFileToHardwareSessionDto } from '../../hardware/sessionMapping';
import * as actionTracerBle from '../actionTracerBle';
import { DeviceFile } from '../../hardware/bleProtocol';

jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    createHardwareSession: jest.fn(),
  },
}));

jest.mock('../../hardware/sessionMapping', () => ({
  mapDeviceFileToHardwareSessionDto: jest.fn(),
}));
describe('actionTracerBle syncDeviceFileToBackend', () => {
  const api = jest.requireMock('../../api').default as {
    createHardwareSession: jest.Mock;
  };
  const mockCreate = api.createHardwareSession as jest.Mock;
  const mockMap = mapDeviceFileToHardwareSessionDto as jest.Mock;

  beforeEach(() => {
    mockCreate.mockReset();
    mockMap.mockReset();
  });

  it('downloads, maps, and posts session', async () => {
    const file: DeviceFile = {
      id: 1,
      startDateMmdd: 511,
      startTimeMsUtc: 0,
      endDateMmdd: 511,
      endTimeMsUtc: 1000,
      length: 2,
      state: 'completed',
    };
    const payload = {
      deviceId: 'p',
      source: 's',
      type: 'training',
      startedAt: '',
      endedAt: '',
    };
    mockMap.mockReturnValue(payload);
    mockCreate.mockResolvedValue({});

    await actionTracerBle.syncDeviceFileToBackend('player-1', 'dev-1', file);

    expect(mockMap).toHaveBeenCalledWith(
      file,
      expect.any(Array),
      'player-1',
      expect.any(Object),
    );
    const mappedPoints = mockMap.mock.calls[0][1];
    expect(Array.isArray(mappedPoints)).toBe(true);
    expect(mappedPoints.length).toBeGreaterThan(0);
    expect(mockCreate).toHaveBeenCalledWith(payload);
  });

  it('passes sync options to mapping', async () => {
    const file: DeviceFile = {
      id: 2,
      startDateMmdd: 511,
      startTimeMsUtc: 0,
      endDateMmdd: 511,
      endTimeMsUtc: 1000,
      length: 2,
      state: 'completed',
    };
    mockMap.mockReturnValue({
      deviceId: 'p',
      source: 's',
      type: 'match',
      startedAt: '',
      endedAt: '',
    });
    mockCreate.mockResolvedValue({});

    await actionTracerBle.syncDeviceFileToBackend('player-1', 'dev-1', file, {
      sessionType: 'match',
      simulationMode: 'protocol',
      labOptions: {
        presetMinutes: 90,
        hz: 10,
        profile: 'winger',
        sourceLabel: 'ACTION_MARK_LAB',
        isLabGenerated: true,
      },
      matchContext: {
        matchId: 'match-1',
        matchLabel: 'Demo',
      },
    });

    expect(mockMap.mock.calls[0][3]).toMatchObject({
      sessionType: 'match',
      matchContext: {
        matchId: 'match-1',
        matchLabel: 'Demo',
      },
      sourceOverride: 'ACTION_MARK_LAB',
      simulation: true,
      labMeta: {
        presetMinutes: 90,
        hz: 10,
        profile: 'winger',
        mode: 'protocol',
      },
    });
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
