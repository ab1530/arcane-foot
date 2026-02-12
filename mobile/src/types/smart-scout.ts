export interface PartialReport {
  matchId?: string;
  playerId?: string;
  playerPosition?: string;
  technicalRating?: number;
  physicalRating?: number;
  mentalRating?: number;
  tacticalRating?: number;
  strengths?: string;
  weaknesses?: string;
  summary?: string;
  notes?: string;
  tags?: string[];
}

export interface SimilarReport {
  reportId: string;
  similarity: number;
  player: {
    id: string;
    name: string;
    position: string;
  };
  excerpts?: {
    strengths?: string;
    weaknesses?: string;
    summary?: string;
  };
  scoutName?: string;
  matchDate?: string;
}

export interface Suggestion {
  field: string;
  value: string;
  confidence: number;
  source?: string;
}

export interface SuggestionResponse {
  similarReports: SimilarReport[];
  suggestions: Suggestion[];
  insights?: string;
  usingAI: boolean;
}

export interface AutocompleteSuggestion {
  value: string;
  confidence: number;
  source: 'ai' | 'rules';
}

export interface AutocompleteRequest {
  fieldName: string;
  partialValue: string;
  context?: {
    position?: string;
    league?: string;
    nationality?: string;
    age?: number;
  };
}

export interface AutocompleteResponse {
  suggestions: string[];
  usingAI: boolean;
}

export interface PlayerInsights {
  playerId: string;
  playerName: string;
  summary: string;
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  consensus: {
    agreementPercentage: number;
    totalReports: number;
  };
  avgRatings: {
    technical: number;
    tactical: number;
    physical: number;
    mental: number;
  };
}

export type FieldName = 'strengths' | 'weaknesses' | 'summary' | 'notes' | 'position' | 'preferredFoot' | 'tags';

export const AUTOCOMPLETE_FIELDS: { label: string; value: FieldName }[] = [
  { label: 'Strengths', value: 'strengths' },
  { label: 'Weaknesses', value: 'weaknesses' },
  { label: 'Summary', value: 'summary' },
  { label: 'Notes', value: 'notes' },
];

export const POSITIONS = [
  'GK',
  'RB', 'CB', 'LB', 'RWB', 'LWB',
  'CDM', 'CM', 'CAM', 'RM', 'LM',
  'RW', 'ST', 'CF', 'LW',
];
