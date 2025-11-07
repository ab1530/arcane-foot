import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MarketScreen } from '../MarketScreen';

describe('MarketScreen', () => {
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rend l’en-tête et la barre de recherche', () => {
    const { getByText, getByPlaceholderText } = render(<MarketScreen navigation={navigation as any} />);

    expect(getByText('Transfer Market')).toBeTruthy();
    expect(getByPlaceholderText('Search players...')).toBeTruthy();
  });

  it('met à jour la catégorie sélectionnée', () => {
    const { getByTestId } = render(<MarketScreen navigation={navigation as any} />);
    const midfieldersCategory = getByTestId('market-category-midfielders');

    fireEvent.press(midfieldersCategory);
    expect(midfieldersCategory.props.accessibilityState?.selected).toBe(true);
  });

  it('met à jour la requête de recherche', () => {
    const { getByPlaceholderText } = render(<MarketScreen navigation={navigation as any} />);
    const searchInput = getByPlaceholderText('Search players...');

    fireEvent.changeText(searchInput, 'Mbappé');
    expect(searchInput.props.value).toBe('Mbappé');
  });

  it('navigue vers la fiche joueur', () => {
    const { getByTestId } = render(<MarketScreen navigation={navigation as any} />);

    fireEvent.press(getByTestId('market-player-1'));
    expect(navigation.navigate).toHaveBeenCalledWith('PlayerDetail', { id: '1' });
  });

  it('affiche le message fallback lorsque la catégorie filtrée ne contient aucun joueur', () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(<MarketScreen navigation={navigation as any} />);
    fireEvent.press(getByTestId('market-category-goalkeepers'));
    fireEvent.changeText(getByPlaceholderText('Search players...'), 'zzzz');

    expect(getByText('No players match your filters')).toBeTruthy();
  });

  it('clear la recherche via le bouton ✕', () => {
    const { getByPlaceholderText, getByTestId } = render(<MarketScreen navigation={navigation as any} />);
    const searchInput = getByPlaceholderText('Search players...');

    fireEvent.changeText(searchInput, 'Mbappé');
    expect(searchInput.props.value).toBe('Mbappé');

    fireEvent.press(getByTestId('market-search-clear'));
    expect(searchInput.props.value).toBe('');
  });
});
