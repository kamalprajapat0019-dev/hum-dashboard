import React from 'react';
import { X } from 'lucide-react';

export function AuditorModal({
  isOpen,
  onClose,
  auditorId,
  setAuditorId,
  auditDate,
  setAuditDate,
  remarks,
  setRemarks,
  onConfirm,
  loading,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Assign Verification Auditor</h3>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Auditor ID or Email *</label>
            <input
              type="text"
              className="form-control"
              value={auditorId}
              onChange={(e) => setAuditorId(e.target.value)}
              placeholder="Enter Auditor User ID (e.g. auditor user id)"
              required
            />
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Scheduled Audit Date</label>
            <input
              type="date"
              className="form-control"
              value={auditDate}
              onChange={(e) => setAuditDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Instructions / Audit Scope</label>
            <textarea
              className="form-control"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Check UPS load switchover and LAN isolation."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Assigning...' : 'Assign Auditor'}
          </button>
        </div>
      </div>
    </div>
  );
}
