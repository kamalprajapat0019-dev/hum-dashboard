import React from 'react';
import { X } from 'lucide-react';
import { SUPPORTED_ROLES as DEFAULT_SUPPORTED_ROLES } from './constants';

export function UserEditModal({
  editingUser,
  editForm,
  setEditForm,
  onClose,
  onSubmit,
  actionLoading = false,
  availableProjects = [],
  supportedRoles = DEFAULT_SUPPORTED_ROLES,
}) {
  if (!editingUser) return null;

  const isScopeEditable = ['project_manager', 'PM', 'operations_executive', 'OPERATIONS'].includes(editForm.role);

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
        maxWidth: 520,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 0,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* Modal Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
              Edit User: {editingUser.name}
            </h3>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              User ID: {editingUser.id}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              Full Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={editForm.name}
              onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              Email Address (Read-only)
            </label>
            <input
              type="email"
              className="form-control"
              value={editingUser.email}
              disabled
              style={{ background: '#f8fafc', color: '#64748b' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              Phone Number
            </label>
            <input
              type="tel"
              className="form-control"
              value={editForm.phoneNumber}
              onChange={e => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              Role / User Type
            </label>
            <select
              className="form-control"
              value={editForm.role}
              onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
            >
              {supportedRoles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              Account Status
            </label>
            <select
              className="form-control"
              value={editForm.status}
              onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Scope selection for internal roles */}
          {isScopeEditable && availableProjects.length > 0 && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 6 }}>
                Assigned Project Scope
              </label>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 0, marginBottom: 8 }}>
                Select permitted projects. Leave unselected to oversee all projects.
              </p>
              <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {availableProjects.map(p => (
                  <label key={p.id} style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editForm.selectedProjects?.includes(p.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setEditForm(prev => ({ ...prev, selectedProjects: [...(prev.selectedProjects || []), p.id] }));
                        } else {
                          setEditForm(prev => ({ ...prev, selectedProjects: (prev.selectedProjects || []).filter(id => id !== p.id) }));
                        }
                      }}
                    />
                    <span>{p.name} ({p.projectCode || p.id})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
