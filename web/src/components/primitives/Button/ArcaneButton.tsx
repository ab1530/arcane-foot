'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { BaseButtonProps } from './types';
import { cn } from '@/lib/utils';

/**
 * ArcaneButton - Premium button component following Arcane Design System
 *
 * @example
 * ```tsx
 * <ArcaneButton variant="primary" size="md" icon={<SearchIcon />}>
 *   Search Players
 * </ArcaneButton>
 * ```
 */
export const ArcaneButton: React.FC<BaseButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  className,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
  children,
}) => {
  // Base styles
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-sans font-semibold
    rounded-md
    transition-all duration-200
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcane-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-arcane-black
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
  `;

  // Variant styles
  const variantStyles = {
    primary: `
      bg-arcane-yellow text-arcane-black
      hover:brightness-110 hover:shadow-glow-yellow hover:-translate-y-0.5
      active:brightness-90 active:translate-y-0
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
      hover:brightness-110 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:-translate-y-0.5
      active:brightness-90 active:translate-y-0
    `,
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';

  // Icon size based on button size
  const iconSize = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  const renderIcon = (iconElement: React.ReactNode) => {
    if (!iconElement) return null;

    // Clone icon element with proper size
    if (React.isValidElement(iconElement)) {
      return React.cloneElement(iconElement as React.ReactElement<any>, {
        size: iconSize[size],
        strokeWidth: 2,
      });
    }

    return iconElement;
  };

  return (
    <button
      type={type}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        widthStyles,
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {loading ? (
        <Loader2 size={iconSize[size]} className="animate-spin" />
      ) : (
        icon && renderIcon(icon)
      )}
      {children && <span>{children}</span>}
      {!loading && iconRight && renderIcon(iconRight)}
    </button>
  );
};

ArcaneButton.displayName = 'ArcaneButton';
