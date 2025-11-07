import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ReportsNavigator from '../ReportsNavigator';
import { scoutingReportsApi } from '../../services/api/scouting-reports';
import api from '../../services/api';
import { Alert } from 'react-native';

jest.mock('../../services/api/scouting-reports', () => ({
  scoutingReportsApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    submit: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getMatches: jest.fn(),
    getPlayers: jest.fn(),
  },
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

const mockDetailReport = {
  ...mockSummaryReport,
  strengths: 'Rapidité impressionnante',
  weaknesses: 'Décisions parfois précipitées',
  conclusion: 'Profil à suivre de près',
  recommendationNotes: 'Recruter immédiatement',
  tags: ['rapide', 'butteur'],
  submittedAt: '2024-01-02T12:00:00.000Z',
  reviewedAt: '2024-01-03T12:00:00.000Z',
} as any;

const mockMatches = {
  items: [
    {
      id: 'match-1',
      homeClub: { name: 'PSG' },
      awayClub: { name: 'OM' },
      date: '2024-01-05T18:00:00.000Z',
    },
  ],
};

const mockPlayers = {
  items: [
    {
      id: 'player-1',
      position: 'Forward',
      user: { firstName: 'Kylian', lastName: 'Mbappé' },
    },
  ],
};

const mockGetAll = scoutingReportsApi.getAll as jest.Mock;
const mockGetById = scoutingReportsApi.getById as jest.Mock;
const mockCreate = scoutingReportsApi.create as jest.Mock;
const mockGetMatches = api.getMatches as jest.Mock;
const mockGetPlayers = api.getPlayers as jest.Mock;

const renderNavigator = () =>
  render(
    <NavigationContainer>
      <ReportsNavigator />
    </NavigationContainer>
  );

describe('ReportsNavigator integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAll.mockResolvedValue([mockSummaryReport]);
    mockGetById.mockResolvedValue(mockDetailReport);
    mockCreate.mockResolvedValue({ id: 'report-new' });
    mockGetMatches.mockResolvedValue(mockMatches);
    mockGetPlayers.mockResolvedValue(mockPlayers);
  });

  it('navigue de la liste vers le détail puis revient à la liste', async () => {
    const { getByText, getByTestId } = renderNavigator();

    await waitFor(() => expect(getByText('Kylian Mbappé')).toBeTruthy());

    fireEvent.press(getByText('Kylian Mbappé'));

    await waitFor(() => expect(getByText('Détails du rapport')).toBeTruthy());
    expect(mockGetById).toHaveBeenCalledWith('report-1');

    fireEvent.press(getByTestId('report-detail-back'));

    await waitFor(() => expect(getByText('Kylian Mbappé')).toBeTruthy());
  });

  it('permet de créer un rapport depuis la liste et de revenir automatiquement', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, _message, buttons) => {
      if (title === 'Succès') {
        const okButton = buttons?.find((btn) => btn.text === 'OK');
        okButton?.onPress?.();
      }
    });

    const { getByText, getByTestId } = renderNavigator();

    await waitFor(() => expect(getByText('Kylian Mbappé')).toBeTruthy());

    fireEvent.press(getByTestId('reports-fab'));

    await waitFor(() => expect(getByTestId('create-report-submit')).toBeTruthy());

    fireEvent.press(getByTestId('create-report-match-match-1'));
    fireEvent.press(getByTestId('create-report-player-player-1'));

    fireEvent.press(getByTestId('create-report-submit'));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith({ matchId: 'match-1', playerId: 'player-1' }));

    await waitFor(() => expect(getByText('Kylian Mbappé')).toBeTruthy());

    alertSpy.mockRestore();
  });
});
