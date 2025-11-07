import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import CreateReportScreen from '../CreateReportScreen';
import { scoutingReportsApi } from '../../../services/api/scouting-reports';
import api from '../../../services/api';
import { Alert } from 'react-native';

jest.mock('../../../services/api/scouting-reports', () => ({
  scoutingReportsApi: {
    create: jest.fn(),
  },
}));

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getMatches: jest.fn(),
    getPlayers: jest.fn(),
  },
}));

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

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

const mockGetMatches = api.getMatches as unknown as jest.Mock;
const mockGetPlayers = api.getPlayers as unknown as jest.Mock;
const mockCreate = scoutingReportsApi.create as jest.Mock;

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('CreateReportScreen', () => {
  const alertSpy = jest.spyOn(Alert, 'alert');

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation.goBack = jest.fn();
    mockNavigation.navigate = jest.fn();
    mockGetMatches.mockResolvedValue(mockMatches);
    mockGetPlayers.mockResolvedValue(mockPlayers);
    alertSpy.mockReset();
  });

  afterAll(() => {
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('charge les matchs et joueurs disponibles', async () => {
    const { getByText } = render(<CreateReportScreen />);

    await waitFor(() => {
      expect(mockGetMatches).toHaveBeenCalled();
      expect(mockGetPlayers).toHaveBeenCalled();
      expect(getByText('PSG vs OM')).toBeTruthy();
      expect(getByText('Kylian Mbappé')).toBeTruthy();
    });
  });

  it('valide la création et envoie les données formatées', async () => {
    mockCreate.mockResolvedValue({ id: 'report-1' });
    alertSpy.mockImplementation((title, message, buttons) => {
      if (title === 'Succès') {
        const okButton = buttons?.find((btn) => btn.text === 'OK');
        if (okButton?.onPress) {
          act(() => okButton.onPress?.());
        }
      }
    });

    const { getByTestId } = render(<CreateReportScreen />);

    await waitFor(() => expect(getByTestId('create-report-match-match-1')).toBeTruthy());

    fireEvent.press(getByTestId('create-report-match-match-1'));
    fireEvent.press(getByTestId('create-report-player-player-1'));

    fireEvent.changeText(getByTestId('create-report-rating-overall'), '85');
    fireEvent.changeText(getByTestId('create-report-player-minutes'), '75');
    fireEvent.changeText(getByTestId('create-report-strengths'), 'Rapide');
    fireEvent.changeText(getByTestId('create-report-weaknesses'), 'Doit progresser');
    fireEvent.changeText(getByTestId('create-report-conclusion'), 'Très bon profil');
    fireEvent.press(getByTestId('create-report-reco-BUY_NOW'));
    fireEvent.changeText(
      getByTestId('create-report-recommendation-notes'),
      'Recruter immédiatement'
    );
    fireEvent.changeText(
      getByTestId('create-report-tags'),
      'rapide, technique ,'
    );

    fireEvent.press(getByTestId('create-report-submit'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          matchId: 'match-1',
          playerId: 'player-1',
          overallRating: 85,
          playerMinutesPlayed: 75,
          recommendation: 'BUY_NOW',
          tags: ['rapide', 'technique'],
          strengths: 'Rapide',
          weaknesses: 'Doit progresser',
          conclusion: 'Très bon profil',
          recommendationNotes: 'Recruter immédiatement',
        })
      );
      expect(alertSpy).toHaveBeenCalledWith(
        'Succès',
        'Rapport créé avec succès',
        expect.any(Array)
      );
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('affiche une alerte si match ou joueur manquant', async () => {
    alertSpy.mockImplementation(() => {});
    const { getByTestId } = render(<CreateReportScreen />);

    await waitFor(() => expect(getByTestId('create-report-submit')).toBeTruthy());

    fireEvent.press(getByTestId('create-report-submit'));
    expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Veuillez sélectionner un match');
  });

  it('affiche une erreur si la création échoue', async () => {
    mockCreate.mockRejectedValue({
      response: { data: { message: 'Validation error' } },
    });
    alertSpy.mockImplementation(() => {});

    const { getByTestId } = render(<CreateReportScreen />);

    await waitFor(() => expect(getByTestId('create-report-match-match-1')).toBeTruthy());

    fireEvent.press(getByTestId('create-report-match-match-1'));
    fireEvent.press(getByTestId('create-report-player-player-1'));

    fireEvent.press(getByTestId('create-report-submit'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Validation error');
    });
  });

  it('signale une erreur si les données initiales ne se chargent pas', async () => {
    mockGetMatches.mockRejectedValueOnce(new Error('Network down'));
    alertSpy.mockImplementation(() => {});

    render(<CreateReportScreen />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Impossible de charger les données');
    });
  });
});
