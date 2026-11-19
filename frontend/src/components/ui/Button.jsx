import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Standard Enterprise Button Component
 * Reuses design tokens and CSS classes from globals.css (.btn, .btn-primary, .btn-secondary, etc.)
 */
export function Button({
  children,
  variant = 'secondary', // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon = null,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  title,
  style = {},
  ...props
}) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  }[variant] || 'btn-secondary';

  const sizeClass = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }[size] || '';

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      style={style}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" />
      ) : icon ? (
        <span className="btn-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
          {icon}
        </span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}

export default Button;
