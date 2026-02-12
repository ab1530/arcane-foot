'use client';

import React, { useState, useRef, useEffect, ReactNode, cloneElement, isValidElement } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/**
 * Tooltip placement options
 */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/**
 * Tooltip props
 */
export interface TooltipProps {
  /** Tooltip content */
  content: ReactNode;
  /** Placement of tooltip */
  placement?: TooltipPlacement;
  /** Delay before showing (ms) */
  delay?: number;
  /** Element that triggers the tooltip */
  children: React.ReactElement;
  /** Additional CSS classes */
  className?: string;
  /** Disable tooltip */
  disabled?: boolean;
}

/**
 * Tooltip Component - Accessible tooltip with positioning
 *
 * Features:
 * - 4 placements: top, bottom, left, right
 * - Delay before showing (default 200ms)
 * - Arrow indicator
 * - Dark background with white text
 * - Max width for long text
 * - Smooth fade animation
 * - Keyboard accessible (show on focus)
 *
 * @example
 * ```tsx
 * <Tooltip content="Edit player profile" placement="top">
 *   <IconButton icon={<Edit />} aria-label="Edit" />
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  delay = 200,
  children,
  className,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate tooltip position
  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8; // Gap between trigger and tooltip

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - gap;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + gap;
        break;
    }

    // Keep tooltip within viewport
    const padding = 8;
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

    setPosition({ top, left });
  };

  // Show tooltip
  const showTooltip = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  // Hide tooltip
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Update position when visible
  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition);
      window.addEventListener('resize', calculatePosition);

      return () => {
        window.removeEventListener('scroll', calculatePosition);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [isVisible, placement]);

  // Clone child element with event handlers
  let trigger: React.ReactNode = children;
  if (isValidElement(children)) {
    const originalProps = (children.props as Record<string, any>) ?? {};
    trigger = cloneElement(children, {
      ref: triggerRef,
      onMouseEnter: (e: React.MouseEvent) => {
        showTooltip();
        originalProps.onMouseEnter?.(e);
      },
      onMouseLeave: (e: React.MouseEvent) => {
        hideTooltip();
        originalProps.onMouseLeave?.(e);
      },
      onFocus: (e: React.FocusEvent) => {
        showTooltip();
        originalProps.onFocus?.(e);
      },
      onBlur: (e: React.FocusEvent) => {
        hideTooltip();
        originalProps.onBlur?.(e);
      },
    } as any);
  }

  // Arrow position classes
  const arrowClasses = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent',
  };

  const tooltip = mounted && isVisible && !disabled && (
    <div
      ref={tooltipRef}
      role="tooltip"
      className={cn(
        'fixed z-[9997] px-3 py-2 rounded-lg',
        'bg-gray-900 text-white text-sm font-medium',
        'shadow-xl border border-gray-700',
        'max-w-xs break-words',
        'pointer-events-none',
        'animate-[fadeIn_0.15s_ease-out]',
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {content}

      {/* Arrow */}
      <div
        className={cn(
          'absolute w-0 h-0',
          'border-4',
          arrowClasses[placement]
        )}
      />
    </div>
  );

  return (
    <>
      {trigger}
      {tooltip && createPortal(tooltip, document.body)}
    </>
  );
};

Tooltip.displayName = 'Tooltip';
