import type { PlayStyleClassification, ComparisonResult, StyleDefinition, StyleDistribution } from '@/types/playstyle-dna';

const API_BASE_URL = process.env.NEXT_PUBLIC_PLAYSTYLE_DNA_API || 'http://localhost:8002';

export const playStyleDnaApi = {
  /**
   * Classify a player's playing style
   */
  classify: async (playerId: string, playerStats?: any): Promise<PlayStyleClassification> => {
    const response = await fetch(`${API_BASE_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId,
        ...playerStats,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to classify player');
    }

    return response.json();
  },

  /**
   * Compare multiple players' playing styles
   */
  compare: async (playerIds: string[]): Promise<ComparisonResult> => {
    const response = await fetch(`${API_BASE_URL}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to compare players');
    }

    return response.json();
  },

  /**
   * Get all available playing styles
   */
  getStyles: async (): Promise<StyleDefinition[]> => {
    const response = await fetch(`${API_BASE_URL}/styles`);

    if (!response.ok) {
      throw new Error('Failed to fetch styles');
    }

    return response.json();
  },

  /**
   * Get players similar to the specified player
   */
  getSimilar: async (playerId: string, limit: number = 5): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/similar/${playerId}?limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to fetch similar players');
    }

    return response.json();
  },

  /**
   * Get style distribution analytics
   */
  getDistribution: async (): Promise<StyleDistribution[]> => {
    const response = await fetch(`${API_BASE_URL}/analytics/distribution`);

    if (!response.ok) {
      throw new Error('Failed to fetch distribution');
    }

    return response.json();
  },

  /**
   * Get players by style
   */
  getPlayersByStyle: async (style: string): Promise<PlayStyleClassification[]> => {
    const response = await fetch(`${API_BASE_URL}/players/by-style/${encodeURIComponent(style)}`);

    if (!response.ok) {
      throw new Error('Failed to fetch players by style');
    }

    return response.json();
  },
};
