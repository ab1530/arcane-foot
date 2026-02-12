import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ReportsListScreen from '../ReportsListScreen';
import { scoutingReportsApi } from '../../../services/api/scouting-reports';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('../../../services/api/scouting-reports', () => ({
  scoutingReportsApi: {
    getAll: jest.fn(),
  },
}));

describe('ReportsListScreen', () => {
  const mockReports = [
    {
      id: 'report-1',
      status: 'APPROVED',
      overallRating: 82,
      recommendation: 'BUY_NOW',
      tags: ['speed', 'agility'],
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
    },
  ];

  const mockGetAll = scoutingReportsApi.getAll as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAll.mockResolvedValue(mockReports);
  });

  it('affiche un loader durant le chargement', async () => {
    const { getByTestId } = render(<ReportsListScreen />);
    expect(getByTestId('reports-loading-indicator')).toBeTruthy();
    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
  });

  it('récupère et affiche les rapports', async () => {
    const { getByText } = render(<ReportsListScreen />);

    await waitFor(() => {
      expect(mockGetAll).toHaveBeenCalledTimes(1);
      expect(getByText('Kylian Mbappé')).toBeTruthy();
      expect(getByText('PSG vs OM')).toBeTruthy();
      expect(getByText('82/100')).toBeTruthy();
    });
  });

  it('applique le filtre "Approuvés"', async () => {
    mockGetAll.mockResolvedValueOnce(mockReports);
    const { getByTestId } = render(<ReportsListScreen />);

    await waitFor(() => expect(mockGetAll).toHaveBeenCalledTimes(1));
    mockGetAll.mockResolvedValue([]);
    await waitFor(() => expect(getByTestId('reports-filter-approved')).toBeTruthy());

    fireEvent.press(getByTestId('reports-filter-approved'));

    await waitFor(() => {
      expect(mockGetAll).toHaveBeenLastCalledWith({ status: 'APPROVED' });
    });
  });

  it('affiche un état vide lorsque aucun rapport', async () => {
    mockGetAll.mockResolvedValueOnce([]);
    const { getByText } = render(<ReportsListScreen />);

    await waitFor(() => {
      expect(getByText('Aucun rapport trouvé')).toBeTruthy();
    });
  });
});
