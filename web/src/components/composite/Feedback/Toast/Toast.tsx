'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ToastProps } from './types';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/design-system/tokens';

/**
 * Toast Component - Individual toast notification
 *
 * Features:
 * - 4 variants with unique icons and colors
 * - Auto-dismiss with progress bar
 * - Manual close button
 * - Action button support
 * - Slide in/out animations
 * - Glow effects
 *
 * @example
 * ```tsx
 * <Toast
 *   id="1"
 *   variant="success"
 *   title="Profile updated"
 *   description="Your changes have been saved"
 *   onDismiss={() => {}}
 *   position="top-right"
 * />
 * ```
 */
export const Toast: React.FC<ToastProps> = ({
  id,
  variant,
  title,
  description,
  duration = 3000,
  action,
  icon,
  onDismiss,
  position,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  // Auto-dismiss countdown
  useEffect(() => {
    if (duration === 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [duration]);

  // Handle dismiss
  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300); // Match animation duration
  };

  // Variant configurations
  const variantConfig = {
    success: {
      icon: <CheckCircle2 size={20} />,
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      glow: 'shadow-[0_0_24px_rgba(34,197,94,0.25)]',
      progressBg: 'bg-green-500',
    },
    error: {
      icon: <AlertCircle size={20} />,
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      glow: 'shadow-[0_0_24px_rgba(239,68,68,0.25)]',
      progressBg: 'bg-red-500',
    },
    warning: {
      icon: <AlertTriangle size={20} />,
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_24px_rgba(245,158,11,0.25)]',
      progressBg: 'bg-amber-500',
    },
    info: {
      icon: <Info size={20} />,
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      glow: 'shadow-[0_0_24px_rgba(59,130,246,0.25)]',
      progressBg: 'bg-blue-500',
    },
  };

  const config = variantConfig[variant];

  // Position-based animation classes
  const animationClasses = {
    'top-right': isExiting
      ? 'animate-[slideOutRight_0.3s_ease-in-out_forwards]'
      : 'animate-[slideInRight_0.3s_ease-in-out]',
    'top-left': isExiting
      ? 'animate-[slideOutLeft_0.3s_ease-in-out_forwards]'
      : 'animate-[slideInLeft_0.3s_ease-in-out]',
    'top-center': isExiting
      ? 'animate-[slideOutUp_0.3s_ease-in-out_forwards]'
      : 'animate-[slideInDown_0.3s_ease-in-out]',
    'bottom-right': isExiting
      ? 'animate-[slideOutRight_0.3s_ease-in-out_forwards]'
      : 'animate-[slideInRight_0.3s_ease-in-out]',
    'bottom-left': isExiting
      ? 'animate-[slideOutLeft_0.3s_ease-in-out_forwards]'
      : 'animate-[slideInLeft_0.3s_ease-in-out]',
    'bottom-center': isExiting
      ? 'animate-[slideOutDown_0.3s_ease-in-out_forwards]'
      : 'animate-[slideInUp_0.3s_ease-in-out]',
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'relative w-full max-w-sm overflow-hidden',
        'backdrop-blur-md rounded-lg border',
        'shadow-lg',
        config.bg,
        config.border,
        config.glow,
        animationClasses[position]
      )}
      style={{
        backgroundColor: 'rgba(15, 20, 37, 0.95)',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          <div
            className={cn('h-full transition-all ease-linear', config.progressBg)}
            style={{
              width: `${progress}%`,
              transitionDuration: '16ms',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={cn('flex-shrink-0 mt-0.5', config.text)}>
          {icon || config.icon}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          {description && (
            <p className="mt-1 text-sm text-gray-400 line-clamp-2">
              {description}
            </p>
          )}

          {/* Action button */}
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'mt-2 text-sm font-medium underline-offset-4 hover:underline',
                config.text
              )}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className={cn(
            'flex-shrink-0 rounded-md p-1',
            'text-gray-400 hover:text-white',
            'hover:bg-white/10',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-white/20'
          )}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

Toast.displayName = 'Toast';
