'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Toast } from './Toast';
import { ToastContainerProps, Toast as ToastData } from './types';
import { useToastStore } from './useToast';
import { cn } from '@/lib/utils';

/**
 * ToastContainer - Container for managing multiple toasts
 *
 * Features:
 * - Stacking support (multiple toasts)
 * - Position options (6 positions)
 * - Max toast limit
 * - Portal rendering (outside of DOM hierarchy)
 * - Z-index management
 *
 * @example
 * ```tsx
 * // Add to root layout
 * <ToastContainer position="top-right" maxToasts={5} />
 * ```
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  maxToasts = 5,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const { toasts, removeToast } = useToastStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Limit number of visible toasts
  const visibleToasts: ToastData[] = toasts.slice(-maxToasts);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4 items-end',
    'top-left': 'top-4 left-4 items-start',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-left': 'bottom-4 left-4 items-start',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  };

  const container = (
    <div
      className={cn(
        'fixed z-[9999] flex flex-col gap-3 pointer-events-none',
        positionClasses[position]
      )}
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      {visibleToasts.map((toastData) => (
        <div key={toastData.id} className="pointer-events-auto">
          <Toast {...toastData} onDismiss={removeToast} position={position} />
        </div>
      ))}
    </div>
  );

  return createPortal(container, document.body);
};

ToastContainer.displayName = 'ToastContainer';
