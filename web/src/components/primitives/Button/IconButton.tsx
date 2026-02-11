'use client';

import React from 'react';
import { IconButtonProps } from './types';
import { cn } from '@/lib/utils';

/**
 * IconButton - Circular icon button for actions
 *
 * @example
 * ```tsx
 * <IconButton
 *   icon={<HeartIcon />}
 *   variant="ghost"
 *   aria-label="Add to favorites"
 * />
 * ```
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'md',
  badge,
  disabled = false,
  className,
  onClick,
  'aria-label': ariaLabel,
  tooltip,
}) => {
  // Base styles for circular button
  const baseStyles = `
    relative inline-flex items-center justify-center
    rounded-full
    transition-all duration-200
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcane-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-arcane-black
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
  `;

  // Variant styles
  const variantStyles = {
    primary: `
      bg-arcane-yellow text-arcane-black
      hover:brightness-110 hover:shadow-glow-yellow hover:scale-105
      active:brightness-90 active:scale-95
    `,
    secondary: `
      bg-transparent text-arcane-gray-200 border border-arcane-slate
      hover:border-arcane-yellow hover:text-arcane-yellow hover:bg-arcane-yellow/10
      active:bg-arcane-yellow/20
    `,
    ghost: `
      bg-transparent text-arcane-gray-300
      hover:bg-arcane-charcoal hover:text-arcane-gray-100
      active:bg-arcane-anthracite
    `,
    danger: `
      bg-error text-white
      hover:brightness-110 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105
      active:brightness-90 active:scale-95
    `,
  };

  // Size styles (circular, so same width/height)
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  // Icon sizes
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
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
    <div className="relative inline-block">
      <button
        type="button"
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        title={tooltip}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {renderIcon()}
      </button>

      {/* Badge overlay */}
      {badge !== undefined && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-arcane-black bg-arcane-yellow rounded-full"
          aria-label={`${badge} notifications`}
        >
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
  );
};

IconButton.displayName = 'IconButton';
