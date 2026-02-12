"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { smartScoutApi } from "@/lib/api/smart-scout";
import type { PlayerInsights as PlayerInsightsType, Player } from "@/types/smart-scout";
import { cn } from "@/lib/utils";

interface PlayerInsightsProps {
  players: Player[];
}

export function PlayerInsights({ players }: PlayerInsightsProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [insights, setInsights] = useState<PlayerInsightsType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPlayerId) {
      setInsights(null);
      return;
    }

    const fetchInsights = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await smartScoutApi.getInsights(selectedPlayerId);
        setInsights(data);
      } catch (err: any) {
        console.error('Error fetching insights:', err);
        setError(err.message || 'Failed to fetch insights');
        setInsights(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [selectedPlayerId]);

  const consensusPercentage = insights?.consensus?.percentage || 0;
  const consensusColor =
    consensusPercentage >= 80 ? "text-green-400" :
    consensusPercentage >= 60 ? "text-arcane-accent" :
    consensusPercentage >= 40 ? "text-orange-400" :
    "text-red-400";

  const TrendIcon = ({ trend }: { trend: 'improving' | 'declining' | 'stable' }) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <GlassCard variant="elevated" className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-arcane-accent" />
          <h2 className="text-xl font-bold text-white">Player Insights</h2>
        </div>
        {insights?.usingAI && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 text-xs bg-arcane-accent/20 text-arcane-accent px-3 py-1.5 rounded-full font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Generated
          </motion.span>
        )}
      </div>

      {/* Player Select */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-white mb-2">
          Select Player
        </label>
        <select
          value={selectedPlayerId}
          onChange={(e) => setSelectedPlayerId(e.target.value)}
          className="w-full bg-arcane-darkCard/60 border border-arcane-darkBorder rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arcane-accent/50 focus:border-arcane-accent transition-all"
          disabled={isLoading}
        >
          <option value="">Choose a player...</option>
          {players.map(player => (
            <option key={player.id} value={player.id}>
              {player.fullName || `${player.firstName} ${player.lastName}`}
              {player.position && ` - ${player.position}`}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-arcane-accent animate-spin mx-auto mb-4" />
            <p className="text-sm text-arcane-grey">Analyzing player data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Error</p>
            <p className="text-xs text-red-300 mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!selectedPlayerId && !isLoading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="w-12 h-12 text-arcane-grey/30 mx-auto mb-4" />
            <p className="text-sm text-arcane-grey">
              Select a player to view AI-powered insights
            </p>
          </div>
        </div>
      )}

      {/* Insights Content */}
      {insights && !isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-arcane-accent/20 scrollbar-track-transparent"
        >
          {/* AI Summary */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-arcane-accent" />
              AI Analysis
            </h3>
            <div className="bg-arcane-darkCard/40 border border-arcane-accent/20 rounded-lg p-4">
              <p className="text-sm text-arcane-grey leading-relaxed whitespace-pre-wrap">
                {insights.insights}
              </p>
            </div>
          </div>

          {/* Average Ratings */}
          {insights.averageRatings && (
            <div>
              <h3 className="text-sm font-bold text-white mb-3">Average Ratings</h3>
              <div className="grid grid-cols-2 gap-3">
                {insights.averageRatings.technical !== undefined && (
                  <div className="bg-arcane-darkCard/40 border border-arcane-darkBorder rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-arcane-grey">Technical</span>
                      <span className="text-lg font-bold text-arcane-accent">
                        {insights.averageRatings.technical.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-arcane-dark rounded-full h-1.5 mt-2">
                      <div
                        className="bg-arcane-accent rounded-full h-1.5 transition-all"
                        style={{ width: `${(insights.averageRatings.technical / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {insights.averageRatings.tactical !== undefined && (
                  <div className="bg-arcane-darkCard/40 border border-arcane-darkBorder rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-arcane-grey">Tactical</span>
                      <span className="text-lg font-bold text-blue-400">
                        {insights.averageRatings.tactical.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-arcane-dark rounded-full h-1.5 mt-2">
                      <div
                        className="bg-blue-400 rounded-full h-1.5 transition-all"
                        style={{ width: `${(insights.averageRatings.tactical / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {insights.averageRatings.physical !== undefined && (
                  <div className="bg-arcane-darkCard/40 border border-arcane-darkBorder rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-arcane-grey">Physical</span>
                      <span className="text-lg font-bold text-green-400">
                        {insights.averageRatings.physical.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-arcane-dark rounded-full h-1.5 mt-2">
                      <div
                        className="bg-green-400 rounded-full h-1.5 transition-all"
                        style={{ width: `${(insights.averageRatings.physical / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {insights.averageRatings.mental !== undefined && (
                  <div className="bg-arcane-darkCard/40 border border-arcane-darkBorder rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-arcane-grey">Mental</span>
                      <span className="text-lg font-bold text-purple-400">
                        {insights.averageRatings.mental.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-arcane-dark rounded-full h-1.5 mt-2">
                      <div
                        className="bg-purple-400 rounded-full h-1.5 transition-all"
                        style={{ width: `${(insights.averageRatings.mental / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trends */}
          {insights.trends && (
            <div>
              <h3 className="text-sm font-bold text-white mb-3">Performance Trends</h3>
              <div className="space-y-3">
                {/* Improving */}
                {insights.trends.improving && insights.trends.improving.length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendIcon trend="improving" />
                      <span className="text-sm font-semibold text-green-400">Improving</span>
                    </div>
                    <ul className="space-y-1">
                      {insights.trends.improving.map((item, index) => (
                        <li key={index} className="text-xs text-green-300 flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Declining */}
                {insights.trends.declining && insights.trends.declining.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendIcon trend="declining" />
                      <span className="text-sm font-semibold text-red-400">Declining</span>
                    </div>
                    <ul className="space-y-1">
                      {insights.trends.declining.map((item, index) => (
                        <li key={index} className="text-xs text-red-300 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Stable */}
                {insights.trends.stable && insights.trends.stable.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendIcon trend="stable" />
                      <span className="text-sm font-semibold text-blue-400">Stable</span>
                    </div>
                    <ul className="space-y-1">
                      {insights.trends.stable.map((item, index) => (
                        <li key={index} className="text-xs text-blue-300 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scout Consensus */}
          {insights.consensus && (
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-arcane-accent" />
                Scout Consensus
              </h3>
              <div className="bg-arcane-darkCard/40 border border-arcane-darkBorder rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-arcane-grey">Agreement Rate</span>
                  <span className={cn("text-2xl font-bold", consensusColor)}>
                    {consensusPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-arcane-dark rounded-full h-2 mb-3">
                  <div
                    className={cn(
                      "rounded-full h-2 transition-all",
                      consensusPercentage >= 80 ? "bg-green-400" :
                      consensusPercentage >= 60 ? "bg-arcane-accent" :
                      consensusPercentage >= 40 ? "bg-orange-400" :
                      "bg-red-400"
                    )}
                    style={{ width: `${consensusPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-arcane-grey">
                  Based on {insights.consensus.total} report{insights.consensus.total !== 1 ? 's' : ''}
                  {insights.reportCount && ` (${insights.reportCount} total)`}
                </p>
              </div>
            </div>
          )}

          {/* Generated Timestamp */}
          <div className="text-xs text-arcane-grey text-center pt-4 border-t border-arcane-darkBorder">
            Generated {new Date(insights.generatedAt).toLocaleString()}
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
}
