import { useState } from 'react';
import {
  FileText, Shield, Bell, CheckCircle2, Clock, Search, Filter,
  RefreshCw, AlertTriangle, ToggleLeft, ToggleRight, Info, Check
} from 'lucide-react';
import { getAuditLogs, appendAuditLog } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_EVENT_RULES = [
  { id: 'ev1', code: 'SCAN_DUPLICATE_MAC', name: 'Technical Scan Duplicate MAC Alert', category: 'Compliance', severity: 'Critical', enabled: true, desc: 'Triggers high-priority security alert when duplicate hardware MAC addresses are detected at a venue.' },
  { id: 'ev2', code: 'AUDIT_CRITICAL_FINDING', name: 'Audit Critical Finding Escalation', category: 'Compliance', severity: 'Critical', enabled: true, desc: 'Immediately notifies PM and Ops Lead when a centre fails critical audit parameters.' },
  { id: 'ev3', code: 'DOC_REJECTED', name: 'Document Rejection Notification', category: 'Operations', severity: 'Medium', enabled: true, desc: 'Dispatches instant re-upload notification with mandatory rejection remarks to Centre User.' },
  { id: 'ev4', code: 'BOOKING_CONFLICT', name: 'Concurrent Booking Overlap Warning', category: 'Operations', severity: 'High', enabled: true, desc: 'Alerts Ops executive if a centre is allocated to overlapping exam dates across different projects.' },
  { id: 'ev5', code: 'MOCK_TEST_FAILED', name: 'Mock Examination Failure Alert', category: 'Execution', severity: 'Critical', enabled: true, desc: 'Automates rapid escalation ticket to IT Field Team when mock exam completion is marked Failed.' },
  { id: 'ev6', code: 'COMMERCIAL_RATE_DISCREPANCY', name: 'Cost Sheet Rate Deviation', category: 'Finance', severity: 'Medium', enabled: true, desc: 'Notifies Accounts team if agreed centre per-node payout exceeds client sanction limit.' },
];

export default function ConfigPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState(() => getAuditLogs());
  const [activeTab, setActiveTab] = useState('audit'); // audit | rules
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [rules, setRules] = useState(DEFAULT_EVENT_RULES);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const reloadLogs = () => setLogs(getAuditLogs());

  const handleToggleRule = (ruleId) => {
    setRules(prev => prev.map(r => {
      if (r.id === ruleId) {
        const nextState = !r.enabled;
        appendAuditLog({
          user: user?.name || 'Admin',
          role: 'admin',
          action: 'CONFIG_CHANGE',
          entity: `Rule: ${r.name}`,
          details: `Toggled notification rule to ${nextState ? 'ENABLED' : 'DISABLED'}`,
        });
        showToast(`${r.name} is now ${nextState ? 'Enabled' : 'Disabled'}`);
        return { ...r, enabled: nextState };
      }
      return r;
    }));
    reloadLogs();
  };

  const filteredLogs = logs.filter(l => {
    if (search) {
      const q = search.toLowerCase();
      const match = l.user?.toLowerCase().includes(q) ||
                    l.entity?.toLowerCase().includes(q) ||
                    l.details?.toLowerCase().includes(q) ||
                    l.action?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (actionFilter && l.action !== actionFilter) return false;
    return true;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action).filter(Boolean)));

  return (
    <div>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          maxWidth: 'calc(100vw - 32px)',
          boxSizing: 'border-box',
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

      {/* Header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <div className="breadcrumb">
              <span>Admin</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Audit Trail & Configuration</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>System Configuration & Security Audit Trail</h1>
            <p className="page-header__subtitle">
              Module 1 — Platform Foundation, immutable system logs, and automated event notification triggers
            </p>
          </div>
          <div className="page-header__actions">
            <button className="btn btn-secondary" onClick={reloadLogs}>
              <RefreshCw size={14} /> Refresh Logs
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                appendAuditLog({
                  user: user?.name || 'Admin',
                  role: user?.role || 'admin',
                  action: 'MANUAL_AUDIT_STAMP',
                  entity: 'Security Checkpoint',
                  details: 'Manual verification stamp generated by system administrator',
                });
                reloadLogs();
                showToast('Audit timestamp generated!');
              }}
            >
              <Shield size={14} /> Generate Checkpoint Stamp
            </button>
          </div>
        </div>
      </div>

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
          Event Notification Rules ({rules.length})
        </button>
      </div>

      {activeTab === 'audit' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', width: 'min(100%, 280px)' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Filter logs by user, action, entity..."
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
              {uniqueActions.map(act => <option key={act} value={act}>{act}</option>)}
            </select>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '170px' }}>Timestamp (UTC/IST)</th>
                  <th>Actor / Role</th>
                  <th>Action Event</th>
                  <th>Target Entity</th>
                  <th>Audit Details</th>
                  <th>Integrity</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No audit events recorded matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                          <Clock size={12} color="var(--text-muted)" />
                          <span>{log.ts ? new Date(log.ts).toLocaleString() : 'Just now'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.user}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>role: {log.role}</div>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontFamily: 'monospace', fontSize: '0.6875rem' }}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{log.entity}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {log.details}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-success" style={{ fontSize: '0.625rem' }}>
                          VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Notification Rules */}
      {activeTab === 'rules' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Automated Event Rules & Notification Triggers</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Rules configuring automated escalation messages, emails, and in-app alerts on critical operational milestones
              </p>
            </div>
            <span className="badge badge-success">Engine Active</span>
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {rules.map(rule => (
              <div
                key={rule.id}
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  background: rule.enabled ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                  transition: 'background var(--transition-fast)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {rule.name}
                    </span>
                    <span className={`badge ${rule.severity === 'Critical' ? 'badge-danger' : rule.severity === 'High' ? 'badge-warning' : 'badge-info'}`}>
                      {rule.severity}
                    </span>
                    <span className="badge badge-purple">{rule.category}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {rule.desc}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 4 }}>
                    Event Key: {rule.code}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleRule(rule.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-default)',
                    background: rule.enabled ? '#eff6ff' : 'var(--bg-surface)',
                    color: rule.enabled ? 'var(--color-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {rule.enabled ? (
                    <>
                      <CheckCircle2 size={16} color="var(--color-primary)" />
                      <span>Enabled</span>
                    </>
                  ) : (
                    <>
                      <Clock size={16} color="var(--text-muted)" />
                      <span>Disabled</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
