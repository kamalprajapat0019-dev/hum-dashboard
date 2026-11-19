import React from 'react';
import { Download } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

/**
 * Standard Download Action Button
 * Icon: Download (14px)
 * Tooltip: "Download file" (or custom)
 */
export function DownloadAction({
  onClick,
  tooltip = 'Download file',
  ariaLabel = 'Download file',
  disabled = false,
  loading = false,
  className = '',
  size = 'sm',
  ...props
}) {
  return (
    <IconButton
      icon={<Download size={13} />}
      variant="default"
      size={size}
      tooltip={tooltip}
      ariaLabel={ariaLabel}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      className={`action-btn-download ${className}`.trim()}
      {...props}
    />
  );
}

export default DownloadAction;
