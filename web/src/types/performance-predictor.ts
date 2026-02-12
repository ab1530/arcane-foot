/**
 * Performance Predictor Types
 * ML-powered player performance prediction system
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
  playerName?: string;
  playerPosition?: string;
  playerPhoto?: string;
  matchId?: string;

  predictedRating: number; // 0-10
  confidenceInterval: number[]; // [low, high]
  confidence: number; // 0-1

  ratingDistribution: RatingDistribution;
  keyFactors: KeyFactor[];
  recommendations: string[];

  predictedAt?: string;
}

export interface LineupPrediction {
  matchId: string;
  formation: string;
  players: PerformancePrediction[];
  expectedTeamRating: number;
  bench: PerformancePrediction[];
  insights: string[];
}

export interface AccuracyMetrics {
  totalPredictions: number;
  avgError: number; // MAE
  rmse: number;
  withinCI: number; // percentage
  r2Score?: number;
  dateRange: string;
  modelVersion: string;
}

export interface AccuracyTrendData {
  month: string;
  mae: number;
  rmse: number;
  withinCI: number;
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

export interface Player {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  position: string;
  photo?: string;
  age?: number;
  nationality?: string;
}

export interface Match {
  id: string;
  homeClub: {
    id: string;
    name: string;
    logo?: string;
  };
  awayClub: {
    id: string;
    name: string;
    logo?: string;
  };
  scheduledAt: string;
  competition?: string;
  venue?: string;
  status: string;
}

// Rating color and label helpers
export type RatingLevel = 'excellent' | 'good' | 'average' | 'poor';

export interface RatingStyle {
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  chartColor: string;
}
