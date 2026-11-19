import React from 'react';
import { X } from 'lucide-react';

export function OverrideModal({
  isOpen,
  onClose,
  centreName,
  reason,
  setReason,
  onConfirm,
  loading,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: '#d97706' }}>Executive Eligibility Override</h3>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Executive override permits booking this centre (<strong>{centreName}</strong>) despite soft compliance warnings or pending audit clearance.
          </p>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Override Justification *</label>
            <textarea
              className="form-control"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Approved by Project Director under emergency capacity requirement..."
              required
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={loading}
            style={{ background: '#d97706', borderColor: '#d97706', color: '#fff' }}
          >
            {loading ? 'Submitting Override...' : 'Confirm Override'}
          </button>
        </div>
      </div>
    </div>
  );
}
