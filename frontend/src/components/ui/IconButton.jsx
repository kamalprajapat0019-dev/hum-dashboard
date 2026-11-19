import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Standard Enterprise Icon-Only Button
 * Compact 30x30px or 34x34px square button with accessible tooltip, aria-label, and hover effects.
 */
export function IconButton({
  icon,
  variant = 'default', // 'default' | 'primary' | 'edit' | 'danger' | 'warning' | 'success' | 'ghost'
  size = 'sm', // 'sm' (30x30) | 'md' (34x34)
  tooltip,
  ariaLabel,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  style = {},
  type = 'button',
  ...props
}) {
  const isSm = size === 'sm';
  const dimension = isSm ? 30 : 34;

  const getVariantStyles = () => {
    switch (variant) {
      case 'edit':
        return {
          color: '#2563eb',
          borderColor: 'rgba(226, 232, 240, 0.95)',
          background: 'rgba(255, 255, 255, 0.9)',
        };
      case 'danger':
        return {
          color: '#dc2626',
          borderColor: '#fecaca',
          background: '#fef2f2',
        };
      case 'warning':
        return {
          color: '#d97706',
          borderColor: '#fde68a',
          background: '#fffbeb',
        };
      case 'success':
        return {
          color: '#16a34a',
          borderColor: '#bbf7d0',
          background: '#f0fdf4',
        };
      case 'primary':
        return {
          color: '#ffffff',
          borderColor: '#2563eb',
          background: '#2563eb',
        };
      case 'ghost':
        return {
          color: 'var(--text-secondary, #64748b)',
          borderColor: 'transparent',
          background: 'transparent',
        };
      default:
        return {
          color: '#475569',
          borderColor: 'var(--border-default, #e2e8f0)',
          background: 'rgba(255, 255, 255, 0.9)',
        };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <button
      type={type}
      className={`btn-table-action ${className}`.trim()}
      onClick={onClick}
      disabled={disabled || loading}
      title={tooltip || ariaLabel}
      aria-label={ariaLabel || tooltip}
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'all 0.15s ease',
        ...variantStyle,
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin" />
      ) : React.isValidElement(icon) ? (
        icon
      ) : typeof icon === 'function' || (icon && (icon.$$typeof || icon.render)) ? (
        React.createElement(icon, { size: 13 })
      ) : (
        icon
      )}
    </button>
  );
}

export default IconButton;
