import { renderHook, waitFor, act } from '@testing-library/react-native';
import { usePlayers } from './usePlayers';
import api from '../services/api';

// Mock dependencies
jest.mock('../services/api');

const mockApi = api as jest.Mocked<typeof api>;

describe('usePlayers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      mockApi.getPlayers.mockResolvedValueOnce({
        items: mockPlayers,
        data: mockPlayers,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });

      const { result } = renderHook(() => usePlayers());

      expect(result.current.players).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.refreshing).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Fetching Players', () => {
    it('should fetch players on mount', async () => {
      const mockResponse = {
        items: mockPlayers,
        data: mockPlayers,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      };
      mockApi.getPlayers.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockApi.getPlayers).toHaveBeenCalledWith();
      expect(result.current.players).toEqual(mockPlayers);
      expect(result.current.error).toBeNull();
    });

    it('should handle response with items property', async () => {
      const mockResponse = {
        items: mockPlayers,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      };
      mockApi.getPlayers.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toEqual(mockPlayers);
    });

    it('should handle response with data property', async () => {
      const mockResponse = {
        data: mockPlayers,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      };
      mockApi.getPlayers.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toEqual(mockPlayers);
    });

    it('should handle response with direct array', async () => {
      mockApi.getPlayers.mockResolvedValueOnce(mockPlayers as any);

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toEqual(mockPlayers);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockApi.getPlayers.mockRejectedValueOnce(error);

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.players).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching players:', error);
    });

    it('should handle empty response', async () => {
      mockApi.getPlayers.mockResolvedValueOnce({
        items: [],
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
      });

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle non-array response', async () => {
      mockApi.getPlayers.mockResolvedValueOnce({ invalid: 'response' } as any);

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toEqual([]);
    });
  });

  describe('Refresh', () => {
    it('should refresh players', async () => {
      const mockResponse = {
        items: mockPlayers,
        data: mockPlayers,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      };
      mockApi.getPlayers.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockApi.getPlayers).toHaveBeenCalledTimes(1);

      // Call refresh
      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      expect(mockApi.getPlayers).toHaveBeenCalledTimes(2);
      expect(result.current.players).toEqual(mockPlayers);
    });

    it('should handle refresh errors', async () => {
      const mockResponse = {
        items: mockPlayers,
        data: mockPlayers,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      };
      mockApi.getPlayers.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock error on refresh
      const error = new Error('Refresh Error');
      mockApi.getPlayers.mockRejectedValueOnce(error);

      // Call refresh
      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });
      expect(result.current.players).toEqual([]);
    });
  });

  describe('Loading States', () => {
    it('should manage loading state correctly', async () => {
      const mockResponse = {
        items: mockPlayers,
        data: mockPlayers,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      };
      mockApi.getPlayers.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockResponse), 100);
          })
      );

      const { result } = renderHook(() => usePlayers());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.refreshing).toBe(false);

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 200 }
      );

      expect(result.current.players).toEqual(mockPlayers);
    });

    it('should manage refreshing state independently', async () => {
      const mockResponse = {
        items: mockPlayers,
        data: mockPlayers,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      };
      mockApi.getPlayers.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start refresh
      act(() => {
        result.current.refresh();
      });

      // Loading should remain false during refresh
      expect(result.current.loading).toBe(false);
      expect(result.current.refreshing).toBe(true);

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover from error on successful retry', async () => {
      const error = new Error('API Error');
      mockApi.getPlayers.mockRejectedValueOnce(error);

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.players).toEqual([]);

      // Successful refresh
      const mockResponse = {
        items: mockPlayers,
        data: mockPlayers,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      };
      mockApi.getPlayers.mockResolvedValueOnce(mockResponse);

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.players).toEqual(mockPlayers);
    });
  });
});
