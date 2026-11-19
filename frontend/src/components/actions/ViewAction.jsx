import React from 'react';
import { Eye } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

/**
 * Standard View Action Button
 * Icon: Eye (14px)
 * Tooltip: "View details" (or custom)
 * Accessible and aligned.
 */
export function ViewAction({
  onClick,
  tooltip = 'View details',
  ariaLabel = 'View details',
  disabled = false,
  loading = false,
  className = '',
  size = 'sm',
  ...props
}) {
  return (
    <IconButton
      icon={<Eye size={14} />}
      variant="default"
      size={size}
      tooltip={tooltip}
      ariaLabel={ariaLabel}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      className={`action-btn-view ${className}`.trim()}
      {...props}
    />
  );
}

export default ViewAction;
