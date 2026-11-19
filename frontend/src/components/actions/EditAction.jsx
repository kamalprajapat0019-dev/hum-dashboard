import React from 'react';
import { Pencil } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

/**
 * Standard Edit Action Button
 * Icon: Pencil (14px)
 * Tooltip: "Edit record" (or custom)
 * Accessible and aligned.
 */
export function EditAction({
  onClick,
  tooltip = 'Edit record',
  ariaLabel = 'Edit record',
  disabled = false,
  loading = false,
  className = '',
  size = 'sm',
  ...props
}) {
  return (
    <IconButton
      icon={<Pencil size={13} />}
      variant="edit"
      size={size}
      tooltip={tooltip}
      ariaLabel={ariaLabel}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      className={`action-btn-edit ${className}`.trim()}
      {...props}
    />
  );
}

export default EditAction;
