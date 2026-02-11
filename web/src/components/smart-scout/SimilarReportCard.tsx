"use client";

import { motion } from "framer-motion";
import { User, TrendingUp, Calendar, MapPin } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import type { SimilarReport } from "@/types/smart-scout";
import { cn } from "@/lib/utils";

interface SimilarReportCardProps {
  report: SimilarReport;
  similarity: number;
  onClick: () => void;
}

export function SimilarReportCard({ report, similarity, onClick }: SimilarReportCardProps) {
  const playerName = `${report.player.firstName || ''} ${report.player.lastName || ''}`.trim() ||
    report.player.name;

  const similarityPercentage = Math.round(similarity * 100);
  const similarityColor =
    similarityPercentage >= 80 ? "text-green-400" :
    similarityPercentage >= 60 ? "text-arcane-accent" :
    "text-orange-400";

  const formattedDate = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <GlassCard
        variant="bordered"
        className="cursor-pointer hover:border-arcane-accent/40 transition-all duration-300"
        onClick={onClick}
        noPadding
      >
        <div className="p-4">
          {/* Header: Player & Similarity */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white truncate mb-1">
                {playerName}
              </h4>
              <div className="flex items-center gap-2 text-xs text-arcane-grey">
                <span className="font-medium">{report.player.position || 'N/A'}</span>
                {report.player.club && (
                  <>
                    <span>•</span>
                    <span className="truncate">{report.player.club}</span>
                  </>
                )}
              </div>
            </div>

            {/* Similarity Badge */}
            <div className="flex flex-col items-end ml-2">
              <div className={cn(
                "text-2xl font-bold",
                similarityColor
              )}>
                {similarityPercentage}%
              </div>
              <span className="text-xs text-arcane-grey">match</span>
            </div>
          </div>

          {/* Ratings Preview */}
          {report.excerpts && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {report.excerpts.technicalRating !== undefined && (
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-arcane-accent" />
                  <span className="text-arcane-grey">Tech:</span>
                  <span className="text-white font-semibold">{report.excerpts.technicalRating}/10</span>
                </div>
              )}
              {report.excerpts.tacticalRating !== undefined && (
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="text-arcane-grey">Tact:</span>
                  <span className="text-white font-semibold">{report.excerpts.tacticalRating}/10</span>
                </div>
              )}
              {report.excerpts.physicalRating !== undefined && (
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-arcane-grey">Phys:</span>
                  <span className="text-white font-semibold">{report.excerpts.physicalRating}/10</span>
                </div>
              )}
              {report.excerpts.mentalRating !== undefined && (
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span className="text-arcane-grey">Ment:</span>
                  <span className="text-white font-semibold">{report.excerpts.mentalRating}/10</span>
                </div>
              )}
            </div>
          )}

          {/* Excerpts */}
          {(report.excerpts?.strengths || report.excerpts?.weaknesses) && (
            <div className="space-y-2 mb-3">
              {report.excerpts.strengths && (
                <div className="text-xs">
                  <span className="text-green-400 font-semibold">Strengths: </span>
                  <span className="text-arcane-grey line-clamp-1">
                    {report.excerpts.strengths}
                  </span>
                </div>
              )}
              {report.excerpts.weaknesses && (
                <div className="text-xs">
                  <span className="text-orange-400 font-semibold">Weaknesses: </span>
                  <span className="text-arcane-grey line-clamp-1">
                    {report.excerpts.weaknesses}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Summary Excerpt */}
          {report.excerpts?.summary && (
            <p className="text-xs text-arcane-grey line-clamp-2 mb-3 italic">
              "{report.excerpts.summary}"
            </p>
          )}

          {/* Footer: Scout & Date */}
          <div className="flex items-center justify-between text-xs text-arcane-grey pt-3 border-t border-arcane-darkBorder">
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3" />
              <span>{report.scoutName || 'Unknown Scout'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Hover Glow Effect */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-1 rounded-b-lg transition-opacity duration-300 opacity-0 group-hover:opacity-100",
            similarityPercentage >= 80 ? "bg-gradient-to-r from-green-400/50 to-arcane-accent/50" :
            similarityPercentage >= 60 ? "bg-gradient-to-r from-arcane-accent/50 to-blue-400/50" :
            "bg-gradient-to-r from-orange-400/50 to-red-400/50"
          )}
        />
      </GlassCard>
    </motion.div>
  );
}
