import React from 'react';

/**
 * Standard Form Input Component
 * Reuses `.form-control` styling with consistent height, border, and focus states.
 */
export function FormInput({
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  className = '',
  style = {},
  ...props
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
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
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
      {...props}
    />
  );
}

export default FormInput;
