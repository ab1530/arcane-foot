'use client';

import React from 'react';
import { CardHeaderProps } from './types';
import { cn } from '@/lib/utils';

/**
 * CardHeader - Header section for ArcaneCard
 *
 * @example
 * ```tsx
 * <CardHeader>Player Statistics</CardHeader>
 * ```
 */
export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  const baseStyles = `
    px-6 py-4
    border-b border-arcane-slate/30
    font-sans font-semibold text-lg text-arcane-gray-100
  `;

  return <div className={cn(baseStyles, className)}>{children}</div>;
};

CardHeader.displayName = 'CardHeader';
