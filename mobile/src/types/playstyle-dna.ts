/**
 * PlayStyle DNA Types
 * Types for AI-powered playing style classification system
 */

export type PlayStyleName =
  | 'Playmaker'
  | 'Physical Enforcer'
  | 'Box-to-Box Engine'
  | 'Tactical Anchor'
  | 'Speed Demon'
  | 'Clinical Finisher'
  | 'Creative Dribbler'
  | 'Defensive Wall'
  | 'Deep-Lying Orchestrator'
  | 'Pressing Machine'
  | 'Target Man'
  | 'Balanced All-Rounder';

export interface DNAProfile {
  technical: number;
  tactical: number;
  physical: number;
  mental: number;
  pace: number;
  strength: number;
  creativity: number;
  workRate: number;
}

export interface SimilarPlayer {
  id: string;
  name: string;
  position: string;
  style: PlayStyleName;
  similarity: number;
  photo?: string;
  nationality?: string;
  club?: string;
}

export interface PlayStyleClassification {
  playerId: string;
  playerName: string;
  primaryStyle: PlayStyleName;
  secondaryStyle?: PlayStyleName;
  styleConfidence: number;
  cluster: number;
  dnaProfile: DNAProfile;
  similarPlayers: SimilarPlayer[];
  recommendations: string[];
  realWorldExamples: string[];
  metadata?: {
    classifiedAt: string;
    modelVersion: string;
    dataQuality: number;
  };
}

export interface PlayStyleInfo {
  name: PlayStyleName;
  description: string;
  characteristics: string[];
  strengths: string[];
  weaknesses: string[];
  realWorldExamples: string[];
  icon: string;
  color: string;
  playerCount?: number;
}

export interface StyleComparison {
  playerIds: string[];
  players: {
    id: string;
    name: string;
    classification: PlayStyleClassification;
  }[];
  compatibility: {
    [key: string]: {
      [key: string]: number; // Compatibility score between two players
    };
  };
  insights: string[];
  teamBalance: {
    technical: number;
    physical: number;
    creative: number;
    defensive: number;
  };
}

export interface ClassificationRequest {
  playerId: string;
  includeRecommendations?: boolean;
  includeSimilarPlayers?: boolean;
  similarityThreshold?: number;
  maxSimilarPlayers?: number;
}

export interface ComparisonRequest {
  playerIds: string[];
  analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
}

export interface StyleExplorerFilter {
  styles?: PlayStyleName[];
  minConfidence?: number;
  position?: string;
  nationality?: string;
  ageRange?: [number, number];
}

export interface TrainingRecommendation {
  id: string;
  type: 'technical' | 'tactical' | 'physical' | 'mental';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetAttribute: keyof DNAProfile;
  expectedImprovement: number;
  duration: string;
  exercises?: string[];
}

export interface StyleEvolution {
  playerId: string;
  timeline: {
    date: string;
    primaryStyle: PlayStyleName;
    confidence: number;
    dnaProfile: DNAProfile;
  }[];
  trends: {
    attribute: keyof DNAProfile;
    change: number;
    direction: 'improving' | 'declining' | 'stable';
  }[];
}

// API Response types
export interface ClassifyResponse {
  success: boolean;
  data: PlayStyleClassification;
  message?: string;
}

export interface CompareResponse {
  success: boolean;
  data: StyleComparison;
  message?: string;
}

export interface StylesListResponse {
  success: boolean;
  data: PlayStyleInfo[];
  message?: string;
}

export interface SimilarPlayersResponse {
  success: boolean;
  data: SimilarPlayer[];
  message?: string;
}
