'use client';

import { motion } from 'framer-motion';
import type { SimilarPlayer } from '@/types/playstyle-dna';
import { StyleBadge } from './StyleBadge';
import { User } from 'lucide-react';

interface SimilarPlayersProps {
  players: SimilarPlayer[];
  onPlayerClick?: (playerId: string) => void;
}

export function SimilarPlayers({ players, onPlayerClick }: SimilarPlayersProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-arcane-grey">
        <p>No similar players found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {players.map((player, index) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02, x: 4 }}
          className="flex items-center gap-4 p-4 rounded-lg border border-arcane-darkBorder bg-arcane-darkCard/30 backdrop-blur-sm hover:bg-arcane-darkCard/50 transition-all cursor-pointer"
          onClick={() => onPlayerClick?.(player.id)}
        >
          {/* Player avatar */}
          <div className="w-12 h-12 rounded-full bg-arcane-darkBorder flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-arcane-grey" />
          </div>

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">{player.name}</h4>
            <p className="text-sm text-arcane-grey">{player.position}</p>
          </div>

          {/* Style badge */}
          <div className="flex-shrink-0">
            <StyleBadge styleName={player.style} size="sm" />
          </div>

          {/* Similarity percentage */}
          <div className="flex-shrink-0 text-right">
            <div className="text-lg font-bold text-arcane-accent">
              {Math.round(player.similarity * 100)}%
            </div>
            <div className="text-xs text-arcane-grey">similar</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
