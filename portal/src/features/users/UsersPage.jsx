import { useState } from 'react';
import {
  Users, UserPlus, Shield, Check, X, Edit, Trash2, Search,
  Filter, RefreshCw, CheckCircle2, Lock, Key, Eye, AlertCircle
} from 'lucide-react';
import { UserStore, appendAuditLog } from '@/services/dataService';
import { useAuth, ROLES, ROLE_LABELS, ROLE_COLORS } from '@/context/AuthContext';
import { StatusBadge } from '@/components/common';

const PERMISSION_MATRIX = [
  { module: 'User & Role Management', admin: 'Full Control', pm: 'View Only', auditor: 'None', ops: 'None', finance: 'None', centre: 'None' },
  { module: 'Client & Project Setup', admin: 'Full Control', pm: 'Full Control', auditor: 'View Only', ops: 'View Only', finance: 'View Only', centre: 'None' },
  { module: 'Centre Master Registry', admin: 'Full Control', pm: 'View & Edit', auditor: 'View Only', ops: 'Full Control', finance: 'View Only', centre: 'Own Profile' },
  { module: 'Eligibility & Blacklist', admin: 'Full Control', pm: 'Review & Vote', auditor: 'View Only', ops: 'Manage', finance: 'None', centre: 'None' },
  { module: 'Booking & Locking', admin: 'Full Control', pm: 'Approve', auditor: 'View Only', ops: 'Execute', finance: 'None', centre: 'Accept/Discuss' },
  { module: 'Digital Consent', admin: 'Full Control', pm: 'Track', auditor: 'View Only', ops: 'Issue', finance: 'None', centre: 'Sign/Consent' },
  { module: 'Document Verification', admin: 'Full Control', pm: 'Review', auditor: 'Audit Docs', ops: 'Verify & Reject', finance: 'Finance Docs', centre: 'Upload & Update' },
  { module: 'Audit & Compliance', admin: 'Full Control', pm: 'Escalations', auditor: 'Submit Findings', ops: 'Track Rework', finance: 'None', centre: 'View Issues' },
  { module: 'Technical Scan & Mock', admin: 'Full Control', pm: 'View & Alert', auditor: 'Scan & Mock Report', ops: 'Track Pass/Fail', finance: 'None', centre: 'View Results' },
  { module: 'Allocation & Calling', admin: 'Full Control', pm: 'Approve Target', auditor: 'None', ops: 'Call & Lock', finance: 'None', centre: 'View Allotment' },
  { module: 'Commercials & Cost Sheets', admin: 'Full Control', pm: 'Review Rate', auditor: 'None', ops: 'View', finance: 'Full Control', centre: 'Quotation' },
  { module: 'Invoicing & Payments', admin: 'Full Control', pm: 'Milestone Signoff', auditor: 'None', ops: 'None', finance: 'Full Control', centre: 'Submit Invoice' },
];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(() => UserStore.getAll());
  const [activeTab, setActiveTab] = useState('users'); // users | matrix
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const initialForm = {
    name: '',
    email: '',
    role: 'operations_executive',
    status: 'Active',
    avatar: 'UN',
  };
  const [formData, setFormData] = useState(initialForm);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadUsers = () => setUsers(UserStore.getAll());

  const filteredUsers = users.filter(u => {
    if (search) {
      const q = search.toLowerCase();
      const match = u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter && u.status !== statusFilter) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({ ...u });
    setShowModal(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const initials = formData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'US';

    if (editingUser) {
      UserStore.update(editingUser.id, { ...formData, avatar: initials });
      appendAuditLog({
        user: currentUser?.name || 'Admin',
        role: 'admin',
        action: 'UPDATE_USER',
        entity: `User: ${formData.name}`,
        details: `Updated role to ${ROLE_LABELS[formData.role]} and status to ${formData.status}`,
      });
      showToast(`User "${formData.name}" updated successfully!`);
    } else {
      UserStore.create({ ...formData, avatar: initials, lastLogin: 'Never' });
      appendAuditLog({
        user: currentUser?.name || 'Admin',
        role: 'admin',
        action: 'CREATE_USER',
        entity: `User: ${formData.name}`,
        details: `Created new user with role ${ROLE_LABELS[formData.role]}`,
      });
      showToast(`User "${formData.name}" created successfully!`);
    }

    reloadUsers();
    setShowModal(false);
  };

  const handleToggleStatus = (u) => {
    const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
    UserStore.update(u.id, { status: nextStatus });
    appendAuditLog({
      user: currentUser?.name || 'Admin',
      role: 'admin',
      action: 'TOGGLE_USER_STATUS',
      entity: `User: ${u.name}`,
      details: `Status set to ${nextStatus}`,
    });
    reloadUsers();
    showToast(`User "${u.name}" is now ${nextStatus}`);
  };

  const handleDeleteUser = (u) => {
    if (confirm(`Are you sure you want to delete user "${u.name}"?`)) {
      UserStore.delete(u.id);
      appendAuditLog({
        user: currentUser?.name || 'Admin',
        role: 'admin',
        action: 'DELETE_USER',
        entity: `User: ${u.name}`,
        details: 'User account removed from system',
      });
      reloadUsers();
      showToast(`User "${u.name}" removed.`);
    }
  };

  return (
    <div>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: 'var(--color-primary-dark)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <div className="breadcrumb">
              <span>Admin</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">User & Role Management</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>Identity & Access Management</h1>
            <p className="page-header__subtitle">
              Provision users, enforce Role-Based Access Control (RBAC), and inspect the enterprise permission matrix
            </p>
          </div>
          <div className="page-header__actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                UserStore.reset();
                reloadUsers();
                showToast('Reset user store to default seed users');
              }}
            >
              <RefreshCw size={14} /> Reset Users
            </button>
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <UserPlus size={14} /> Provision New User
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Accounts ({users.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
          onClick={() => setActiveTab('matrix')}
        >
          Role Permission Matrix (6 Roles)
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          {/* Summary KPI row */}
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Total Accounts</span>
                <div className="kpi-card__icon" style={{ background: '#eff6ff' }}>
                  <Users size={16} color="#1e40af" />
                </div>
              </div>
              <div className="kpi-card__value">{users.length}</div>
              <div className="kpi-card__sub">Across all 6 enterprise roles</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Active Users</span>
                <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
                  <CheckCircle2 size={16} color="#16a34a" />
                </div>
              </div>
              <div className="kpi-card__value" style={{ color: 'var(--color-success)' }}>
                {users.filter(u => u.status === 'Active').length}
              </div>
              <div className="kpi-card__sub">Active authentication tokens</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Internal Staff</span>
                <div className="kpi-card__icon" style={{ background: '#faf5ff' }}>
                  <Shield size={16} color="#7c3aed" />
                </div>
              </div>
              <div className="kpi-card__value" style={{ color: 'var(--color-purple)' }}>
                {users.filter(u => u.role !== 'centre_user').length}
              </div>
              <div className="kpi-card__sub">Operations, PM, Audit & Finance</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Centre Representatives</span>
                <div className="kpi-card__icon" style={{ background: '#fffbeb' }}>
                  <Lock size={16} color="#d97706" />
                </div>
              </div>
              <div className="kpi-card__value" style={{ color: 'var(--color-warning)' }}>
                {users.filter(u => u.role === 'centre_user').length}
              </div>
              <div className="kpi-card__sub">Scoped to venue portals</div>
            </div>
          </div>

          {/* Users Table Card */}
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div style={{ position: 'relative', width: 280 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 30, fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="form-control"
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  style={{ width: 170, fontSize: '0.75rem' }}
                >
                  <option value="">All Roles</option>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>

                <select
                  className="form-control"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ width: 130, fontSize: '0.75rem' }}
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email Address</th>
                    <th>Assigned Role</th>
                    <th>Account Status</th>
                    <th>Last Active</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No users matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => {
                      const color = ROLE_COLORS[u.role] || '#64748b';
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                className="avatar avatar-md"
                                style={{ background: color }}
                              >
                                {u.avatar || 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>ID: {u.id}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>{u.email}</span>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '3px 9px',
                                borderRadius: 'var(--radius-full)',
                                background: `${color}18`,
                                color: color,
                                border: `1px solid ${color}35`,
                              }}
                            >
                              <Shield size={11} />
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                          </td>
                          <td>
                            <StatusBadge status={u.status} />
                          </td>
                          <td>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleToggleStatus(u)}
                                title={u.status === 'Active' ? 'Deactivate user' : 'Activate user'}
                              >
                                {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenEdit(u)}
                                title="Edit user details"
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--color-danger)' }}
                                onClick={() => handleDeleteUser(u)}
                                title="Delete user"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Role Permission Matrix View */}
      {activeTab === 'matrix' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Enterprise RBAC Permission Matrix</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Defines module boundaries, write capabilities, and approvals across all 6 roles
              </p>
            </div>
            <span className="badge badge-info">12 Core Modules Configured</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '220px' }}>Module / Capability</th>
                  <th>Admin</th>
                  <th>Project Mgr</th>
                  <th>Auditor / IT</th>
                  <th>Operations</th>
                  <th>Finance</th>
                  <th>Centre User</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MATRIX.map(row => (
                  <tr key={row.module}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.module}</td>
                    <td>
                      <span className="badge badge-success">{row.admin}</span>
                    </td>
                    <td>
                      <span className={`badge ${row.pm === 'Full Control' ? 'badge-success' : row.pm === 'None' ? 'badge-neutral' : 'badge-info'}`}>
                        {row.pm}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.auditor === 'None' ? 'badge-neutral' : row.auditor.includes('Audit') || row.auditor.includes('Scan') ? 'badge-warning' : 'badge-info'}`}>
                        {row.auditor}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.ops === 'Full Control' ? 'badge-success' : row.ops === 'None' ? 'badge-neutral' : 'badge-purple'}`}>
                        {row.ops}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.finance === 'Full Control' ? 'badge-success' : row.finance === 'None' ? 'badge-neutral' : 'badge-info'}`}>
                        {row.finance}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.centre === 'None' ? 'badge-neutral' : 'badge-warning'}`}>
                        {row.centre}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision / Edit User Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingUser ? 'Edit User Credentials' : 'Provision New User'}</h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Ramesh Verma"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    placeholder="name@oemportal.in"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Assigned Role *</label>
                    <select
                      className="form-control"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                    >
                      {Object.entries(ROLE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status *</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Security & Scope Note</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    This user will automatically inherit navigation boundaries, dashboard access, and scoped permissions corresponding to the selected role.
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} /> {editingUser ? 'Save Changes' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
