'use client';

import { motion } from 'framer-motion';
import { getStyleColor, getStyleIcon, STYLE_DESCRIPTIONS } from '@/lib/utils/playstyle-colors';
import { Users } from 'lucide-react';

interface StyleExplorerGridProps {
  onStyleSelect: (style: string) => void;
  styleCounts?: Record<string, number>;
}

const ALL_STYLES = [
  'Playmaker',
  'Physical Enforcer',
  'Box-to-Box Engine',
  'Tactical Anchor',
  'Speed Demon',
  'Clinical Finisher',
  'Creative Dribbler',
  'Defensive Wall',
  'Deep-Lying Orchestrator',
  'Pressing Machine',
  'Target Man',
  'Balanced All-Rounder',
];

export function StyleExplorerGrid({ onStyleSelect, styleCounts = {} }: StyleExplorerGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {ALL_STYLES.map((style, index) => {
        const color = getStyleColor(style);
        const Icon = getStyleIcon(style);
        const count = styleCounts[style] || 0;
        const description = STYLE_DESCRIPTIONS[style] || '';

        return (
          <motion.div
            key={style}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="relative overflow-hidden rounded-xl border border-arcane-darkBorder bg-arcane-darkCard/50 backdrop-blur-sm p-6 cursor-pointer group"
            onClick={() => onStyleSelect(style)}
            style={{
              boxShadow: `0 0 20px ${color}10`,
            }}
          >
            {/* Gradient overlay */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
              style={{
                background: `radial-gradient(circle at top right, ${color}, transparent 70%)`,
              }}
            />

            <div className="relative z-10 space-y-4">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${color}15`,
                  border: `1px solid ${color}30`,
                }}
              >
                <Icon size={24} style={{ color }} />
              </div>

              {/* Style name */}
              <h3 className="text-lg font-semibold text-white">{style}</h3>

              {/* Description */}
              <p className="text-sm text-arcane-greyLight leading-relaxed line-clamp-3">
                {description}
              </p>

              {/* Player count */}
              <div className="flex items-center gap-2 pt-2 border-t border-arcane-darkBorder">
                <Users size={16} className="text-arcane-grey" />
                <span className="text-sm text-arcane-grey">
                  {count} {count === 1 ? 'player' : 'players'}
                </span>
              </div>

              {/* Hover indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 text-xs" style={{ color }}>
                  <span>Explore</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6H10M10 6L6 2M10 6L6 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
