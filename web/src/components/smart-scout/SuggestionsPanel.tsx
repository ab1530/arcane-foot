"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { SimilarReportCard } from "./SimilarReportCard";
import { smartScoutApi } from "@/lib/api/smart-scout";
import type { PartialReport, ReportContext, SimilarReport } from "@/types/smart-scout";
import { cn } from "@/lib/utils";

interface SuggestionsPanelProps {
  onReportSelect: (reportId: string) => void;
}

export function SuggestionsPanel({ onReportSelect }: SuggestionsPanelProps) {
  const [partialReport, setPartialReport] = useState<PartialReport>({});
  const [similarReports, setSimilarReports] = useState<SimilarReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usingAI, setUsingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const positions = [
    "Goalkeeper", "Right Back", "Center Back", "Left Back",
    "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder",
    "Right Winger", "Left Winger", "Striker"
  ];

  // Fetch suggestions when partial report changes
  useEffect(() => {
    const hasData =
      partialReport.playerPosition ||
      partialReport.technicalRating ||
      partialReport.tacticalRating ||
      partialReport.physicalRating ||
      partialReport.mentalRating ||
      partialReport.strengths ||
      partialReport.weaknesses;

    if (!hasData) {
      setSimilarReports([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await smartScoutApi.getSuggestions(partialReport, {});
        setSimilarReports(response.similarReports || []);
        setUsingAI(response.usingAI);
      } catch (err: any) {
        console.error('Error fetching suggestions:', err);
        setError(err.message || 'Failed to fetch suggestions');
        setSimilarReports([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [partialReport]);

  const handleRatingChange = (field: keyof PartialReport, value: number) => {
    setPartialReport(prev => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setPartialReport({});
    setSimilarReports([]);
    setError(null);
  };

  return (
    <GlassCard variant="elevated" className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-arcane-accent" />
          <h2 className="text-xl font-bold text-white">Smart Suggestions</h2>
        </div>
        {usingAI && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 text-xs bg-arcane-accent/20 text-arcane-accent px-3 py-1.5 rounded-full font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Active
          </motion.span>
        )}
      </div>

      {/* Partial Report Form */}
      <div className="space-y-4 mb-6">
        {/* Position Select */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Position
          </label>
          <select
            value={partialReport.playerPosition || ''}
            onChange={(e) => setPartialReport(prev => ({ ...prev, playerPosition: e.target.value }))}
            className="w-full bg-arcane-darkCard/60 border border-arcane-darkBorder rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arcane-accent/50 focus:border-arcane-accent transition-all"
          >
            <option value="">Select position...</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        {/* Ratings */}
        <div className="grid grid-cols-2 gap-3">
          {/* Technical Rating */}
          <div>
            <label className="block text-xs font-semibold text-arcane-grey mb-1.5">
              Technical
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={partialReport.technicalRating || ''}
              onChange={(e) => handleRatingChange('technicalRating', parseFloat(e.target.value))}
              placeholder="1-10"
              className="w-full bg-arcane-darkCard/60 border border-arcane-darkBorder rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arcane-accent/50 focus:border-arcane-accent transition-all"
            />
          </div>

          {/* Tactical Rating */}
          <div>
            <label className="block text-xs font-semibold text-arcane-grey mb-1.5">
              Tactical
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={partialReport.tacticalRating || ''}
              onChange={(e) => handleRatingChange('tacticalRating', parseFloat(e.target.value))}
              placeholder="1-10"
              className="w-full bg-arcane-darkCard/60 border border-arcane-darkBorder rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arcane-accent/50 focus:border-arcane-accent transition-all"
            />
          </div>

          {/* Physical Rating */}
          <div>
            <label className="block text-xs font-semibold text-arcane-grey mb-1.5">
              Physical
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={partialReport.physicalRating || ''}
              onChange={(e) => handleRatingChange('physicalRating', parseFloat(e.target.value))}
              placeholder="1-10"
              className="w-full bg-arcane-darkCard/60 border border-arcane-darkBorder rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arcane-accent/50 focus:border-arcane-accent transition-all"
            />
          </div>

          {/* Mental Rating */}
          <div>
            <label className="block text-xs font-semibold text-arcane-grey mb-1.5">
              Mental
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={partialReport.mentalRating || ''}
              onChange={(e) => handleRatingChange('mentalRating', parseFloat(e.target.value))}
              placeholder="1-10"
              className="w-full bg-arcane-darkCard/60 border border-arcane-darkBorder rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arcane-accent/50 focus:border-arcane-accent transition-all"
            />
          </div>
        </div>

        {/* Strengths */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Strengths (optional)
          </label>
          <textarea
            value={partialReport.strengths || ''}
            onChange={(e) => setPartialReport(prev => ({ ...prev, strengths: e.target.value }))}
            placeholder="Enter key strengths..."
            rows={2}
            className="w-full bg-arcane-darkCard/60 border border-arcane-darkBorder rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arcane-accent/50 focus:border-arcane-accent transition-all resize-none"
          />
        </div>

        {/* Weaknesses */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Weaknesses (optional)
          </label>
          <textarea
            value={partialReport.weaknesses || ''}
            onChange={(e) => setPartialReport(prev => ({ ...prev, weaknesses: e.target.value }))}
            placeholder="Enter key weaknesses..."
            rows={2}
            className="w-full bg-arcane-darkCard/60 border border-arcane-darkBorder rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arcane-accent/50 focus:border-arcane-accent transition-all resize-none"
          />
        </div>

        {/* Clear Button */}
        {Object.keys(partialReport).length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="w-full"
          >
            Clear Form
          </Button>
        )}
      </div>

      {/* Similar Reports List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-arcane-accent" />
            Similar Reports
            {similarReports.length > 0 && (
              <span className="text-arcane-grey">({similarReports.length})</span>
            )}
          </h3>
          {isLoading && (
            <Loader2 className="w-4 h-4 text-arcane-accent animate-spin" />
          )}
        </div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Error</p>
              <p className="text-xs text-red-300 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Reports List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-arcane-accent/20 scrollbar-track-transparent">
          <AnimatePresence mode="popLayout">
            {similarReports.length === 0 && !isLoading && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <Sparkles className="w-12 h-12 text-arcane-grey/30 mx-auto mb-4" />
                <p className="text-sm text-arcane-grey">
                  Enter report details above to find similar reports
                </p>
              </motion.div>
            )}

            {similarReports.map((report, index) => (
              <motion.div
                key={report.reportId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <SimilarReportCard
                  report={report}
                  similarity={report.similarity}
                  onClick={() => onReportSelect(report.reportId)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  );
}
