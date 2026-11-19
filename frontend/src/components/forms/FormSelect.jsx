import React from 'react';

/**
 * Standard Form Select Component
 * Reuses `.form-control` styling with consistent height, border, and focus states.
 */
export function FormSelect({
  id,
  name,
  value,
  onChange,
  options = [], // [{ value: string|number, label: string }]
  children,
  placeholder,
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  return (
    <select
      id={id}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      disabled={disabled}
      className={`form-control ${className}`.trim()}
      style={{
        width: '100%',
        height: 38,
        padding: '8px 12px',
        fontSize: '0.8125rem',
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        background: disabled ? '#f8fafc' : '#ffffff',
        color: '#1e293b',
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children
        ? children
        : options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
    </select>
  );
}

export default FormSelect;
