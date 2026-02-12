'use client';

import React from 'react';
import { TextProps } from './types';
import { cn } from '@/lib/utils';

/**
 * Text - Body text component with size and color variants
 *
 * @example
 * ```tsx
 * <Text size="md" color="secondary" weight="medium">
 *   Body text content
 * </Text>
 * ```
 */
export const Text: React.FC<TextProps> = ({
  size = 'md',
  color = 'primary',
  weight = 'regular',
  as: Component = 'p',
  className,
  children,
  ...rest
}) => {
  // Base text styles
  const baseStyles = 'font-body leading-relaxed';

  // Size styles
  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  };

  // Color styles
  const colorStyles = {
    primary: 'text-arcane-gray-200',
    secondary: 'text-arcane-gray-300',
    tertiary: 'text-arcane-gray-400',
    accent: 'text-arcane-yellow',
  };

  // Weight styles
  const weightStyles = {
    regular: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    black: 'font-black',
  };

  return (
    <Component
      className={cn(
        baseStyles,
        sizeStyles[size],
        colorStyles[color],
        weightStyles[weight],
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
};

Text.displayName = 'Text';
