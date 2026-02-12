'use client';

import React from 'react';
import { SpinnerProps } from './types';
import { cn } from '@/lib/utils';

/**
 * Spinner - Loading spinner with smooth rotation
 *
 * Features:
 * - Loading spinner
 * - Sizes: sm, md, lg
 * - Color variations
 * - Smooth rotation animation
 * - Center in container option
 *
 * @example
 * ```tsx
 * // Default spinner
 * <Spinner />
 *
 * // Centered spinner
 * <Spinner size="lg" centered />
 *
 * // Custom color
 * <Spinner color="white" size="md" />
 * ```
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'yellow',
  centered = false,
  className,
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      outer: 'w-4 h-4',
      border: 'border-2',
    },
    md: {
      outer: 'w-8 h-8',
      border: 'border-3',
    },
    lg: {
      outer: 'w-12 h-12',
      border: 'border-4',
    },
  };

  // Color styles
  const colorStyles = {
    yellow: 'border-arcane-yellow',
    white: 'border-white',
    gray: 'border-arcane-gray-400',
  };

  const spinner = (
    <div
      className={cn(
        'inline-block rounded-full border-solid animate-spin',
        sizeConfig[size].outer,
        sizeConfig[size].border,
        colorStyles[color],
        'border-t-transparent',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[100px]">
        {spinner}
      </div>
    );
  }

  return spinner;
};

Spinner.displayName = 'Spinner';
