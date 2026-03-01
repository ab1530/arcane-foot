import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { DashboardScreen } from '../DashboardScreen';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../contexts/LocalizationContext', () => {
  const { fr } = require('../../../i18n/locales/fr');
  const { createTranslator } = require('@shared/i18n');
  const translator = createTranslator(fr);
  return {
    useLocalization: () => ({
      language: 'fr',
      t: translator,
      dictionary: fr,
      setLanguage: jest.fn(),
    }),
  };
});

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getDashboardMobileHome: jest.fn(),
    getDashboardStats: jest.fn(),
    getPlayers: jest.fn(),
    getReports: jest.fn(),
    getPlayer: jest.fn(),
    getHardwareSessions: jest.fn(),
    getMarket: jest.fn(),
    getUsers: jest.fn(),
    listClubNeedRequests: jest.fn(),
  },
}));

jest.mock('../../../services/wearables/qcBand', () => ({
  qcBand: {
    getLastSeenDevice: jest.fn().mockResolvedValue(null),
    connectLastSeen: jest.fn().mockResolvedValue(undefined),
    getBattery: jest.fn().mockResolvedValue({ level: 6, charging: false }),
    getCurrentSteps: jest.fn().mockResolvedValue({ steps: 1200, distanceM: 800, calories: 80, timeMin: 12 }),
    getTodayStats: jest.fn().mockResolvedValue({ steps: 2400, distanceM: 1600, calories: 120, timeMin: 30 }),
    addHeartRateListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  formatBatteryPercent: (level?: number) =>
    typeof level === 'number' ? Math.round((Math.max(0, Math.min(8, level)) / 8) * 100) : null,
  formatDistanceKm: (distanceM?: number) =>
    typeof distanceM === 'number' ? (distanceM / 1000).toFixed(1) : '--',
}));

describe('DashboardScreen', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const mockNavigation = { navigate: jest.fn() };
  const mockApi = api as unknown as {
    getDashboardMobileHome: jest.Mock;
    getDashboardStats: jest.Mock;
    getPlayers: jest.Mock;
    getReports: jest.Mock;
    getPlayer: jest.Mock;
    getHardwareSessions: jest.Mock;
    getMarket: jest.Mock;
    getUsers: jest.Mock;
    listClubNeedRequests: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation.navigate.mockReset();
    mockUseAuth.mockReturnValue({
      user: { firstName: 'Abdallah', role: 'SCOUT' },
      activeRole: null,
    });

    mockApi.getDashboardStats.mockResolvedValue({
      totalReports: 12,
      totalPlayers: 48,
      matchesAttended: 5,
      openDemandRequests: 15,
      totalXP: 3600,
    });
    mockApi.getDashboardMobileHome.mockResolvedValue(null);
    mockApi.getPlayers.mockResolvedValue({ items: [], data: [] });
    mockApi.getReports.mockResolvedValue({ items: [], data: [] });
    mockApi.getMarket.mockResolvedValue({ meta: { total: 69 }, data: [] });
    mockApi.getUsers.mockResolvedValue({ meta: { total: 4 }, data: [] });
    mockApi.listClubNeedRequests.mockResolvedValue({ meta: { total: 2 }, data: [] });
    mockApi.getPlayer.mockResolvedValue(null);
    mockApi.getHardwareSessions.mockResolvedValue([]);
  });

  it('affiche la matrice scout (reports/players/calendar/agent requests)', async () => {
    const { getByText, getByTestId } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => {
      expect(getByText('Abdallah')).toBeTruthy();
      expect(getByTestId('stat-reports-value').props.children).toBe(12);
      expect(getByTestId('stat-players-value').props.children).toBe(48);
      expect(getByTestId('stat-calendar-value').props.children).toBe(5);
      expect(getByTestId('stat-agentRequests-value').props.children).toBe(15);
    });
  });

  it('affiche la matrice admin (calendar/transfermarkt/players/scouts)', async () => {
    mockUseAuth.mockReturnValue({
      user: { firstName: 'Super', role: 'ADMIN' },
      activeRole: 'ADMIN',
    });
    mockApi.getDashboardStats.mockResolvedValue({
      totalReports: 1,
      totalPlayers: 3,
      matchesAttended: 4,
      openDemandRequests: 9,
      totalXP: 100,
    });

    const { getByTestId } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => {
      expect(getByTestId('stat-calendar-value').props.children).toBe(4);
      expect(getByTestId('stat-transfermarkt-value').props.children).toBe(69);
      expect(getByTestId('stat-players-value').props.children).toBe(3);
      expect(getByTestId('stat-scouts-value').props.children).toBe(4);
    });
  });

  it('navigue via les 3 quick actions visibles', async () => {
    const { getByTestId, queryByTestId, queryAllByTestId } = render(
      <DashboardScreen navigation={mockNavigation as any} />,
    );

    await waitFor(() => {
      expect(mockApi.getDashboardStats).toHaveBeenCalled();
    });

    await waitFor(() => {
      const quickActionNodes = queryAllByTestId(/quick-action-/);
      const quickActionIds = quickActionNodes.map((item) => item.props.testID);

      expect(quickActionIds).toEqual(
        expect.arrayContaining([
          'quick-action-createreport',
          'quick-action-globalsearch',
          'quick-action-missionrequests',
        ]),
      );
      expect(queryByTestId('quick-action-analytics')).toBeNull();
      expect(queryByTestId('quick-action-agentrequests')).toBeNull();
    });

    fireEvent.press(getByTestId('quick-action-createreport'));
    fireEvent.press(getByTestId('quick-action-globalsearch'));
    fireEvent.press(getByTestId('quick-action-missionrequests'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateReport');
    expect(mockNavigation.navigate).toHaveBeenCalledWith('GlobalSearch');
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MissionRequests');
  });

  it('affiche le dashboard joueur premium avec données hardware', async () => {
    mockUseAuth.mockReturnValue({
      user: { firstName: 'Erling', lastName: 'Haaland', role: 'PLAYER', playerId: 'player-1' },
      activeRole: 'PLAYER',
    });
    mockApi.getPlayer.mockResolvedValue({
      id: 'player-1',
      position: 'ST',
      dateOfBirth: '2000-07-21T00:00:00.000Z',
    });
    mockApi.getHardwareSessions.mockResolvedValue([
      {
        id: 'session-1',
        type: 'training',
        startedAt: '2026-02-01T08:00:00.000Z',
        metrics: { movementDistanceM: 9000, totalTimeMin: 75, maxSpeedKmh: 31.4 },
      },
    ]);

    const { getByText, queryByTestId } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => expect(mockApi.getHardwareSessions).toHaveBeenCalledWith('player-1'));
    expect(getByText('Résumé du profil')).toBeTruthy();
    expect(getByText('Performance')).toBeTruthy();
    expect(getByText('Bracelet QC Band')).toBeTruthy();
    expect(queryByTestId('stat-reports')).toBeNull();
  });
});
