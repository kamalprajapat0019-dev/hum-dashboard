import React from 'react';
import { Building2, X, Lock, Plus, Loader2 } from 'lucide-react';

export function ClientCreateModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
  submitting,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => !submitting && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={20} color="var(--color-primary)" />
            Create New Client Organisation
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
            {/* Auto-generated Client ID note */}
            <div style={{
              padding: '10px 14px',
              borderRadius: 6,
              background: 'rgba(30, 64, 175, 0.08)',
              border: '1px solid rgba(30, 64, 175, 0.2)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Lock size={15} color="var(--color-primary)" />
              <span>
                <strong>Client ID:</strong> Auto-generated system code (e.g. <code>CLT-004</code>) will be permanently assigned upon creation.
              </span>
            </div>

            {/* Client Name */}
            <div className="form-group">
              <label className="form-label">
                Client Name *
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                  (Official commissioning agency name)
                </span>
              </label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. National Testing Agency / State Commission"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Client Representative Name */}
            <div className="form-group">
              <label className="form-label">
                Client Representative Name *
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                  (Primary point of contact)
                </span>
              </label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Dr. Rajesh Sharma"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            {/* Client Representative Official Email ID */}
            <div className="form-group">
              <label className="form-label">
                Client Representative Official Email ID *
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                  (Official correspondence email)
                </span>
              </label>
              <input
                type="email"
                className="form-control"
                required
                placeholder="e.g. rajesh.sharma@agency.gov.in"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select
                className="form-control"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Description / Scope */}
            <div className="form-group">
              <label className="form-label">Organisation Scope / Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Brief description of jurisdiction, examination mandates..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
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
                  Creating Client...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Register Client
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
