import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { logger, logError } from '../utils/logger';

export interface AnalyticsData {
  overview: {
    totalPlayers: number;
    totalClubs: number;
    totalReports: number;
    totalEvents: number;
    activeScouts: number;
    pendingRequests: number;
  };
  playerStats: {
    byPosition: Record<string, number>;
    byStatus: Record<string, number>;
    topRated: any[];
    recentSignings: any[];
  };
  clubStats: {
    byCountry: Record<string, number>;
    topActiveClubs: any[];
  };
  trends: {
    labels: string[];
    players: number[];
    reports: number[];
    activities: number[];
  };
}

export const useAnalytics = (period: 'week' | 'month' | 'year' = 'month') => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getPeriodDays = (period: 'week' | 'month' | 'year'): number => {
    switch (period) {
      case 'week': return 7;
      case 'month': return 30;
      case 'year': return 365;
      default: return 30;
    }
  };

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [overview, playerStats, clubStats, reportStats, trends] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getPlayersAnalytics(),
        api.getClubsAnalytics(),
        api.getScoutingReportsAnalytics(),
        api.getActivityTrends(getPeriodDays(period))
      ]);

      logger.info('Analytics data fetched successfully', {
        overview: !!overview,
        playerStats: !!playerStats,
        clubStats: !!clubStats,
        trends: !!trends
      });

      setData({
        overview: {
          totalPlayers: overview?.totalPlayers || 0,
          totalClubs: overview?.totalClubs || 0,
          totalReports: overview?.totalReports || 0,
          totalEvents: overview?.totalEvents || 0,
          activeScouts: overview?.activeScouts || 0,
          pendingRequests: overview?.pendingRequests || 0
        },
        playerStats: {
          byPosition: playerStats?.byPosition || {},
          byStatus: playerStats?.byStatus || {},
          topRated: playerStats?.topRated || [],
          recentSignings: playerStats?.recentSignings || []
        },
        clubStats: {
          byCountry: clubStats?.byCountry || {},
          topActiveClubs: clubStats?.topActiveClubs || []
        },
        trends: {
          labels: trends?.labels || [],
          players: trends?.players || [],
          reports: trends?.reports || [],
          activities: trends?.activities || []
        }
      });
    } catch (err) {
      logError('Failed to fetch analytics data', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refresh = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refresh,
    period
  };
};