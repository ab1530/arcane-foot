import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { DashboardScreen } from '../DashboardScreen';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getDashboardStats: jest.fn(),
  },
}));

const mockNavigation = {
  navigate: jest.fn(),
};

describe('DashboardScreen', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const mockApi = api as unknown as { getDashboardStats: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { firstName: 'Abdallah' },
    });
    mockNavigation.navigate.mockReset();
  });

  it('affiche le prénom de l’utilisateur et les stats récupérées', async () => {
    mockApi.getDashboardStats.mockResolvedValue({
      totalReports: 12,
      pendingReports: 3,
      totalPlayers: 48,
      upcomingMatches: 5,
    });

    const { getByText } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => {
      expect(getByText('Abdallah')).toBeTruthy();
      expect(getByText('12')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
      expect(getByText('48')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
    });
  });

  it('propose des actions rapides vers les écrans clés', async () => {
    mockApi.getDashboardStats.mockResolvedValue({});
    const { getByText } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => expect(mockApi.getDashboardStats).toHaveBeenCalled());

    fireEvent.press(getByText('New Report'));
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
      const totalReportsValue = getByTestId('dashboard-stat-totalReports-value');
      expect(totalReportsValue.props.children).toBe(9);
    });
  });

  it('log une erreur et conserve les valeurs par défaut si la récupération échoue', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockApi.getDashboardStats.mockRejectedValueOnce(new Error('Network down'));

    const { getByTestId } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => expect(mockApi.getDashboardStats).toHaveBeenCalled());
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching dashboard data:', expect.any(Error));

    const totalReportsValue = getByTestId('dashboard-stat-totalReports-value');
    expect(totalReportsValue.props.children).toBe(0);

    consoleSpy.mockRestore();
  });

  it('navigue vers Players, Calendar et Kanban via les quick actions', async () => {
    mockApi.getDashboardStats.mockResolvedValue({});
    const { getByText } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => expect(mockApi.getDashboardStats).toHaveBeenCalled());

    fireEvent.press(getByText('View Players'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Players');

    fireEvent.press(getByText('Calendar'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Calendar');

    fireEvent.press(getByText('Kanban'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Kanban');
  });

  it("affiche 'User' quand le prénom est absent", async () => {
    mockUseAuth.mockReturnValue({ user: {} });
    mockApi.getDashboardStats.mockResolvedValue({});

    const { getByText, queryByText } = render(<DashboardScreen navigation={mockNavigation as any} />);

    await waitFor(() => expect(getByText('Welcome back,')).toBeTruthy());
    expect(queryByText('Abdallah')).toBeNull();
    expect(getByText('User')).toBeTruthy();

    mockUseAuth.mockReturnValue({ user: { firstName: 'Abdallah' } });
  });
});
