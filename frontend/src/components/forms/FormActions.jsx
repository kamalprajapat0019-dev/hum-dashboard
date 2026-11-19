import React from 'react';
import { Button } from '../ui/Button';

/**
 * Standard Form Footer Action Buttons
 * Provides Cancel and Submit with consistent alignment, loading state, and styling.
 */
export function FormActions({
  onCancel,
  cancelLabel = 'Cancel',
  submitLabel = 'Save Changes',
  loading = false,
  disabled = false,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`form-actions ${className}`.trim()}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 12,
        paddingTop: 16,
        borderTop: '1px solid #f1f5f9',
        ...style,
      }}
    >
      {onCancel && (
        <Button
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        variant="primary"
        size="md"
        type="submit"
        loading={loading}
        disabled={disabled || loading}
      >
        {submitLabel}
      </Button>
    </div>
  );
}

export default FormActions;
