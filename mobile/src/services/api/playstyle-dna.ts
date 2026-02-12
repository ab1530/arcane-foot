/**
 * PlayStyle DNA API Client
 * Connects to Python FastAPI service on port 8002
 */

import { API_URL } from '../../constants/config';
import type {
  PlayStyleClassification,
  ClassifyResponse,
  CompareResponse,
  StylesListResponse,
  SimilarPlayersResponse,
  ClassificationRequest,
  ComparisonRequest,
  StyleComparison,
  PlayStyleInfo,
  SimilarPlayer,
} from '../../types/playstyle-dna';

// Python AI service base URL
const AI_SERVICE_URL = API_URL.replace(':3000', ':8002').replace('/api', '');

class PlayStyleDnaApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = AI_SERVICE_URL;
  }

  /**
   * Classify a player's playing style using AI
   */
  async classify(
    playerId: string,
    options?: Omit<ClassificationRequest, 'playerId'>
  ): Promise<PlayStyleClassification> {
    try {
      const requestBody: ClassificationRequest = {
        playerId,
        includeRecommendations: options?.includeRecommendations ?? true,
        includeSimilarPlayers: options?.includeSimilarPlayers ?? true,
        similarityThreshold: options?.similarityThreshold ?? 0.7,
        maxSimilarPlayers: options?.maxSimilarPlayers ?? 5,
      };

      const response = await fetch(`${this.baseUrl}/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Classification failed: ${response.statusText}`);
      }

      const data: ClassifyResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Classification failed');
      }

      return data.data;
    } catch (error) {
      console.error('Error classifying player style:', error);
      throw error;
    }
  }

  /**
   * Compare multiple players' playing styles
   */
  async compare(
    playerIds: string[],
    analysisDepth: 'basic' | 'detailed' | 'comprehensive' = 'detailed'
  ): Promise<StyleComparison> {
    try {
      if (playerIds.length < 2) {
        throw new Error('At least 2 players are required for comparison');
      }

      if (playerIds.length > 5) {
        throw new Error('Maximum 5 players can be compared at once');
      }

      const requestBody: ComparisonRequest = {
        playerIds,
        analysisDepth,
      };

      const response = await fetch(`${this.baseUrl}/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Comparison failed: ${response.statusText}`);
      }

      const data: CompareResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Comparison failed');
      }

      return data.data;
    } catch (error) {
      console.error('Error comparing player styles:', error);
      throw error;
    }
  }

  /**
   * Get all 12 playing styles with descriptions
   */
  async getStyles(): Promise<PlayStyleInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/styles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch styles: ${response.statusText}`);
      }

      const data: StylesListResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch styles');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching playing styles:', error);
      throw error;
    }
  }

  /**
   * Get similar players based on a player's style
   */
  async getSimilar(
    playerId: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<SimilarPlayer[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/similar/${playerId}?limit=${limit}&threshold=${threshold}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch similar players: ${response.statusText}`);
      }

      const data: SimilarPlayersResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch similar players');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching similar players:', error);
      throw error;
    }
  }

  /**
   * Search players by style
   */
  async searchByStyle(
    styleName: string,
    filters?: {
      minConfidence?: number;
      position?: string;
      nationality?: string;
      limit?: number;
    }
  ): Promise<PlayStyleClassification[]> {
    try {
      const params = new URLSearchParams();
      params.append('style', styleName);

      if (filters?.minConfidence) {
        params.append('minConfidence', filters.minConfidence.toString());
      }
      if (filters?.position) {
        params.append('position', filters.position);
      }
      if (filters?.nationality) {
        params.append('nationality', filters.nationality);
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error searching players by style:', error);
      throw error;
    }
  }

  /**
   * Get batch classifications for multiple players
   */
  async batchClassify(playerIds: string[]): Promise<PlayStyleClassification[]> {
    try {
      if (playerIds.length === 0) {
        return [];
      }

      if (playerIds.length > 20) {
        throw new Error('Maximum 20 players can be classified at once');
      }

      const response = await fetch(`${this.baseUrl}/batch-classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerIds }),
      });

      if (!response.ok) {
        throw new Error(`Batch classification failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error batch classifying players:', error);
      throw error;
    }
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<{ status: string; version: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('AI service is unavailable');
      }

      return await response.json();
    } catch (error) {
      console.error('AI service health check failed:', error);
      throw error;
    }
  }
}

export const playStyleDnaApi = new PlayStyleDnaApiClient();
export default playStyleDnaApi;
