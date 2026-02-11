'use client';

import React from 'react';
import { HeadingProps } from './types';
import { cn } from '@/lib/utils';

/**
 * Heading - Semantic heading component with gradient support
 *
 * @example
 * ```tsx
 * <Heading level={1} gradient>
 *   Welcome to Arcane
 * </Heading>
 * ```
 */
export const Heading: React.FC<HeadingProps> = ({
  level = 1,
  gradient = false,
  gradientType = 'primary',
  className,
  children,
  ...rest
}) => {
  // Base heading styles
  const baseStyles = 'font-display font-bold leading-tight';

  // Level-specific styles
  const levelStyles = {
    1: 'text-5xl md:text-6xl text-arcane-gray-100',
    2: 'text-4xl md:text-5xl text-arcane-gray-100',
    3: 'text-3xl md:text-4xl text-arcane-gray-100',
    4: 'text-2xl md:text-3xl text-arcane-gray-200',
    5: 'text-xl md:text-2xl text-arcane-gray-200',
    6: 'text-lg md:text-xl text-arcane-gray-200',
  };

  // Gradient styles
  const gradientStyles = {
    primary: 'bg-gradient-to-r from-arcane-yellow to-success bg-clip-text text-transparent',
    ai: 'bg-gradient-to-r from-ai to-info bg-clip-text text-transparent',
    performance: 'bg-gradient-to-r from-success to-analytics bg-clip-text text-transparent',
    premium: 'bg-gradient-to-r from-gamification to-error bg-clip-text text-transparent',
  };

  const Component = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  return (
    <Component
      className={cn(
        baseStyles,
        levelStyles[level],
        gradient && gradientStyles[gradientType],
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
};

Heading.displayName = 'Heading';
