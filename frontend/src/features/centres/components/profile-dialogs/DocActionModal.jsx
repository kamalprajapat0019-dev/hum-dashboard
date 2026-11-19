import React from 'react';
import { X } from 'lucide-react';

export function DocActionModal({
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

  const isVerify = modalState.action === 'verify';

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isVerify ? 'Verify Supporting Document' : 'Reject Supporting Document'}
          </h3>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: '0.8125rem' }}>
            Document: <strong>{modalState.doc?.documentName || modalState.doc?.documentType}</strong> ({modalState.doc?.fileName})
          </div>

          {!isVerify ? (
            <div className="form-group">
              <label className="form-label" style={{ color: '#991b1b', fontWeight: 600 }}>Rejection Reason *</label>
              <textarea
                className="form-control"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify why document is rejected (e.g. blurred, expired)..."
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Verification Remarks (Optional)</label>
              <textarea
                className="form-control"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Validated against official database."
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
              background: isVerify ? '#16a34a' : '#dc2626',
              borderColor: isVerify ? '#16a34a' : '#dc2626',
              color: '#fff',
            }}
          >
            {loading ? 'Processing...' : isVerify ? 'Mark Verified' : 'Reject Document'}
          </button>
        </div>
      </div>
    </div>
  );
}
