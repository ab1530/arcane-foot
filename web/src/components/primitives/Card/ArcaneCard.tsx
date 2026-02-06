'use client';

import React from 'react';
import { ArcaneCardProps } from './types';
import { cn } from '@/lib/utils';

/**
 * ArcaneCard - Premium card component following Arcane Design System
 *
 * @example
 * ```tsx
 * <ArcaneCard variant="standard" hover glow>
 *   <CardHeader>Player Profile</CardHeader>
 *   <CardContent>Content goes here</CardContent>
 *   <CardFooter>Actions</CardFooter>
 * </ArcaneCard>
 * ```
 */
export const ArcaneCard: React.FC<ArcaneCardProps> = ({
  variant = 'standard',
  hover = false,
  glow = false,
  gradient = false,
  className,
  children,
  onClick,
  style,
  ...rest
}) => {
  // Base card styles
  const baseStyles = `
    rounded-xl
    transition-all duration-300
    ${onClick ? 'cursor-pointer' : ''}
  `;

  // Variant-specific styles
  const variantStyles = {
    standard: `
      bg-arcane-charcoal
      border border-arcane-yellow/[0.08]
      shadow-lg
    `,
    glass: `
      bg-arcane-anthracite/70
      backdrop-blur-xl
      border border-arcane-yellow/10
      shadow-lg
    `,
    feature: `
      bg-arcane-charcoal
      border-l-4 border-l-arcane-yellow
      shadow-lg
      relative
      before:absolute before:top-0 before:left-0 before:right-0 before:h-[1px]
      before:bg-gradient-to-r before:from-arcane-yellow before:to-transparent
    `,
    stat: `
      bg-gradient-to-br from-arcane-charcoal to-arcane-anthracite
      border border-arcane-slate/50
      shadow-lg
    `,
  };

  // Hover effect styles
  const hoverStyles = hover
    ? `
      hover:border-arcane-yellow/20
      hover:shadow-xl
      hover:-translate-y-0.5
    `
    : '';

  // Glow effect styles
  const glowStyles = glow
    ? `
      hover:shadow-glow-yellow
    `
    : '';

  // Gradient overlay styles
  const gradientOverlayStyles = gradient
    ? `
      relative
      before:absolute before:inset-0
      before:bg-gradient-to-br before:from-arcane-yellow/5 before:to-transparent
      before:rounded-xl before:pointer-events-none
    `
    : '';

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        hoverStyles,
        glowStyles,
        gradientOverlayStyles,
        className
      )}
      onClick={onClick}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

ArcaneCard.displayName = 'ArcaneCard';
