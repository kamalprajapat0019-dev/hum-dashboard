import React from 'react';

/**
 * Standard Form Textarea Component
 */
export function FormTextarea({
  id,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  readOnly = false,
  className = '',
  style = {},
  ...props
}) {
  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={`form-control ${className}`.trim()}
      style={{
        width: '100%',
        padding: '8px 12px',
        fontSize: '0.8125rem',
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        background: disabled ? '#f8fafc' : '#ffffff',
        color: '#1e293b',
        outline: 'none',
        resize: 'vertical',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
      {...props}
    />
  );
}

export default FormTextarea;
