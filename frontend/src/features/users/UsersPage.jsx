import { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Shield, Check, X, Search,
  RefreshCw, CheckCircle2, Lock, Key, Eye, AlertCircle,
  Pencil, UserX, UserCheck, Copy, Phone, Mail, Building2,
  Calendar, ArrowUpDown, ChevronLeft, ChevronRight,
  ExternalLink, Clock, ShieldAlert, Briefcase
} from 'lucide-react';
import { useAuth, ROLES, ROLE_LABELS, ROLE_COLORS } from '@/context/AuthContext';
import { StatusBadge } from '@/components/common';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';

// Canonical role mapping for the dropdown and display
const SUPPORTED_ROLES = [
  { value: 'project_manager', label: 'Project Manager', raw: 'PM', desc: 'Manages projects, operations, and assigned centres' },
  { value: 'accounts_finance', label: 'Accounts Team User', raw: 'FINANCE', desc: 'Financial invoices, cost sheets, and reconciliation' },
  { value: 'operations_executive', label: 'Operations User', raw: 'OPERATIONS', desc: 'Venue operations, scheduling, and centre invitations' },
  { value: 'auditor_it', label: 'Auditor User', raw: 'AUDITOR', desc: 'Centre technical scans, mock examinations, and compliance' },
  { value: 'centre_user', label: 'Centre User', raw: 'CENTRE', desc: 'External exam venue head, registration, and seating dossier' },
  { value: 'admin', label: 'System Administrator', raw: 'ADMIN', desc: 'Full OEMP platform configuration and governance' },
];

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
  const [statusToggleUser, setStatusToggleUser] = useState(null); // user to activate/deactivate
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [generatedResetUrl, setGeneratedResetUrl] = useState(null);
  const [createdUserResult, setCreatedUserResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }

  // Available Projects & Clients for Scope Assignment (loaded from backend)
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
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.USERS_SUMMARY);
      if (res && res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.warn('Failed to load user summary counts:', err);
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

  // Form Email Domain Check for feedback
  const isInternalRole = ['project_manager', 'PM', 'operations_executive', 'OPERATIONS', 'auditor_it', 'AUDITOR', 'accounts_finance', 'FINANCE'].includes(createForm.role);
  const emailDomain = createForm.email.includes('@') ? createForm.email.split('@')[1].toLowerCase() : '';
  const isApprovedDomain = emailDomain === 'oemportal.in' || emailDomain === 'assessinfra.com';

  // ── Handlers ─────────────────────────────────────────────────────────────

  // Create User Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) {
      showToast('Full Name and Email are required.', 'error');
      return;
    }

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

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullUserId);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = fullUserId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!successful) throw new Error('execCommand failed');
      }
      showToast('User ID copied successfully!', 'success');
    } catch (err) {
      console.warn('Clipboard copy error:', err);
      showToast('Unable to copy User ID. Please try again.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Toast Alert ── */}
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

      {/* ── Page Header (Phase 1) ── */}
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

      {/* ── Three Summary Cards (Phase 1) ── */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {/* Card 1: Total Users */}
        <div className="kpi-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px' }}>
          <div className="kpi-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="kpi-card__label" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Users
            </span>
            <div style={{ background: '#eff6ff', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#2563eb" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1e293b' }}>
            {summaryLoading ? '—' : summary.totalUsers}
          </div>
          <div className="kpi-card__sub" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            All existing OEMP accounts (including Admin accounts)
          </div>
        </div>

        {/* Card 2: Internal Users */}
        <div className="kpi-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px' }}>
          <div className="kpi-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="kpi-card__label" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Internal Users
            </span>
            <div style={{ background: '#f5f3ff', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#7c3aed" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ fontSize: '1.875rem', fontWeight: 800, color: '#7c3aed' }}>
            {summaryLoading ? '—' : summary.internalUsers}
          </div>
          <div className="kpi-card__sub" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            Project Manager, Operations, Auditor, and Accounts
          </div>
        </div>

        {/* Card 3: Centre Users */}
        <div className="kpi-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px' }}>
          <div className="kpi-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="kpi-card__label" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Centre Users
            </span>
            <div style={{ background: '#fffbeb', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} color="#d97706" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ fontSize: '1.875rem', fontWeight: 800, color: '#d97706' }}>
            {summaryLoading ? '—' : summary.centreUsers}
          </div>
          <div className="kpi-card__sub" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            External venue examination and onboarding accounts
          </div>
        </div>
      </div>

      {/* ── Generated Reset Link / Activation Link Success Banner ── */}
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
              className="btn btn-sm btn-ghost"
              onClick={() => setGeneratedResetUrl(null)}
              style={{ color: '#64748b' }}
            >
              <X size={16} />
            </button>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#1e3a8a', margin: 0 }}>
            This secure reset link is valid for 24 hours. The recipient does not need their previous password.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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

      {/* ── User Listing Card (Phase 2) ── */}
      <div className="card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table Filters Header */}
        <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email, phone, or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 34, fontSize: '0.8125rem', height: 38 }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters & Page Size */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Role Filter */}
            <select
              className="form-control"
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
              style={{ width: 175, fontSize: '0.8125rem', height: 38 }}
            >
              <option value="">All Roles</option>
              <option value="project_manager">Project Manager</option>
              <option value="accounts_finance">Accounts / Finance</option>
              <option value="operations_executive">Operations Executive</option>
              <option value="auditor_it">Auditor / IT</option>
              <option value="centre_user">Centre User</option>
              <option value="admin">Administrator</option>
            </select>

            {/* Status Filter */}
            <select
              className="form-control"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ width: 130, fontSize: '0.8125rem', height: 38 }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Page Size */}
            <select
              className="form-control"
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              style={{ width: 110, fontSize: '0.8125rem', height: 38 }}
              title="Rows per page"
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>
        </div>

        {/* User Listing Table */}
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', width: 70, textAlign: 'center' }}>
                  S. No.
                </th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', width: 120 }}>
                  User ID
                </th>
                <th
                  onClick={() => handleSortToggle('name')}
                  style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>User Name</span>
                    <ArrowUpDown size={12} color={sortBy === 'name' ? 'var(--color-primary)' : '#94a3b8'} />
                  </div>
                </th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  User Email
                </th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  Phone No.
                </th>
                <th
                  onClick={() => handleSortToggle('createdAt')}
                  style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Created Date</span>
                    <ArrowUpDown size={12} color={sortBy === 'createdAt' ? 'var(--color-primary)' : '#94a3b8'} />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('updatedAt')}
                  style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Last Updated</span>
                    <ArrowUpDown size={12} color={sortBy === 'updatedAt' ? 'var(--color-primary)' : '#94a3b8'} />
                  </div>
                </th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textAlign: 'center' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textAlign: 'center', width: 220 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <RefreshCw size={24} className="animate-spin" color="var(--color-primary)" />
                      <span>Loading user records from database...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <Users size={32} color="#cbd5e1" />
                      <div style={{ fontWeight: 600, color: '#475569' }}>No users found</div>
                      <div style={{ fontSize: '0.8125rem' }}>
                        {debouncedSearch || roleFilter || statusFilter
                          ? 'Try adjusting your search criteria or filters.'
                          : 'No user records exist in the database yet.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => {
                  const roleColor = ROLE_COLORS[u.role] || '#64748b';
                  const roleLabel = ROLE_LABELS[u.role] || u.role;
                  const isActive = u.status === 'Active';
                  const isSelf = currentUser?.id === u.id;
                  const serialNumber = (page - 1) * limit + idx + 1;

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* S. No. (Continuous) */}
                      <td style={{ padding: '14px 16px', fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', textAlign: 'center' }}>
                        {serialNumber}
                      </td>

                      {/* User ID */}
                      <td style={{ padding: '14px 16px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#475569' }}>
                        <span
                          title="Double-click to copy"
                          onDoubleClick={(e) => handleCopyUserId(e, u.id)}
                          style={{
                            cursor: 'copy',
                            userSelect: 'none',
                          }}
                        >
                          {u.id.length > 10 ? `${u.id.slice(0, 8)}…` : u.id}
                        </span>
                      </td>

                      {/* User Name & Role Tag */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                          {u.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: `${roleColor}15`,
                            color: roleColor,
                            border: `1px solid ${roleColor}30`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            {roleLabel}
                          </span>
                          {u.manager && (
                            <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }} title={`Managed by ${u.manager.name}`}>
                              • Rep to: {u.manager.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* User Email */}
                      <td style={{ padding: '14px 16px', fontSize: '0.8125rem', fontFamily: 'monospace', color: '#334155' }}>
                        {u.email}
                      </td>

                      {/* Phone No. */}
                      <td style={{ padding: '14px 16px', fontSize: '0.8125rem', color: '#475569' }}>
                        {u.phoneNumber ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Phone size={12} color="#94a3b8" /> {u.phoneNumber}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: '14px 16px', fontSize: '0.75rem', color: '#64748b' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '—'}
                      </td>

                      {/* Last Updated Date */}
                      <td style={{ padding: '14px 16px', fontSize: '0.75rem', color: '#64748b' }}>
                        {u.updatedAt ? new Date(u.updatedAt).toLocaleDateString('en-GB') : '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <StatusBadge status={u.status} />
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {/* View Button */}
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setViewingUser(u)}
                            title="View full user profile"
                            style={{ padding: '5px 8px' }}
                          >
                            <Eye size={13} />
                          </button>

                          {/* Edit Button */}
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleOpenEdit(u)}
                            title="Edit user details and scope"
                            style={{ padding: '5px 8px' }}
                          >
                            <Pencil size={13} />
                          </button>

                          {/* Activate / Deactivate Toggle Button */}
                          <button
                            className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => setStatusToggleUser(u)}
                            disabled={isSelf}
                            title={isSelf ? 'Cannot deactivate your own account' : (isActive ? 'Deactivate user account' : 'Activate user account')}
                            style={{
                              padding: '5px 8px',
                              color: isSelf ? '#cbd5e1' : (isActive ? '#dc2626' : '#16a34a'),
                              borderColor: isActive ? '#fecaca' : '#bbf7d0',
                              background: isActive ? '#fef2f2' : '#f0fdf4'
                            }}
                          >
                            {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>

                          {/* Reset Password Button */}
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setResetPasswordUser(u)}
                            title="Initiate single-use password reset link"
                            style={{ padding: '5px 8px', color: '#2563eb' }}
                          >
                            <Key size={13} />
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

        {/* Pagination Controls (Phase 2) */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalRecords)} of {totalRecords} users
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', padding: '0 8px' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 1: CREATE NEW USER (Phase 3)
      ════════════════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
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
                onClick={() => setShowCreateModal(false)}
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
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
                  {SUPPORTED_ROLES.map(r => (
                    <option key={r.value} value={r.value}>
                      {r.label} ({r.raw})
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                  {SUPPORTED_ROLES.find(r => r.value === createForm.role)?.desc}
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
                {createForm.email.includes('@') && (
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

              {/* Role-Specific Fields (Phase 3) */}
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
                    {availableProjects.map(p => (
                      <label key={p.id} style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={createForm.selectedProjects.includes(p.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setCreateForm(prev => ({ ...prev, selectedProjects: [...prev.selectedProjects, p.id] }));
                            } else {
                              setCreateForm(prev => ({ ...prev, selectedProjects: prev.selectedProjects.filter(id => id !== p.id) }));
                            }
                          }}
                        />
                        <span>{p.name} ({p.projectCode})</span>
                      </label>
                    ))}
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
                          {c.centreName} ({c.centreCode || c.id}) — {c.cityName}
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
                  onClick={() => setShowCreateModal(false)}
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
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2: VIEW USER DOSSIER (Phase 7)
      ════════════════════════════════════════════════════════════════════════ */}
      {viewingUser && (
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
            maxWidth: 540,
            padding: 0,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: ROLE_COLORS[viewingUser.role] || '#2563eb',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}>
                  {viewingUser.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    {viewingUser.name}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {viewingUser.email}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setViewingUser(null)}
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    User ID
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: '#1e293b', marginTop: 2 }}>
                    {viewingUser.id}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Account Status
                  </div>
                  <div style={{ marginTop: 2 }}>
                    <StatusBadge status={viewingUser.status} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Assigned Role
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: ROLE_COLORS[viewingUser.role] || '#1e293b', marginTop: 2 }}>
                    {ROLE_LABELS[viewingUser.role] || viewingUser.role}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Phone Number
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#1e293b', marginTop: 2 }}>
                    {viewingUser.phoneNumber || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Created Date
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#1e293b', marginTop: 2 }}>
                    {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString('en-GB') : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Last Active
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#1e293b', marginTop: 2 }}>
                    {viewingUser.lastLogin ? new Date(viewingUser.lastLogin).toLocaleString('en-GB') : 'Never logged in'}
                  </div>
                </div>
              </div>

              {/* Manager & Scope Details */}
              {viewingUser.manager && (
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: '0.8125rem' }}>
                  <strong>Delegated Reporting Manager:</strong> {viewingUser.manager.name} ({viewingUser.manager.role})
                </div>
              )}

              {viewingUser.scope && (
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    Permitted Operational Scope:
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Projects: {Array.isArray(viewingUser.scope.projects) ? viewingUser.scope.projects.join(', ') : 'All Projects'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                    Centres: {Array.isArray(viewingUser.scope.centres) ? viewingUser.scope.centres.join(', ') : 'All Venues'}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setViewingUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 3: EDIT USER (Phase 7)
      ════════════════════════════════════════════════════════════════════════ */}
      {editingUser && (
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
            padding: 0,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
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
                onClick={() => setEditingUser(null)}
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  {SUPPORTED_ROLES.map(r => (
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingUser(null)}
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
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 4: ACTIVATE / DEACTIVATE CONFIRMATION (Phase 8)
      ════════════════════════════════════════════════════════════════════════ */}
      {statusToggleUser && (
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
                background: statusToggleUser.status === 'Active' ? '#fef2f2' : '#f0fdf4',
                padding: 10,
                borderRadius: '50%',
                color: statusToggleUser.status === 'Active' ? '#dc2626' : '#16a34a'
              }}>
                {statusToggleUser.status === 'Active' ? <UserX size={24} /> : <UserCheck size={24} />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
                  {statusToggleUser.status === 'Active' ? 'Deactivate User Account?' : 'Reactivate User Account?'}
                </h3>
                <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
                  {statusToggleUser.status === 'Active' ? (
                    <>
                      Are you sure you want to deactivate the account for <strong>{statusToggleUser.name}</strong> ({statusToggleUser.email})?
                      <br /><br />
                      <strong>Effect:</strong> Deactivation will immediately prevent future login attempts while safely preserving all historical audit logs and examination records. The user will NOT be deleted.
                    </>
                  ) : (
                    <>
                      Are you sure you want to reactivate the account for <strong>{statusToggleUser.name}</strong> ({statusToggleUser.email})?
                      <br /><br />
                      <strong>Effect:</strong> The account will be marked Active and eligible access will be restored according to their role and scope.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setStatusToggleUser(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={`btn ${statusToggleUser.status === 'Active' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleExecuteStatusToggle}
                disabled={actionLoading}
                style={{
                  background: statusToggleUser.status === 'Active' ? '#dc2626' : '#16a34a',
                  borderColor: statusToggleUser.status === 'Active' ? '#dc2626' : '#16a34a',
                  color: '#fff'
                }}
              >
                {actionLoading ? 'Processing...' : (statusToggleUser.status === 'Active' ? 'Confirm Deactivation' : 'Confirm Activation')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 5: RESET PASSWORD CONFIRMATION (Phase 6)
      ════════════════════════════════════════════════════════════════════════ */}
      {resetPasswordUser && (
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
              <div style={{ background: '#eff6ff', padding: 10, borderRadius: '50%', color: '#2563eb' }}>
                <Key size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
                  Initiate Password Reset?
                </h3>
                <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
                  You are generating a secure password reset link for:
                  <br />
                  <strong>{resetPasswordUser.name}</strong> ({resetPasswordUser.email})
                  <br /><br />
                  The link will be single-use, time-limited (24 hours), and will allow the user to define a new password without providing the old password.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setResetPasswordUser(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExecutePasswordReset}
                disabled={actionLoading}
              >
                {actionLoading ? 'Generating...' : 'Generate Reset Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
