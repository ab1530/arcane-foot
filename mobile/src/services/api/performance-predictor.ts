import api from '../api';
import type {
  PerformancePrediction,
  AccuracyMetrics,
  FeatureImportance,
  PredictionRequest,
} from '../../types/performance-predictor';

export const performancePredictorApi = {
  /**
   * Predict performance for a single player in a match
   */
  async predict(playerId: string, matchId: string): Promise<PerformancePrediction> {
    return api.postRaw(`/performance-predictor/predict/${playerId}/${matchId}`);
  },

  /**
   * Batch predict for all players in a match (team lineup)
   */
  async batchPredict(matchId: string): Promise<PerformancePrediction[]> {
    return api.postRaw(`/performance-predictor/batch-predict/${matchId}`);
  },

  /**
   * Get historical accuracy metrics
   */
  async getAccuracy(playerId?: string, dateRange?: string): Promise<AccuracyMetrics[]> {
    const params: any = {};
    if (playerId) params.playerId = playerId;
    if (dateRange) params.dateRange = dateRange;

    return api.getRaw('/performance-predictor/accuracy', { params });
  },

  /**
   * Get feature importance from ML model
   */
  async getFeatureImportance(): Promise<FeatureImportance[]> {
    return api.getRaw('/performance-predictor/feature-importance');
  },

  /**
   * Trigger model retraining (admin only)
   */
  async retrainModel(): Promise<{ message: string; success: boolean }> {
    return api.postRaw('/performance-predictor/retrain');
  },

  /**
   * Get historical predictions for a player
   */
  async getPlayerPredictions(playerId: string): Promise<PerformancePrediction[]> {
    return api.getRaw(`/performance-predictor/predictions/${playerId}`);
  },

  /**
   * Get performance insights for a player
   */
  async getPerformanceInsights(playerId: string): Promise<any> {
    return api.getRaw(`/performance-predictor/insights/${playerId}`);
  },
};
