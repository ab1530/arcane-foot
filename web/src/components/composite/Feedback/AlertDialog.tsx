'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * AlertDialog variant types
 */
export type AlertDialogVariant = 'info' | 'warning' | 'danger';

/**
 * AlertDialog props
 */
export interface AlertDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Dialog variant style */
  variant?: AlertDialogVariant;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description: string;
  /** Primary action label */
  confirmLabel?: string;
  /** Secondary action label */
  cancelLabel?: string;
  /** Callback when confirm is clicked */
  onConfirm?: () => void;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
  /** Show loading state on confirm button */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AlertDialog Component - Confirmation/alert dialog
 *
 * Features:
 * - 3 variants: info, warning, danger
 * - Title + description
 * - Primary + secondary actions
 * - Confirm/cancel pattern
 * - Danger variant has red primary button
 * - Keyboard support (Enter = confirm, ESC = cancel)
 *
 * @example
 * ```tsx
 * <AlertDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   variant="danger"
 *   title="Delete Player"
 *   description="Are you sure you want to delete this player? This action cannot be undone."
 *   confirmLabel="Delete"
 *   cancelLabel="Cancel"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  variant = 'info',
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  className,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Handle mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle body scroll
  useEffect(() => {
    if (!isOpen) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Handle keyboard
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter' && !isLoading) {
        handleConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading]);

  // Auto-focus confirm button
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!mounted || !isOpen) return null;

  // Variant configurations
  const variantConfig = {
    info: {
      icon: <Info size={24} />,
      iconBg: 'bg-blue-500/10',
      iconText: 'text-blue-400',
      iconBorder: 'border-blue-500/30',
      confirmBg: 'bg-blue-500 hover:bg-blue-600',
      confirmText: 'text-white',
    },
    warning: {
      icon: <AlertTriangle size={24} />,
      iconBg: 'bg-amber-500/10',
      iconText: 'text-amber-400',
      iconBorder: 'border-amber-500/30',
      confirmBg: 'bg-amber-500 hover:bg-amber-600',
      confirmText: 'text-white',
    },
    danger: {
      icon: <AlertCircle size={24} />,
      iconBg: 'bg-red-500/10',
      iconText: 'text-red-400',
      iconBorder: 'border-red-500/30',
      confirmBg: 'bg-red-500 hover:bg-red-600',
      confirmText: 'text-white',
    },
  };

  const config = variantConfig[variant];

  const dialog = (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={handleBackdropClick}
      />

      {/* Dialog */}
      <div
        className={cn(
          'relative w-full max-w-md',
          'backdrop-blur-xl rounded-2xl border',
          'shadow-2xl',
          'animate-[modalSlideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]',
          className
        )}
        style={{
          backgroundColor: 'rgba(15, 20, 37, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="p-6">
          {/* Icon */}
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-full border mb-4',
              config.iconBg,
              config.iconText,
              config.iconBorder
            )}
          >
            {config.icon}
          </div>

          {/* Title */}
          <h2
            id="alert-dialog-title"
            className="text-xl font-bold text-white mb-2"
          >
            {title}
          </h2>

          {/* Description */}
          <p
            id="alert-dialog-description"
            className="text-sm text-gray-400 mb-6"
          >
            {description}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Cancel button */}
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg',
                'text-sm font-semibold',
                'bg-transparent text-gray-300 border border-white/20',
                'hover:bg-white/10 hover:text-white',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-white/20',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {cancelLabel}
            </button>

            {/* Confirm button */}
            <button
              ref={confirmButtonRef}
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg',
                'text-sm font-semibold',
                config.confirmBg,
                config.confirmText,
                'shadow-lg',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-white/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                !isLoading && 'hover:scale-105'
              )}
              style={{
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};

AlertDialog.displayName = 'AlertDialog';
