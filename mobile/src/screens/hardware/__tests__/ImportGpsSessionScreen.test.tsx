import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ImportGpsSessionScreen } from '../ImportGpsSessionScreen';
import type { DeviceFile } from '../../../services/hardware/bleProtocol';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => ({
    params: {
      deviceId: 'dev-1',
      deviceName: '$ATP-B0015',
      initialMode: 'lab',
      initialLabPresetMinutes: 90,
      preselectedSessionType: 'match',
    },
  }),
}));

jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      darkBg: '#020617',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      accent: '#d9f939',
      glass: '#1e293b',
      glassBorder: '#334155',
      error: '#ef4444',
    },
  }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      playerId: 'player-1',
      role: 'PLAYER',
    },
  }),
}));

jest.mock('../../../services/toast', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));

jest.mock('../../../services/ble/actionTracerBle', () => {
  let labId = 9900;
  return {
    readDeviceFiles: jest.fn(),
    syncDeviceFileToBackend: jest.fn(),
    createLabVirtualDeviceFile: jest.fn((presetMinutes: 20 | 45 | 90, hz: 10) => {
      labId += 1;
      return {
        id: labId,
        startDateMmdd: 511,
        startTimeMsUtc: 0,
        endDateMmdd: 511,
        endTimeMsUtc: presetMinutes * 60 * 1000,
        length: presetMinutes * 60 * hz,
        state: 'completed',
      };
    }),
  };
});

describe('ImportGpsSessionScreen LAB flow', () => {
  const bleModule = jest.requireMock('../../../services/ble/actionTracerBle') as {
    readDeviceFiles: jest.Mock;
    syncDeviceFileToBackend: jest.Mock;
  };

  beforeEach(() => {
    mockNavigate.mockReset();
    bleModule.readDeviceFiles.mockReset();
    bleModule.syncDeviceFileToBackend.mockReset();
  });

  it('shows LAB generator and creates an importable LAB session', async () => {
    const realFile: DeviceFile = {
      id: 1,
      startDateMmdd: 511,
      startTimeMsUtc: 0,
      endDateMmdd: 511,
      endTimeMsUtc: 3000,
      length: 36,
      state: 'completed',
    };
    bleModule.readDeviceFiles.mockResolvedValue([realFile]);
    bleModule.syncDeviceFileToBackend.mockResolvedValue(undefined);

    const screen = render(<ImportGpsSessionScreen />);

    await waitFor(() => expect(bleModule.readDeviceFiles).toHaveBeenCalledTimes(1));
    expect(screen.getByText('LAB Generator')).toBeTruthy();

    fireEvent.press(screen.getByText('Générer séance LAB'));

    expect(screen.getByText(/LAB Winger/)).toBeTruthy();
    expect(screen.getByText(/Preset: 90 min/)).toBeTruthy();
  });

  it('imports generated LAB session with protocol options', async () => {
    const realFile: DeviceFile = {
      id: 2,
      startDateMmdd: 511,
      startTimeMsUtc: 0,
      endDateMmdd: 511,
      endTimeMsUtc: 3000,
      length: 36,
      state: 'completed',
    };
    bleModule.readDeviceFiles.mockResolvedValue([realFile]);
    bleModule.syncDeviceFileToBackend.mockResolvedValue(undefined);

    const screen = render(<ImportGpsSessionScreen />);
    await waitFor(() => expect(bleModule.readDeviceFiles).toHaveBeenCalledTimes(1));

    fireEvent.press(screen.getByText('Générer séance LAB'));
    const importButtons = screen.getAllByText('Importer');
    fireEvent.press(importButtons[0]);

    await waitFor(() => expect(bleModule.syncDeviceFileToBackend).toHaveBeenCalledTimes(1));
    const [, , , options] = bleModule.syncDeviceFileToBackend.mock.calls[0];
    expect(options).toMatchObject({
      sessionType: 'match',
      simulationMode: 'protocol',
      labOptions: {
        presetMinutes: 90,
        hz: 10,
        profile: 'winger',
        sourceLabel: 'ACTION_MARK_LAB',
        isLabGenerated: true,
      },
    });
  });
});
