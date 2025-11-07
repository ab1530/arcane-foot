"use client";

import { motion } from 'framer-motion';
import { Users, TrendingUp, ExternalLink } from 'lucide-react';
import { ComparablePlayer } from '@/types/market-value';
import { useRouter } from 'next/navigation';

interface ComparablePlayersProps {
  players: ComparablePlayer[];
  className?: string;
  onPlayerClick?: (playerId: string) => void;
}

export function ComparablePlayers({ players, className = '', onPlayerClick }: ComparablePlayersProps) {
  const router = useRouter();

  const handlePlayerClick = (playerId?: string) => {
    if (playerId && onPlayerClick) {
      onPlayerClick(playerId);
    }
  };

  // Get similarity color
  const getSimilarityColor = (score: number) => {
    if (score >= 0.9) return 'text-green-400';
    if (score >= 0.8) return 'text-yellow-400';
    return 'text-orange-400';
  };

  // Get similarity badge
  const getSimilarityBadge = (score: number) => {
    if (score >= 0.9) return 'Very Similar';
    if (score >= 0.8) return 'Similar';
    return 'Somewhat Similar';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-arcane-darkBorder/20 backdrop-blur-sm border border-arcane-darkBorder/50 rounded-xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Users className="h-5 w-5 text-arcane-accent" />
          Comparable Players
        </h3>
        <div className="text-xs text-arcane-grey">
          Top {players.length} Similar
        </div>
      </div>

      {/* Players List */}
      <div className="space-y-3">
        {players.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-arcane-grey mx-auto mb-3" />
            <p className="text-arcane-grey text-sm">No comparable players found</p>
          </div>
        ) : (
          players.map((player, index) => (
            <motion.div
              key={player.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handlePlayerClick(player.id)}
              className={`group bg-arcane-darkBorder/30 rounded-lg p-4 border border-arcane-darkBorder/50 transition-all hover:border-arcane-accent/50 hover:bg-arcane-darkBorder/50 ${player.id ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-center justify-between">
                {/* Player Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-white group-hover:text-arcane-accent transition-colors">
                      {player.name}
                    </span>
                    {player.id && (
                      <ExternalLink className="h-3 w-3 text-arcane-grey opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-arcane-grey">
                    <span>{player.position}</span>
                    <span>•</span>
                    <span>{player.age} years</span>
                    {player.club && (
                      <>
                        <span>•</span>
                        <span>{player.club}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Value and Similarity */}
                <div className="flex items-center gap-4">
                  {/* Market Value */}
                  <div className="text-right">
                    <p className="text-xs text-arcane-grey mb-0.5">Value</p>
                    <p className="text-lg font-black text-arcane-accent">
                      €{player.market_value.toFixed(1)}M
                    </p>
                  </div>

                  {/* Similarity Score */}
                  <div className="text-right min-w-[80px]">
                    <p className="text-xs text-arcane-grey mb-0.5">Match</p>
                    <div className="flex items-center justify-end gap-1">
                      <div className="relative w-12 h-2 bg-arcane-darkBorder rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${player.similarity_score * 100}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`absolute inset-y-0 left-0 ${
                            player.similarity_score >= 0.9
                              ? 'bg-green-400'
                              : player.similarity_score >= 0.8
                              ? 'bg-yellow-400'
                              : 'bg-orange-400'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-bold ${getSimilarityColor(player.similarity_score)}`}>
                        {Math.round(player.similarity_score * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Similarity Badge */}
              <div className="mt-3 pt-3 border-t border-arcane-darkBorder/50">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${getSimilarityColor(player.similarity_score)}`}>
                    {getSimilarityBadge(player.similarity_score)}
                  </span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          i < Math.round(player.similarity_score * 5)
                            ? 'bg-arcane-accent'
                            : 'bg-arcane-darkBorder'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Info Footer */}
      {players.length > 0 && (
        <div className="mt-6 pt-6 border-t border-arcane-darkBorder/50">
          <div className="flex items-start gap-2 text-xs text-arcane-grey">
            <TrendingUp className="h-4 w-4 text-arcane-accent flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Comparable players are identified using AI analysis of performance metrics,
              age, position, and playing style characteristics.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
