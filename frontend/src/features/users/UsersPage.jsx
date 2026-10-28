import { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Shield, Check, X, Search,
  Filter, RefreshCw, CheckCircle2, Lock, Key, Eye, AlertCircle,
  Pencil, UserX, UserCheck, Trash2, Loader2
} from 'lucide-react';
import { UserStore, appendAuditLog } from '@/services/dataService';
import { useAuth, ROLES, ROLE_LABELS, ROLE_COLORS } from '@/context/AuthContext';
import { StatusBadge } from '@/components/common';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';

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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // users | matrix
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Action States
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }

  const initialForm = {
    name: '',
    email: '',
    role: 'auditor_it',
    status: 'Active',
    password: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch users from live Backend API with graceful cache fallback
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.USERS);
      if (res && res.success && Array.isArray(res.data)) {
        setUsers(res.data);
        setIsApiConnected(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('API users fetch failed, falling back to local store:', err);
      setIsApiConnected(false);
    } finally {
      setLoading(false);
    }
    setUsers(UserStore.getAll());
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter(u => {
    if (search) {
      const q = search.toLowerCase();
      const match = u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (roleFilter) {
      const matchRole =
        u.role === roleFilter ||
        u.role?.toLowerCase() === roleFilter.toLowerCase() ||
        ROLE_LABELS[u.role] === ROLE_LABELS[roleFilter];
      if (!matchRole) return false;
    }
    if (statusFilter && u.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'auditor_it',
      status: u.status || 'Active',
      password: '',
    });
    setShowModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Please enter both name and email.', 'error');
      return;
    }

    if (editingUser) {
      try {
        const payload = {
          name: formData.name.trim(),
          role: formData.role,
          status: formData.status,
          ...(formData.password ? { password: formData.password } : {}),
        };
        const res = await apiClient.put(`${ENDPOINTS.ADMIN.USERS}/${editingUser.id}`, payload);
        if (res && res.success) {
          showToast(`User "${formData.name}" updated successfully!`, 'success');
          setShowModal(false);
          await loadUsers();
          return;
        }
      } catch (err) {
        const msg = err.data?.error?.message || err.message || 'Failed to update user';
        showToast(msg, 'error');
        return;
      }
    } else {
      // Provision New User via real backend API
      try {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          status: formData.status || 'Active',
          password: formData.password || 'TempPass@2026',
          scope: { clients: ['all'], projects: ['all'], centres: ['all'] },
        };
        const res = await apiClient.post(ENDPOINTS.ADMIN.USERS, payload);

        if (res && res.success && res.data) {
          showToast(`User "${formData.name}" provisioned successfully in database!`, 'success');
          setShowModal(false);
          await loadUsers();
          return;
        }
      } catch (err) {
        // Display exact backend error and DO NOT insert fake row
        const msg = err.data?.error?.message || err.message || 'Failed to provision user';
        showToast(msg, 'error');
        return;
      }
    }
  };

  const handleToggleStatus = async (u) => {
    const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
    setActionLoadingId(u.id);
    try {
      const res = await apiClient.put(`${ENDPOINTS.ADMIN.USERS}/${u.id}`, { status: nextStatus });
      if (res && res.success) {
        showToast(`User "${u.name}" account is now ${nextStatus}`, 'success');
        await loadUsers();
        return;
      }
    } catch (err) {
      const msg = err.data?.error?.message || err.message || 'Failed to update account status';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setActionLoadingId(deletingUser.id);
    try {
      const res = await apiClient.delete(`${ENDPOINTS.ADMIN.USERS}/${deletingUser.id}`);
      if (res && res.success) {
        showToast(`User "${deletingUser.name}" account deactivated successfully.`, 'success');
        setDeletingUser(null);
        await loadUsers();
        return;
      }
    } catch (err) {
      const msg = err.data?.error?.message || err.message || 'Failed to deactivate user';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: toast.type === 'error' ? '#b91c1c' : 'var(--color-primary-dark)',
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
          {toast.type === 'error' ? (
            <AlertCircle size={18} color="#fca5a5" />
          ) : (
            <CheckCircle2 size={18} color="#4ade80" />
          )}
          <span>{toast.message}</span>
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
            <span
              className={`badge ${isApiConnected ? 'badge-success' : 'badge-neutral'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', fontSize: '0.75rem' }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isApiConnected ? 'var(--color-success)' : 'var(--text-muted)',
                  display: 'inline-block',
                }}
              />
              {isApiConnected ? 'Connected (MySQL)' : 'Local Cache'}
            </span>
            <button
              className="btn btn-secondary"
              onClick={loadUsers}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh List
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
          RBAC Permission Matrix
        </button>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* User Metrics */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Total User Accounts</span>
                <div className="kpi-card__icon" style={{ background: '#eff6ff' }}>
                  <Users size={16} color="#2563eb" />
                </div>
              </div>
              <div className="kpi-card__value">{users.length}</div>
              <div className="kpi-card__sub">{users.filter(u => u.status === 'Active').length} currently active</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Internal Staff</span>
                <div className="kpi-card__icon" style={{ background: '#faf5ff' }}>
                  <Shield size={16} color="#7c3aed" />
                </div>
              </div>
              <div className="kpi-card__value" style={{ color: 'var(--color-purple)' }}>
                {users.filter(u => u.role !== 'centre_user' && u.role !== 'CENTRE').length}
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
                {users.filter(u => u.role === 'centre_user' || u.role === 'CENTRE').length}
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
                  <option value="admin">Admin</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="auditor_it">Auditor / IT</option>
                  <option value="operations_executive">Operations Executive</option>
                  <option value="accounts_finance">Accounts / Finance</option>
                  <option value="centre_user">Centre User</option>
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
                    <th style={{ textAlign: 'center', width: 148, minWidth: 148 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        {loading ? 'Loading users from database...' : 'No users matching filter criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => {
                      const color = ROLE_COLORS[u.role] || '#64748b';
                      const label = ROLE_LABELS[u.role] || u.role;
                      const avatarInitials = u.avatar || u.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                className="avatar avatar-md"
                                style={{ background: color }}
                              >
                                {avatarInitials}
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
                              <Shield size={11} /> {label}
                            </span>
                          </td>
                          <td>
                            <StatusBadge status={u.status} />
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : (u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Never')}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="actions-cell-wrapper">
                              <button
                                type="button"
                                className="btn-table-action btn-table-action-edit"
                                title="Edit user details"
                                aria-label={`Edit user ${u.name}`}
                                onClick={() => handleOpenEdit(u)}
                                disabled={actionLoadingId === u.id}
                              >
                                <Pencil size={16} strokeWidth={2} />
                              </button>

                              <button
                                type="button"
                                className={`btn-table-action ${u.status === 'Active' ? 'btn-table-action-warning' : 'btn-table-action-success'}`}
                                title={u.status === 'Active' ? 'Deactivate user account' : 'Activate user account'}
                                aria-label={u.status === 'Active' ? `Deactivate account for ${u.name}` : `Activate account for ${u.name}`}
                                onClick={() => handleToggleStatus(u)}
                                disabled={actionLoadingId === u.id}
                              >
                                {actionLoadingId === u.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : u.status === 'Active' ? (
                                  <UserX size={16} strokeWidth={2} />
                                ) : (
                                  <UserCheck size={16} strokeWidth={2} />
                                )}
                              </button>

                              <button
                                type="button"
                                className="btn-table-action btn-table-action-danger"
                                title="Deactivate and delete user"
                                aria-label={`Deactivate user ${u.name}`}
                                onClick={() => setDeletingUser(u)}
                                disabled={actionLoadingId === u.id}
                              >
                                <Trash2 size={16} strokeWidth={2} />
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
        </div>
      )}

      {/* TAB 2: RBAC MATRIX */}
      {activeTab === 'matrix' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Enterprise RBAC Permission Matrix</h3>
              <p className="card-subtitle">Formal functional boundaries across administrative and operational roles</p>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Functional Module</th>
                  <th>Admin</th>
                  <th>Project Mgr</th>
                  <th>Auditor / IT</th>
                  <th>Operations</th>
                  <th>Finance</th>
                  <th>Centre User</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MATRIX.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{row.module}</td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>{row.admin}</span>
                    </td>
                    <td>
                      <span className={`badge ${row.pm === 'Full Control' ? 'badge-success' : row.pm === 'None' ? 'badge-neutral' : 'badge-info'}`} style={{ fontSize: '0.6875rem' }}>
                        {row.pm}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.auditor === 'None' ? 'badge-neutral' : 'badge-info'}`} style={{ fontSize: '0.6875rem' }}>
                        {row.auditor}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.ops === 'Full Control' ? 'badge-success' : row.ops === 'None' ? 'badge-neutral' : 'badge-info'}`} style={{ fontSize: '0.6875rem' }}>
                        {row.ops}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.finance === 'Full Control' ? 'badge-success' : row.finance === 'None' ? 'badge-neutral' : 'badge-info'}`} style={{ fontSize: '0.6875rem' }}>
                        {row.finance}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.centre === 'None' ? 'badge-neutral' : 'badge-warning'}`} style={{ fontSize: '0.6875rem' }}>
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
                    placeholder="e.g. Ankur Pandey"
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
                    placeholder="e.g. ankurpandey@gmail.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingUser}
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
                      <option value="admin">Admin</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="auditor_it">Auditor / IT</option>
                      <option value="operations_executive">Operations Executive</option>
                      <option value="accounts_finance">Accounts / Finance</option>
                      <option value="centre_user">Centre User</option>
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

                <div className="form-group">
                  <label className="form-label">{editingUser ? 'Update Password (leave blank to keep current)' : 'Password (optional)'}</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder={editingUser ? '••••••••' : 'Default: TempPass@2026'}
                    value={formData.password || ''}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    minLength={8}
                  />
                  {!editingUser && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Defaults to <code style={{ color: 'var(--color-primary)' }}>TempPass@2026</code> if left blank.
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Security & Scope Note</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    This user will be securely persisted in the MySQL database (<code style={{ fontSize: '0.6875rem' }}>oecm_users</code>) with salted bcrypt encryption and assigned RBAC permissions.
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

      {/* Delete / Deactivate Confirmation Modal */}
      {deletingUser && (
        <div className="modal-backdrop" onClick={() => !actionLoadingId && setDeletingUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-danger)' }}>
                <AlertCircle size={20} /> Deactivate User Account
              </h3>
              <button
                className="btn-ghost"
                onClick={() => setDeletingUser(null)}
                disabled={!!actionLoadingId}
                style={{ padding: 4 }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to deactivate and remove <strong>{deletingUser.name}</strong> (<code style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{deletingUser.email}</code>)?
              </p>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: '#991b1b' }}>
                This user account will be marked <strong>Inactive</strong> in the MySQL database and immediate portal session access will be revoked.
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingUser(null)}
                disabled={!!actionLoadingId}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={!!actionLoadingId}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {actionLoadingId ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
