import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ReportsListScreen from '../../screens/reports/ReportsListScreen';
import { scoutingReportsApi } from '../../services/api/scouting-reports';
import api from '../../services/api';

const mockNavigation = { navigate: jest.fn() };

jest.mock('../../services/api/scouting-reports', () => ({
  scoutingReportsApi: {
    getAll: jest.fn(),
  },
}));

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getMatches: jest.fn(),
    getPlayers: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

const mockSummaryReport = {
  id: 'report-1',
  status: 'APPROVED',
  overallRating: 82,
  recommendation: 'BUY_NOW',
  createdAt: '2024-01-01T12:00:00.000Z',
  player: {
    position: 'Forward',
    user: { firstName: 'Kylian', lastName: 'Mbappé' },
  },
  scout: { firstName: 'Louis', lastName: 'Scout' },
  match: {
    homeClub: { name: 'PSG' },
    awayClub: { name: 'OM' },
  },
};

const mockGetAll = scoutingReportsApi.getAll as jest.Mock;

describe('ReportsNavigator integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation.navigate.mockClear();
    mockGetAll.mockResolvedValue([mockSummaryReport]);
  });

  it('navigue vers le détail lors du tap sur un rapport', async () => {
    const { getByText } = render(<ReportsListScreen />);

    await waitFor(() => expect(getByText('Kylian Mbappé')).toBeTruthy());
    fireEvent.press(getByText('Kylian Mbappé'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ReportDetail', { reportId: 'report-1' });
  });

  it('ouvre la création de rapport depuis le bouton flottant', async () => {
    const { getByTestId } = render(<ReportsListScreen />);

    await waitFor(() => expect(getByTestId('reports-fab')).toBeTruthy());
    fireEvent.press(getByTestId('reports-fab'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateReport');
  });
});
