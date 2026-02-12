/**
 * DataDisplay Component Types
 * Arcane Design System - Tier 2 Components
 */

// Table Types
export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  id: keyof T | string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  pagination?: boolean;
  defaultPageSize?: 10 | 25 | 50 | 100;
  stickyHeader?: boolean;
  className?: string;
}

export interface TableState<T> {
  sortColumn: keyof T | string | null;
  sortDirection: SortDirection;
  currentPage: number;
  pageSize: number;
  selectedRows: Set<number>;
  filters: Record<string, string>;
}

// DataGrid Types
export interface DataGridProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  infiniteScroll?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

// List Types
export interface ListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  dividers?: boolean;
  spacing?: 'sm' | 'md' | 'lg';
  virtualized?: boolean;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
}
