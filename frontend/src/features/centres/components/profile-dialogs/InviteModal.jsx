import React from 'react';
import { X, CheckCircle, Copy, Send } from 'lucide-react';

export function InviteModal({
  isOpen,
  onClose,
  centre,
  inviteForm,
  setInviteForm,
  inviteResult,
  inviting,
  handleSendInvite,
  handleCopyLink,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Invite Centre Portal Administrator</h3>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        {inviteResult ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CheckCircle size={28} color="#16a34a" />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Invitation Link Generated!
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '0.8125rem', color: '#64748b' }}>
              Share this secure single-use registration URL with the centre superintendent or authorized personnel.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, wordBreak: 'break-all' }}>
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#1e40af', flex: 1, textAlign: 'left' }}>
                {inviteResult.registrationUrl}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleCopyLink}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Copy size={13} /> Copy Link
              </button>
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                style={{ width: '100%' }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendInvite}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, fontSize: '0.8125rem', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b' }}>Assigned Venue:</div>
                <strong style={{ color: '#0f172a' }}>{centre?.centreName} ({centre?.centreCode || centre?.id})</strong>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Contact Person Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="e.g. Dr. Ramesh Kumar"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="e.g. superintendent@centre.edu.in"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number (Optional)</label>
                <input
                  type="tel"
                  className="form-control"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Operational Notes / Scope Instructions (Optional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={inviteForm.notes}
                  onChange={(e) => setInviteForm({ ...inviteForm, notes: e.target.value })}
                  placeholder="e.g. Authorized to submit seating dossiers and lab infrastructure."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={inviting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={inviting} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={14} /> {inviting ? 'Generating Invitation...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
