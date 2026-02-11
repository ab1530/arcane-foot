'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import { Text } from '@/components/primitives/Typography/Text';
import { cn } from '@/lib/utils';
import { motion, useSpring, useTransform } from 'framer-motion';

interface XPBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
  showLabel?: boolean;
  animated?: boolean;
  variant?: 'default' | 'compact';
  onLevelUp?: () => void;
  className?: string;
}

/**
 * XPBar - Animated XP progress bar
 *
 * Features:
 * - Smooth progress animation
 * - Gradient fill (yellow to gold)
 * - Glow effect
 * - Level indicator
 * - Percentage display
 * - Level-up animation
 * - Compact variant
 */
export const XPBar: React.FC<XPBarProps> = ({
  currentXP,
  nextLevelXP,
  level,
  showLabel = true,
  animated = true,
  variant = 'default',
  onLevelUp,
  className,
}) => {
  const [prevLevel, setPrevLevel] = useState(level);
  const percentage = Math.min((currentXP / nextLevelXP) * 100, 100);

  // Spring animation for smooth progress
  const springProgress = useSpring(0, {
    stiffness: 50,
    damping: 20,
  });

  const width = useTransform(springProgress, [0, 100], ['0%', '100%']);

  useEffect(() => {
    if (animated) {
      springProgress.set(percentage);
    }
  }, [percentage, animated, springProgress]);

  // Detect level up
  useEffect(() => {
    if (level > prevLevel) {
      setPrevLevel(level);
      if (onLevelUp) {
        onLevelUp();
      }
    }
  }, [level, prevLevel, onLevelUp]);

  const xpRemaining = nextLevelXP - currentXP;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Labels */}
      {showLabel && variant === 'default' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-arcane-yellow fill-arcane-yellow" />
            <Text size="sm" weight="semibold">
              Level {level}
            </Text>
          </div>
          <Text size="sm" color="secondary">
            {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
          </Text>
        </div>
      )}

      {variant === 'compact' && showLabel && (
        <div className="flex items-center justify-between">
          <Text size="xs" color="secondary">
            Level {level}
          </Text>
          <Text size="xs" weight="semibold" className="text-arcane-yellow">
            {percentage.toFixed(0)}%
          </Text>
        </div>
      )}

      {/* Progress Bar Container */}
      <div
        className={cn(
          'relative bg-arcane-slate/50 rounded-full overflow-hidden',
          variant === 'compact' ? 'h-2' : 'h-4',
          'shadow-inner'
        )}
      >
        {/* Animated Progress Fill */}
        {animated ? (
          <motion.div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              'bg-gradient-to-r from-arcane-yellow via-yellow-500 to-yellow-600',
              'shadow-[0_0_10px_rgba(228,255,59,0.5)]'
            )}
            style={{ width }}
            initial={{ width: 0 }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </motion.div>
        ) : (
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              'bg-gradient-to-r from-arcane-yellow via-yellow-500 to-yellow-600',
              'shadow-[0_0_10px_rgba(228,255,59,0.5)]',
              'transition-all duration-500 ease-out'
            )}
            style={{ width: `${percentage}%` }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        )}

        {/* Percentage Text (for default variant) */}
        {variant === 'default' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Text size="xs" weight="bold" className="text-arcane-black mix-blend-difference">
              {percentage.toFixed(0)}%
            </Text>
          </div>
        )}
      </div>

      {/* XP Details */}
      {showLabel && variant === 'default' && (
        <div className="flex items-center justify-between">
          <Text size="xs" color="tertiary" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {xpRemaining.toLocaleString()} XP to next level
          </Text>
        </div>
      )}
    </div>
  );
};

XPBar.displayName = 'XPBar';
