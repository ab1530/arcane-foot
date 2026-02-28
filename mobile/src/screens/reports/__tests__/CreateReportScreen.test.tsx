import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import CreateReportScreen from '../CreateReportScreen';
import { scoutingReportsApi } from '../../../services/api/scouting-reports';
import api from '../../../services/api';
import { Alert } from 'react-native';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { LocalizationProvider } from '../../../contexts/LocalizationContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('../../../services/api/scouting-reports', () => ({
  scoutingReportsApi: {
    bulkSubmit: jest.fn(),
  },
}));

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getMatches: jest.fn(),
    getPlayers: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};
const mockRoute = {
  params: undefined as any,
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}));

const renderWithProviders = () =>
  render(
    <SafeAreaProvider>
      <ThemeProvider>
        <LocalizationProvider>
          <CreateReportScreen />
        </LocalizationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );

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
const mockBulkSubmit = scoutingReportsApi.bulkSubmit as jest.Mock;

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('CreateReportScreen', () => {
  const alertSpy = Alert.alert as jest.Mock;
  const selectMatchAndPlayer = async (getByTestId: any) => {
    fireEvent.press(getByTestId('create-report-match-dropdown'));
    const matchOption = await waitFor(() => getByTestId('match-option-match-1'));
    fireEvent.press(matchOption);

    fireEvent.press(getByTestId('create-report-player-dropdown'));
    const playerOption = await waitFor(() => getByTestId('player-option-player-1'));
    fireEvent.press(playerOption);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation.goBack = jest.fn();
    mockNavigation.navigate = jest.fn();
    mockRoute.params = undefined;
    mockGetMatches.mockResolvedValue(mockMatches);
    mockGetPlayers.mockResolvedValue(mockPlayers);
    mockBulkSubmit.mockResolvedValue({
      data: [{ id: 'report-1', status: 'SUBMITTED' }],
      meta: { matchId: 'match-1', scoutId: 'scout-1', created: 1 },
    });
    alertSpy.mockReset();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('charge les matchs et joueurs disponibles', async () => {
    const { getByTestId, findByText } = renderWithProviders();

    await waitFor(() => expect(getByTestId('create-report-match-dropdown')).toBeTruthy());

    fireEvent.press(getByTestId('create-report-match-dropdown'));
    expect(await findByText('PSG vs OM')).toBeTruthy();

    fireEvent.press(getByTestId('create-report-player-dropdown'));
    expect(await findByText('Kylian Mbappé')).toBeTruthy();
  });

  it('valide la création et envoie les données formatées', async () => {
    alertSpy.mockImplementation((title, message, buttons) => {
      if (title === 'Succès') {
        const okButton = buttons?.find((btn) => btn.text === 'OK');
        if (okButton?.onPress) {
          act(() => okButton.onPress?.());
        }
      }
    });

    const { getByTestId, getByPlaceholderText, getByText } = renderWithProviders();

    await waitFor(() => expect(getByTestId('create-report-match-dropdown')).toBeTruthy());

    await selectMatchAndPlayer(getByTestId);

    fireEvent.changeText(getByPlaceholderText('75'), '85');
    fireEvent.changeText(getByPlaceholderText('90'), '75');
    fireEvent.changeText(getByPlaceholderText('Décrivez les forces clés…'), 'Rapide');
    fireEvent.changeText(getByPlaceholderText('Décrivez les points faibles…'), 'Doit progresser');
    fireEvent.changeText(getByPlaceholderText('Synthèse du rapport…'), 'Très bon profil');
    fireEvent.press(getByText('Recruter maintenant'));
    fireEvent.changeText(getByPlaceholderText('Précisez la recommandation…'), 'Recruter immédiatement');
    fireEvent.changeText(getByPlaceholderText('ex : prospect,U19,priorité'), 'rapide, technique ,');

    fireEvent.press(getByTestId('create-report-submit'));

    await waitFor(() => {
      expect(mockBulkSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          matchId: 'match-1',
          playerIds: ['player-1'],
          template: expect.objectContaining({
            overallRating: 85,
            playerMinutesPlayed: 75,
            recommendation: 'BUY_NOW',
            tags: ['rapide', 'technique'],
            strengths: 'Rapide',
            weaknesses: 'Doit progresser',
            summary: 'Très bon profil',
            recommendationNotes: 'Recruter immédiatement',
          }),
        })
      );
      expect(alertSpy).toHaveBeenCalledWith(
        'Succès',
        '1 rapport envoyé(s) et visibles aux agents.',
        expect.any(Array)
      );
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Reports');
    });
  });

  it('affiche une alerte si match ou joueur manquant', async () => {
    alertSpy.mockImplementation(() => {});
    const { getByTestId } = renderWithProviders();

    await waitFor(() => expect(getByTestId('create-report-submit')).toBeTruthy());

    fireEvent.press(getByTestId('create-report-submit'));
    expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Veuillez sélectionner un match');
  });

  it('affiche une erreur si la création échoue', async () => {
    mockBulkSubmit.mockRejectedValue({
      response: { data: { message: 'Validation error' } },
    });
    alertSpy.mockImplementation(() => {});

    const { getByTestId } = renderWithProviders();

    await waitFor(() => expect(getByTestId('create-report-match-dropdown')).toBeTruthy());

    await selectMatchAndPlayer(getByTestId);

    fireEvent.press(getByTestId('create-report-submit'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Validation error');
    });
  });

  it('signale une erreur si les données initiales ne se chargent pas', async () => {
    mockGetMatches.mockRejectedValueOnce(new Error('Network down'));
    alertSpy.mockImplementation(() => {});

    renderWithProviders();

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Impossible de charger les données');
    });
  });
});
