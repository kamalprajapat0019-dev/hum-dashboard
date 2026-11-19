import React from 'react';
import { Key } from 'lucide-react';

export function PasswordResetModal({
  user,
  onClose,
  onConfirm,
  actionLoading = false,
}) {
  if (!user) return null;

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div className="card" style={{
        background: '#fff',
        borderRadius: 14,
        width: '100%',
        maxWidth: 480,
        padding: 24,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ background: '#eff6ff', padding: 10, borderRadius: '50%', color: '#2563eb' }}>
            <Key size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
              Initiate Password Reset?
            </h3>
            <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
              You are generating a secure password reset link for:
              <br />
              <strong>{user.name}</strong> ({user.email})
              <br /><br />
              The link will be single-use, time-limited (24 hours), and will allow the user to define a new password without providing the old password.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={actionLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={actionLoading}
          >
            {actionLoading ? 'Generating...' : 'Generate Reset Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
