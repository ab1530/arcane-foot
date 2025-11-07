/**
 * Conversation message structure
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  scouts?: any[];
  extractedCriteria?: any;
}

/**
 * Full conversation structure stored in cache
 */
export interface Conversation {
  id: string;
  userId: string;
  messages: ConversationMessage[];
  currentCriteria: any;
  createdAt: Date;
  lastMessageAt: Date;
  scoutingHistory: string[]; // IDs of scouts already shown
}

/**
 * Response for getting conversation history
 */
export interface ConversationHistoryDto {
  conversationId: string;
  messages: ConversationMessage[];
  messageCount: number;
  createdAt: Date;
  lastMessageAt: Date;
}
