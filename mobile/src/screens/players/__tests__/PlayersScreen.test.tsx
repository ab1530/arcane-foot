import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import PlayersScreen from '../PlayersScreen';
import api from '../../../services/api';

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

  it('affiche la liste des joueurs et la mise à jour du compteur', async () => {
    const { getByText } = render(<PlayersScreen />);
    await waitFor(() => expect(getByText('2 joueurs')).toBeTruthy());
    expect(getByText('Mike Keeper')).toBeTruthy();
    expect(getByText('Leo Striker')).toBeTruthy();
  });

  it('filtre les joueurs par position et par recherche', async () => {
    const { getByText, getByPlaceholderText } = render(<PlayersScreen />);
    await waitFor(() => expect(getByText('2 joueurs')).toBeTruthy());

    fireEvent.press(getByText('Gardiens'));
    await waitFor(() => expect(getByText('1 joueur')).toBeTruthy());
    expect(getByText('Mike Keeper')).toBeTruthy();

    fireEvent.press(getByText('Tous'));
    fireEvent.changeText(getByPlaceholderText('Rechercher un joueur, un club...'), 'Arcane');
    await waitFor(() => expect(getByText('1 joueur')).toBeTruthy());
    expect(getByText('Leo Striker')).toBeTruthy();
  });
});
