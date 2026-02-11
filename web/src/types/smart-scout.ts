/**
 * SmartScout AI Types
 * AI-powered scouting report suggestions and autocomplete
 */

export interface PartialReport {
  playerPosition?: string;
  technicalRating?: number;
  tacticalRating?: number;
  physicalRating?: number;
  mentalRating?: number;
  strengths?: string;
  weaknesses?: string;
  summary?: string;
  tags?: string[];
  overallRating?: number;
}

export interface ReportContext {
  matchId?: string;
  playerId?: string;
  scoutId?: string;
  league?: string;
  position?: string;
  [key: string]: any;
}

export interface SimilarReport {
  reportId: string;
  similarity: number;
  player: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    position: string;
    club?: string;
    nationality?: string;
    age?: number;
  };
  excerpts: {
    strengths?: string;
    weaknesses?: string;
    summary?: string;
    technicalRating?: number;
    tacticalRating?: number;
    physicalRating?: number;
    mentalRating?: number;
  };
  createdAt: string;
  scoutName?: string;
}

export interface Suggestion {
  field: string;
  value: string;
  confidence: number;
  source: 'ai' | 'rules';
}

export interface SuggestionResponse {
  similarReports: SimilarReport[];
  suggestions: Suggestion[];
  usingAI: boolean;
  message?: string;
}

export interface AutocompleteOption {
  value: string;
  confidence: number;
  source: 'ai' | 'rules';
  metadata?: {
    frequency?: number;
    lastUsed?: string;
  };
}

export interface AutocompleteResponse {
  suggestions: AutocompleteOption[];
  fieldName: string;
  usingAI: boolean;
}

export interface PlayerInsights {
  playerId: string;
  playerName: string;
  insights: string;
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  consensus: {
    agreements: number;
    total: number;
    percentage: number;
  };
  reportCount?: number;
  averageRatings?: {
    technical?: number;
    tactical?: number;
    physical?: number;
    mental?: number;
    overall?: number;
  };
  generatedAt: string;
  usingAI: boolean;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  position?: string;
  club?: string;
  nationality?: string;
  age?: number;
  photoUrl?: string;
}

// Field names for autocomplete
export type AutocompleteFieldName =
  | 'strengths'
  | 'weaknesses'
  | 'summary'
  | 'position'
  | 'foot'
  | 'tags'
  | 'recommendation'
  | 'recommendationNotes';
