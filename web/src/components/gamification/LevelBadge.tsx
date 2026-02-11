'use client';

import React from 'react';
import { Trophy, Star } from 'lucide-react';
import { Text } from '@/components/primitives/Typography/Text';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LevelBadgeProps {
  level: number;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showTitle?: boolean;
  className?: string;
}

/**
 * LevelBadge - Circular level display with gradient
 *
 * Features:
 * - Size variants
 * - Animated glow
 * - Level title
 * - Gradient background
 * - Trophy icon for high levels
 */
export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  title,
  size = 'md',
  animated = true,
  showTitle = true,
  className,
}) => {
  const sizes = {
    sm: { container: 'h-12 w-12', text: 'text-lg', icon: 'h-3 w-3' },
    md: { container: 'h-16 w-16', text: 'text-2xl', icon: 'h-4 w-4' },
    lg: { container: 'h-20 w-20', text: 'text-3xl', icon: 'h-5 w-5' },
    xl: { container: 'h-32 w-32', text: 'text-5xl', icon: 'h-8 w-8' },
  };

  const { container, text: textSize, icon: iconSize } = sizes[size];

  // Determine level tier for visual style
  const isLegendary = level >= 50;
  const isMaster = level >= 30;
  const isElite = level >= 10;

  const gradientColors = isLegendary
    ? 'from-yellow-500 via-orange-500 to-red-500'
    : isMaster
    ? 'from-purple-500 via-pink-500 to-red-500'
    : isElite
    ? 'from-blue-500 to-cyan-500'
    : 'from-arcane-yellow to-yellow-500';

  const badge = (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Level Circle */}
      <motion.div
        className={cn(
          'relative rounded-full flex items-center justify-center',
          'bg-gradient-to-br shadow-lg',
          container,
          gradientColors
        )}
        style={{
          boxShadow: animated
            ? `0 0 30px ${isLegendary ? '#F59E0B' : isMaster ? '#8B5CF6' : '#E4FF3B'}40`
            : undefined,
        }}
        animate={
          animated
            ? {
                boxShadow: [
                  `0 0 20px ${isLegendary ? '#F59E0B' : isMaster ? '#8B5CF6' : '#E4FF3B'}40`,
                  `0 0 40px ${isLegendary ? '#F59E0B' : isMaster ? '#8B5CF6' : '#E4FF3B'}60`,
                  `0 0 20px ${isLegendary ? '#F59E0B' : isMaster ? '#8B5CF6' : '#E4FF3B'}40`,
                ],
              }
            : undefined
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Inner circle */}
        <div
          className={cn(
            'absolute inset-1 rounded-full bg-arcane-black',
            'flex items-center justify-center'
          )}
        >
          <Text
            size={textSize as any}
            weight="black"
            className={cn(
              'bg-gradient-to-br bg-clip-text text-transparent',
              gradientColors
            )}
          >
            {level}
          </Text>
        </div>

        {/* Trophy icon for high levels */}
        {isLegendary && (
          <div className={cn('absolute -top-1 -right-1', iconSize)}>
            <Trophy
              className={cn('text-yellow-400 fill-yellow-400', iconSize)}
              style={{ filter: 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.8))' }}
            />
          </div>
        )}

        {/* Star particles for master */}
        {isMaster && !isLegendary && (
          <>
            <Star
              className={cn('absolute top-0 right-2 text-purple-400', iconSize)}
              style={{ filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.8))' }}
            />
            <Star
              className={cn('absolute bottom-0 left-2 text-pink-400', iconSize)}
              style={{ filter: 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.8))' }}
            />
          </>
        )}
      </motion.div>

      {/* Title */}
      {showTitle && title && (
        <Text
          size={size === 'xl' ? 'lg' : size === 'lg' ? 'md' : 'sm'}
          weight="semibold"
          className="text-center"
        >
          {title}
        </Text>
      )}
    </div>
  );

  return badge;
};

LevelBadge.displayName = 'LevelBadge';
