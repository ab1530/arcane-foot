/**
 * Progress Component Types
 * Arcane Design System - Tier 2 Components
 */

export type ProgressSize = 'sm' | 'md' | 'lg';

// ProgressBar Types
export interface ProgressBarProps {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  size?: ProgressSize;
  label?: string;
  showPercentage?: boolean;
  gradient?: boolean;
  className?: string;
}

// CircularProgress Types
export interface CircularProgressProps {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  size?: ProgressSize | 'xl';
  showLabel?: boolean;
  thickness?: number;
  gradient?: boolean;
  className?: string;
}

// Skeleton Types
export type SkeletonType = 'text' | 'card' | 'avatar' | 'custom';

export interface SkeletonProps {
  type?: SkeletonType;
  lines?: number;
  width?: string;
  height?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

// Spinner Types
export interface SpinnerProps {
  size?: ProgressSize;
  color?: 'yellow' | 'white' | 'gray';
  centered?: boolean;
  className?: string;
}
