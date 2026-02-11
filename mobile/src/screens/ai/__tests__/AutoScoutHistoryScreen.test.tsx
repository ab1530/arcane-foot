import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { AutoScoutHistoryScreen } from '../AutoScoutHistoryScreen';
import autoScoutApi from '../../../services/api/auto-scout';
import api from '../../../services/api';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { translations } from '../../../i18n';
import { Alert } from 'react-native';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('../../../services/api/auto-scout', () => ({
  __esModule: true,
  default: {
    getHistory: jest.fn(),
  },
}));

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getPlayers: jest.fn(),
  },
}));

jest.mock('../../../contexts/LocalizationContext', () => ({
  useLocalization: jest.fn(),
}));

const mockUseLocalization = useLocalization as jest.Mock;
const mockGetHistory = (autoScoutApi as unknown as { getHistory: jest.Mock }).getHistory;
const mockGetPlayers = (api as unknown as { getPlayers: jest.Mock }).getPlayers;

const sampleHistory = [
  {
    id: 'history-1',
    playerId: 'player-42',
    playerName: 'Marcus Silva',
    qualityScore: {
      total: 90,
      grade: 'A',
      breakdown: {
        dataCompleteness: 90,
        insightDepth: 88,
        technicalAccuracy: 92,
        actionability: 89,
      },
    },
    template: 'MATCH_PERFORMANCE',
    templateName: 'Match Performance',
    status: 'saved',
    createdAt: new Date().toISOString(),
    overallRating: 8.5,
  },
];

const navigation = { goBack: jest.fn() } as any;

const mockLocalization = (language: 'fr' | 'en') => ({
  language,
  setLanguage: jest.fn(),
  t: jest.fn(),
  dictionary: translations[language],
});

describe('AutoScoutHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue(mockLocalization('fr'));
    mockGetPlayers.mockResolvedValue({ data: [{ id: 'player-42' }] });
    mockGetHistory.mockResolvedValue({ success: true, data: sampleHistory });
  });

  it('affiche les libellés français et les rapports chargés', async () => {
    const { findByText } = render(<AutoScoutHistoryScreen navigation={navigation} />);

    expect(await findByText(translations.fr.autoScout.history.title)).toBeTruthy();
    await waitFor(() => expect(mockGetHistory).toHaveBeenCalledWith('player-42'));
    expect(await findByText(translations.fr.autoScout.history.statuses.saved)).toBeTruthy();
  });

  it('bascule en anglais lorsque le contexte change', async () => {
    mockUseLocalization.mockReturnValue(mockLocalization('en'));

    const { findByText } = render(<AutoScoutHistoryScreen navigation={navigation} />);

    expect(await findByText(translations.en.autoScout.history.title)).toBeTruthy();
    await waitFor(() => expect(mockGetHistory).toHaveBeenCalledWith('player-42'));
    expect(await findByText(translations.en.autoScout.history.statuses.saved)).toBeTruthy();
  });

  it('affiche un message si aucun joueur ne peut être résolu', async () => {
    mockGetPlayers.mockResolvedValue({ data: [] });

    const { findByText } = render(<AutoScoutHistoryScreen navigation={navigation} />);

    expect(await findByText(translations.fr.autoScout.history.errors.noPlayer)).toBeTruthy();
    expect(mockGetHistory).not.toHaveBeenCalled();
  });

  it('ouvre les alertes d’export et de suppression avec le texte localisé', async () => {
    const alertSpy = (Alert.alert as jest.Mock).mockImplementation(() => {});

    const { findByTestId } = render(<AutoScoutHistoryScreen navigation={navigation} />);

    const exportButton = await findByTestId('auto-scout-history-export-history-1');
    fireEvent.press(exportButton);
    expect(alertSpy).toHaveBeenLastCalledWith(
      translations.fr.autoScout.history.alerts.exportTitle,
      translations.fr.autoScout.history.alerts.exportMessage,
      expect.any(Array),
    );

    const deleteButton = await findByTestId('auto-scout-history-delete-history-1');
    fireEvent.press(deleteButton);
    expect(alertSpy).toHaveBeenLastCalledWith(
      translations.fr.autoScout.history.alerts.deleteTitle,
      translations.fr.autoScout.history.alerts.deleteMessage,
      expect.any(Array),
    );

    alertSpy.mockReset();
  });

  it('affiche une erreur lorsqu’un chargement échoue', async () => {
    mockGetHistory.mockRejectedValue(new Error('Network failure'));

    const { getByText } = render(<AutoScoutHistoryScreen navigation={navigation} />);

    await waitFor(() => expect(mockGetHistory).toHaveBeenCalled());
    await waitFor(() =>
      expect(getByText(translations.fr.autoScout.history.errors.load)).toBeTruthy()
    );
  });
});
