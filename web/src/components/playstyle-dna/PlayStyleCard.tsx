'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { StyleBadge } from './StyleBadge';
import { getStyleColor } from '@/lib/utils/playstyle-colors';

interface PlayStyleCardProps {
  style: {
    name: string;
    primaryStyle: string;
    secondaryStyle?: string;
    confidence: number;
    cluster: number;
  };
  onExplore?: () => void;
  className?: string;
}

export function PlayStyleCard({ style, onExplore, className }: PlayStyleCardProps) {
  const primaryColor = getStyleColor(style.primaryStyle);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-xl border border-arcane-darkBorder bg-arcane-darkCard/50 backdrop-blur-sm p-6 cursor-pointer ${className}`}
      onClick={onExplore}
      style={{
        boxShadow: `0 0 20px ${primaryColor}15`,
      }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at top right, ${primaryColor}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 space-y-4">
        {/* Player name */}
        <h3 className="text-lg font-semibold text-white">{style.name}</h3>

        {/* Primary style */}
        <div className="space-y-2">
          <p className="text-xs text-arcane-grey uppercase tracking-wider">Primary Style</p>
          <StyleBadge styleName={style.primaryStyle} size="lg" />
        </div>

        {/* Secondary style if exists */}
        {style.secondaryStyle && (
          <div className="space-y-2">
            <p className="text-xs text-arcane-grey uppercase tracking-wider">Secondary Style</p>
            <StyleBadge styleName={style.secondaryStyle} size="md" />
          </div>
        )}

        {/* Confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-arcane-grey uppercase tracking-wider">Confidence</p>
            <p className="text-sm font-semibold text-arcane-accent">
              {Math.round(style.confidence * 100)}%
            </p>
          </div>
          <div className="h-2 bg-arcane-darkBorder rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${style.confidence * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
        </div>

        {/* Explore button */}
        <button
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-arcane-accent/10 hover:bg-arcane-accent/20 text-arcane-accent rounded-lg transition-colors border border-arcane-accent/20"
          onClick={(e) => {
            e.stopPropagation();
            onExplore?.();
          }}
        >
          <span className="text-sm font-medium">Explore Style</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}
