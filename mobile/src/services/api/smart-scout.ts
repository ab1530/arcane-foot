import api from '../api';
import type {
  PartialReport,
  SuggestionResponse,
  AutocompleteRequest,
  AutocompleteResponse,
  PlayerInsights,
} from '../../types/smart-scout';

export const smartScoutApi = {
  /**
   * Get similar reports based on partial report data
   */
  async getSuggestions(partialReport: PartialReport): Promise<SuggestionResponse> {
    const response = await api.postRaw<SuggestionResponse>(
      '/smart-scout/suggestions',
      { partialReport }
    );
    return response;
  },

  /**
   * Get autocomplete suggestions for a field
   */
  async autocomplete(request: AutocompleteRequest): Promise<AutocompleteResponse> {
    const response = await api.postRaw<AutocompleteResponse>(
      '/smart-scout/autocomplete',
      request
    );
    return response;
  },

  /**
   * Get AI insights for a player based on all their reports
   */
  async getInsights(playerId: string): Promise<PlayerInsights> {
    const response = await api.getRaw<PlayerInsights>(
      `/smart-scout/insights/${playerId}`
    );
    return response;
  },
};

export default smartScoutApi;
