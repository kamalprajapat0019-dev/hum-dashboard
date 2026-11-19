import React from 'react';
import { X } from 'lucide-react';

export function RejectModal({
  isOpen,
  onClose,
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
          <h3 className="modal-title" style={{ color: '#dc2626' }}>Reject Centre Application</h3>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            A mandatory rejection reason is required and will be communicated to the Centre User for correction.
          </p>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label" style={{ color: '#991b1b', fontWeight: 600 }}>Rejection Reason *</label>
            <textarea
              className="form-control"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Specify why this application is rejected..."
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
            style={{ background: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
          >
            {loading ? 'Rejecting...' : 'Reject Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
