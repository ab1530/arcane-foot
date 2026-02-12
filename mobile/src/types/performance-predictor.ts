/**
 * Performance Predictor Types
 * AI-powered player performance prediction system
 */

export interface KeyFactor {
  factor: string;
  value: number;
  importance: number; // 0-1
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface RatingDistribution {
  poor_0_5: number;
  average_5_7: number;
  good_7_8: number;
  excellent_8_plus: number;
}

export interface PerformancePrediction {
  playerId: string;
  predictedRating: number; // 0-10
  confidenceInterval: number[]; // [low, high]
  confidence: number; // 0-1
  ratingDistribution: RatingDistribution;
  keyFactors: KeyFactor[];
  recommendations: string[];
}

export interface TeamPrediction extends PerformancePrediction {
  playerName?: string;
  playerPosition?: string;
  playerPhoto?: string;
}

export interface AccuracyMetrics {
  totalPredictions: number;
  avgError: number; // MAE
  rmse: number;
  withinCI: number; // Percentage
  r2Score?: number;
  dateRange: string;
  modelVersion: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface PredictionRequest {
  playerId: string;
  matchContext: {
    venue?: string;
    importance?: number;
    opponent_strength?: number;
    days_rest?: number;
    season_progress?: number;
    playing_position?: string;
  };
  recentForm: number[];
  seasonStats: {
    avg_minutes?: number;
    technical_rating?: number;
    tactical_rating?: number;
    physical_rating?: number;
    mental_rating?: number;
  };
  playerAttributes: {
    age: number;
    height?: number;
    weight?: number;
    market_value?: number;
    position: string;
  };
}

export type RatingCategory = 'excellent' | 'good' | 'average' | 'poor';

export interface MonthlyTrend {
  month: string;
  mae: number;
  withinCI: number;
}
