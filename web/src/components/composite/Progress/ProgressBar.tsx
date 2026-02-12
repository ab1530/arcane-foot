'use client';

import React from 'react';
import { ProgressBarProps } from './types';
import { cn } from '@/lib/utils';

/**
 * ProgressBar - Linear progress indicator with animations
 *
 * Features:
 * - Linear progress bar
 * - Animated filling
 * - Label display (optional)
 * - Percentage text
 * - Gradient support (Arcane yellow)
 * - Indeterminate state (loading without progress)
 * - Sizes: sm, md, lg
 *
 * @example
 * ```tsx
 * <ProgressBar
 *   value={75}
 *   label="Upload Progress"
 *   showPercentage
 *   gradient
 *   size="md"
 * />
 * ```
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  max = 100,
  indeterminate = false,
  size = 'md',
  label,
  showPercentage = false,
  gradient = true,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Size styles
  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      {/* Label and Percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-arcane-gray-200">
              {label}
            </span>
          )}
          {showPercentage && !indeterminate && (
            <span className="text-sm font-semibold text-arcane-yellow">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div
        className={cn(
          'w-full bg-arcane-slate rounded-full overflow-hidden',
          sizeStyles[size]
        )}
      >
        {/* Progress Fill */}
        {indeterminate ? (
          // Indeterminate animation
          <div className="h-full w-full relative overflow-hidden">
            <div
              className={cn(
                'h-full w-1/3 rounded-full animate-pulse',
                gradient
                  ? 'bg-gradient-to-r from-arcane-yellow to-success'
                  : 'bg-arcane-yellow'
              )}
              style={{
                animation: 'progress-indeterminate 1.5s ease-in-out infinite',
              }}
            />
          </div>
        ) : (
          // Determinate progress
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              gradient
                ? 'bg-gradient-to-r from-arcane-yellow to-success'
                : 'bg-arcane-yellow',
              percentage > 0 && 'shadow-glow-yellow'
            )}
            style={{
              width: `${percentage}%`,
            }}
          />
        )}
      </div>

      {/* Add keyframes for indeterminate animation */}
      <style jsx>{`
        @keyframes progress-indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
};

ProgressBar.displayName = 'ProgressBar';
