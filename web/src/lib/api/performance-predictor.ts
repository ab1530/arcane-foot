/**
 * Performance Predictor API Client
 * ML-powered player performance prediction endpoints
 */

import { apiClient } from '../api-client';
import {
  PerformancePrediction,
  AccuracyMetrics,
  FeatureImportance,
} from '@/types/performance-predictor';

export const performancePredictorApi = {
  /**
   * Predict performance for a single player in a specific match
   * POST /api/performance-predictor/predict/:playerId/:matchId
   */
  predict: async (
    playerId: string,
    matchId: string
  ): Promise<PerformancePrediction> => {
    return apiClient.predictPerformance(playerId, matchId);
  },

  /**
   * Batch predict performance for all players in a match
   * POST /api/performance-predictor/batch-predict/:matchId
   */
  batchPredict: async (matchId: string): Promise<PerformancePrediction[]> => {
    return apiClient.batchPredictPerformance(matchId);
  },

  /**
   * Get historical prediction accuracy metrics
   * GET /api/performance-predictor/accuracy
   */
  getAccuracy: async (
    playerId?: string,
    dateRange?: string
  ): Promise<AccuracyMetrics[]> => {
    return apiClient.getPerformancePredictorAccuracy(playerId, dateRange);
  },

  /**
   * Get feature importance from ML model
   * GET /api/performance-predictor/feature-importance
   */
  getFeatureImportance: async (): Promise<FeatureImportance[]> => {
    return apiClient.getFeatureImportance();
  },

  /**
   * Get historical predictions for a player
   * GET /api/performance-predictor/predictions/:playerId
   */
  getPlayerPredictions: async (playerId: string): Promise<any> => {
    return apiClient.getPlayerPredictions(playerId);
  },

  /**
   * Get performance insights for a player
   * GET /api/performance-predictor/insights/:playerId
   */
  getPerformanceInsights: async (playerId: string): Promise<any> => {
    return apiClient.getPerformanceInsights(playerId);
  },

  /**
   * Trigger model retraining (admin only)
   * POST /api/performance-predictor/retrain
   */
  retrainModel: async (): Promise<any> => {
    return apiClient.retrainPerformanceModel();
  },
};
