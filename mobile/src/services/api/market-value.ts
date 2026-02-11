import api from '../api';
import type {
  PlayerValuation,
  ValuationTrend,
  ComparePlayersResponse,
} from '../../types/market-value';

export const marketValueApi = {
  /**
   * Get AI-powered market valuation for a specific player
   */
  getValuation: async (playerId: string): Promise<PlayerValuation> => {
    const response = await api.getRaw<PlayerValuation>(`/market-value/player/${playerId}`);
    return response;
  },

  /**
   * Get historical valuation trend for a player
   */
  getTrend: async (playerId: string): Promise<ValuationTrend> => {
    const response = await api.getRaw<ValuationTrend>(`/market-value/trend/${playerId}`);
    return response;
  },

  /**
   * Compare market valuations of multiple players
   */
  compare: async (playerIds: string[]): Promise<ComparePlayersResponse> => {
    const response = await api.postRaw<ComparePlayersResponse>('/market-value/compare', {
      playerIds,
    });
    return response;
  },

  /**
   * Check if the AI market value service is operational
   */
  checkHealth: async (): Promise<any> => {
    const response = await api.getRaw('/market-value/health');
    return response;
  },
};

export default marketValueApi;
