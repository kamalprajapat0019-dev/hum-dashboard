import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

/**
 * Standard Table Pagination Controls
 * Handles page size selector, record count range, and page navigation.
 */
export function TablePagination({
  page = 1,
  limit = 10,
  total = 0,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div
      className={`table-pagination flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600 ${className}`.trim()}
    >
      {/* Records info */}
      <div className="flex items-center gap-2">
        <span>
          Showing <strong className="text-slate-800">{startRecord}</strong> to{' '}
          <strong className="text-slate-800">{endRecord}</strong> of{' '}
          <strong className="text-slate-800">{total}</strong> records
        </span>
      </div>

      {/* Page Size & Navigation */}
      <div className="flex items-center gap-4">
        {onLimitChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1">
          <span className="mr-2 text-slate-500">
            Page {page} of {totalPages}
          </span>
          <IconButton
            icon={<ChevronLeft size={14} />}
            variant="default"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            tooltip="Previous page"
            ariaLabel="Previous page"
          />
          <IconButton
            icon={<ChevronRight size={14} />}
            variant="default"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            tooltip="Next page"
            ariaLabel="Next page"
          />
        </div>
      </div>
    </div>
  );
}

export default TablePagination;
