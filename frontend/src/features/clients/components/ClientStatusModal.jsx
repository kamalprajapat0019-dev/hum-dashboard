import React from 'react';
import { Building2, X, AlertCircle, CheckCircle2, Loader2, Power } from 'lucide-react';

export function ClientStatusModal({
  isOpen,
  onClose,
  client,
  onConfirm,
  submitting = false,
}) {
  if (!isOpen || !client) return null;

  const isActivating = client.status !== 'Active';

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
      onClick={() => !submitting && onClose()}
    >
      <div
        className="card"
        style={{
          background: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 480,
          padding: 24,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              background: isActivating ? '#f0fdf4' : '#fef2f2',
              padding: 10,
              borderRadius: '50%',
              color: isActivating ? '#16a34a' : '#dc2626',
              flexShrink: 0,
            }}
          >
            {isActivating ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
                {isActivating ? 'Reactivate Client Organisation?' : 'Deactivate Client Organisation?'}
              </h3>
              <button
                className="btn-ghost"
                onClick={onClose}
                disabled={submitting}
                style={{ padding: 4, margin: '-4px -4px 0 0', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
              {isActivating ? (
                <>
                  Are you sure you want to reactivate <strong>{client.name}</strong> (<code>{client.code || client.id}</code>)?
                  <br /><br />
                  <strong>Effect:</strong> The client organisation will be restored to <strong>Active</strong> status and will be immediately eligible for scheduling new examination projects, venue allocations, and operational drives.
                </>
              ) : (
                <>
                  Are you sure you want to deactivate <strong>{client.name}</strong> (<code>{client.code || client.id}</code>)?
                  <br /><br />
                  <strong>Effect:</strong> Deactivation will mark this institutional client as <strong>Inactive</strong>. New examination projects and venue bookings cannot be initiated under this client while deactivated.
                  <br /><br />
                  All historical project audits, candidate dossiers, centre allocations, and financial invoices are strictly preserved and remain accessible for compliance review.
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
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${isActivating ? 'btn-primary' : 'btn-danger'}`}
            onClick={onConfirm}
            disabled={submitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isActivating ? '#16a34a' : '#dc2626',
              borderColor: isActivating ? '#16a34a' : '#dc2626',
              color: '#fff',
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Power size={14} />
                <span>{isActivating ? 'Confirm Reactivation' : 'Confirm Deactivation'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
