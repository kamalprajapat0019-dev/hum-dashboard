import React from 'react';
import { TableToolbar } from './TableToolbar';
import { TablePagination } from './TablePagination';

/**
 * Standard Unified Table Card Container
 * Encapsulates the enterprise pattern:
 * Single Container -> Toolbar -> Divider -> Data Table -> Divider -> Pagination
 */
export function DataTable({
  children,
  toolbar = null,
  pagination = null,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`unified-table-card bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col ${className}`.trim()}
      style={style}
    >
      {/* 1. Filter Toolbar */}
      {toolbar}

      {/* 2. Divider if toolbar exists */}
      {toolbar && <div className="h-[1px] bg-slate-100 w-full" />}

      {/* 3. Data Table Grid */}
      <div className="table-responsive w-full overflow-x-auto flex-1">
        {children}
      </div>

      {/* 4. Pagination Bar */}
      {pagination}
    </div>
  );
}

export default DataTable;
