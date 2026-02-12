import { ReactNode, HTMLAttributes } from 'react';

export type CardVariant = 'standard' | 'glass' | 'feature' | 'stat';

export interface ArcaneCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card variant style */
  variant?: CardVariant;
  /** Enable hover lift effect */
  hover?: boolean;
  /** Enable border glow on hover */
  glow?: boolean;
  /** Show gradient overlay */
  gradient?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Card content */
  children: ReactNode;
  /** Click handler for interactive cards */
  onClick?: () => void;
}

export interface CardHeaderProps {
  /** Header content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export interface CardContentProps {
  /** Content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export interface CardFooterProps {
  /** Footer content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}
