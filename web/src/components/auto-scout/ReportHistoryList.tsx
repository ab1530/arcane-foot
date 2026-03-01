'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye, Trash2, Download, Filter, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/language-context';
import { apiClient } from '@/lib/api-client';
import { QualityScoreBadge } from './QualityScoreBadge';
import { ReportHistory } from '@/types/auto-scout';

interface ReportHistoryListProps {
  playerId?: string;
  onViewReport?: (report: ReportHistory) => void;
}

type GradeFilter = 'all' | ReportHistory['qualityScore']['grade'];
type TypeFilter =
  | 'all'
  | 'MATCH_PERFORMANCE'
  | 'SEASON_OVERVIEW'
  | 'TRANSFER_TARGET'
  | 'YOUTH_PROSPECT'
  | 'QUICK_SCAN';

export function ReportHistoryList({ playerId, onViewReport }: ReportHistoryListProps) {
  const { dictionary } = useLanguage();
  const historyCopy = dictionary.autoScout.history;
  const filtersCopy = historyCopy.filters;
  const actionsCopy = historyCopy.actions;

  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPlayerContext, setHasPlayerContext] = useState(true);
  const [fallbackPlayerId, setFallbackPlayerId] = useState<string | null>(null);
  const [filterGrade, setFilterGrade] = useState<GradeFilter>('all');
  const [filterType, setFilterType] = useState<TypeFilter>('all');

  const gradeOptions = useMemo(() => Object.entries(filtersCopy.grades), [filtersCopy.grades]);
  const typeOptions = useMemo(() => Object.entries(filtersCopy.types), [filtersCopy.types]);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);

      // If playerId is provided, get history for that specific player
      if (playerId) {
        setHasPlayerContext(true);
        const historyResponse = await apiClient.getPlayerAutoScoutHistory(playerId);
        setReports(historyResponse?.data ?? []);
      } else {
        // Otherwise, get ALL reports for the current user
        setHasPlayerContext(true);
        const historyResponse = await apiClient.getAllAutoScoutHistory();
        setReports(historyResponse?.data ?? []);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error(historyCopy.toasts.loadError);
    } finally {
      setLoading(false);
    }
  }, [playerId, historyCopy.toasts.loadError]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDelete = async (reportId: string) => {
    if (!confirm(historyCopy.confirmations.delete)) return;

    try {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      toast.success(historyCopy.toasts.deleteSuccess);
    } catch (error) {
      console.error('Failed to delete report:', error);
      toast.error(historyCopy.toasts.deleteError);
    }
  };

  const handleExportPlaceholder = () => {
    toast.info(historyCopy.toasts.exportPlaceholder);
  };

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (filterGrade !== 'all' && report.qualityScore.grade !== filterGrade) {
        return false;
      }
      if (filterType !== 'all' && report.reportType !== filterType) {
        return false;
      }
      return true;
    });
  }, [reports, filterGrade, filterType]);

  const hasFiltersApplied = filterGrade !== 'all' || filterType !== 'all';

  const getReportTypeLabel = useCallback(
    (type: string) =>
      filtersCopy.types[type as keyof typeof filtersCopy.types] ?? type.replace(/_/g, ' '),
    [filtersCopy.types],
  );

  const resetFilters = () => {
    setFilterGrade('all');
    setFilterType('all');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-[#e6ff3c] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 mt-4">{historyCopy.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {historyCopy.title}
          </h2>
          <p className="text-gray-400">
            {historyCopy.subtitle}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />

          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value as GradeFilter)}
            className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e6ff3c]"
          >
            {gradeOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TypeFilter)}
            className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e6ff3c]"
          >
            {typeOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {!hasPlayerContext ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-white">{historyCopy.noPlayer.title}</h3>
          <p className="text-gray-400 mt-2">{historyCopy.noPlayer.description}</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">{historyCopy.empty.title}</p>
          <p className="text-sm text-gray-500 mt-2">{historyCopy.empty.description}</p>
          {hasFiltersApplied && (
            <button
              onClick={resetFilters}
              className="mt-4 text-[#e6ff3c] hover:underline"
            >
              {filtersCopy.reset}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-start gap-6">
                {/* Quality score */}
                <div className="flex-shrink-0">
                  <QualityScoreBadge qualityScore={report.qualityScore} size="sm" />
                </div>

                {/* Report info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {report.playerName}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(report.generatedAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {report.scoutName}
                        </span>
                      </div>
                    </div>

                    {/* Status badge */}
                    {report.isOfficial && (
                      <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold">
                        {historyCopy.badge.official}
                      </span>
                    )}
                  </div>

                  {/* Report type */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#e6ff3c]/20 border border-[#e6ff3c]/30 text-[#e6ff3c] text-xs font-semibold">
                      {getReportTypeLabel(report.reportType)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onViewReport?.(report)}
                      disabled={!onViewReport}
                      className="px-4 py-2 rounded-lg bg-[#e6ff3c] text-black font-semibold text-sm hover:bg-[#d8f14e] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Eye className="w-4 h-4" />
                      {actionsCopy.view}
                    </button>

                    <button
                      onClick={handleExportPlaceholder}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {actionsCopy.export}
                    </button>

                    <button
                      onClick={() => handleDelete(report.id)}
                      className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {actionsCopy.delete}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
