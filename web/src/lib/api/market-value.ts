/**
 * Market Value AI API Client
 * API functions for the MarketValue AI feature
 */

import { apiClient } from '../api-client';
import {
  PlayerValuation,
  ValuationTrend,
  ComparisonResult,
  MarketValueHealthStatus,
} from '@/types/market-value';

export const marketValueApi = {
  /**
   * Get player market valuation
   */
  async getPlayerValuation(playerId: string): Promise<PlayerValuation> {
    return apiClient.getPlayerValuation(playerId);
  },

  /**
   * Get valuation trend for a player
   */
  async getValuationTrend(playerId: string): Promise<ValuationTrend> {
    return apiClient.getValuationTrend(playerId);
  },

  /**
   * Compare multiple players
   */
  async comparePlayers(playerIds: string[]): Promise<ComparisonResult> {
    return apiClient.comparePlayers(playerIds);
  },

  /**
   * Check AI service health
   */
  async checkHealth(): Promise<MarketValueHealthStatus> {
    return apiClient.checkMarketValueHealth();
  },

  /**
   * Trigger model retraining (Admin only)
   */
  async triggerModelRetrain(): Promise<{ message: string; status: string }> {
    return apiClient.triggerModelRetrain();
  },
};
