import React from 'react';
import { UserX, UserCheck } from 'lucide-react';

export function UserStatusModal({
  user,
  onClose,
  onConfirm,
  actionLoading = false,
}) {
  if (!user) return null;

  const isActive = user.status === 'Active';

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
          <div style={{
            background: isActive ? '#fef2f2' : '#f0fdf4',
            padding: 10,
            borderRadius: '50%',
            color: isActive ? '#dc2626' : '#16a34a'
          }}>
            {isActive ? <UserX size={24} /> : <UserCheck size={24} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
              {isActive ? 'Deactivate User Account?' : 'Reactivate User Account?'}
            </h3>
            <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
              {isActive ? (
                <>
                  Are you sure you want to deactivate the account for <strong>{user.name}</strong> ({user.email})?
                  <br /><br />
                  <strong>Effect:</strong> Deactivation will immediately prevent future login attempts while safely preserving all historical audit logs and examination records. The user will NOT be deleted.
                </>
              ) : (
                <>
                  Are you sure you want to reactivate the account for <strong>{user.name}</strong> ({user.email})?
                  <br /><br />
                  <strong>Effect:</strong> The account will be marked Active and eligible access will be restored according to their role and scope.
                </>
              )}
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
            className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={actionLoading}
            style={{
              background: isActive ? '#dc2626' : '#16a34a',
              borderColor: isActive ? '#dc2626' : '#16a34a',
              color: '#fff'
            }}
          >
            {actionLoading ? 'Processing...' : (isActive ? 'Confirm Deactivation' : 'Confirm Activation')}
          </button>
        </div>
      </div>
    </div>
  );
}
