import { useState } from 'react';
import {
  UserCheck, Search, Filter, CheckCircle2, Clock, XCircle,
  MessageSquare, RefreshCw, Send, Eye, ShieldCheck, AlertCircle, FileText
} from 'lucide-react';
import { ConsentStore, appendAuditLog } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common';

export default function ConsentManagementPage() {
  const { user } = useAuth();
  const [consents, setConsents] = useState(() => ConsentStore.getAll());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedConsent, setSelectedConsent] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadData = () => setConsents(ConsentStore.getAll());

  const filteredConsents = consents.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      const match = c.centre_name?.toLowerCase().includes(q) ||
                    c.project_name?.toLowerCase().includes(q) ||
                    c.consent_sign_name?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    return true;
  });

  const acceptedCount = consents.filter(c => c.status === 'Accepted').length;
  const pendingCount  = consents.filter(c => c.status === 'Pending').length;
  const discussCount  = consents.filter(c => c.status === 'Discuss').length;
  const rejectedCount = consents.filter(c => c.status === 'Rejected').length;

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

      {/* Header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <div className="breadcrumb">
              <span>Operations</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Digital Consent Tracker</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>Digital Consent &amp; Undertaking Management</h1>
            <p className="page-header__subtitle">
              Module 3C — Monitor digital consent requests dispatched to venue heads, review counter-offers, and verify signatory authorization
            </p>
          </div>
          <div className="page-header__actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                ConsentStore.reset();
                reloadData();
                showToast('Reset consent records to default');
              }}
            >
              <RefreshCw size={14} /> Reset Data
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Consent Confirmed</span>
            <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
              <ShieldCheck size={16} color="#16a34a" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-success)' }}>{acceptedCount}</div>
          <div className="kpi-card__sub">Signed digital undertakings</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Pending Response</span>
            <div className="kpi-card__icon" style={{ background: '#eff6ff' }}>
              <Clock size={16} color="#1e40af" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-primary)' }}>{pendingCount}</div>
          <div className="kpi-card__sub">Awaiting venue authorization</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">In Discussion / Counter</span>
            <div className="kpi-card__icon" style={{ background: '#fffbeb' }}>
              <MessageSquare size={16} color="#d97706" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-warning)' }}>{discussCount}</div>
          <div className="kpi-card__sub">Rate or node renegotiation</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Declined / Rejected</span>
            <div className="kpi-card__icon" style={{ background: '#fef2f2' }}>
              <XCircle size={16} color="#dc2626" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-danger)' }}>{rejectedCount}</div>
          <div className="kpi-card__sub">Requires re-routing replacement</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search centre, project, signatory..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 30, fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {['All', 'Accepted', 'Pending', 'Discuss', 'Rejected'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: statusFilter === st ? 'var(--color-primary)' : 'var(--border-default)',
                  background: statusFilter === st ? '#eff6ff' : 'var(--bg-surface)',
                  color: statusFilter === st ? 'var(--color-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Centre Name</th>
                <th>Target Project</th>
                <th>Exam Date</th>
                <th>Capacity Offered</th>
                <th>Proposed Rate</th>
                <th>Signatory &amp; Timestamp</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConsents.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No consent records found.
                  </td>
                </tr>
              ) : (
                filteredConsents.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.centre_name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>ID: {c.centre_id}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{c.project_name}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem' }}>{c.exam_date}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{c.proposed_nodes}</span> nodes ({c.proposed_shifts} shifts)
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {c.proposed_rate}
                      </span>
                    </td>
                    <td>
                      {c.consent_sign_name ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-success)' }}>
                            ✓ {c.consent_sign_name}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            {new Date(c.consent_signed_at).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Awaiting signature
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'Accepted' ? 'badge-success' : c.status === 'Discuss' ? 'badge-warning' : c.status === 'Rejected' ? 'badge-danger' : 'badge-neutral'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedConsent(c)}
                      >
                        <Eye size={13} /> View Terms
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedConsent && (
        <div className="modal-backdrop" onClick={() => setSelectedConsent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Consent Record: {selectedConsent.centre_name}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedConsent.project_name}</div>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedConsent(null)} style={{ padding: 4 }}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--bg-subtle)', padding: 14, borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Undertaking Framework</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: 2 }}>{selectedConsent.terms}</div>
              </div>

              <div className="grid-2" style={{ fontSize: '0.8125rem' }}>
                <div>Allocated Nodes: <strong>{selectedConsent.proposed_nodes} Systems</strong></div>
                <div>Exam Shifts: <strong>{selectedConsent.proposed_shifts} Shifts</strong></div>
                <div>Offered Rate: <strong>{selectedConsent.proposed_rate}</strong></div>
                <div>Exam Date: <strong>{selectedConsent.exam_date}</strong></div>
              </div>

              {selectedConsent.discuss_remark && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309' }}>Centre Discussion Notes / Counter-Offer:</div>
                  <div style={{ fontSize: '0.8125rem', color: '#92400e', marginTop: 4 }}>{selectedConsent.discuss_remark}</div>
                </div>
              )}

              {selectedConsent.consent_sign_name && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534' }}>Digital Authorization Verified</div>
                  <div style={{ fontSize: '0.8125rem', color: '#166534', marginTop: 2 }}>
                    Signatory: <strong>{selectedConsent.consent_sign_name}</strong> • Time: {new Date(selectedConsent.consent_signed_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedConsent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
