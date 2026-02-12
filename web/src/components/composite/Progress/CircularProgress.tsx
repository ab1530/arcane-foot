'use client';

import React from 'react';
import { CircularProgressProps } from './types';
import { cn } from '@/lib/utils';

/**
 * CircularProgress - Circular progress indicator with gradient stroke
 *
 * Features:
 * - Circular progress indicator
 * - Sizes: sm, md, lg, xl
 * - Gradient stroke (yellow)
 * - Center label (percentage)
 * - Animated stroke drawing
 * - Indeterminate state (spinning)
 * - Thickness control
 *
 * @example
 * ```tsx
 * <CircularProgress
 *   value={75}
 *   size="lg"
 *   showLabel
 *   gradient
 *   thickness={8}
 * />
 * ```
 */
export const CircularProgress: React.FC<CircularProgressProps> = ({
  value = 0,
  max = 100,
  indeterminate = false,
  size = 'md',
  showLabel = true,
  thickness = 6,
  gradient = true,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Size configurations
  const sizeConfig = {
    sm: { dimension: 48, fontSize: 'text-xs' },
    md: { dimension: 64, fontSize: 'text-sm' },
    lg: { dimension: 96, fontSize: 'text-base' },
    xl: { dimension: 128, fontSize: 'text-xl' },
  };

  const { dimension, fontSize } = sizeConfig[size];
  const radius = (dimension - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: dimension, height: dimension }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      {/* SVG Circle */}
      <svg
        className={cn(
          'transform -rotate-90',
          indeterminate && 'animate-spin'
        )}
        width={dimension}
        height={dimension}
      >
        {/* Gradient Definition */}
        {gradient && (
          <defs>
            <linearGradient id={`progress-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E4FF3B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        )}

        {/* Background Circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-arcane-slate"
        />

        {/* Progress Circle */}
        {!indeterminate && (
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke={gradient ? `url(#progress-gradient-${size})` : '#E4FF3B'}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(228, 255, 59, 0.4))',
            }}
          />
        )}

        {/* Indeterminate Circle */}
        {indeterminate && (
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke={gradient ? `url(#progress-gradient-${size})` : '#E4FF3B'}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={circumference * 0.75}
            className="opacity-75"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(228, 255, 59, 0.4))',
            }}
          />
        )}
      </svg>

      {/* Center Label */}
      {showLabel && !indeterminate && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center font-bold text-arcane-yellow',
            fontSize
          )}
        >
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

CircularProgress.displayName = 'CircularProgress';
