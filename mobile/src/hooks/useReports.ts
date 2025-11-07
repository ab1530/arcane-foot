import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { logger, logError } from '../utils/logger';

export interface Report {
  id: string;
  playerId: string;
  player?: {
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  matchId?: string;
  match?: {
    homeClub?: { name: string };
    awayClub?: { name: string };
    date: string;
  };
  createdAt: string;
  updatedAt: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  overallRating?: number;
  recommendation?: string;
  scoutId: string;
  scout?: {
    firstName: string;
    lastName: string;
  };
}

export interface ReportsFilters {
  status?: string;
  search?: string;
  scoutId?: string;
  playerId?: string;
  matchId?: string;
}

export const useReports = (initialFilters?: ReportsFilters) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportsFilters>(initialFilters || {});
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getScoutingReports();

      logger.info('Reports fetched', {
        count: response?.length || 0,
        filters
      });

      let filteredReports = response || [];

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        filteredReports = filteredReports.filter((r: Report) => r.status === filters.status);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredReports = filteredReports.filter((r: Report) =>
          r.player?.user?.firstName?.toLowerCase().includes(searchLower) ||
          r.player?.user?.lastName?.toLowerCase().includes(searchLower) ||
          r.match?.homeClub?.name?.toLowerCase().includes(searchLower) ||
          r.match?.awayClub?.name?.toLowerCase().includes(searchLower)
        );
      }

      if (filters.scoutId) {
        filteredReports = filteredReports.filter((r: Report) => r.scoutId === filters.scoutId);
      }

      if (filters.playerId) {
        filteredReports = filteredReports.filter((r: Report) => r.playerId === filters.playerId);
      }

      if (filters.matchId) {
        filteredReports = filteredReports.filter((r: Report) => r.matchId === filters.matchId);
      }

      setReports(filteredReports);
    } catch (err) {
      logError('Failed to fetch reports', err);
      setError('Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateFilters = useCallback((newFilters: ReportsFilters) => {
    setFilters(newFilters);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
  }, [fetchReports]);

  const createReport = useCallback(async (reportData: any) => {
    try {
      const response = await api.createScoutingReport(reportData);
      logger.info('Report created', { id: response.id });
      await fetchReports(); // Refresh the list
      return response;
    } catch (err) {
      logError('Failed to create report', err);
      throw err;
    }
  }, [fetchReports]);

  const updateReport = useCallback(async (reportId: string, updates: any) => {
    try {
      const response = await api.updateScoutingReport(reportId, updates);
      logger.info('Report updated', { id: reportId });
      await fetchReports(); // Refresh the list
      return response;
    } catch (err) {
      logError('Failed to update report', err);
      throw err;
    }
  }, [fetchReports]);

  const deleteReport = useCallback(async (reportId: string) => {
    try {
      await api.deleteScoutingReport(reportId);
      logger.info('Report deleted', { id: reportId });
      await fetchReports(); // Refresh the list
    } catch (err) {
      logError('Failed to delete report', err);
      throw err;
    }
  }, [fetchReports]);

  const getReportById = useCallback((reportId: string) => {
    return reports.find(r => r.id === reportId);
  }, [reports]);

  const getReportStats = useCallback(() => {
    const total = reports.length;
    const draft = reports.filter(r => r.status === 'DRAFT').length;
    const submitted = reports.filter(r => r.status === 'SUBMITTED').length;
    const approved = reports.filter(r => r.status === 'APPROVED').length;
    const rejected = reports.filter(r => r.status === 'REJECTED').length;

    return {
      total,
      draft,
      submitted,
      approved,
      rejected,
      approvalRate: total > 0 ? (approved / total) * 100 : 0
    };
  }, [reports]);

  return {
    reports,
    loading,
    error,
    refreshing,
    filters,
    updateFilters,
    refresh,
    createReport,
    updateReport,
    deleteReport,
    getReportById,
    getReportStats
  };
};