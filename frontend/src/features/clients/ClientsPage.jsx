import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useClient } from '@/context/ClientContext';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import {
  ClientKpiCards,
  ClientsTable,
  ClientCreateModal,
  ClientEditModal,
  ClientViewModal,
  ClientStatusModal,
  INITIAL_CLIENT_FORM,
} from './components';

export default function ClientsPage() {
  const { user: currentUser } = useAuth();
  const { refreshClients } = useClient();

  const userRole = (currentUser?.role || '').toUpperCase();
  const canManageClients = userRole === 'ADMIN' || userRole === 'OPERATIONS';

  // ── Loading & Feedback State ───────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);
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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [statusToggleClient, setStatusToggleClient] = useState(null);
  const [clientDetailsLoading, setClientDetailsLoading] = useState(false);

  // ── Form State ────────────────────────────────────────────────────────────
  const [clientForm, setClientForm] = useState(INITIAL_CLIENT_FORM);

  // Show Toast Feedback
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Copy to clipboard helper
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
      setSummaryError(null);
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
      setSummaryError(err.message || 'Unable to retrieve client summary counts');
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
    setClientForm(INITIAL_CLIENT_FORM);
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

  // ── Open Status Modal ─────────────────────────────────────────────────────
  const handleOpenStatus = (client) => {
    setStatusToggleClient(client);
    setShowStatusModal(true);
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
      setClientForm(INITIAL_CLIENT_FORM);
      await Promise.all([fetchSummary(), fetchClients()]);
      if (refreshClients) refreshClients();
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
      await Promise.all([fetchSummary(), fetchClients()]);
      if (refreshClients) refreshClients();
    } catch (err) {
      console.error('Failed to update client:', err);
      showToast(err.message || 'Failed to update client organisation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Execute Status Toggle ─────────────────────────────────────────────────
  const handleExecuteStatusToggle = async () => {
    if (!statusToggleClient) return;
    const newStatus = statusToggleClient.status === 'Active' ? 'Inactive' : 'Active';

    try {
      setSubmitting(true);
      await apiClient.patch(ENDPOINTS.ADMIN.CLIENT_STATUS(statusToggleClient.id), { status: newStatus });
      showToast(
        newStatus === 'Active'
          ? `Client "${statusToggleClient.name}" has been successfully reactivated.`
          : `Client "${statusToggleClient.name}" has been deactivated.`,
        'success'
      );
      setShowStatusModal(false);
      setStatusToggleClient(null);
      await Promise.all([fetchSummary(), fetchClients()]);
      if (refreshClients) refreshClients();
    } catch (err) {
      console.error('Failed to update client status:', err);
      showToast(err.message || 'Failed to update client status', 'error');
    } finally {
      setSubmitting(false);
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
          <div className="breadcrumb" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Admin</span>
            <span className="breadcrumb-sep" style={{ margin: '0 6px' }}>/</span>
            <span className="breadcrumb-current" style={{ color: 'var(--color-primary)' }}>Client Management</span>
          </div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
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
            disabled={loading || summaryLoading}
            title="Refresh directory"
          >
            <RefreshCw size={14} className={loading || summaryLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {canManageClients && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleOpenCreate}
            >
              <Plus size={14} />
              Create New Client
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <ClientKpiCards
        summary={summary}
        summaryLoading={summaryLoading}
        summaryError={summaryError}
        onRetry={fetchSummary}
      />

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertCircle size={18} />
          <div style={{ flex: 1 }}>{error}</div>
          <button className="btn btn-sm btn-secondary" onClick={handleRefreshAll}>Retry</button>
        </div>
      )}

      {/* Client Directory Table */}
      <ClientsTable
        clients={clients}
        loading={loading}
        totalCount={totalCount}
        page={page}
        limit={limit}
        totalPages={totalPages}
        search={search}
        statusFilter={statusFilter}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        onResetFilters={() => {
          setSearch('');
          setStatusFilter('');
          setPage(1);
        }}
        onPageChange={setPage}
        onLimitChange={(lim) => {
          setLimit(lim);
          setPage(1);
        }}
        onOpenView={handleOpenView}
        onOpenEdit={handleOpenEdit}
        onOpenStatus={handleOpenStatus}
        onCopy={handleCopy}
        canManageClients={canManageClients}
      />

      {/* Modals */}
      <ClientCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        form={clientForm}
        setForm={setClientForm}
        onSubmit={handleSaveCreate}
        submitting={submitting}
      />

      <ClientEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        selectedClient={selectedClient}
        form={clientForm}
        setForm={setClientForm}
        onSubmit={handleSaveEdit}
        submitting={submitting}
      />

      <ClientViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        selectedClient={selectedClient}
        loading={clientDetailsLoading}
      />

      <ClientStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        client={statusToggleClient}
        onConfirm={handleExecuteStatusToggle}
        submitting={submitting}
      />
    </div>
  );
}
