import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, CheckCircle2, Clock,
  Edit, Eye, AlertCircle, Loader2, RefreshCw,
  X, Check, Lock, Mail, User, Layers, Calendar, Copy
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { StatusBadge } from '@/components/common';

export default function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Data & Summary State ──────────────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [summary, setSummary] = useState({
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
  });

  // ── Filters & Pagination ──────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ── Modals State ──────────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetailsLoading, setClientDetailsLoading] = useState(false);

  // ── Form State ────────────────────────────────────────────────────────────
  const initialClientForm = {
    name: '',
    fullName: '',
    contactEmail: '',
    description: '',
    status: 'Active',
  };
  const [clientForm, setClientForm] = useState(initialClientForm);

  // Show Toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Copy to clipboard
  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => showToast(`${label || 'Text'} copied successfully!`, 'success'),
      () => showToast(`Failed to copy ${label || 'text'} to clipboard`, 'error')
    );
  };

  // ── Fetch Summary Counts ──────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const res = await apiClient.get(ENDPOINTS.ADMIN.CLIENTS_SUMMARY);
      if (res && res.data) {
        setSummary({
          totalClients: res.data.totalClients ?? 0,
          activeClients: res.data.activeClients ?? 0,
          inactiveClients: res.data.inactiveClients ?? 0,
        });
      }
    } catch (err) {
      console.warn('Failed to load client summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // ── Fetch Clients List ────────────────────────────────────────────────────
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit,
        ...(search ? { search: search.trim() } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      };

      const res = await apiClient.get(ENDPOINTS.ADMIN.CLIENTS, { params });
      if (res && res.data) {
        const clientList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
          ? res.data.data
          : [];
        setClients(clientList);
        const total = res.meta?.total ?? res.data?.pagination?.total ?? res.pagination?.total ?? clientList.length;
        const pages = res.meta?.totalPages ?? res.data?.pagination?.totalPages ?? res.pagination?.totalPages ?? 1;
        setTotalCount(total);
        setTotalPages(pages);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
      setError(err.message || 'Failed to query client records from database.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleRefreshAll = () => {
    fetchSummary();
    fetchClients();
    showToast('Client directory refreshed', 'info');
  };

  // ── View Client Details ───────────────────────────────────────────────────
  const handleOpenView = async (client) => {
    setSelectedClient(client);
    setShowViewModal(true);
    setClientDetailsLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.CLIENT_DETAIL(client.id));
      if (res && res.data) {
        setSelectedClient(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch detailed client view:', err);
    } finally {
      setClientDetailsLoading(false);
    }
  };

  // ── Open Create Modal ─────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setClientForm(initialClientForm);
    setShowCreateModal(true);
  };

  // ── Open Edit Modal ───────────────────────────────────────────────────────
  const handleOpenEdit = (client) => {
    setSelectedClient(client);
    setClientForm({
      name: client.name || '',
      fullName: client.fullName || '',
      contactEmail: client.contactEmail || '',
      description: client.description || '',
      status: client.status || 'Active',
    });
    setShowEditModal(true);
  };

  // ── Save New Client ───────────────────────────────────────────────────────
  const handleSaveCreate = async (e) => {
    e.preventDefault();
    if (!clientForm.name.trim() || !clientForm.fullName.trim() || !clientForm.contactEmail.trim()) {
      showToast('Client Name, Representative Name, and Email are mandatory', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: clientForm.name.trim(),
        fullName: clientForm.fullName.trim(),
        contactEmail: clientForm.contactEmail.trim().toLowerCase(),
        description: clientForm.description.trim() || undefined,
        status: clientForm.status,
      };

      await apiClient.post(ENDPOINTS.ADMIN.CLIENTS, payload);
      showToast(`Client "${clientForm.name.trim()}" created successfully!`, 'success');
      setShowCreateModal(false);
      setClientForm(initialClientForm);
      fetchSummary();
      fetchClients();
    } catch (err) {
      console.error('Failed to create client:', err);
      showToast(err.message || 'Failed to create client organisation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Save Edited Client ────────────────────────────────────────────────────
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;
    if (!clientForm.fullName.trim() || !clientForm.contactEmail.trim()) {
      showToast('Representative Name and Email are mandatory', 'error');
      return;
    }

    try {
      setSubmitting(true);
      // Editing rules: Client ID and Client Name are read-only during normal edit
      const payload = {
        fullName: clientForm.fullName.trim(),
        contactEmail: clientForm.contactEmail.trim().toLowerCase(),
        description: clientForm.description.trim() || undefined,
        status: clientForm.status,
      };

      await apiClient.put(ENDPOINTS.ADMIN.CLIENT_DETAIL(selectedClient.id), payload);
      showToast(`Client details for "${selectedClient.name}" updated successfully!`, 'success');
      setShowEditModal(false);
      setSelectedClient(null);
      fetchSummary();
      fetchClients();
    } catch (err) {
      console.error('Failed to update client:', err);
      showToast(err.message || 'Failed to update client organisation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle Client Status ──────────────────────────────────────────────────
  const handleToggleStatus = async (client) => {
    const newStatus = client.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await apiClient.patch(ENDPOINTS.ADMIN.CLIENT_STATUS(client.id), {
        status: newStatus,
        isActive: newStatus === 'Active',
      });
      showToast(`Client "${client.name}" marked as ${newStatus}`, 'success');
      fetchSummary();
      fetchClients();
    } catch (err) {
      console.error('Failed to toggle client status:', err);
      showToast(err.message || 'Failed to update client status', 'error');
    }
  };

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`} style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 8px 30px rgba(0,0,0,0.18)'
        }}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={26} color="var(--color-primary, #1e40af)" />
            Client Management
          </h1>
          <p className="page-sub">
            Maintain institutional testing agency profiles, official commissioning contacts and examination authorities.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRefreshAll}
            disabled={loading}
            title="Refresh directory"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleOpenCreate}
          >
            <Plus size={14} />
            Create New Client
          </button>
        </div>
      </div>

      {/* ── Summary Cards (3 Cards) ─────────────────────────────────────────── */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {/* Card 1: Total Clients */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">TOTAL CLIENTS</span>
            <div className="kpi-card__icon" style={{ background: '#eff6ff' }}>
              <Building2 size={16} color="#1e40af" />
            </div>
          </div>
          <div className="kpi-card__value">
            {summaryLoading ? '...' : summary.totalClients}
          </div>
          <div className="kpi-card__sub">
            Registered examination commission authorities
          </div>
        </div>

        {/* Card 2: Active Clients */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">ACTIVE CLIENTS</span>
            <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
              <CheckCircle2 size={16} color="#16a34a" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-success, #16a34a)' }}>
            {summaryLoading ? '...' : summary.activeClients}
          </div>
          <div className="kpi-card__sub">
            Currently active testing partners
          </div>
        </div>

        {/* Card 3: Inactive Clients */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">INACTIVE CLIENTS</span>
            <div className="kpi-card__icon" style={{ background: '#fef2f2' }}>
              <Clock size={16} color="#dc2626" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-danger, #dc2626)' }}>
            {summaryLoading ? '...' : summary.inactiveClients}
          </div>
          <div className="kpi-card__sub">
            Dormant or archived client accounts
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertCircle size={18} />
          <div style={{ flex: 1 }}>{error}</div>
          <button className="btn btn-sm btn-secondary" onClick={handleRefreshAll}>Retry</button>
        </div>
      )}

      {/* ── Client Directory Card ───────────────────────────────────────────── */}
      <div className="card">
        {/* Card Header & Filter Controls */}
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: 'min(100%, 320px)' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by Client ID, Name, Rep..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: 32, fontSize: '0.8125rem' }}
            />
          </div>

          {/* Status Filter */}
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: 150, fontSize: '0.75rem' }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {(search || statusFilter) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setPage(1);
              }}
              style={{ fontSize: '0.75rem' }}
            >
              Reset Filters
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing <strong>{clients.length}</strong> of <strong>{totalCount}</strong> clients
          </div>
        </div>

        {/* Client Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 70, textAlign: 'center' }}>S. NO.</th>
                <th style={{ width: 140 }}>CLIENT ID</th>
                <th style={{ minWidth: 160 }}>CLIENT NAME</th>
                <th style={{ minWidth: 180 }}>REPRESENTATIVE NAME</th>
                <th style={{ minWidth: 220 }}>OFFICIAL EMAIL ID</th>
                <th style={{ width: 140, textAlign: 'center' }}>TOTAL NO. OF EXAMS</th>
                <th style={{ width: 130, textAlign: 'center' }}>ACTIVE EXAMS</th>
                <th style={{ width: 120 }}>STATUS</th>
                <th style={{ width: 140, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                    Loading client directory from database...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <Building2 size={32} style={{ margin: '0 auto 10px', opacity: 0.4, display: 'block' }} />
                    No client organisations match your query.
                  </td>
                </tr>
              ) : (
                clients.map((c, idx) => {
                  const serialNumber = (page - 1) * limit + idx + 1;
                  const clientIdDisplay = c.code || c.id;
                  return (
                    <tr key={c.id}>
                      {/* S. No. */}
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {serialNumber}
                      </td>

                      {/* Client ID (Double-click to copy) */}
                      <td>
                        <span
                          onDoubleClick={() => handleCopy(clientIdDisplay, 'Client ID')}
                          title="Double-click to copy Client ID"
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: 'var(--color-primary, #1e40af)',
                            cursor: 'copy',
                            background: 'rgba(30, 64, 175, 0.08)',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}
                        >
                          {clientIdDisplay}
                        </span>
                      </td>

                      {/* Client Name */}
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                          {c.name}
                        </span>
                        {c.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {c.description}
                          </div>
                        )}
                      </td>

                      {/* Client Representative Name */}
                      <td>
                        <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>{c.fullName || '—'}</span>
                        </div>
                      </td>

                      {/* Client Representative Official Email ID */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                          <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                          <a
                            href={`mailto:${c.contactEmail}`}
                            style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                            title="Send email"
                          >
                            {c.contactEmail || '—'}
                          </a>
                        </div>
                      </td>

                      {/* Total No. of Exams */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {c.totalExams ?? (c._count?.projects || 0)} Exams
                        </span>
                      </td>

                      {/* Active Exams */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {c.activeExams ?? 0} Active
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge status={c.status || 'Active'} />
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenView(c)}
                            title="View Client Profile & Associated Projects"
                            style={{ padding: '5px 8px' }}
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Client Information"
                            style={{ padding: '5px 8px' }}
                          >
                            <Edit size={13} />
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

        {/* Pagination Bar */}
        <div className="card-footer" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="form-control"
              style={{ width: 70, height: 32, padding: '2px 8px', fontSize: '0.8125rem' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pNum = page - 2 + i;
                if (pNum > totalPages) pNum = totalPages - (4 - i);
              }
              return (
                <button
                  key={pNum}
                  className={`btn btn-sm ${page === pNum ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPage(pNum)}
                  style={{ minWidth: 32, padding: '4px 8px' }}
                >
                  {pNum}
                </button>
              );
            })}
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── CREATE CLIENT MODAL ──────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => !submitting && setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={20} color="var(--color-primary)" />
                Create New Client Organisation
              </h3>
              <button
                className="btn-ghost"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCreate} className="modal-form">
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
                    value={clientForm.name}
                    onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
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
                    value={clientForm.fullName}
                    onChange={e => setClientForm({ ...clientForm, fullName: e.target.value })}
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
                    value={clientForm.contactEmail}
                    onChange={e => setClientForm({ ...clientForm, contactEmail: e.target.value })}
                  />
                </div>

                {/* Status */}
                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select
                    className="form-control"
                    value={clientForm.status}
                    onChange={e => setClientForm({ ...clientForm, status: e.target.value })}
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
                    value={clientForm.description}
                    onChange={e => setClientForm({ ...clientForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
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
      )}

      {/* ── EDIT CLIENT MODAL ────────────────────────────────────────────────── */}
      {showEditModal && selectedClient && (
        <div className="modal-backdrop" onClick={() => !submitting && setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit size={18} color="var(--color-primary)" />
                Edit Client: {selectedClient.name}
              </h3>
              <button
                className="btn-ghost"
                onClick={() => setShowEditModal(false)}
                disabled={submitting}
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form">
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
                    value={clientForm.fullName}
                    onChange={e => setClientForm({ ...clientForm, fullName: e.target.value })}
                  />
                </div>

                {/* Client Representative Official Email ID (Editable) */}
                <div className="form-group">
                  <label className="form-label">Client Representative Official Email ID *</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={clientForm.contactEmail}
                    onChange={e => setClientForm({ ...clientForm, contactEmail: e.target.value })}
                  />
                </div>

                {/* Status */}
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={clientForm.status}
                    onChange={e => setClientForm({ ...clientForm, status: e.target.value })}
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
                    value={clientForm.description}
                    onChange={e => setClientForm({ ...clientForm, description: e.target.value })}
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
                  onClick={() => setShowEditModal(false)}
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
      )}

      {/* ── VIEW CLIENT DETAILS MODAL ────────────────────────────────────────── */}
      {showViewModal && selectedClient && (
        <div className="modal-backdrop" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 780 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={22} color="var(--color-primary)" />
                <div>
                  <h3 className="modal-title">{selectedClient.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      background: 'rgba(30, 64, 175, 0.1)',
                      color: 'var(--color-primary)',
                      padding: '2px 6px',
                      borderRadius: 4
                    }}>
                      {selectedClient.code || selectedClient.id}
                    </span>
                    <StatusBadge status={selectedClient.status || 'Active'} />
                  </div>
                </div>
              </div>
              <button
                className="btn-ghost"
                onClick={() => setShowViewModal(false)}
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Client Master Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Representative Name</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{selectedClient.fullName || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official Email ID</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.8125rem', marginTop: 2 }}>
                    {selectedClient.contactEmail || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registration Date</div>
                  <div style={{ marginTop: 2, fontSize: '0.8125rem' }}>
                    {selectedClient.createdAt ? new Date(selectedClient.createdAt).toLocaleDateString('en-IN') : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Associated Examination Projects</div>
                  <div style={{ marginTop: 2, fontWeight: 700, color: 'var(--color-primary)' }}>
                    {selectedClient.totalExams ?? (selectedClient.projects?.length || 0)} Total ({selectedClient.activeExams ?? 0} Active)
                  </div>
                </div>
              </div>

              {/* Contextual Associated Projects Table */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={15} color="var(--color-primary)" />
                    Associated Examination Projects (Read-Only Context)
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Managed in Project Management module
                  </span>
                </div>

                {clientDetailsLoading ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    <Loader2 className="animate-spin" size={20} style={{ margin: '0 auto 6px', display: 'block' }} />
                    Loading associated examination drives...
                  </div>
                ) : !selectedClient.projects || selectedClient.projects.length === 0 ? (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 6,
                    border: '1px dashed rgba(255,255,255,0.1)',
                    color: 'var(--text-muted)',
                    fontSize: '0.8125rem'
                  }}>
                    No examination projects have been created for this client yet.
                  </div>
                ) : (
                  <div className="table-wrapper" style={{ maxHeight: 240, overflowY: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Project Code</th>
                          <th>Project Title</th>
                          <th>Exam Type</th>
                          <th>Stage</th>
                          <th>Target Candidates</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClient.projects.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
                                {p.projectCode}
                              </span>
                            </td>
                            <td>{p.name}</td>
                            <td>{p.examType || 'CBT'}</td>
                            <td>
                              <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                                {p.stage}
                              </span>
                            </td>
                            <td>{p.candidateTarget ? Number(p.candidateTarget).toLocaleString('en-IN') : '—'}</td>
                            <td>
                              <StatusBadge status={p.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Client ID: <code style={{ color: 'var(--color-primary)' }}>{selectedClient.code || selectedClient.id}</code>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
