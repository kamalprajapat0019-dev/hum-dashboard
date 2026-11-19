import React from 'react';

/**
 * Standard ActionGroup container for table action columns
 * Keeps action buttons horizontally aligned, vertically centered, and properly spaced.
 */
export function ActionGroup({ children, align = 'right', className = '', style = {} }) {
  const justify = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  }[align] || 'flex-end';

  return (
    <div
      className={`actions-cell-wrapper ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: justify,
        gap: 6,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default ActionGroup;
