import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ArcaneIndexScreen } from '../ArcaneIndexScreen';
import api from '../../../services/api';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { translations } from '../../../i18n';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getPlayers: jest.fn(),
    getArkaneIndex: jest.fn(),
    getAiPlayerIndex: jest.fn(),
  },
}));

jest.mock('../../../contexts/LocalizationContext', () => ({
  useLocalization: jest.fn(),
}));

const mockApi = api as unknown as {
  getPlayers: jest.Mock;
  getArkaneIndex: jest.Mock;
};
const mockUseLocalization = useLocalization as jest.Mock;

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const mockLocalization = (lang: 'fr' | 'en') => ({
  language: lang,
  setLanguage: jest.fn(),
  t: jest.fn(),
  dictionary: translations[lang],
});

describe('ArcaneIndexScreen i18n', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue(mockLocalization('fr'));
    mockApi.getPlayers.mockResolvedValue({ data: [{ id: 'player-1' }] });
    mockApi.getArkaneIndex.mockResolvedValue({
      playerId: 'player-1',
      playerName: 'Jean Dupont',
      position: 'Milieu',
      overallScore: 90,
      breakdown: [
        { name: 'Technique', score: 90 },
      ],
    });
  });

  it('affiche les libellés par défaut en français', async () => {
    const { findByText } = render(<ArcaneIndexScreen navigation={mockNavigation as any} route={undefined as any} />);

    expect(await findByText(translations.fr.aiTools.index.hero.title)).toBeTruthy();
    await waitFor(() => expect(mockApi.getArkaneIndex).toHaveBeenCalled());
  });

  it('bascule en anglais lorsque le contexte change', async () => {
    mockUseLocalization.mockReturnValue(mockLocalization('en'));

    const { findByText } = render(<ArcaneIndexScreen navigation={mockNavigation as any} route={undefined as any} />);

    expect(await findByText(translations.en.aiTools.index.hero.title)).toBeTruthy();
    await waitFor(() => expect(mockApi.getArkaneIndex).toHaveBeenCalled());
  });
});
