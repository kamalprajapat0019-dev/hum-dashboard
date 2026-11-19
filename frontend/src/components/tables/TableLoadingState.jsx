import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Standard Table Loading State
 */
export function TableLoadingState({
  message = 'Loading records...',
  colSpan = 1,
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-14 px-4 text-slate-500">
        <div className="flex flex-col items-center justify-center gap-2.5">
          <RefreshCw size={24} className="animate-spin text-blue-600" />
          <span className="text-xs font-medium text-slate-600">{message}</span>
        </div>
      </td>
    </tr>
  );
}

export default TableLoadingState;
