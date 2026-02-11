import { ReactNode } from 'react';

/**
 * Toast variant types
 */
export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast position on screen
 */
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

/**
 * Individual toast data
 */
export interface Toast {
  /** Unique toast identifier */
  id: string;
  /** Toast variant style */
  variant: ToastVariant;
  /** Toast title */
  title: string;
  /** Optional description */
  description?: string;
  /** Auto-dismiss duration in milliseconds (0 = no auto-dismiss) */
  duration?: number;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom icon */
  icon?: ReactNode;
  /** Timestamp when toast was created */
  createdAt: number;
}

/**
 * Toast props
 */
export interface ToastProps extends Toast {
  /** Callback when toast is dismissed */
  onDismiss: (id: string) => void;
  /** Toast position */
  position: ToastPosition;
}

/**
 * Toast container props
 */
export interface ToastContainerProps {
  /** Position of toasts */
  position?: ToastPosition;
  /** Maximum number of visible toasts */
  maxToasts?: number;
}

/**
 * Toast options for creating a new toast
 */
export interface ToastOptions {
  /** Toast variant style */
  variant?: ToastVariant;
  /** Optional description */
  description?: string;
  /** Auto-dismiss duration in milliseconds (default: 3000, 0 = no auto-dismiss) */
  duration?: number;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom icon */
  icon?: ReactNode;
}
