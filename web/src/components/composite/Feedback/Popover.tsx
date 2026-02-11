'use client';

import React, { useState, useRef, useEffect, ReactNode, cloneElement, isValidElement } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/**
 * Popover placement options
 */
export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';

/**
 * Popover trigger types
 */
export type PopoverTrigger = 'click' | 'hover';

/**
 * Popover props
 */
export interface PopoverProps {
  /** Popover content */
  content: ReactNode;
  /** Placement of popover */
  placement?: PopoverPlacement;
  /** Trigger type */
  trigger?: PopoverTrigger;
  /** Element that triggers the popover */
  children: React.ReactElement;
  /** Additional CSS classes for popover */
  className?: string;
  /** Additional CSS classes for content */
  contentClassName?: string;
  /** Disable popover */
  disabled?: boolean;
  /** Show arrow */
  showArrow?: boolean;
  /** Close on click outside */
  closeOnClickOutside?: boolean;
}

/**
 * Popover Component - Floating content container
 *
 * Features:
 * - Click or hover trigger
 * - 4 placements: top, bottom, left, right
 * - Arrow indicator
 * - Custom content support
 * - Close on click outside
 * - Smooth fade + scale animation
 * - Glassmorphism styling
 *
 * @example
 * ```tsx
 * <Popover
 *   content={
 *     <div className="p-4">
 *       <h3 className="font-bold mb-2">Player Stats</h3>
 *       <p>View detailed statistics</p>
 *     </div>
 *   }
 *   placement="bottom"
 *   trigger="click"
 * >
 *   <ArcaneButton>Show Stats</ArcaneButton>
 * </Popover>
 * ```
 */
export const Popover: React.FC<PopoverProps> = ({
  content,
  placement = 'bottom',
  trigger = 'click',
  children,
  className,
  contentClassName,
  disabled = false,
  showArrow = true,
  closeOnClickOutside = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate popover position
  const calculatePosition = () => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const gap = showArrow ? 12 : 8; // Gap between trigger and popover

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top - popoverRect.height - gap;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.left - popoverRect.width - gap;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.right + gap;
        break;
    }

    // Keep popover within viewport
    const padding = 8;
    top = Math.max(padding, Math.min(top, window.innerHeight - popoverRect.height - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - popoverRect.width - padding));

    setPosition({ top, left });
  };

  // Handle click outside
  useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        triggerRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeOnClickOutside]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Update position when open
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition);
      window.addEventListener('resize', calculatePosition);

      return () => {
        window.removeEventListener('scroll', calculatePosition);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [isOpen, placement]);

  // Handle trigger events
  const handleClick = () => {
    if (disabled || trigger !== 'click') return;
    setIsOpen(!isOpen);
  };

  const handleMouseEnter = () => {
    if (disabled || trigger !== 'hover') return;
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (disabled || trigger !== 'hover') return;
    setIsOpen(false);
  };

  let triggerElement: React.ReactNode = children;
  if (isValidElement(children)) {
    const originalProps = (children.props as Record<string, any>) || {};
    triggerElement = cloneElement(children, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        handleClick();
        originalProps.onClick?.(e);
      },
      onMouseEnter: (e: React.MouseEvent) => {
        handleMouseEnter();
        originalProps.onMouseEnter?.(e);
      },
      onMouseLeave: (e: React.MouseEvent) => {
        handleMouseLeave();
        originalProps.onMouseLeave?.(e);
      },
      'aria-expanded': isOpen,
      'aria-haspopup': true,
    } as any);
  }

  // Arrow position classes
  const arrowClasses = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-[rgba(255,255,255,0.1)] border-x-transparent border-b-transparent',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-b-[rgba(255,255,255,0.1)] border-x-transparent border-t-transparent',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 border-l-[rgba(255,255,255,0.1)] border-y-transparent border-r-transparent',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 border-r-[rgba(255,255,255,0.1)] border-y-transparent border-l-transparent',
  };

  const popover = mounted && isOpen && !disabled && (
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="false"
      className={cn(
        'fixed z-[9997]',
        'backdrop-blur-xl rounded-xl border',
        'shadow-2xl',
        'animate-[popoverSlideIn_0.2s_cubic-bezier(0.16,1,0.3,1)]',
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        backgroundColor: 'rgba(15, 20, 37, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
      onMouseEnter={() => trigger === 'hover' && setIsOpen(true)}
      onMouseLeave={() => trigger === 'hover' && setIsOpen(false)}
    >
      {/* Content */}
      <div className={cn('relative', contentClassName)}>
        {content}
      </div>

      {/* Arrow */}
      {showArrow && (
        <div
          className={cn(
            'absolute w-0 h-0',
            'border-[6px]',
            arrowClasses[placement]
          )}
        />
      )}
    </div>
  );

  return (
    <>
      {triggerElement}
      {popover && createPortal(popover, document.body)}
    </>
  );
};

Popover.displayName = 'Popover';
