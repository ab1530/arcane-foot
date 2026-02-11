/**
 * ArkaneMatch Types
 * Type definitions for conversational AI scout search
 */

export interface Scout {
  id: string;
  users: {
    firstName: string;
    lastName: string;
    email?: string;
    avatar?: string;
  };
  headline?: string;
  bio?: string;
  hourlyRate?: number;
  currency?: string;
  isVerified?: boolean;
  expertise?: {
    leagues?: string[];
    positions?: string[];
    specializations?: string[];
  };
  availability?: {
    status?: string;
    timezone?: string;
  };
  stats?: {
    avgRating?: number;
    totalReviews?: number;
    completedReports?: number;
    yearsExperience?: number;
  };
  languages?: string[];
  location?: {
    country?: string;
    city?: string;
  };
}

export interface SearchCriteria {
  leagues?: string[];
  positions?: string[];
  maxBudget?: number;
  minRating?: number;
  countries?: string[];
  languages?: string[];
  verifiedOnly?: boolean;
  currency?: string;
}

export enum IntentType {
  SEARCH_SCOUT = 'SEARCH_SCOUT',
  REFINE_SEARCH = 'REFINE_SEARCH',
  GET_DETAILS = 'GET_DETAILS',
  COMPARE_SCOUTS = 'COMPARE_SCOUTS',
  GENERAL_QUESTION = 'GENERAL_QUESTION',
  UNCLEAR = 'UNCLEAR',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  scouts?: Scout[];
  extractedCriteria?: SearchCriteria;
  suggestions?: string[];
  timestamp: Date;
}

export interface ConversationState {
  messages: ChatMessage[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ChatResponse {
  response: string;
  scouts?: Scout[];
  extractedCriteria?: SearchCriteria;
  suggestions?: string[];
  conversationId: string;
  intent?: IntentType;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

// Preset prompts for suggestion chips
export const SUGGESTED_PROMPTS = [
  "Find Premier League scouts",
  "Show top-rated scouts",
  "LaLiga defender specialists",
  "Scouts under €150/hr",
  "Verified scouts only",
  "French-speaking scouts",
  "What can you help me with?",
];
