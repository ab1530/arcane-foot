import { renderHook, waitFor } from '@testing-library/react'
import { useSubscription } from '../useSubscription'
import { apiClient } from '@/lib/api-client'

// Mock apiClient
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getMySubscription: jest.fn(),
  },
}))

describe('useSubscription Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.setItem('arcane_auth_token', 'test-token')
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('fetches subscription on mount', async () => {
    const mockSubscription = {
      id: '1',
      tier: 'GOLD',
      status: 'ACTIVE',
    }
    
    ;(apiClient.getMySubscription as jest.Mock).mockResolvedValue(mockSubscription)
    
    const { result } = renderHook(() => useSubscription())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.subscription).toEqual(mockSubscription)
    expect(apiClient.getMySubscription).toHaveBeenCalledTimes(1)
  })

  it('handles errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(apiClient.getMySubscription as jest.Mock).mockRejectedValue(new Error('API Error'))
    
    const { result } = renderHook(() => useSubscription())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.subscription).toBe(null)
    expect(result.current.error).toBe('API Error')
    
    consoleErrorSpy.mockRestore()
  })

  it('hasMinimumTier returns correct values', async () => {
    const mockSubscription = {
      id: '1',
      tier: 'GOLD',
      status: 'ACTIVE',
    }
    
    ;(apiClient.getMySubscription as jest.Mock).mockResolvedValue(mockSubscription)
    
    const { result } = renderHook(() => useSubscription())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    // GOLD tier should have access to FREE, BASIC, GOLD
    expect(result.current.hasMinimumTier('FREE')).toBe(true)
    expect(result.current.hasMinimumTier('BASIC')).toBe(true)
    expect(result.current.hasMinimumTier('GOLD')).toBe(true)
    
    // But not PRO or ENTERPRISE
    expect(result.current.hasMinimumTier('PRO')).toBe(false)
    expect(result.current.hasMinimumTier('ENTERPRISE')).toBe(false)
  })

  it('getTierName returns correct translations', async () => {
    ;(apiClient.getMySubscription as jest.Mock).mockResolvedValue({ tier: 'GOLD', status: 'ACTIVE' })
    
    const { result } = renderHook(() => useSubscription())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.getTierName('FREE')).toBe('Gratuit')
    expect(result.current.getTierName('GOLD')).toBe('Gold')
    expect(result.current.getTierName('ENTERPRISE')).toBe('Enterprise')
  })

  it('canUpgrade returns false for ENTERPRISE tier', async () => {
    ;(apiClient.getMySubscription as jest.Mock).mockResolvedValue({ tier: 'ENTERPRISE', status: 'ACTIVE' })
    
    const { result } = renderHook(() => useSubscription())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.canUpgrade()).toBe(false)
  })

  it('canUpgrade returns true for other tiers', async () => {
    ;(apiClient.getMySubscription as jest.Mock).mockResolvedValue({ tier: 'FREE', status: 'ACTIVE' })
    
    const { result } = renderHook(() => useSubscription())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.canUpgrade()).toBe(true)
  })
})
