import { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, RefreshCw, CheckCircle2,
  AlertCircle, Key, X, Copy, Check
} from 'lucide-react';
import { useAuth, ROLE_LABELS, ROLE_COLORS } from '@/context/AuthContext';
import {
  UserKpiCards,
  UserTable,
  UserCreateModal,
  UserViewModal,
  UserEditModal,
  UserStatusModal,
  PasswordResetModal,
  SUPPORTED_ROLES,
} from './components';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  // State: Data & Metrics
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    internalUsers: 0,
    centreUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // State: Pagination & Sorting
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // State: Search & Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Action States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [statusToggleUser, setStatusToggleUser] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [generatedResetUrl, setGeneratedResetUrl] = useState(null);
  const [createdUserResult, setCreatedUserResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }

  // Available Projects & Centres for Scope Assignment
  const [availableProjects, setAvailableProjects] = useState([]);
  const [availableCentres, setAvailableCentres] = useState([]);

  // Create Form State
  const initialCreateForm = {
    name: '',
    role: 'project_manager',
    email: '',
    phoneNumber: '',
    selectedProjects: [],
    centreId: '',
    clientId: '',
    sendInvitation: true,
    customPassword: '',
  };
  const [createForm, setCreateForm] = useState(initialCreateForm);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    phoneNumber: '',
    role: '',
    status: '',
    selectedProjects: [],
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load KPI Summary Cards
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.USERS_SUMMARY, { bypassCache: true });
      if (res && res.success && res.data) {
        setSummary({
          totalUsers: Number(res.data.totalUsers ?? 0),
          internalUsers: Number(res.data.internalUsers ?? 0),
          centreUsers: Number(res.data.centreUsers ?? 0),
          adminUsers: Number(res.data.adminUsers ?? 0),
          activeUsers: Number(res.data.activeUsers ?? 0),
          inactiveUsers: Number(res.data.inactiveUsers ?? 0),
        });
        setSummaryError(null);
      } else {
        throw new Error(res?.error?.message || 'Invalid summary response format');
      }
    } catch (err) {
      console.warn('Failed to load user summary counts:', err);
      const msg = err.data?.error?.message || err.message || 'Unable to retrieve user summary counts';
      setSummaryError(msg);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Load Users Listing with server-side pagination & sorting
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await apiClient.get(ENDPOINTS.ADMIN.USERS, { params });
      if (res && res.success && Array.isArray(res.data)) {
        setUsers(res.data);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalRecords(res.meta.total || res.data.length);
        } else {
          setTotalRecords(res.data.length);
          setTotalPages(Math.ceil(res.data.length / limit) || 1);
        }
      } else {
        setUsers([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast(err.message || 'Unable to retrieve users list', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, debouncedSearch, roleFilter, statusFilter]);

  // Load reference datasets for scope selection
  useEffect(() => {
    apiClient.get(ENDPOINTS.ADMIN.PROJECTS, { params: { limit: 100 } })
      .then(res => {
        if (res && res.success && Array.isArray(res.data)) {
          setAvailableProjects(res.data);
        }
      })
      .catch(() => {});

    apiClient.get(ENDPOINTS.ADMIN.CENTRES, { params: { limit: 100 } })
      .then(res => {
        if (res && res.success && Array.isArray(res.data)) {
          setAvailableCentres(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Initial & Filter-based loading
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle Refresh Action
  const handleRefresh = async () => {
    setSummaryError(null);
    await Promise.all([loadSummary(), loadUsers()]);
    showToast('User counts and listing refreshed.', 'success');
  };

  // Sorting Toggle
  const handleSortToggle = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Create User Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) {
      showToast('Full Name and Email are required.', 'error');
      return;
    }

    const isInternalRole = ['project_manager', 'PM', 'operations_executive', 'OPERATIONS', 'auditor_it', 'AUDITOR', 'accounts_finance', 'FINANCE'].includes(createForm.role);
    const emailDomain = createForm.email.includes('@') ? createForm.email.split('@')[1].toLowerCase() : '';
    const isApprovedDomain = emailDomain === 'oemportal.in' || emailDomain === 'assessinfra.com';

    if (isInternalRole && !isApprovedDomain) {
      showToast('Internal users must use an approved organisation domain (@oemportal.in or @assessinfra.com).', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name: createForm.name.trim(),
        email: createForm.email.trim().toLowerCase(),
        phoneNumber: createForm.phoneNumber.trim() || undefined,
        role: createForm.role,
        status: 'Active',
      };

      if (!createForm.sendInvitation && createForm.customPassword.trim()) {
        payload.password = createForm.customPassword.trim();
      }

      // Add scope configuration based on role
      if (['project_manager', 'PM', 'operations_executive', 'OPERATIONS'].includes(createForm.role)) {
        payload.scope = {
          projects: createForm.selectedProjects.length > 0 ? createForm.selectedProjects : ['all'],
          clients: ['all'],
          centres: ['all'],
        };
      } else if (createForm.role === 'centre_user' || createForm.role === 'CENTRE') {
        if (createForm.centreId) payload.centreId = createForm.centreId;
        if (createForm.clientId) payload.clientId = createForm.clientId;
        payload.scope = {
          centres: createForm.centreId ? [createForm.centreId] : ['all'],
          clients: createForm.clientId ? [createForm.clientId] : ['all'],
          projects: [],
        };
      }

      const res = await apiClient.post(ENDPOINTS.ADMIN.USERS, payload);
      if (res && res.success && res.data) {
        showToast(`User account "${createForm.name}" created successfully!`, 'success');
        setCreatedUserResult(res.data);
        setShowCreateModal(false);
        setCreateForm(initialCreateForm);
        await Promise.all([loadSummary(), loadUsers()]);
      }
    } catch (err) {
      const msg = err.data?.error?.message || err.message || 'Failed to create user';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setEditForm({
      name: u.name || '',
      phoneNumber: u.phoneNumber || '',
      role: u.role || 'auditor_it',
      status: u.status || 'Active',
      selectedProjects: Array.isArray(u.scope?.projects) ? u.scope.projects : [],
    });
  };

  // Submit Edit User
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setActionLoading(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        phoneNumber: editForm.phoneNumber.trim() || undefined,
        role: editForm.role,
        status: editForm.status,
      };

      if (['project_manager', 'PM', 'operations_executive', 'OPERATIONS'].includes(editForm.role)) {
        payload.scope = {
          ...editingUser.scope,
          projects: editForm.selectedProjects,
        };
      }

      const res = await apiClient.put(ENDPOINTS.ADMIN.USER_DETAIL(editingUser.id), payload);
      if (res && res.success) {
        showToast(`User "${editForm.name}" updated successfully.`, 'success');
        setEditingUser(null);
        await Promise.all([loadSummary(), loadUsers()]);
      }
    } catch (err) {
      const msg = err.data?.error?.message || err.message || 'Failed to update user';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Activate / Deactivate Toggle
  const handleExecuteStatusToggle = async () => {
    if (!statusToggleUser) return;
    const isActivating = statusToggleUser.status !== 'Active';
    const endpoint = isActivating
      ? ENDPOINTS.ADMIN.USER_ACTIVATE(statusToggleUser.id)
      : ENDPOINTS.ADMIN.USER_DEACTIVATE(statusToggleUser.id);

    setActionLoading(true);
    try {
      const res = await apiClient.post(endpoint, {});
      if (res && res.success) {
        showToast(
          isActivating
            ? `Account for "${statusToggleUser.name}" has been activated.`
            : `Account for "${statusToggleUser.name}" has been deactivated. Login is now disabled.`,
          'success'
        );
        setStatusToggleUser(null);
        await Promise.all([loadSummary(), loadUsers()]);
      }
    } catch (err) {
      const msg = err.data?.error?.message || err.message || 'Status transition failed';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Password Reset
  const handleExecutePasswordReset = async () => {
    if (!resetPasswordUser) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post(ENDPOINTS.ADMIN.USER_RESET_PASSWORD(resetPasswordUser.id), {});
      if (res && res.success && res.data) {
        const fullUrl = `${window.location.origin}${res.data.resetUrl}`;
        setGeneratedResetUrl({
          targetUser: res.data.targetUser || resetPasswordUser,
          url: fullUrl,
          expiresAt: res.data.expiresAt,
        });
        setResetPasswordUser(null);
        showToast(`Secure single-use password reset link generated for ${resetPasswordUser.email}`, 'success');
      }
    } catch (err) {
      const msg = err.data?.error?.message || err.message || 'Failed to initiate password reset';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
    showToast('Link copied to clipboard.', 'success');
  };

  // Double-click copy for complete User ID
  const handleCopyUserId = async (e, fullUserId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!fullUserId) return;

    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(fullUserId);
        copied = true;
      } catch (clipErr) {
        // Fall back to execCommand below
      }
    }

    if (!copied) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = fullUserId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (fallbackErr) {
        copied = false;
      }
    }

    if (copied) {
      showToast('User ID copied successfully!', 'success');
    } else {
      showToast('Unable to copy User ID. Please try again.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: toast.type === 'error' ? '#b91c1c' : '#047857',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg, 10px)',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontWeight: 600,
          fontSize: '0.875rem'
        }}>
          {toast.type === 'error' ? (
            <AlertCircle size={18} color="#fca5a5" />
          ) : (
            <CheckCircle2 size={18} color="#6ee7b7" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header__top">
          <div>
            <div className="breadcrumb" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Admin</span>
              <span className="breadcrumb-sep" style={{ margin: '0 6px' }}>/</span>
              <span className="breadcrumb-current" style={{ color: 'var(--color-primary)' }}>User Management</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6, fontSize: '1.5rem', fontWeight: 800 }}>
              User Management
            </h1>
            <p className="page-header__subtitle" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Manage system access, provision internal and centre users, delegate hierarchies, and oversee account security.
            </p>
          </div>
          <div className="page-header__actions" style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary"
              onClick={handleRefresh}
              disabled={loading || summaryLoading}
              title="Reload all user counts and current listings"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={loading || summaryLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => { setCreateForm(initialCreateForm); setShowCreateModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <UserPlus size={15} />
              <span>Create New User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <UserKpiCards
        summary={summary}
        summaryLoading={summaryLoading}
        summaryError={summaryError}
        loadSummary={loadSummary}
      />

      {/* Generated Reset Link / Activation Link Success Banner */}
      {generatedResetUrl && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #93c5fd',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1e40af', fontWeight: 700 }}>
              <Key size={18} />
              <span>Single-Use Password Reset Link Generated for {generatedResetUrl.targetUser?.name}</span>
            </div>
            <button
              onClick={() => setGeneratedResetUrl(null)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={16} />
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#3b82f6' }}>
            This secure, single-use token will expire in 24 hours. Provide this link to the user to securely set their password.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              readOnly
              value={generatedResetUrl.url}
              style={{
                flex: 1,
                background: '#fff',
                border: '1px solid #bfdbfe',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                color: '#1e293b'
              }}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => copyToClipboard(generatedResetUrl.url)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {copiedToken ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedToken ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* User Listing Card / Table */}
      <UserTable
        users={users}
        loading={loading}
        totalRecords={totalRecords}
        page={page}
        limit={limit}
        totalPages={totalPages}
        sortBy={sortBy}
        sortOrder={sortOrder}
        search={search}
        debouncedSearch={debouncedSearch}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setStatusFilter}
        onLimitChange={(lim) => { setLimit(lim); setPage(1); }}
        onSort={handleSortToggle}
        onPageChange={setPage}
        onViewUser={setViewingUser}
        onEditUser={handleOpenEdit}
        onToggleStatus={setStatusToggleUser}
        onResetPassword={setResetPasswordUser}
        onCopyUserId={handleCopyUserId}
        currentUser={currentUser}
        ROLE_LABELS={ROLE_LABELS}
        ROLE_COLORS={ROLE_COLORS}
      />

      {/* Modals */}
      <UserCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        createForm={createForm}
        setCreateForm={setCreateForm}
        onSubmit={handleCreateSubmit}
        actionLoading={actionLoading}
        availableProjects={availableProjects}
        availableCentres={availableCentres}
        supportedRoles={SUPPORTED_ROLES}
      />

      <UserViewModal
        user={viewingUser}
        onClose={() => setViewingUser(null)}
        ROLE_LABELS={ROLE_LABELS}
        ROLE_COLORS={ROLE_COLORS}
      />

      <UserEditModal
        editingUser={editingUser}
        editForm={editForm}
        setEditForm={setEditForm}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEditSubmit}
        actionLoading={actionLoading}
        availableProjects={availableProjects}
        supportedRoles={SUPPORTED_ROLES}
      />

      <UserStatusModal
        user={statusToggleUser}
        onClose={() => setStatusToggleUser(null)}
        onConfirm={handleExecuteStatusToggle}
        actionLoading={actionLoading}
      />

      <PasswordResetModal
        user={resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        onConfirm={handleExecutePasswordReset}
        actionLoading={actionLoading}
      />
    </div>
  );
}
