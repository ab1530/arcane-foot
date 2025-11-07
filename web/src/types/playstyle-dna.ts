export interface PlayStyleClassification {
  playerId: string;
  playerName: string;
  primaryStyle: string;
  secondaryStyle?: string;
  styleConfidence: number; // 0-1
  cluster: number;
  dnaProfile: DNAProfile;
  similarPlayers: SimilarPlayer[];
  recommendations: string[];
  realWorldExamples: string[];
}

export interface DNAProfile {
  Technical: number;
  Tactical: number;
  Physical: number;
  Mental: number;
  Pace: number;
  Strength: number;
  Creativity: number;
  'Work Rate': number;
}

export interface SimilarPlayer {
  id: string;
  name: string;
  position: string;
  style: string;
  similarity: number;
  dnaProfile: DNAProfile;
}

export interface StyleDefinition {
  styleName: string;
  description: string;
  characteristics: Record<string, number>;
  examplePlayers: string[];
  strengthsProfile?: Record<string, number>;
  idealPositions: string[];
  trainingFocus: string[];
}

export interface ComparisonResult {
  players: PlayStyleClassification[];
  compatibility: number; // 0-100
  insights: string[];
}

export interface StyleDistribution {
  style: string;
  count: number;
  percentage: number;
}
