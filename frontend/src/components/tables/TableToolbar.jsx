import React from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * Standard Table Toolbar
 * Holds search input, filter dropdowns, and an optional clear-filters button.
 */
export function TableToolbar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = null, // Custom dropdowns or children
  onClearFilters,
  hasActiveFilters = false,
  actions = null, // Secondary action buttons (e.g., Export, Refresh)
  className = '',
  style = {},
}) {
  return (
    <div
      className={`table-toolbar flex flex-wrap items-center justify-between gap-3 p-4 bg-white/70 ${className}`.trim()}
      style={{ minHeight: 60, ...style }}
    >
      <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
        {/* Search Input */}
        {onSearchChange && (
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-white/90 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Custom Filters */}
        {filters}

        {/* Clear Filters Button */}
        {hasActiveFilters && onClearFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            icon={<X size={12} />}
            style={{ color: '#dc2626' }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Toolbar Right Actions */}
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default TableToolbar;
