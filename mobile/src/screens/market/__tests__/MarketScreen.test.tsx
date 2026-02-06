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

  it('rend l’en-tête, la barre de recherche et les filtres', () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <MarketScreen navigation={navigation as any} loadingDelayMs={0} />,
    );

    expect(getByText('Transfer Market')).toBeTruthy();
    expect(getByPlaceholderText('Search players, clubs or tags...')).toBeTruthy();
    expect(getByTestId('position-filter-ALL')).toBeTruthy();
    expect(getByTestId('budget-filter-ALL')).toBeTruthy();
  });

  it('filtre par budget et watchlist', () => {
    const { getByTestId, queryByText } = render(
      <MarketScreen navigation={navigation as any} loadingDelayMs={0} />,
    );

    fireEvent.press(getByTestId('budget-filter-UNDER_10'));
    expect(queryByText('Marcus Silva')).toBeNull();

    fireEvent(getByTestId('watchlist-toggle'), 'valueChange', true);
    expect(queryByText('Amina Diallo')).toBeNull();
  });

  it('met à jour la requête de recherche', () => {
    const { getByPlaceholderText, queryByText } = render(
      <MarketScreen navigation={navigation as any} loadingDelayMs={0} />,
    );
    const searchInput = getByPlaceholderText('Search players, clubs or tags...');

    fireEvent.changeText(searchInput, 'Victor');
    expect(searchInput.props.value).toBe('Victor');
    expect(queryByText('Victor Hugo')).toBeTruthy();
  });
});
