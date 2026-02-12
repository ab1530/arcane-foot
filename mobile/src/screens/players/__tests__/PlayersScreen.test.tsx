import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import PlayersScreen from '../PlayersScreen';
import api from '../../../services/api';
import { translations } from '../../../i18n';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('../../../contexts/LocalizationContext', () => {
  const { translations } = require('../../../i18n');
  return {
    useLocalization: () => ({
      dictionary: translations.fr,
      t: (key: string) => key,
    }),
  };
});

jest.mock('../../../contexts/FavoritesContext', () => ({
  useFavorites: () => ({
    favoritePlayerIds: [],
    isFavorite: () => false,
    toggleFavorite: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    clearFavorites: jest.fn(),
  }),
}));

jest.mock('../../../contexts/ComparisonContext', () => ({
  useComparison: () => ({
    comparisonCount: 0,
    comparisonPlayerIds: [],
    isInComparison: () => false,
    toggleComparison: jest.fn(),
  }),
}));

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getPlayers: jest.fn(),
  },
}));

describe('PlayersScreen', () => {
  const mockApi = api as unknown as { getPlayers: jest.Mock };

  const samplePlayers = [
    {
      id: 'p1',
      position: 'Goalkeeper',
      status: 'ACTIVE',
      user: { firstName: 'Mike', lastName: 'Keeper' },
      nationality: 'France',
      club: { name: 'Paris FC' },
      statsJson: { goals: 0, assists: 1, appearances: 20 },
      marketValue: 500000,
      dateOfBirth: '1998-05-10',
      height: 190,
      weight: 84,
      preferredFoot: 'Right',
    },
    {
      id: 'p2',
      position: 'Forward',
      status: 'ACTIVE',
      user: { firstName: 'Leo', lastName: 'Striker' },
      nationality: 'Argentina',
      club: { name: 'Arcane FC' },
      statsJson: { goals: 18, assists: 7, appearances: 30 },
      marketValue: 2500000,
      dateOfBirth: '2001-03-22',
      height: 178,
      weight: 72,
      preferredFoot: 'Left',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getPlayers.mockResolvedValue({
      items: samplePlayers,
      meta: { total: 2 },
    });
  });

  it('affiche le header Players et quelques talents vedettes', async () => {
    const { getByText } = render(<PlayersScreen />);
    await waitFor(() => expect(getByText('Joueurs scoutés')).toBeTruthy());
    expect(getByText('Mike Keeper')).toBeTruthy();
    expect(getByText('Leo Striker')).toBeTruthy();
  });

  it('permet de saisir une recherche dans le champ prévu', async () => {
    const { getByPlaceholderText } = render(<PlayersScreen />);
    const searchInput = await waitFor(() =>
      getByPlaceholderText('Rechercher des joueurs, clubs, positions...')
    );

    fireEvent.changeText(searchInput, 'Mbappé');
    expect(searchInput.props.value).toBe('Mbappé');
  });
});
