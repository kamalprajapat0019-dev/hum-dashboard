import React from 'react';

/**
 * Standard Form Field Wrapper
 * Renders label with optional required asterisk, helper text, and error message.
 */
export function FormField({
  label,
  required = false,
  error = null,
  helperText = null,
  htmlFor,
  children,
  className = '',
  style = {},
}) {
  return (
    <div className={`form-group ${className}`.trim()} style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="form-label"
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>{label}</span>
          {required && <span style={{ color: '#dc2626' }}>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 2 }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{helperText}</span>
      ) : null}
    </div>
  );
}

export default FormField;
