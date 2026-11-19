import React from 'react';
import { X } from 'lucide-react';

export function ApproveModal({
  isOpen,
  onClose,
  centreName,
  remarks,
  setRemarks,
  onConfirm,
  loading,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Approve Centre Application</h3>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Are you sure you want to approve <strong>{centreName}</strong>? This will transition the centre status to <strong>Ready to Book</strong>.
          </p>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Approval Remarks (Optional)</label>
            <textarea
              className="form-control"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Infrastructure verified and documents validated."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={loading}
            style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
          >
            {loading ? 'Approving...' : 'Confirm Approval'}
          </button>
        </div>
      </div>
    </div>
  );
}
