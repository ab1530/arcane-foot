'use client';

import React from 'react';
import { GradientTextProps, GradientSize, GradientWeight, GradientType } from './types';
import { cn } from '@/lib/utils';

/**
 * GradientText - Text with gradient effect
 *
 * @example
 * ```tsx
 * <GradientText gradient="ai">
 *   AI-Powered Insights
 * </GradientText>
 * ```
 */
const sizeClasses: Record<GradientSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
};

const weightClasses: Record<GradientWeight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  black: 'font-black',
};

export const GradientText: React.FC<GradientTextProps> = ({
  gradient = 'primary',
  className,
  children,
  size,
  weight = 'semibold',
  animated,
  ...rest
}) => {
  const gradientStyles: Record<GradientType, string> = {
    primary: 'bg-gradient-to-r from-arcane-yellow to-success',
    ai: 'bg-gradient-to-r from-ai to-info',
    performance: 'bg-gradient-to-r from-success to-analytics',
    premium: 'bg-gradient-to-r from-gamification to-error',
  };

  const gradientClass =
    typeof gradient === 'string' && gradient in gradientStyles
      ? gradientStyles[gradient as GradientType]
      : typeof gradient === 'string' && gradient.startsWith('from-')
      ? `bg-gradient-to-r ${gradient}`
      : gradientStyles.primary;

  return (
    <span
      className={cn(
        'bg-clip-text text-transparent',
        gradientClass,
        size && sizeClasses[size],
        weightClasses[weight],
        animated && 'animate-pulse',
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
};

GradientText.displayName = 'GradientText';
