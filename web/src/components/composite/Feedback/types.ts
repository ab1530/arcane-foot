/**
 * ARCANE DESIGN SYSTEM - Feedback Component Types
 * Centralized type definitions for all feedback components
 */

// Re-export Toast types
export type {
  ToastVariant,
  ToastPosition,
  Toast,
  ToastProps,
  ToastContainerProps,
  ToastOptions,
} from './Toast/types';

// Re-export Modal types
export type { ModalSize, ModalProps } from './Modal';

// Re-export AlertDialog types
export type { AlertDialogVariant, AlertDialogProps } from './AlertDialog';

// Re-export Tooltip types
export type { TooltipPlacement, TooltipProps } from './Tooltip';

// Re-export Popover types
export type {
  PopoverPlacement,
  PopoverTrigger,
  PopoverProps,
} from './Popover';
