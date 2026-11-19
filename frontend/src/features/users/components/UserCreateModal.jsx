import React from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { SUPPORTED_ROLES as DEFAULT_SUPPORTED_ROLES } from './constants';

export function UserCreateModal({
  isOpen,
  onClose,
  createForm,
  setCreateForm,
  onSubmit,
  actionLoading = false,
  availableProjects = [],
  availableCentres = [],
  supportedRoles = DEFAULT_SUPPORTED_ROLES,
}) {
  if (!isOpen) return null;

  const isInternalRole = ['project_manager', 'PM', 'operations_executive', 'OPERATIONS', 'auditor_it', 'AUDITOR', 'accounts_finance', 'FINANCE'].includes(createForm.role);
  const emailDomain = createForm.email?.includes('@') ? createForm.email.split('@')[1].toLowerCase() : '';
  const isApprovedDomain = emailDomain === 'oemportal.in' || emailDomain === 'assessinfra.com';

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
        maxWidth: 600,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 0,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* Modal Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
              Create New User
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Provision an enterprise or centre account with RBAC controls and scope delegation.
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={onSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Common: Role / User Type */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              User Type / Role <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              className="form-control"
              value={createForm.role}
              onChange={e => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
              required
            >
              {supportedRoles.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label} ({r.raw})
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
              {supportedRoles.find(r => r.value === createForm.role)?.desc}
            </div>
          </div>

          {/* Common: Full Name */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              Full Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Ramesh Chandra"
              value={createForm.name}
              onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Common: Email Address */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              Email ID / Login ID <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="email"
              className="form-control"
              placeholder={isInternalRole ? 'user@oemportal.in' : 'centre.admin@gmail.com'}
              value={createForm.email}
              onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
              required
            />
            {/* Email Domain Validation Feedback */}
            {createForm.email?.includes('@') && (
              <div style={{ fontSize: '0.75rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                {isInternalRole ? (
                  isApprovedDomain ? (
                    <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={13} /> Approved organisation domain (@{emailDomain})
                    </span>
                  ) : (
                    <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={13} /> Organisation domain required (@oemportal.in or @assessinfra.com)
                    </span>
                  )
                ) : (
                  <span style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={13} /> Global email domain allowed for Centre User
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Common: Phone Number */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              Mobile Number
            </label>
            <input
              type="tel"
              className="form-control"
              placeholder="e.g. 9876543210 (10 digits)"
              value={createForm.phoneNumber}
              onChange={e => setCreateForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
            />
          </div>

          {/* Role-Specific Fields */}
          {/* Case 1: Project Manager / Operations Scope */}
          {['project_manager', 'PM', 'operations_executive', 'OPERATIONS'].includes(createForm.role) && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 6 }}>
                Assigned Project Scope
              </label>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 0, marginBottom: 8 }}>
                Select projects this user is permitted to oversee. Leave unselected to grant global scope.
              </p>
              <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {availableProjects.length === 0 ? (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No projects available for scoping</span>
                ) : (
                  availableProjects.map(p => (
                    <label key={p.id} style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={createForm.selectedProjects?.includes(p.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setCreateForm(prev => ({ ...prev, selectedProjects: [...(prev.selectedProjects || []), p.id] }));
                          } else {
                            setCreateForm(prev => ({ ...prev, selectedProjects: (prev.selectedProjects || []).filter(id => id !== p.id) }));
                          }
                        }}
                      />
                      <span>{p.name} ({p.projectCode || p.id})</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Case 2: Accounts User (Predefined Profile Notice) */}
          {['accounts_finance', 'FINANCE'].includes(createForm.role) && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12, fontSize: '0.75rem', color: '#92400e' }}>
              <strong>Predefined Accounts Profile:</strong> Accounts team users are assigned standard financial ledger, milestone signoff, cost sheet, and invoice reconciliation permissions. These permissions cannot be manually broadened.
            </div>
          )}

          {/* Case 3: Centre User (Associate Client and Centre) */}
          {['centre_user', 'CENTRE'].includes(createForm.role) && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Associated Centre Record
                </label>
                <select
                  className="form-control"
                  value={createForm.centreId}
                  onChange={e => setCreateForm(prev => ({ ...prev, centreId: e.target.value }))}
                >
                  <option value="">Select Examination Centre...</option>
                  {availableCentres.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.centreName || c.name} ({c.centreCode || c.id}) {c.cityName ? `— ${c.cityName}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Associating a centre ensures the Centre User is restricted strictly to their own venue registration and examinee allocation dossier.
              </div>
            </div>
          )}

          {/* Password Option: Invitation vs Temporary Password */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={createForm.sendInvitation}
                onChange={e => setCreateForm(prev => ({ ...prev, sendInvitation: e.target.checked }))}
              />
              <span>Generate secure single-use invitation / activation link (Recommended)</span>
            </label>
            {!createForm.sendInvitation && (
              <div style={{ marginTop: 10 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Set Custom Temporary Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Minimum 8 characters"
                  value={createForm.customPassword}
                  onChange={e => setCreateForm(prev => ({ ...prev, customPassword: e.target.value }))}
                  minLength={8}
                />
              </div>
            )}
          </div>

          {/* Modal Actions */}
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
              {actionLoading ? 'Provisioning...' : 'Provision Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
