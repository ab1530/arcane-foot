import api from '../../api';
import { mapDeviceFileToHardwareSessionDto } from '../../hardware/sessionMapping';
import * as actionTracerBle from '../actionTracerBle';
import { DeviceFile } from '../../hardware/bleProtocol';

jest.mock('../../api');
jest.mock('../../hardware/sessionMapping');
describe('actionTracerBle syncDeviceFileToBackend', () => {
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
    const points = [{ timeMsUtc: 0, latitudeDeg: 0, longitudeDeg: 0 }];
    const payload = { deviceId: 'p', source: 's', type: 'training', startedAt: '', endedAt: '' };
    mockMap.mockReturnValue(payload);
    mockCreate.mockResolvedValue({});

    await actionTracerBle.syncDeviceFileToBackend('player-1', 'dev-1', file);

    expect(mockMap).toHaveBeenCalledWith(file, expect.any(Array), 'player-1');
    const mappedPoints = mockMap.mock.calls[0][1];
    expect(Array.isArray(mappedPoints)).toBe(true);
    expect(mappedPoints.length).toBeGreaterThan(0);
    expect(mockCreate).toHaveBeenCalledWith(payload);
  });
});
