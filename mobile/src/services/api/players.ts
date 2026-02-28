import api from '../api';
import type { Player, PaginatedResponse } from '../../types';

export interface PlayersQuery {
  position?: string;
  status?: string;
  nationality?: string;
  clubId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type DiscoveredTreeSquadType = 'ALL' | 'PRO' | 'RESERVE';

export interface ResolveObservedPlayerDto {
  observedFirstName?: string;
  observedLastName?: string;
  observedNationality?: string;
  observedPhone?: string;
  observedEmail?: string;
  observedClubName?: string;
  observedBirthYear?: number;
  playerPosition?: string;
  matchId?: string;
}

export interface ResolveObservedPlayerResponse {
  playerId: string;
  resolutionMode: 'exact_match' | 'probable_match' | 'created_new';
  confidence: number;
}

export interface DiscoveredTreePlayerNode {
  playerId: string;
  fullName: string;
  ageCategory: 'SENIOR' | 'U19' | 'U17' | 'U16';
  squadType: 'PRO' | 'RESERVE';
  country: string;
  competition: string;
  reportCount: number;
  lastReportAt: string | null;
  weightedOverallRating: number | null;
  latestOverallRating: number | null;
}

export interface DiscoveredTreeAgeCategoryNode {
  ageCategory: 'SENIOR' | 'U19' | 'U17' | 'U16';
  totalPlayers: number;
  totalReports: number;
  players: DiscoveredTreePlayerNode[];
}

export interface DiscoveredTreeCompetitionNode {
  competition: string;
  totalAgeCategories: number;
  totalPlayers: number;
  totalReports: number;
  ageCategories: DiscoveredTreeAgeCategoryNode[];
}

export interface DiscoveredTreeCountryNode {
  country: string;
  totalCompetitions: number;
  totalPlayers: number;
  totalReports: number;
  competitions: DiscoveredTreeCompetitionNode[];
}

export interface DiscoveredTreeResponse {
  data: DiscoveredTreeCountryNode[];
  meta: {
    scoutId: string;
    squadType: DiscoveredTreeSquadType;
    totalCountries: number;
    totalCompetitions: number;
    totalPlayers: number;
    totalReports: number;
  };
}

export const playersApi = {
  async getAllPlayers(params?: PlayersQuery): Promise<Player[]> {
    const response: PaginatedResponse<Player> = await api.getPlayers(params);
    return response.items ?? response.data ?? [];
  },

  async resolveObservedPlayer(
    payload: ResolveObservedPlayerDto,
  ): Promise<ResolveObservedPlayerResponse> {
    return api.postRaw('/players/resolve-observed', payload);
  },

  async getDiscoveredTree(
    params?: { squadType?: DiscoveredTreeSquadType },
  ): Promise<DiscoveredTreeResponse> {
    return api.getRaw('/players/discovered/tree', { params });
  },
};

export type { Player };
