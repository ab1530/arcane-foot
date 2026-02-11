import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { DashboardScreen } from '../DashboardScreen';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { fr } from '../../../i18n/locales/fr';

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
    getDashboardStats: jest.fn(),
    getPlayers: jest.fn().mockResolvedValue({ items: [], data: [] }),
    getReports: jest.fn().mockResolvedValue({ items: [], data: [] }),
    getPlayer: jest.fn().mockResolvedValue(null),
    getHardwareSessions: jest.fn().mockResolvedValue([]),
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

const mockNavigation = {
  navigate: jest.fn(),
};

describe('DashboardScreen', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const mockApi = api as unknown as {
    getDashboardStats: jest.Mock;
    getPlayers: jest.Mock;
    getReports: jest.Mock;
    getPlayer: jest.Mock;
    getHardwareSessions: jest.Mock;
  };
  const dashboardCopy = fr.dashboard;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { firstName: 'Abdallah', role: 'SCOUT' },
      activeRole: null,
    });
    mockNavigation.navigate.mockReset();
    mockApi.getPlayers.mockResolvedValue({ items: [], data: [] });
    mockApi.getReports.mockResolvedValue({ items: [], data: [] });
    mockApi.getPlayer.mockResolvedValue(null);
    mockApi.getHardwareSessions.mockResolvedValue([]);
  });

  it('affiche le prénom de l’utilisateur et les stats récupérées', async () => {
    mockApi.getDashboardStats.mockResolvedValue({
      totalReports: 12,
      totalPlayers: 48,
      matchesAttended: 5,
      totalXP: 3600,
    });

    const { getByText, getByTestId } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => {
      expect(getByText('Abdallah')).toBeTruthy();
      expect(getByTestId('stat-reports-value').props.children).toBe(12);
      expect(getByTestId('stat-players-value').props.children).toBe(48);
      expect(getByTestId('stat-matches-value').props.children).toBe(5);
    });
  });

  it('propose des actions rapides vers les écrans clés', async () => {
    mockApi.getDashboardStats.mockResolvedValue({});
    const { getByText } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => expect(mockApi.getDashboardStats).toHaveBeenCalled());

    fireEvent.press(getByText(dashboardCopy.quickActions.items[0].label));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateReport');
  });

  it('rafraîchit les statistiques via pull-to-refresh', async () => {
    mockApi.getDashboardStats.mockResolvedValueOnce({
      totalReports: 5,
      pendingReports: 1,
      totalPlayers: 10,
      upcomingMatches: 2,
    });

    const { getByTestId, getByText } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => {
      expect(mockApi.getDashboardStats).toHaveBeenCalledTimes(1);
      expect(getByText('5')).toBeTruthy();
    });

    mockApi.getDashboardStats.mockResolvedValueOnce({
      totalReports: 9,
      pendingReports: 4,
      totalPlayers: 20,
      upcomingMatches: 3,
    });

    const scrollView = getByTestId('dashboard-scroll');
    await act(async () => {
      await scrollView.props.refreshControl.props.onRefresh();
    });

    await waitFor(() => expect(mockApi.getDashboardStats).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      const totalReportsValue = getByTestId('stat-reports-value');
      expect(totalReportsValue.props.children).toBe(9);
    });
  });

  it('log une erreur et conserve les valeurs par défaut si la récupération échoue', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockApi.getDashboardStats.mockRejectedValueOnce(new Error('Network down'));

    const { getByTestId } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => expect(mockApi.getDashboardStats).toHaveBeenCalled());
    expect(consoleSpy).toHaveBeenCalled();
    const [message] = consoleSpy.mock.calls.at(-1) || [];
    expect(message).toContain('Error fetching dashboard data');
    expect(message).toContain('DashboardScreen');

    const totalReportsValue = getByTestId('stat-reports-value');
    expect(totalReportsValue.props.children).toBe(0);

    consoleSpy.mockRestore();
  });

  it('navigue vers Players, Calendar et Kanban via les quick actions', async () => {
    mockApi.getDashboardStats.mockResolvedValue({});
    const { getByText } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => expect(mockApi.getDashboardStats).toHaveBeenCalled());

    fireEvent.press(getByText(dashboardCopy.quickActions.items[1].label));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('GlobalSearch');

    fireEvent.press(getByText(dashboardCopy.quickActions.items[2].label));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Analytics');

    fireEvent.press(getByText(dashboardCopy.quickActions.items[3].label));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AI');
  });

  it("affiche 'User' quand le prénom est absent", async () => {
    mockUseAuth.mockReturnValue({ user: {}, activeRole: null });
    mockApi.getDashboardStats.mockResolvedValue({});

    const { getByText, queryByText } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => expect(getByText(dashboardCopy.hero.greeting)).toBeTruthy());
    expect(queryByText('Abdallah')).toBeNull();
    expect(getByText(dashboardCopy.hero.defaultName)).toBeTruthy();

    mockUseAuth.mockReturnValue({ user: { firstName: 'Abdallah', role: 'SCOUT' }, activeRole: null });
  });

  it('affiche une vue dashboard dédiée au joueur', async () => {
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

    const { getByText, queryByText } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => expect(mockApi.getHardwareSessions).toHaveBeenCalledWith('player-1'));
    expect(getByText('Résumé du profil')).toBeTruthy();
    expect(getByText('Performance')).toBeTruthy();
    expect(getByText('Bracelet QC Band')).toBeTruthy();
    expect(getByText("Séances d'entraînement")).toBeTruthy();
    expect(queryByText(dashboardCopy.quickActions.items[0].label)).toBeNull();
  });

  it('n’explose pas pour un joueur sans playerId', async () => {
    mockUseAuth.mockReturnValue({
      user: { firstName: 'Test', role: 'PLAYER' },
      activeRole: 'PLAYER',
    });

    const { getByText } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => expect(getByText("Séances d'entraînement")).toBeTruthy());
    expect(getByText('Aucune session disponible')).toBeTruthy();
    expect(mockApi.getHardwareSessions).not.toHaveBeenCalled();
  });
});
