'use client';

import React from 'react';
import { CardFooterProps } from './types';
import { cn } from '@/lib/utils';

/**
 * CardFooter - Footer section for ArcaneCard with actions
 *
 * @example
 * ```tsx
 * <CardFooter>
 *   <Button>View Details</Button>
 * </CardFooter>
 * ```
 */
export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  const baseStyles = `
    px-6 py-4
    border-t border-arcane-slate/30
    flex items-center gap-3
  `;

  return <div className={cn(baseStyles, className)}>{children}</div>;
};

CardFooter.displayName = 'CardFooter';
