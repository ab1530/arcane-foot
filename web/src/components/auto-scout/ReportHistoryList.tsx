'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Trash2, Download, Filter, Calendar, User } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { QualityScoreBadge } from './QualityScoreBadge';
import { ReportHistory } from '@/types/auto-scout';

interface ReportHistoryListProps {
  playerId?: string;
  onViewReport?: (report: ReportHistory) => void;
}

export function ReportHistoryList({ playerId, onViewReport }: ReportHistoryListProps) {
  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadReports();
  }, [playerId]);

  const loadReports = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockReports: ReportHistory[] = [
        {
          id: '1',
          playerId: 'player-1',
          playerName: 'Example Player',
          reportType: 'SEASON_OVERVIEW',
          qualityScore: {
            total: 85,
            grade: 'A',
            breakdown: {
              dataCompleteness: 90,
              insightDepth: 85,
              technicalAccuracy: 80,
              actionability: 85,
            },
          },
          generatedAt: new Date().toISOString(),
          scoutName: 'AI Scout',
          isOfficial: true,
        },
      ];
      setReports(mockReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load report history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      // await apiClient.deleteAutoScoutReport(reportId);
      setReports(reports.filter((r) => r.id !== reportId));
      toast.success('Report deleted successfully');
    } catch (error) {
      console.error('Failed to delete report:', error);
      toast.error('Failed to delete report');
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filterGrade !== 'all' && report.qualityScore.grade !== filterGrade) {
      return false;
    }
    if (filterType !== 'all' && report.reportType !== filterType) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-[#E4FF3B] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 mt-4">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Report History
          </h2>
          <p className="text-gray-400">
            View and manage previously generated AI reports
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />

          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-[#E4FF3B]"
          >
            <option value="all">All Grades</option>
            <option value="S">S Grade</option>
            <option value="A">A Grade</option>
            <option value="B">B Grade</option>
            <option value="C">C Grade</option>
            <option value="D">D Grade</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-[#E4FF3B]"
          >
            <option value="all">All Types</option>
            <option value="MATCH_PERFORMANCE">Match Performance</option>
            <option value="SEASON_OVERVIEW">Season Overview</option>
            <option value="TRANSFER_TARGET">Transfer Target</option>
            <option value="YOUTH_PROSPECT">Youth Prospect</option>
            <option value="QUICK_SCAN">Quick Scan</option>
          </select>
        </div>
      </div>

      {/* Reports list */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No reports found</p>
          {(filterGrade !== 'all' || filterType !== 'all') && (
            <button
              onClick={() => {
                setFilterGrade('all');
                setFilterType('all');
              }}
              className="mt-4 text-[#E4FF3B] hover:underline"
            >
              Clear filters
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
                        Official
                      </span>
                    )}
                  </div>

                  {/* Report type */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#E4FF3B]/20 border border-[#E4FF3B]/30 text-[#E4FF3B] text-xs font-semibold">
                      {report.reportType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onViewReport?.(report)}
                      className="px-4 py-2 rounded-lg bg-[#E4FF3B] text-black font-semibold text-sm hover:bg-[#d4ef2b] transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Report
                    </button>

                    <button
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>

                    <button
                      onClick={() => handleDelete(report.id)}
                      className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination placeholder */}
      {filteredReports.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors">
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-400">
            Page 1 of 1
          </span>
          <button className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
