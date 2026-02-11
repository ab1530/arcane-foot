'use client';

import React, { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Modal size options
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

/**
 * Modal props
 */
export interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal size */
  size?: ModalSize;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Footer content (actions, buttons) */
  footer?: ReactNode;
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Prevent scroll when open */
  preventScroll?: boolean;
}

/**
 * Modal Component - Premium modal dialog with glassmorphism
 *
 * Features:
 * - 5 sizes: sm, md, lg, xl, fullscreen
 * - Backdrop blur with glassmorphism
 * - Close button (X)
 * - Keyboard ESC support
 * - Click outside to close (optional)
 * - Smooth fade + scale animation
 * - Header, Content, Footer sections
 * - Focus trap (accessibility)
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   size="md"
 *   title="Edit Profile"
 *   footer={
 *     <>
 *       <ArcaneButton variant="secondary" onClick={onClose}>Cancel</ArcaneButton>
 *       <ArcaneButton variant="primary" onClick={onSave}>Save</ArcaneButton>
 *     </>
 *   }
 * >
 *   <p>Modal content here</p>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  size = 'md',
  title,
  children,
  footer,
  closeOnBackdropClick = true,
  showCloseButton = true,
  className,
  preventScroll = true,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle body scroll
  useEffect(() => {
    if (!isOpen || !preventScroll) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, preventScroll]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    // Save previous focus
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }

    // Restore focus on unmount
    return () => {
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted || !isOpen) return null;

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    fullscreen: 'max-w-none w-screen h-screen m-0 rounded-none',
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full',
          'backdrop-blur-xl rounded-2xl border',
          'shadow-2xl',
          'animate-[modalSlideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]',
          sizeClasses[size],
          className
        )}
        style={{
          backgroundColor: 'rgba(15, 20, 37, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            {title && (
              <h2
                id="modal-title"
                className="text-xl font-bold text-white"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'rounded-lg p-2',
                  'text-gray-400 hover:text-white',
                  'hover:bg-white/10',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-white/20',
                  !title && 'ml-auto'
                )}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

Modal.displayName = 'Modal';
