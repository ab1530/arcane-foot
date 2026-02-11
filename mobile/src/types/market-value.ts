export interface ConfidenceInterval {
  low: number;
  high: number;
}

export interface ComparablePlayer {
  id?: string;
  name: string;
  age: number;
  position: string;
  market_value: number;
  similarity_score: number;
}

export interface PlayerValuation {
  playerId: string;
  playerName?: string;
  estimatedValue: number; // millions EUR
  confidenceInterval: ConfidenceInterval;
  confidenceScore: number; // 0-1
  factors: Record<string, number>;
  comparablePlayers: ComparablePlayer[];
  modelVersion: string;
  timestamp: Date;
}

export interface ValuationDataPoint {
  timestamp: Date;
  value: number;
  confidence: number;
  modelVersion: string;
}

export interface ValuationTrend {
  playerId: string;
  valuations: ValuationDataPoint[];
  currentValue: number;
  previousValue: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PlayerComparison {
  playerId: string;
  playerName: string;
  age: number;
  position: string;
  estimatedValue: number;
  confidenceScore: number;
  appearances: number;
  goals: number;
  assists: number;
  rating: number;
}

export interface ComparePlayersResponse {
  players: PlayerComparison[];
  highestValuePlayerId: string;
  highestValue: number;
  averageValue: number;
  valueStdDev: number;
}
