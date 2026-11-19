import React from 'react';
import { X, Loader2 } from 'lucide-react';

export function ProjectFormModal({
  isOpen,
  onClose,
  editingProject,
  projectForm,
  setProjectForm,
  clients,
  onSubmit,
  submitting,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h3 className="modal-title">
            {editingProject ? `Edit Project (${projectForm.projectCode})` : 'Create New Project'}
          </h3>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4 }} title="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Row 1: Project Code & Associated Client */}
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Project Code <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  readOnly
                  placeholder="Auto-generated"
                  value={projectForm.projectCode || ''}
                  style={{
                    background: 'var(--bg-subtle, #f8fafc)',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--color-primary, #1e40af)',
                    cursor: 'not-allowed',
                  }}
                  title="Project Code is automatically generated and read-only"
                />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  Auto-generated sequential code (e.g. PRJ-0001)
                </span>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Associated Client <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>
                </label>
                <select
                  className="form-control"
                  required
                  value={projectForm.clientId || ''}
                  onChange={e => setProjectForm({ ...projectForm, clientId: e.target.value })}
                >
                  <option value="">Select an active client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.fullName ? `(${c.fullName})` : ''} {c.status === 'Inactive' ? '[Inactive]' : ''}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  Mandatory institutional client
                </span>
              </div>
            </div>

            {/* Row 2: Project Name (full width) */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Project Name <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Staff Selection Commission GD 2027"
                value={projectForm.name || ''}
                onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
              />
            </div>

            {/* Row 3: Financial Year & Project Status */}
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Financial Year <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>
                </label>
                <select
                  className="form-control"
                  required
                  value={projectForm.financialYear || '2026-2027'}
                  onChange={e => setProjectForm({ ...projectForm, financialYear: e.target.value })}
                >
                  <option value="2027-2028">2027-2028</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                </select>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  Target financial year cycle
                </span>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Project Status <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>
                </label>
                <select
                  className="form-control"
                  required
                  value={projectForm.status || 'Active'}
                  onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="OnHold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Closed">Closed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  Current project lifecycle status
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: 16 }}>
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
                  <Loader2 className="animate-spin" size={14} style={{ marginRight: 6 }} />
                  Saving...
                </>
              ) : (
                editingProject ? 'Save Changes' : 'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
