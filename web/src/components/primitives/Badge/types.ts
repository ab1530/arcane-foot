import { ReactNode, HTMLAttributes } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'premium';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge variant for different states */
  variant?: BadgeVariant;
  /** Badge size */
  size?: BadgeSize;
  /** Icon to display before text */
  icon?: ReactNode;
  /** Badge content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}
