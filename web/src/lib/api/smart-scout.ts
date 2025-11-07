/**
 * SmartScout AI API Client
 * Handles all SmartScout AI-related API calls
 */

import { apiClient } from '../api-client';
import type {
  PartialReport,
  ReportContext,
  SuggestionResponse,
  AutocompleteResponse,
  PlayerInsights,
} from '@/types/smart-scout';

export const smartScoutApi = {
  /**
   * Get intelligent suggestions for report completion
   * @param partialReport - Partial report data entered so far
   * @param context - Additional context (match, player, scout)
   * @returns Similar reports and suggestions
   */
  getSuggestions: async (
    partialReport: PartialReport,
    context?: ReportContext
  ): Promise<SuggestionResponse> => {
    try {
      const response = await apiClient.getSmartScoutSuggestions(partialReport, context);
      return response;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  },

  /**
   * Get autocomplete suggestions for a specific field
   * @param fieldName - Name of the field to autocomplete
   * @param partialValue - Current partial value entered
   * @param context - Additional context (position, league, etc.)
   * @returns Autocomplete suggestions
   */
  autocomplete: async (
    fieldName: string,
    partialValue: string,
    context?: ReportContext
  ): Promise<AutocompleteResponse> => {
    try {
      const response = await apiClient.getSmartScoutAutocomplete(fieldName, partialValue, context);
      return response;
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      throw error;
    }
  },

  /**
   * Get AI-powered insights for a player
   * @param playerId - ID of the player
   * @returns AI-generated insights and trends
   */
  getInsights: async (playerId: string): Promise<PlayerInsights> => {
    try {
      const response = await apiClient.getSmartScoutInsights(playerId);
      return response;
    } catch (error) {
      console.error('Error getting player insights:', error);
      throw error;
    }
  },

  /**
   * Index a specific report (Admin only)
   * @param reportId - ID of the report to index
   */
  indexReport: async (reportId: string): Promise<{ message: string; reportId: string }> => {
    try {
      const response = await apiClient.indexSmartScoutReport(reportId);
      return response;
    } catch (error) {
      console.error('Error indexing report:', error);
      throw error;
    }
  },

  /**
   * Reindex all approved reports (Admin only)
   * Heavy operation - use sparingly
   */
  reindexAll: async (): Promise<{
    message: string;
    indexed: number;
    failed: number;
    totalProcessed: number;
  }> => {
    try {
      const response = await apiClient.reindexAllSmartScoutReports();
      return response;
    } catch (error) {
      console.error('Error reindexing reports:', error);
      throw error;
    }
  },
};
