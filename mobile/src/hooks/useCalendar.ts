import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { logger, logError } from '../utils/logger';

export interface Match {
  id: string;
  date: string;
  time?: string;
  homeClub?: {
    id: string;
    name: string;
    logo?: string;
  };
  awayClub?: {
    id: string;
    name: string;
    logo?: string;
  };
  venue?: {
    name: string;
    city: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  competition?: {
    name: string;
  };
  status?: string;
  assignments?: Array<{
    scoutId: string;
    scout?: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export interface CalendarFilters {
  startDate?: Date;
  endDate?: Date;
  clubId?: string;
  competitionId?: string;
  status?: string;
  viewMode?: 'list' | 'week' | 'month' | 'map';
}

export const useCalendar = (initialFilters?: CalendarFilters) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>(initialFilters || {});
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getMatches();

      logger.info('Matches fetched', {
        count: response?.length || 0,
        filters
      });

      let filteredMatches = response || [];

      // Apply filters
      if (filters.startDate) {
        filteredMatches = filteredMatches.filter((m: Match) =>
          new Date(m.date) >= filters.startDate!
        );
      }

      if (filters.endDate) {
        filteredMatches = filteredMatches.filter((m: Match) =>
          new Date(m.date) <= filters.endDate!
        );
      }

      if (filters.clubId) {
        filteredMatches = filteredMatches.filter((m: Match) =>
          m.homeClub?.id === filters.clubId || m.awayClub?.id === filters.clubId
        );
      }

      if (filters.status) {
        filteredMatches = filteredMatches.filter((m: Match) => m.status === filters.status);
      }

      // Sort by date
      filteredMatches.sort((a: Match, b: Match) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setMatches(filteredMatches);
    } catch (err) {
      logError('Failed to fetch matches', err);
      setError('Failed to load calendar');
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const updateFilters = useCallback((newFilters: CalendarFilters) => {
    setFilters(newFilters);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
  }, [fetchMatches]);

  const getMatchesForDate = useCallback((date: Date) => {
    return matches.filter(match => {
      const matchDate = new Date(match.date);
      return matchDate.getDate() === date.getDate() &&
             matchDate.getMonth() === date.getMonth() &&
             matchDate.getFullYear() === date.getFullYear();
    });
  }, [matches]);

  const getMatchesForWeek = useCallback((startDate: Date) => {
    const weekDates = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    return matches.filter(match => {
      const matchDate = new Date(match.date);
      return matchDate >= startDate && matchDate <= endDate;
    });
  }, [matches]);

  const getMatchesForMonth = useCallback((month: number, year: number) => {
    return matches.filter(match => {
      const matchDate = new Date(match.date);
      return matchDate.getMonth() === month && matchDate.getFullYear() === year;
    });
  }, [matches]);

  const getUpcomingMatches = useCallback((limit: number = 10) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return matches
      .filter(match => new Date(match.date) >= today)
      .slice(0, limit);
  }, [matches]);

  const getPastMatches = useCallback((limit: number = 10) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return matches
      .filter(match => new Date(match.date) < today)
      .reverse()
      .slice(0, limit);
  }, [matches]);

  const getMatchesWithLocation = useCallback(() => {
    return matches.filter(match =>
      match.venue?.latitude && match.venue?.longitude
    );
  }, [matches]);

  const getMatchStats = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = matches.filter(m => new Date(m.date) >= today).length;
    const past = matches.filter(m => new Date(m.date) < today).length;
    const thisWeek = getMatchesForWeek(today).length;

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const thisMonth = getMatchesForMonth(today.getMonth(), today.getFullYear()).length;
    const nextMonthCount = getMatchesForMonth(nextMonth.getMonth(), nextMonth.getFullYear()).length;

    return {
      total: matches.length,
      upcoming,
      past,
      thisWeek,
      thisMonth,
      nextMonth: nextMonthCount
    };
  }, [matches, getMatchesForWeek, getMatchesForMonth]);

  return {
    matches,
    loading,
    error,
    refreshing,
    filters,
    updateFilters,
    refresh,
    getMatchesForDate,
    getMatchesForWeek,
    getMatchesForMonth,
    getUpcomingMatches,
    getPastMatches,
    getMatchesWithLocation,
    getMatchStats
  };
};