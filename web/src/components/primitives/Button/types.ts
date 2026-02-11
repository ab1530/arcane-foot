import { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface BaseButtonProps {
  /** Button variant style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Icon to display before text */
  icon?: ReactNode;
  /** Icon to display after text */
  iconRight?: ReactNode;
  /** Show loading state with spinner */
  loading?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** Button children */
  children?: ReactNode;
}

export interface IconButtonProps {
  /** Icon to display */
  icon: ReactNode;
  /** Button variant style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Show badge overlay */
  badge?: number | string;
  /** Disable the button */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** ARIA label for accessibility (required for icon-only buttons) */
  'aria-label': string;
  /** Tooltip text */
  tooltip?: string;
}
