import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { logger } from '../utils/logger';
import type { Player } from '../types';

export interface MarketFilters {
  position?: string;
  search?: string;
  nationality?: string;
  minAge?: number;
  maxAge?: number;
  clubId?: string;
  status?: string;
}

export interface MarketStats {
  totalPlayers: number;
  availablePlayers: number;
  totalValue: string;
  averageAge: number;
  byPosition: Record<string, number>;
}

export const useMarket = (initialFilters?: MarketFilters) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MarketFilters>(initialFilters || {});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        page,
        limit: 20,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '' || params[key] === 'all') {
          delete params[key];
        }
      });

      const response = await api.getPlayers(params);

      logger.info('Market players fetched', {
        count: response?.items?.length || response?.data?.length || 0,
        page,
        filters
      });

      setPlayers(response?.items || response?.data || []);
      setTotalPages(response?.meta?.totalPages || 1);
      setTotalCount(response?.meta?.total || 0);
    } catch (err) {
      logger.error('market', 'Failed to fetch market players', {
        error: (err as Error)?.message,
      });
      setError('Failed to load players');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const updateFilters = useCallback((newFilters: MarketFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(p => p + 1);
    }
  }, [page, totalPages]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage(p => p - 1);
    }
  }, [page]);

  return {
    players,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refresh,
    page,
    totalPages,
    totalCount,
    nextPage,
    previousPage,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
};

export const useMarketStats = () => {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all players to calculate stats
      const response = await api.getPlayers({ limit: 100 });
      const players = response?.items || response?.data || [];

      // Calculate statistics
      const availablePlayers = players.filter((p: any) =>
        p.status === 'AVAILABLE' || p.status === 'FREE_AGENT'
      );

      const totalValue = players.reduce((sum: number, p: any) => {
        // marketValue n'existe pas dans le modèle Player, on utilise une valeur par défaut
        const value = p.marketValue ? parseFloat(String(p.marketValue).replace(/[^0-9.]/g, '')) : 0;
        return sum + value;
      }, 0);

      const totalAge = players.reduce((sum: number, p: any) => sum + (p.age || 0), 0);

      const byPosition = players.reduce((acc: Record<string, number>, p: any) => {
        const pos = p.position || 'Unknown';
        acc[pos] = (acc[pos] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalPlayers: players.length,
        availablePlayers: availablePlayers.length,
        totalValue: `€${(totalValue / 1000000).toFixed(1)}M`,
        averageAge: players.length ? Math.round(totalAge / players.length) : 0,
        byPosition
      });

      logger.info('Market stats calculated', {
        total: players.length,
        available: availablePlayers.length
      });
    } catch (err) {
      logger.error('market', 'Failed to fetch market stats', {
        error: (err as Error)?.message,
      });
      setError('Failed to load market statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh
  };
};
