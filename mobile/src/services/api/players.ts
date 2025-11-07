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

export const playersApi = {
  async getAllPlayers(params?: PlayersQuery): Promise<Player[]> {
    const response: PaginatedResponse<Player> = await api.getPlayers(params);
    return response.items ?? response.data ?? [];
  },
};

export type { Player };
