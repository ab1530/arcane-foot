'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { DataGridProps } from './types';
import { cn } from '@/lib/utils';
import { Skeleton } from '../Progress/Skeleton';

/**
 * DataGrid - Responsive grid layout for displaying data items
 *
 * Features:
 * - Responsive grid layout (1-4 columns)
 * - Custom item renderer
 * - Loading state with skeletons
 * - Empty state
 * - Infinite scroll support (optional)
 * - Gap control
 *
 * @example
 * ```tsx
 * <DataGrid
 *   data={players}
 *   columns={3}
 *   gap="lg"
 *   renderItem={(player) => (
 *     <PlayerCard player={player} />
 *   )}
 *   infiniteScroll
 *   onLoadMore={loadMorePlayers}
 * />
 * ```
 */
export function DataGrid<T>({
  data,
  renderItem,
  loading = false,
  emptyMessage = 'No items to display',
  columns = 3,
  gap = 'md',
  infiniteScroll = false,
  onLoadMore,
  className,
}: DataGridProps<T>) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Gap styles
  const gapStyles = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  // Column styles - responsive by default
  const columnStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  // Infinite scroll setup
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && !loading && onLoadMore) {
        onLoadMore();
      }
    },
    [loading, onLoadMore]
  );

  useEffect(() => {
    if (!infiniteScroll || !loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [infiniteScroll, handleObserver]);

  // Render loading state
  if (loading && data.length === 0) {
    return (
      <div
        className={cn(
          'grid',
          columnStyles[columns],
          gapStyles[gap],
          className
        )}
      >
        {Array.from({ length: columns * 3 }).map((_, i) => (
          <Skeleton key={i} type="card" />
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
    <div className={cn('w-full', className)}>
      {/* Grid Container */}
      <div
        className={cn(
          'grid',
          columnStyles[columns],
          gapStyles[gap]
        )}
      >
        {data.map((item, index) => (
          <div key={index} className="w-full">
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Loading More Indicator */}
      {loading && data.length > 0 && (
        <div
          className={cn(
            'grid mt-6',
            columnStyles[columns],
            gapStyles[gap]
          )}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} type="card" />
          ))}
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {infiniteScroll && !loading && (
        <div ref={loadMoreRef} className="h-10" />
      )}
    </div>
  );
}

DataGrid.displayName = 'DataGrid';
