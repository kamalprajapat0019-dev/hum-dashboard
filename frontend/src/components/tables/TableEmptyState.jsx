import React from 'react';
import { Database } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * Standard Table Empty State
 */
export function TableEmptyState({
  title = 'No records found',
  description = 'Try adjusting your search criteria or filters.',
  icon = null,
  onReset = null,
  resetLabel = 'Reset Filters',
  colSpan = 1,
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-12 px-4">
        <div className="flex flex-col items-center justify-center gap-2">
          {icon || <Database size={32} className="text-slate-300" />}
          <div className="font-semibold text-slate-700 text-sm mt-1">{title}</div>
          <p className="text-xs text-slate-500 max-w-sm">{description}</p>
          {onReset && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onReset}
              className="mt-2"
            >
              {resetLabel}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default TableEmptyState;
