/**
 * Tests for GlobalSearch Component
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { GlobalSearch } from '../GlobalSearch';
import api from '../../../services/api';

// Mock the API
jest.mock('../../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

describe('GlobalSearch Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly when visible', () => {
    const { getByPlaceholderText } = render(
      <GlobalSearch
        visible={true}
        onClose={jest.fn()}
        navigation={mockNavigation}
      />
    );

    expect(getByPlaceholderText('Search players, clubs, camps...')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByPlaceholderText } = render(
      <GlobalSearch
        visible={false}
        onClose={jest.fn()}
        navigation={mockNavigation}
      />
    );

    expect(queryByPlaceholderText('Search players, clubs, camps...')).toBeNull();
  });

  it('should call onClose when close button is pressed', () => {
    const onCloseMock = jest.fn();
    const { getByText } = render(
      <GlobalSearch
        visible={true}
        onClose={onCloseMock}
        navigation={mockNavigation}
      />
    );

    const closeButton = getByText('✕');
    fireEvent.press(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('should perform search when query has at least 2 characters', async () => {
    // Mock API responses
    mockedApi.getPlayers.mockResolvedValue({
      items: [
        {
          id: '1',
          user: { firstName: 'John', lastName: 'Doe' },
          position: 'Forward',
          club: { name: 'Test FC' },
        },
      ],
      data: [],
    });
    mockedApi.getClubs.mockResolvedValue({ items: [], data: [] });
    mockedApi.getCamps.mockResolvedValue([]);
    mockedApi.getReports.mockResolvedValue({ items: [], data: [] });

    const { getByPlaceholderText, findByText } = render(
      <GlobalSearch
        visible={true}
        onClose={jest.fn()}
        navigation={mockNavigation}
      />
    );

    const searchInput = getByPlaceholderText('Search players, clubs, camps...');
    fireEvent.changeText(searchInput, 'John');

    await waitFor(() => {
      expect(mockedApi.getPlayers).toHaveBeenCalledWith({
        search: 'John',
        limit: 10,
      });
    });

    // Should display the result
    const result = await findByText('John Doe');
    expect(result).toBeTruthy();
  });

  it('should not search when query has less than 2 characters', () => {
    const { getByPlaceholderText } = render(
      <GlobalSearch
        visible={true}
        onClose={jest.fn()}
        navigation={mockNavigation}
      />
    );

    const searchInput = getByPlaceholderText('Search players, clubs, camps...');
    fireEvent.changeText(searchInput, 'J');

    expect(mockedApi.getPlayers).not.toHaveBeenCalled();
  });

  it('should navigate to PlayerDetail when a player result is pressed', async () => {
    mockedApi.getPlayers.mockResolvedValue({
      items: [
        {
          id: 'player-1',
          user: { firstName: 'Test', lastName: 'Player' },
          position: 'Midfielder',
        },
      ],
      data: [],
    });
    mockedApi.getClubs.mockResolvedValue({ items: [], data: [] });
    mockedApi.getCamps.mockResolvedValue([]);
    mockedApi.getReports.mockResolvedValue({ items: [], data: [] });

    const onCloseMock = jest.fn();
    const { getByPlaceholderText, findByText } = render(
      <GlobalSearch
        visible={true}
        onClose={onCloseMock}
        navigation={mockNavigation}
      />
    );

    const searchInput = getByPlaceholderText('Search players, clubs, camps...');
    fireEvent.changeText(searchInput, 'Test');

    const result = await findByText('Test Player');
    fireEvent.press(result);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('PlayerDetail', {
        playerId: 'player-1',
      });
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('should display "No results found" when search returns empty', async () => {
    mockedApi.getPlayers.mockResolvedValue({ items: [], data: [] });
    mockedApi.getClubs.mockResolvedValue({ items: [], data: [] });
    mockedApi.getCamps.mockResolvedValue([]);
    mockedApi.getReports.mockResolvedValue({ items: [], data: [] });

    const { getByPlaceholderText, findByText } = render(
      <GlobalSearch
        visible={true}
        onClose={jest.fn()}
        navigation={mockNavigation}
      />
    );

    const searchInput = getByPlaceholderText('Search players, clubs, camps...');
    fireEvent.changeText(searchInput, 'NonExistent');

    const emptyMessage = await findByText(/No results found for/);
    expect(emptyMessage).toBeTruthy();
  });

  it('should handle API errors gracefully', async () => {
    mockedApi.getPlayers.mockRejectedValue(new Error('Network error'));
    mockedApi.getClubs.mockRejectedValue(new Error('Network error'));
    mockedApi.getCamps.mockRejectedValue(new Error('Network error'));
    mockedApi.getReports.mockRejectedValue(new Error('Network error'));

    const { getByPlaceholderText, findByText } = render(
      <GlobalSearch
        visible={true}
        onClose={jest.fn()}
        navigation={mockNavigation}
      />
    );

    const searchInput = getByPlaceholderText('Search players, clubs, camps...');
    fireEvent.changeText(searchInput, 'Test');

    // Should still show empty state instead of crashing
    const emptyMessage = await findByText(/No results found for/);
    expect(emptyMessage).toBeTruthy();
  });
});
