/**
 * ArkaneMatch Types
 * Types for the AI-powered scout search chat interface
 */

import { ScoutListing } from "./marketplace";

export interface SearchCriteria {
  leagues?: string[];
  positions?: string[];
  maxBudget?: number;
  countries?: string[];
  minRating?: number;
  verifiedOnly?: boolean;
  languages?: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  scouts?: ScoutListing[];
  extractedCriteria?: SearchCriteria;
  suggestions?: string[];
}

export interface ArkaneMatchChatRequest {
  message: string;
  conversationId?: string;
}

export interface ArkaneMatchChatResponse {
  response: string;
  scouts?: ScoutListing[];
  extractedCriteria?: SearchCriteria;
  suggestions?: string[];
  conversationId: string;
  totalMatches?: number;
}

export interface Conversation {
  id: string;
  clubId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
