'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Info } from 'lucide-react';
import {
  getRatingColor,
  getRatingBgColor,
  formatRating,
  getRatingLabel,
} from '@/lib/utils/rating-helpers';
import { PerformancePrediction } from '@/types/performance-predictor';

interface LineupVisualizationProps {
  formation: string;
  players: PerformancePrediction[];
}

// Formation positions (4-3-3, 4-4-2, etc.)
const getFormationPositions = (formation: string): { x: number; y: number }[] => {
  const formations: Record<string, { x: number; y: number }[]> = {
    '4-3-3': [
      // GK
      { x: 50, y: 90 },
      // Defenders
      { x: 15, y: 70 },
      { x: 35, y: 70 },
      { x: 65, y: 70 },
      { x: 85, y: 70 },
      // Midfielders
      { x: 25, y: 45 },
      { x: 50, y: 45 },
      { x: 75, y: 45 },
      // Forwards
      { x: 20, y: 20 },
      { x: 50, y: 15 },
      { x: 80, y: 20 },
    ],
    '4-4-2': [
      // GK
      { x: 50, y: 90 },
      // Defenders
      { x: 15, y: 70 },
      { x: 35, y: 70 },
      { x: 65, y: 70 },
      { x: 85, y: 70 },
      // Midfielders
      { x: 15, y: 45 },
      { x: 35, y: 45 },
      { x: 65, y: 45 },
      { x: 85, y: 45 },
      // Forwards
      { x: 35, y: 20 },
      { x: 65, y: 20 },
    ],
    '4-2-3-1': [
      // GK
      { x: 50, y: 90 },
      // Defenders
      { x: 15, y: 70 },
      { x: 35, y: 70 },
      { x: 65, y: 70 },
      { x: 85, y: 70 },
      // Defensive Midfielders
      { x: 35, y: 55 },
      { x: 65, y: 55 },
      // Attacking Midfielders
      { x: 20, y: 35 },
      { x: 50, y: 35 },
      { x: 80, y: 35 },
      // Forward
      { x: 50, y: 15 },
    ],
  };

  return formations[formation] || formations['4-3-3'];
};

export const LineupVisualization: React.FC<LineupVisualizationProps> = ({
  formation,
  players,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<PerformancePrediction | null>(null);
  const positions = getFormationPositions(formation);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="w-1 h-6 bg-arcane-accent rounded-full" />
            Formation: {formation}
          </h3>
          <p className="text-sm text-gray-400 mt-1">Click player for details</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Expected Team Rating</div>
          <div className="text-2xl font-bold text-arcane-accent">
            {players.length > 0
              ? formatRating(
                  players.reduce((sum, p) => sum + p.predictedRating, 0) / players.length
                )
              : '0.0'}
          </div>
        </div>
      </div>

      {/* Football Pitch */}
      <div className="relative aspect-[2/3] bg-gradient-to-b from-green-900/20 via-green-800/20 to-green-900/20 rounded-xl border-2 border-white/10 overflow-hidden">
        {/* Pitch Lines */}
        <div className="absolute inset-0">
          {/* Center Line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full" />
          {/* Penalty Areas */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-16 border-2 border-white/20 border-t-0" />
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-16 border-2 border-white/20 border-b-0" />
        </div>

        {/* Players */}
        {players.slice(0, positions.length).map((player, index) => {
          const position = positions[index];
          return (
            <motion.div
              key={player.playerId}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              onClick={() => setSelectedPlayer(player)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Player Circle */}
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${getRatingBgColor(
                  player.predictedRating
                )} ${getRatingColor(player.predictedRating).replace('text-', 'border-')} backdrop-blur-sm`}
              >
                {player.playerPhoto ? (
                  <img
                    src={player.playerPhoto}
                    alt={player.playerName || 'Player'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>

              {/* Rating Badge */}
              <div
                className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold ${getRatingBgColor(
                  player.predictedRating
                )} ${getRatingColor(player.predictedRating)} border backdrop-blur-sm`}
              >
                {formatRating(player.predictedRating)}
              </div>

              {/* Player Name */}
              <div className="absolute top-14 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <div className="px-2 py-1 bg-black/70 rounded text-xs text-white text-center">
                  {player.playerName?.split(' ').pop() || 'Unknown'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rating Legend */}
      <div className="mt-6 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-400">Excellent (8+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-400">Good (7-8)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-400">Average (5-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-400">Poor (0-5)</span>
        </div>
      </div>

      {/* Player Details Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPlayer(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 rounded-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-4">
                {selectedPlayer.playerPhoto ? (
                  <img
                    src={selectedPlayer.playerPhoto}
                    alt={selectedPlayer.playerName || 'Player'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-arcane-accent/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-arcane-accent/20 to-purple-500/20 flex items-center justify-center border-2 border-arcane-accent/30">
                    <User className="w-8 h-8 text-arcane-accent" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white">
                    {selectedPlayer.playerName || 'Unknown Player'}
                  </h4>
                  <p className="text-sm text-gray-400">{selectedPlayer.playerPosition}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">Predicted Rating</span>
                  <span
                    className={`text-2xl font-bold ${getRatingColor(
                      selectedPlayer.predictedRating
                    )}`}
                  >
                    {formatRating(selectedPlayer.predictedRating)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">Performance Level</span>
                  <span className={`font-bold ${getRatingColor(selectedPlayer.predictedRating)}`}>
                    {getRatingLabel(selectedPlayer.predictedRating)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">Confidence</span>
                  <span className="font-bold text-white">
                    {Math.round(selectedPlayer.confidence * 100)}%
                  </span>
                </div>

                {selectedPlayer.confidenceInterval && (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Expected Range</span>
                    <span className="font-bold text-white">
                      {formatRating(selectedPlayer.confidenceInterval[0])} -{' '}
                      {formatRating(selectedPlayer.confidenceInterval[1])}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedPlayer(null)}
                className="mt-6 w-full px-4 py-2 bg-arcane-accent text-black font-semibold rounded-lg hover:bg-arcane-accent/90 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
