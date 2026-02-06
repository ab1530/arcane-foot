'use client';

import React from 'react';
import { SkeletonProps } from './types';
import { cn } from '@/lib/utils';

/**
 * Skeleton - Loading placeholder with shimmer animation
 *
 * Features:
 * - Types: text, card, avatar, custom
 * - Shimmer animation
 * - Multiple lines for text
 * - Custom shapes and sizes
 * - Rounded corners matching design system
 *
 * @example
 * ```tsx
 * // Text skeleton
 * <Skeleton type="text" lines={3} />
 *
 * // Card skeleton
 * <Skeleton type="card" />
 *
 * // Avatar skeleton
 * <Skeleton type="avatar" />
 *
 * // Custom skeleton
 * <Skeleton type="custom" width="200px" height="100px" />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  type = 'text',
  lines = 1,
  width,
  height,
  rounded = 'md',
  className,
}) => {
  // Rounded styles
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  // Base shimmer animation styles
  const shimmerStyles = `
    relative
    overflow-hidden
    bg-arcane-slate
    before:absolute
    before:inset-0
    before:-translate-x-full
    before:animate-shimmer
    before:bg-gradient-to-r
    before:from-transparent
    before:via-arcane-gray-400/20
    before:to-transparent
  `;

  // Text skeleton
  if (type === 'text') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              shimmerStyles,
              roundedStyles[rounded],
              'h-4'
            )}
            style={{
              width: index === lines - 1 && lines > 1 ? '80%' : width || '100%',
            }}
          />
        ))}
      </div>
    );
  }

  // Card skeleton
  if (type === 'card') {
    return (
      <div className={cn('w-full', className)}>
        <div className={cn(shimmerStyles, 'rounded-xl h-48 w-full')} />
        <div className="space-y-2 mt-4">
          <div className={cn(shimmerStyles, 'rounded h-4 w-3/4')} />
          <div className={cn(shimmerStyles, 'rounded h-4 w-1/2')} />
        </div>
      </div>
    );
  }

  // Avatar skeleton
  if (type === 'avatar') {
    return (
      <div
        className={cn(
          shimmerStyles,
          'rounded-full',
          className
        )}
        style={{
          width: width || '48px',
          height: height || '48px',
        }}
      />
    );
  }

  // Custom skeleton
  return (
    <div
      className={cn(
        shimmerStyles,
        roundedStyles[rounded],
        className
      )}
      style={{
        width: width || '100%',
        height: height || '20px',
      }}
    />
  );
};

Skeleton.displayName = 'Skeleton';

// Add shimmer animation to global styles
// This should be added to your tailwind.config.ts:
/*
animation: {
  shimmer: 'shimmer 2s infinite',
},
keyframes: {
  shimmer: {
    '100%': {
      transform: 'translateX(100%)',
    },
  },
}
*/
