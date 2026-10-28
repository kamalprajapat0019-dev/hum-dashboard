import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Shield, Bell, CheckCircle2, Clock, Search, Filter,
  RefreshCw, AlertTriangle, ToggleLeft, ToggleRight, Info, Check,
  AlertCircle, Loader2
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { useAuth } from '@/context/AuthContext';

export default function ConfigPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('audit'); // audit | rules
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsRes, configsRes] = await Promise.allSettled([
        apiClient.get(ENDPOINTS.ADMIN.AUDIT_LOGS, { params: { limit: 100 } }),
        apiClient.get(ENDPOINTS.ADMIN.CONFIG),
      ]);

      if (logsRes.status === 'fulfilled' && logsRes.value?.success && Array.isArray(logsRes.value.data)) {
        setLogs(logsRes.value.data);
      } else {
        setLogs([]);
      }

      if (configsRes.status === 'fulfilled' && configsRes.value?.success && Array.isArray(configsRes.value.data)) {
        setConfigs(configsRes.value.data);
      } else {
        setConfigs([]);
      }
    } catch (err) {
      console.error('Failed to load audit logs / configs:', err);
      setError(err.message || 'Unable to load system configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLogs = logs.filter(l => {
    if (search) {
      const q = search.toLowerCase();
      const match = (l.userEmail || l.user?.name || '')?.toLowerCase().includes(q) ||
                    l.entity?.toLowerCase().includes(q) ||
                    l.action?.toLowerCase().includes(q) ||
                    JSON.stringify(l.details || {})?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (actionFilter && l.action !== actionFilter) return false;
    return true;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action).filter(Boolean)));

  return (
    <div>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: toast.type === 'error' ? '#b91c1c' : 'var(--color-primary-dark, #1e3a8a)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} color="#4ade80" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <div className="breadcrumb">
              <span>Admin</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Audit Trail &amp; Configuration</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>System Configuration &amp; Security Audit Trail</h1>
            <p className="page-header__subtitle">
              Immutable audit logs and system configuration stored in MySQL
            </p>
          </div>
          <div className="page-header__actions">
            <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Logs
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#991b1b',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} />
            <div>
              <strong>Failed to query audit trail:</strong> {error}
            </div>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={loadData}
            style={{ background: '#fff', borderColor: '#f87171', color: '#991b1b' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Security Audit Trail ({logs.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          System Parameters &amp; Config ({configs.length})
        </button>
      </div>

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', width: 'min(100%, 300px)' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search audit trail..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 30, fontSize: '0.8125rem' }}
              />
            </div>

            <select
              className="form-control"
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              style={{ width: 200, fontSize: '0.75rem' }}
            >
              <option value="">All Action Types</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor / User</th>
                  <th>Action Type</th>
                  <th>Target Entity</th>
                  <th>Operation Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                      Loading immutable audit records from MySQL...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No audit trail records match the specified query.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(l => (
                    <tr key={l.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />
                          <span>{new Date(l.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{l.user?.name || l.userEmail || 'System'}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {l.user?.role || 'SYSTEM'} {l.ipAddress ? `· ${l.ipAddress}` : ''}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>
                          {l.action}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{l.entity}</span>
                        {l.entityId && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> ({l.entityId})</span>}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {typeof l.details === 'object' && l.details !== null
                            ? JSON.stringify(l.details)
                            : String(l.details || '—')}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'rules' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Persisted System Configurations</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Global configuration parameters stored in table <code>oecm_system_configs</code>
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Config Key</th>
                  <th>Category</th>
                  <th>Persisted JSON Value</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Loading system configurations from MySQL...
                    </td>
                  </tr>
                ) : configs.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No system configurations found in database.
                    </td>
                  </tr>
                ) : (
                  configs.map(c => (
                    <tr key={c.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {c.key}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info">{c.category}</span>
                      </td>
                      <td>
                        <pre style={{ margin: 0, fontSize: '0.75rem', background: 'var(--bg-subtle, #f8fafc)', padding: '6px 10px', borderRadius: 6, maxWidth: 450, overflowX: 'auto' }}>
                          {JSON.stringify(c.value, null, 2)}
                        </pre>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {c.updatedAt ? new Date(c.updatedAt).toLocaleString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
