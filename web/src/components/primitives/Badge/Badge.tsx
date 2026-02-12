'use client';

import React from 'react';
import { BadgeProps } from './types';
import { cn } from '@/lib/utils';

/**
 * Badge - Status and category indicator component
 *
 * @example
 * ```tsx
 * <Badge variant="success" size="md">
 *   Active
 * </Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  size = 'md',
  icon,
  children,
  className,
  ...rest
}) => {
  // Base badge styles
  const baseStyles = `
    inline-flex items-center gap-1.5
    rounded-full
    font-sans font-semibold uppercase
    tracking-wide
    whitespace-nowrap
  `;

  // Variant styles with background and text colors
  const variantStyles = {
    success: `
      bg-success/20
      text-success
      border border-success/30
    `,
    warning: `
      bg-warning/20
      text-warning
      border border-warning/30
    `,
    error: `
      bg-error/20
      text-error
      border border-error/30
    `,
    info: `
      bg-info/20
      text-info
      border border-info/30
    `,
    premium: `
      bg-arcane-yellow/20
      text-arcane-yellow
      border border-arcane-yellow/30
      shadow-sm shadow-arcane-yellow/10
    `,
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  // Icon sizes
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const renderIcon = () => {
    if (!icon) return null;

    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<any>, {
        size: iconSizes[size],
        strokeWidth: 2,
      });
    }

    return icon;
  };

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...rest}
    >
      {icon && renderIcon()}
      <span>{children}</span>
    </span>
  );
};

Badge.displayName = 'Badge';
