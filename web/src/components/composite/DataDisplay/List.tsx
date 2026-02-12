'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ListProps } from './types';
import { cn } from '@/lib/utils';
import { Skeleton } from '../Progress/Skeleton';

/**
 * List - Vertical list layout with optional virtual scrolling
 *
 * Features:
 * - Vertical list layout
 * - Dividers between items (optional)
 * - Custom spacing
 * - Virtual scrolling for long lists
 * - Empty state
 * - Loading state
 *
 * @example
 * ```tsx
 * <List
 *   data={players}
 *   renderItem={(player) => <PlayerListItem player={player} />}
 *   dividers
 *   spacing="md"
 *   virtualized
 *   itemHeight={80}
 *   containerHeight={600}
 * />
 * ```
 */
export function List<T>({
  data,
  renderItem,
  loading = false,
  emptyMessage = 'No items to display',
  dividers = false,
  spacing = 'md',
  virtualized = false,
  itemHeight = 60,
  containerHeight = 600,
  className,
}: ListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Spacing styles
  const spacingStyles = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  // Calculate visible range for virtual scrolling
  const getVisibleRange = () => {
    if (!virtualized) return { start: 0, end: data.length };

    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      data.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    // Add buffer for smooth scrolling
    const buffer = 3;
    return {
      start: Math.max(0, visibleStart - buffer),
      end: Math.min(data.length, visibleEnd + buffer),
    };
  };

  const { start, end } = getVisibleRange();
  const visibleData = virtualized ? data.slice(start, end) : data;
  const offsetY = virtualized ? start * itemHeight : 0;
  const totalHeight = virtualized ? data.length * itemHeight : 'auto';

  // Handle scroll for virtual scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (virtualized) {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };

  // Render loading state
  if (loading && data.length === 0) {
    return (
      <div className={cn('w-full', spacingStyles[spacing], className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} type="custom" className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Render empty state
  if (data.length === 0 && !loading) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-center h-64 bg-arcane-charcoal rounded-xl border border-arcane-slate">
          <div className="text-center">
            <div className="text-arcane-gray-400 text-lg mb-2">No Items</div>
            <div className="text-arcane-gray-500 text-sm">{emptyMessage}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full overflow-y-auto',
        virtualized && 'relative',
        className
      )}
      style={virtualized ? { height: containerHeight } : undefined}
      onScroll={handleScroll}
    >
      {/* Virtual scrolling container */}
      {virtualized ? (
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              width: '100%',
            }}
          >
            {visibleData.map((item, index) => {
              const actualIndex = start + index;
              return (
                <div
                  key={actualIndex}
                  className={cn(
                    dividers && actualIndex < data.length - 1 && 'border-b border-arcane-slate',
                    spacing === 'sm' && 'py-1',
                    spacing === 'md' && 'py-2',
                    spacing === 'lg' && 'py-3'
                  )}
                  style={{ height: itemHeight }}
                >
                  {renderItem(item, actualIndex)}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Regular list
        <div className={cn(!dividers && spacingStyles[spacing])}>
          {data.map((item, index) => (
            <div
              key={index}
              className={cn(
                dividers && index < data.length - 1 && 'border-b border-arcane-slate pb-4'
              )}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}

      {/* Loading More Indicator */}
      {loading && data.length > 0 && (
        <div className="mt-4">
          <Skeleton type="custom" className="h-16 w-full" />
        </div>
      )}
    </div>
  );
}

List.displayName = 'List';
