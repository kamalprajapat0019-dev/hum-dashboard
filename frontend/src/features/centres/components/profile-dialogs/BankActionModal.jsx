import React from 'react';
import { X } from 'lucide-react';

export function BankActionModal({
  modalState,
  onClose,
  remarks,
  setRemarks,
  rejectionReason,
  setRejectionReason,
  onConfirm,
  loading,
}) {
  if (!modalState) return null;

  const isReject = (typeof modalState === 'object' && modalState.action === 'reject') || modalState === 'reject';

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isReject ? 'Reject Bank Details' : 'Approve & Verify Bank Details'}
          </h3>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {isReject ? (
            <div className="form-group">
              <label className="form-label" style={{ color: '#991b1b', fontWeight: 600 }}>Rejection Reason *</label>
              <textarea
                className="form-control"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify reason (e.g. beneficiary name mismatch, invalid IFSC)..."
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Verifying this bank account will enable this centre for commercial settlement and payment disbursements.
              </p>
              <label className="form-label" style={{ marginTop: 10 }}>Approval Remarks (Optional)</label>
              <textarea
                className="form-control"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Account name matches registered centre name."
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: !isReject ? '#16a34a' : '#dc2626',
              borderColor: !isReject ? '#16a34a' : '#dc2626',
              color: '#fff',
            }}
          >
            {loading ? 'Saving...' : !isReject ? 'Approve Bank' : 'Reject Bank'}
          </button>
        </div>
      </div>
    </div>
  );
}
