import { apiClient } from '@/lib/api-client'

// Mock fetch
global.fetch = jest.fn()

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('getPlayers', () => {
    it('fetches players successfully', async () => {
      const mockPlayers = [
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'Jane', lastName: 'Smith' },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockPlayers }),
      })

      const result = await apiClient.getPlayers()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/players'),
        expect.objectContaining({
          method: 'GET',
        })
      )
      expect(result.data).toEqual(mockPlayers)
    })

    it('includes auth token when available', async () => {
      localStorage.setItem('arcane_auth_token', 'test-token')

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })

      await apiClient.getPlayers()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      )
    })

    it('handles API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      })

      await expect(apiClient.getPlayers()).rejects.toThrow()
    })
  })
})
