import { renderHook, waitFor } from '@testing-library/react-native';
import { useMarket, useMarketStats } from './useMarket';
import api from '../services/api';
import { logger, logError } from '../utils/logger';

// Mock dependencies
jest.mock('../services/api');
jest.mock('../utils/logger');

const mockApi = api as jest.Mocked<typeof api>;
const mockLogger = logger as jest.Mocked<typeof logger>;
const mockLogError = logError as jest.MockedFunction<typeof logError>;

describe('useMarket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPlayers = [
    {
      id: '1',
      userId: 'user1',
      user: {
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'avatar1.jpg',
      },
      position: 'FORWARD',
      height: 180,
      weight: 75,
      preferredFoot: 'Right',
      nationality: 'USA',
      dateOfBirth: '1995-01-01',
      status: 'ACTIVE' as const,
      marketValue: 5000000,
      statsJson: { overall: 85 },
    },
    {
      id: '2',
      userId: 'user2',
      user: {
        firstName: 'Jane',
        lastName: 'Smith',
        avatar: 'avatar2.jpg',
      },
      position: 'MIDFIELDER',
      height: 175,
      weight: 70,
      preferredFoot: 'Left',
      nationality: 'UK',
      dateOfBirth: '1996-05-15',
      status: 'ACTIVE' as const,
      marketValue: 3000000,
      statsJson: { overall: 82 },
    },
  ];

  const mockResponse = {
    items: mockPlayers,
    data: mockPlayers,
    meta: {
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  };

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      mockApi.getPlayers.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useMarket());

      expect(result.current.players).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.filters).toEqual({});
      expect(result.current.page).toBe(1);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.totalCount).toBe(0);
    });

    it('should initialize with custom filters', () => {
      mockApi.getPlayers.mockResolvedValueOnce(mockResponse);

      const initialFilters = { position: 'FORWARD', minAge: 20 };
      const { result } = renderHook(() => useMarket(initialFilters));

      expect(result.current.filters).toEqual(initialFilters);
    });
  });

  describe('Fetching Players', () => {
    it('should fetch players on mount', async () => {
      mockApi.getPlayers.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useMarket());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockApi.getPlayers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
      expect(result.current.players).toEqual(mockPlayers);
      expect(result.current.totalCount).toBe(2);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.error).toBeNull();
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockApi.getPlayers.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useMarket());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load players');
      expect(result.current.players).toEqual([]);
      expect(mockLogError).toHaveBeenCalledWith('Failed to fetch market players', error);
    });

    it('should handle empty response', async () => {
      mockApi.getPlayers.mockResolvedValueOnce({
        items: [],
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      const { result } = renderHook(() => useMarket());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toEqual([]);
      expect(result.current.totalCount).toBe(0);
    });
  });

  describe('Filters', () => {
    it('should update filters and reset page', async () => {
      mockApi.getPlayers
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce({
          ...mockResponse,
          items: [mockPlayers[0]],
          data: [mockPlayers[0]],
          meta: { ...mockResponse.meta, total: 1 },
        });

      const { result } = renderHook(() => useMarket());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Update filters
      result.current.updateFilters({ position: 'FORWARD' });

      await waitFor(() => {
        expect(result.current.filters).toEqual({ position: 'FORWARD' });
      });

      expect(result.current.page).toBe(1);
      expect(mockApi.getPlayers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        position: 'FORWARD',
      });
    });

    it('should reset filters', async () => {
      mockApi.getPlayers.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMarket({ position: 'FORWARD' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Reset filters
      result.current.resetFilters();

      await waitFor(() => {
        expect(result.current.filters).toEqual({});
      });

      expect(result.current.page).toBe(1);
    });

    it('should remove empty filters from API call', async () => {
      mockApi.getPlayers.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useMarket());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Update with empty filters
      result.current.updateFilters({ position: '', search: 'all' });

      await waitFor(() => {
        expect(mockApi.getPlayers).toHaveBeenLastCalledWith({
          page: 1,
          limit: 20,
        });
      });
    });
  });

  describe('Pagination', () => {
    it('should navigate to next page', async () => {
      const multiPageResponse = {
        ...mockResponse,
        meta: { ...mockResponse.meta, totalPages: 3 },
      };
      mockApi.getPlayers.mockResolvedValue(multiPageResponse);

      const { result } = renderHook(() => useMarket());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.page).toBe(1);
      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPreviousPage).toBe(false);

      // Go to next page
      result.current.nextPage();

      await waitFor(() => {
        expect(result.current.page).toBe(2);
      });

      expect(mockApi.getPlayers).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
      });
    });

    it('should navigate to previous page', async () => {
      const multiPageResponse = {
        ...mockResponse,
        meta: { ...mockResponse.meta, page: 2, totalPages: 3 },
      };
      mockApi.getPlayers.mockResolvedValue(multiPageResponse);

      const { result } = renderHook(() => useMarket());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Manually set page to 2
      result.current.nextPage();

      await waitFor(() => {
        expect(result.current.page).toBe(2);
      });

      // Go to previous page
      result.current.previousPage();

      await waitFor(() => {
        expect(result.current.page).toBe(1);
      });
    });

    it('should not go beyond last page', async () => {
      mockApi.getPlayers.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMarket());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockApi.getPlayers.mock.calls.length;

      // Try to go to next page (already on last page)
      result.current.nextPage();

      await waitFor(() => {
        expect(result.current.page).toBe(1);
      });

      // Should not make new API call
      expect(mockApi.getPlayers.mock.calls.length).toBe(initialCallCount);
    });

    it('should not go below first page', async () => {
      mockApi.getPlayers.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMarket());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockApi.getPlayers.mock.calls.length;

      // Try to go to previous page (already on first page)
      result.current.previousPage();

      await waitFor(() => {
        expect(result.current.page).toBe(1);
      });

      // Should not make new API call
      expect(mockApi.getPlayers.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('Refresh', () => {
    it('should refresh data', async () => {
      mockApi.getPlayers.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMarket());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockApi.getPlayers.mock.calls.length;

      // Refresh
      result.current.refresh();

      await waitFor(() => {
        expect(mockApi.getPlayers.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });
});

describe('useMarketStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPlayers = [
    {
      id: '1',
      position: 'FORWARD',
      status: 'AVAILABLE',
      marketValue: 5000000,
      age: 25,
    },
    {
      id: '2',
      position: 'MIDFIELDER',
      status: 'AVAILABLE',
      marketValue: 3000000,
      age: 23,
    },
    {
      id: '3',
      position: 'FORWARD',
      status: 'CONTRACTED',
      marketValue: 4000000,
      age: 27,
    },
  ];

  const mockResponse = {
    items: mockPlayers,
    data: mockPlayers,
    meta: {
      total: 3,
      page: 1,
      limit: 100,
      totalPages: 1,
    },
  };

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      mockApi.getPlayers.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useMarketStats());

      expect(result.current.stats).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Fetching Stats', () => {
    it('should fetch and calculate market stats', async () => {
      mockApi.getPlayers.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useMarketStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        totalPlayers: 3,
        availablePlayers: 2,
        totalValue: '€12.0M',
        averageAge: 25,
        byPosition: {
          FORWARD: 2,
          MIDFIELDER: 1,
        },
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockApi.getPlayers.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useMarketStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load market statistics');
      expect(mockLogError).toHaveBeenCalledWith('Failed to fetch market stats', error);
    });

    it('should handle empty response', async () => {
      mockApi.getPlayers.mockResolvedValueOnce({
        items: [],
        data: [],
        meta: { total: 0, page: 1, limit: 100, totalPages: 1 },
      });

      const { result } = renderHook(() => useMarketStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        totalPlayers: 0,
        availablePlayers: 0,
        totalValue: '€0.0M',
        averageAge: 0,
        byPosition: {},
      });
    });

    it('should handle players without market value', async () => {
      const playersWithoutValue = [
        { id: '1', position: 'FORWARD', status: 'AVAILABLE', age: 25 },
        { id: '2', position: 'MIDFIELDER', status: 'FREE_AGENT', age: 23 },
      ];

      mockApi.getPlayers.mockResolvedValueOnce({
        items: playersWithoutValue,
        data: playersWithoutValue,
        meta: { total: 2, page: 1, limit: 100, totalPages: 1 },
      });

      const { result } = renderHook(() => useMarketStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats?.totalValue).toBe('€0.0M');
      expect(result.current.stats?.availablePlayers).toBe(2);
    });
  });

  describe('Refresh', () => {
    it('should refresh stats', async () => {
      mockApi.getPlayers.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMarketStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockApi.getPlayers.mock.calls.length;

      // Refresh
      result.current.refresh();

      await waitFor(() => {
        expect(mockApi.getPlayers.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });
});
