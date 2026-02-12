'use client';

import React, { useState, useMemo } from 'react';
import { TableProps, TableState, SortDirection } from './types';
import { cn } from '@/lib/utils';
import { Skeleton } from '../Progress/Skeleton';

/**
 * Table - Advanced data table with sorting, filtering, and pagination
 *
 * Features:
 * - Sortable columns (click header)
 * - Column filtering
 * - Pagination (10, 25, 50, 100 per page)
 * - Row selection (checkbox)
 * - Sticky header on scroll
 * - Loading skeleton state
 * - Empty state
 * - Responsive (horizontal scroll on mobile)
 *
 * @example
 * ```tsx
 * <Table
 *   data={players}
 *   columns={[
 *     { id: 'name', header: 'Player Name', sortable: true },
 *     { id: 'position', header: 'Position', filterable: true },
 *     { id: 'rating', header: 'Rating', sortable: true, align: 'center' }
 *   ]}
 *   selectable
 *   pagination
 *   stickyHeader
 * />
 * ```
 */
export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  selectable = false,
  onSelectionChange,
  pagination = true,
  defaultPageSize = 25,
  stickyHeader = false,
  className,
}: TableProps<T>) {
  const [state, setState] = useState<TableState<T>>({
    sortColumn: null,
    sortDirection: null,
    currentPage: 1,
    pageSize: defaultPageSize,
    selectedRows: new Set(),
    filters: {},
  });

  // Sort data
  const sortedData = useMemo(() => {
    if (!state.sortColumn || !state.sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = a[state.sortColumn as keyof T];
      const bVal = b[state.sortColumn as keyof T];

      if (aVal === bVal) return 0;

      const comparison = aVal < bVal ? -1 : 1;
      return state.sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, state.sortColumn, state.sortDirection]);

  // Filter data
  const filteredData = useMemo(() => {
    return sortedData.filter((row) => {
      return Object.entries(state.filters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = String(row[key as keyof T] || '').toLowerCase();
        return cellValue.includes(value.toLowerCase());
      });
    });
  }, [sortedData, state.filters]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const start = (state.currentPage - 1) * state.pageSize;
    return filteredData.slice(start, start + state.pageSize);
  }, [filteredData, state.currentPage, state.pageSize, pagination]);

  const totalPages = Math.ceil(filteredData.length / state.pageSize);

  // Handle column sort
  const handleSort = (columnId: string) => {
    setState((prev) => ({
      ...prev,
      sortColumn: columnId,
      sortDirection:
        prev.sortColumn === columnId
          ? prev.sortDirection === 'asc'
            ? 'desc'
            : prev.sortDirection === 'desc'
            ? null
            : 'asc'
          : 'asc',
    }));
  };

  // Handle filter
  const handleFilter = (columnId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, [columnId]: value },
      currentPage: 1,
    }));
  };

  // Handle row selection
  const handleRowSelect = (index: number) => {
    setState((prev) => {
      const newSelected = new Set(prev.selectedRows);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }

      if (onSelectionChange) {
        const selectedData = Array.from(newSelected).map((i) => filteredData[i]);
        onSelectionChange(selectedData);
      }

      return { ...prev, selectedRows: newSelected };
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    setState((prev) => {
      const allSelected = prev.selectedRows.size === paginatedData.length;
      const newSelected = allSelected
        ? new Set<number>()
        : new Set(
            paginatedData.map((_, i) => (state.currentPage - 1) * state.pageSize + i)
          );

      if (onSelectionChange) {
        const selectedData = Array.from(newSelected).map((i) => filteredData[i]);
        onSelectionChange(selectedData);
      }

      return { ...prev, selectedRows: newSelected };
    });
  };

  // Render loading state
  if (loading) {
    return (
      <div className={cn('w-full overflow-x-auto', className)}>
        <div className="min-w-full">
          <Skeleton type="custom" className="h-12 w-full mb-2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} type="custom" className="h-16 w-full mb-2" />
          ))}
        </div>
      </div>
    );
  }

  // Render empty state
  if (data.length === 0) {
    return (
      <div className={cn('w-full overflow-x-auto', className)}>
        <div className="flex items-center justify-center h-64 bg-arcane-charcoal rounded-xl border border-arcane-slate">
          <div className="text-center">
            <div className="text-arcane-gray-400 text-lg mb-2">No Data</div>
            <div className="text-arcane-gray-500 text-sm">{emptyMessage}</div>
          </div>
        </div>
      </div>
    );
  }

  const allSelected =
    state.selectedRows.size > 0 &&
    paginatedData.every((_, i) =>
      state.selectedRows.has((state.currentPage - 1) * state.pageSize + i)
    );

  return (
    <div className={cn('w-full', className)}>
      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-arcane-slate bg-arcane-charcoal">
        <table className="min-w-full divide-y divide-arcane-slate">
          {/* Table Header */}
          <thead
            className={cn(
              'bg-arcane-anthracite',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-arcane-slate bg-arcane-charcoal checked:bg-arcane-yellow checked:border-arcane-yellow focus:ring-2 focus:ring-arcane-yellow focus:ring-offset-2 focus:ring-offset-arcane-charcoal transition-colors cursor-pointer"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.id)}
                  className={cn(
                    'px-6 py-3 text-xs font-semibold text-arcane-gray-300 uppercase tracking-wider',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer hover:text-arcane-yellow transition-colors'
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.id))}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="text-arcane-gray-500">
                        {state.sortColumn === column.id &&
                          (state.sortDirection === 'asc' ? '↑' : state.sortDirection === 'desc' ? '↓' : '⇅')}
                        {state.sortColumn !== column.id && '⇅'}
                      </span>
                    )}
                  </div>
                  {column.filterable && (
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="mt-2 w-full px-2 py-1 text-xs bg-arcane-charcoal border border-arcane-slate rounded focus:border-arcane-yellow focus:ring-1 focus:ring-arcane-yellow outline-none transition-colors"
                      value={state.filters[String(column.id)] || ''}
                      onChange={(e) => handleFilter(String(column.id), e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-arcane-slate">
            {paginatedData.map((row, rowIndex) => {
              const actualIndex = (state.currentPage - 1) * state.pageSize + rowIndex;
              const isSelected = state.selectedRows.has(actualIndex);

              return (
                <tr
                  key={rowIndex}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-arcane-anthracite',
                    isSelected && 'bg-arcane-yellow/10'
                  )}
                  onClick={() => onRowClick && onRowClick(row, actualIndex)}
                >
                  {selectable && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRowSelect(actualIndex)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-arcane-slate bg-arcane-charcoal checked:bg-arcane-yellow checked:border-arcane-yellow focus:ring-2 focus:ring-arcane-yellow focus:ring-offset-2 focus:ring-offset-arcane-charcoal transition-colors cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = column.accessor
                      ? column.accessor(row)
                      : row[column.id as keyof T];

                    return (
                      <td
                        key={String(column.id)}
                        className={cn(
                          'px-6 py-4 text-sm text-arcane-gray-200',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-4">
          <div className="flex items-center gap-2 text-sm text-arcane-gray-400">
            <span>Rows per page:</span>
            <select
              value={state.pageSize}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  pageSize: Number(e.target.value),
                  currentPage: 1,
                }))
              }
              className="px-2 py-1 bg-arcane-charcoal border border-arcane-slate rounded text-arcane-gray-200 focus:border-arcane-yellow focus:ring-1 focus:ring-arcane-yellow outline-none transition-colors"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="ml-4">
              {(state.currentPage - 1) * state.pageSize + 1}-
              {Math.min(state.currentPage * state.pageSize, filteredData.length)} of{' '}
              {filteredData.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setState((prev) => ({ ...prev, currentPage: 1 }))}
              disabled={state.currentPage === 1}
              className="px-3 py-1 text-sm text-arcane-gray-200 bg-arcane-charcoal border border-arcane-slate rounded hover:border-arcane-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              First
            </button>
            <button
              onClick={() =>
                setState((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))
              }
              disabled={state.currentPage === 1}
              className="px-3 py-1 text-sm text-arcane-gray-200 bg-arcane-charcoal border border-arcane-slate rounded hover:border-arcane-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-arcane-gray-200">
              Page {state.currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setState((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))
              }
              disabled={state.currentPage === totalPages}
              className="px-3 py-1 text-sm text-arcane-gray-200 bg-arcane-charcoal border border-arcane-slate rounded hover:border-arcane-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
            <button
              onClick={() => setState((prev) => ({ ...prev, currentPage: totalPages }))}
              disabled={state.currentPage === totalPages}
              className="px-3 py-1 text-sm text-arcane-gray-200 bg-arcane-charcoal border border-arcane-slate rounded hover:border-arcane-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Table.displayName = 'Table';
