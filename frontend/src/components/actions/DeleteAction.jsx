import React from 'react';
import { Trash2 } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

/**
 * Standard Delete Action Button
 * Icon: Trash2 (14px)
 * Tooltip: "Delete record" (or custom)
 * Danger variant with red hover & accessible alert.
 */
export function DeleteAction({
  onClick,
  tooltip = 'Delete record',
  ariaLabel = 'Delete record',
  disabled = false,
  loading = false,
  className = '',
  size = 'sm',
  ...props
}) {
  return (
    <IconButton
      icon={<Trash2 size={13} />}
      variant="danger"
      size={size}
      tooltip={tooltip}
      ariaLabel={ariaLabel}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      className={`action-btn-delete ${className}`.trim()}
      {...props}
    />
  );
}

export default DeleteAction;
