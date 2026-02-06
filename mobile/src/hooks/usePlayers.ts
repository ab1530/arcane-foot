import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Player } from '../types';

export const usePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlayers = useCallback(async (options?: { background?: boolean }) => {
    try {
      setError(null);
      if (!options?.background) {
        setLoading(true);
      }
      const result = await api.getPlayers();
      const list = result.items ?? result.data ?? result ?? [];
      setPlayers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError(err as Error);
      setPlayers([]);
    } finally {
      if (!options?.background) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchPlayers({ background: true });
  }, [fetchPlayers]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return {
    players,
    loading,
    refreshing,
    error,
    refresh,
  };
};
