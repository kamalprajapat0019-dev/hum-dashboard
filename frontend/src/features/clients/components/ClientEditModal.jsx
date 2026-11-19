import React from 'react';
import { Edit, X, Lock, Loader2 } from 'lucide-react';

export function ClientEditModal({
  isOpen,
  onClose,
  selectedClient,
  form,
  setForm,
  onSubmit,
  submitting,
}) {
  if (!isOpen || !selectedClient) return null;

  return (
    <div className="modal-backdrop" onClick={() => !submitting && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit size={18} color="var(--color-primary)" />
            Edit Client: {selectedClient.name}
          </h3>
          <button
            className="btn-ghost"
            onClick={onClose}
            disabled={submitting}
            style={{ padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal-form">
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Client ID (Read-only) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={12} color="var(--text-muted)" />
                Client ID (System Generated — Read-Only)
              </label>
              <input
                type="text"
                className="form-control"
                disabled
                value={selectedClient.code || selectedClient.id}
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontFamily: 'monospace' }}
              />
            </div>

            {/* Client Name (Read-only during normal editing) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={12} color="var(--text-muted)" />
                Client Name (Read-Only)
              </label>
              <input
                type="text"
                className="form-control"
                disabled
                value={selectedClient.name}
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Client Name is permanent per OEMP specification. Legal rename requires controlled Admin approval.
              </span>
            </div>

            {/* Client Representative Name (Editable) */}
            <div className="form-group">
              <label className="form-label">Client Representative Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            {/* Client Representative Official Email ID (Editable) */}
            <div className="form-group">
              <label className="form-label">Client Representative Official Email ID *</label>
              <input
                type="email"
                className="form-control"
                required
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Scope / Notes */}
            <div className="form-group">
              <label className="form-label">Scope / Notes</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Calculated Projects Indicators (Read-only) */}
            <div style={{
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              display: 'flex',
              justifyContent: 'space-around',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Associated Exams</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {selectedClient.totalExams ?? (selectedClient._count?.projects || 0)}
                </div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Exam Drives</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#16a34a' }}>
                  {selectedClient.activeExams ?? 0}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
