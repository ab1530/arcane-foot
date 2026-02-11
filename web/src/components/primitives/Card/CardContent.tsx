'use client';

import React from 'react';
import { CardContentProps } from './types';
import { cn } from '@/lib/utils';

/**
 * CardContent - Main content section for ArcaneCard
 *
 * @example
 * ```tsx
 * <CardContent>
 *   <p>Card content goes here</p>
 * </CardContent>
 * ```
 */
export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  const baseStyles = `
    px-6 py-4
    text-arcane-gray-300
  `;

  return <div className={cn(baseStyles, className)}>{children}</div>;
};

CardContent.displayName = 'CardContent';
