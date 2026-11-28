import React from 'react';
import { X, CheckCircle, Copy, Send, Clock, Phone, Mail } from 'lucide-react';

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
      <div className="modal" style={{ maxWidth: 520, borderRadius: 12 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Send size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                Send Sign-Up Link (FRD Sec. 4.1)
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Generates a secure 72-hour registration link for Centre Users
              </span>
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        {inviteResult ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CheckCircle size={32} color="#16a34a" />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Sign-Up Link Dispatched!
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
              Share this secure single-use registration URL with the centre superintendent or authorized personnel.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px', display: 'flex', alignItems: 'center', gap: 8, wordBreak: 'break-all', marginBottom: 12 }}>
              <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: '#1e40af', flex: 1, textAlign: 'left' }}>
                {inviteResult.registrationUrl?.startsWith('http')
                  ? inviteResult.registrationUrl
                  : `${window.location.origin}${inviteResult.registrationUrl}`}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleCopyLink}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <Copy size={13} /> Copy Link
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.75rem', color: '#b45309', background: '#fef3c7', padding: '6px 12px', borderRadius: 6, marginBottom: 20 }}>
              <Clock size={14} />
              <span>Link expires automatically after <strong>72 hours</strong>. Single-use only.</span>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
              style={{ width: '100%', padding: '10px 0' }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendInvite}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px' }}>
              {centre && (
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, fontSize: '0.8125rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Assigned Venue:</div>
                  <strong style={{ color: '#0f172a' }}>{centre?.centreName} ({centre?.centreCode || centre?.id})</strong>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Centre Name / Representative Name <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
                </label>
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
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Centre Official Email <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-control"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="e.g. superintendent@centre.edu.in"
                    required
                  />
                  <Mail size={15} color="#94a3b8" style={{ position: 'absolute', right: 12, top: 12 }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                  Official registration invitation will be dispatched to this address.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Centre WhatsApp Mobile Number <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    maxLength={10}
                    className="form-control"
                    value={inviteForm.phone || inviteForm.whatsappNumber || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setInviteForm({ ...inviteForm, phone: val, whatsappNumber: val });
                    }}
                    placeholder="e.g. 9876543210"
                    required
                  />
                  <Phone size={15} color="#94a3b8" style={{ position: 'absolute', right: 12, top: 12 }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                  Sign-up link and registration OTP will be sent via WhatsApp.
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                <span>
                  Link valid for <strong>72 hours</strong>. Blocks unauthorized reuse after expiry.
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={inviting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={inviting}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Send size={14} className={inviting ? 'animate-spin' : ''} />
                {inviting ? 'Generating 72h Link...' : 'Send Sign-Up Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default InviteModal;

