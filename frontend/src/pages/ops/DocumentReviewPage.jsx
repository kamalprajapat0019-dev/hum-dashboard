import { useState } from 'react';
import {
  FileText, CheckCircle2, XCircle, AlertTriangle, Search, Filter,
  Eye, RefreshCw, Check, X, ShieldCheck, Download, Clock
} from 'lucide-react';
import { DocStore, DOC_TYPES, CentreStore, appendAuditLog } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, ProgressRing } from '../../components/common';

export default function DocumentReviewPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState(() => DocStore.getAll());
  const [centres] = useState(() => CentreStore.getAll());
  const [selectedCentreId, setSelectedCentreId] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [reworkDoc, setReworkDoc] = useState(null);
  const [reworkReason, setReworkReason] = useState('Police verification seal missing on document page 2.');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadData = () => setDocs(DocStore.getAll());

  // Attach centre names
  const enrichedDocs = docs.map(d => {
    const c = centres.find(cn => cn.id === d.centre_id);
    const docMeta = DOC_TYPES.find(dt => dt.key === d.doc_type);
    return {
      ...d,
      centre_name: c ? c.centre_name : 'Lotus Computer Education',
      label: docMeta ? docMeta.label : d.doc_type,
      mandatory: docMeta ? docMeta.mandatory : false,
    };
  });

  const filteredDocs = enrichedDocs.filter(d => {
    if (selectedCentreId !== 'All' && d.centre_id !== selectedCentreId) return false;
    if (statusFilter !== 'All' && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match = d.centre_name?.toLowerCase().includes(q) ||
                    d.label?.toLowerCase().includes(q) ||
                    d.file_name?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const approvedCount = docs.filter(d => d.status === 'Approved').length;
  const pendingCount  = docs.filter(d => d.status === 'Pending').length;
  const reworkCount   = docs.filter(d => d.status === 'Rejected').length;

  const handleApprove = (doc) => {
    DocStore.update(doc.id, {
      status: 'Approved',
      remark: 'Verified by Operations Verification Desk',
    });

    appendAuditLog({
      user: user?.name || 'Ops Executive',
      role: user?.role || 'operations_executive',
      action: 'DOCUMENT_APPROVED',
      entity: `${doc.centre_name} — ${doc.label}`,
      details: 'Compliance verification cleared successfully',
    });

    reloadData();
    showToast(`Approved "${doc.label}" for ${doc.centre_name}!`);
  };

  const handleReworkSubmit = (e) => {
    e.preventDefault();
    if (!reworkDoc) return;

    DocStore.update(reworkDoc.id, {
      status: 'Rejected',
      remark: reworkReason,
    });

    appendAuditLog({
      user: user?.name || 'Ops Executive',
      role: user?.role || 'operations_executive',
      action: 'DOCUMENT_REJECTED_REWORK',
      entity: `${reworkDoc.centre_name} — ${reworkDoc.label}`,
      details: `Rejection notice dispatched: ${reworkReason}`,
    });

    reloadData();
    setReworkDoc(null);
    showToast(`Rework notification sent to ${reworkDoc.centre_name}.`);
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

      {/* Header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <div className="breadcrumb">
              <span>Operations</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Document Verification Desk</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>Venue Compliance &amp; Document Review Desk</h1>
            <p className="page-header__subtitle">
              Module 3D / 4 — Cross-venue document verification, legal agreement auditing, and automated rework workflows
            </p>
          </div>
          <div className="page-header__actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                DocStore.reset();
                reloadData();
                showToast('Reset documents dataset to default');
              }}
            >
              <RefreshCw size={14} /> Reset Documents
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Approved Documents</span>
            <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
              <ShieldCheck size={16} color="#16a34a" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-success)' }}>{approvedCount}</div>
          <div className="kpi-card__sub">Legally verified &amp; archived</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Pending Review</span>
            <div className="kpi-card__icon" style={{ background: '#eff6ff' }}>
              <Clock size={16} color="#1e40af" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-primary)' }}>{pendingCount}</div>
          <div className="kpi-card__sub">Awaiting verification signoff</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Rework / Discrepancy</span>
            <div className="kpi-card__icon" style={{ background: '#fef2f2' }}>
              <AlertTriangle size={16} color="#dc2626" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-danger)' }}>{reworkCount}</div>
          <div className="kpi-card__sub">Action required from venue</div>
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
              placeholder="Search centre, doc name, file..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 30, fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select
              className="form-control"
              value={selectedCentreId}
              onChange={e => setSelectedCentreId(e.target.value)}
              style={{ width: 220, fontSize: '0.75rem' }}
            >
              <option value="All">All Centres</option>
              {centres.map(c => (
                <option key={c.id} value={c.id}>{c.centre_name}</option>
              ))}
            </select>

            <select
              className="form-control"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: 140, fontSize: '0.75rem' }}
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rework / Rejected</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Centre Name</th>
                <th>Document Type</th>
                <th>Mandatory</th>
                <th>File Attached</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th>Verification Note</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No documents matching criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.centre_name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{doc.centre_id}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{doc.label}</div>
                      <div style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{doc.doc_type}</div>
                    </td>
                    <td>
                      {doc.mandatory ? (
                        <span className="badge badge-danger" style={{ fontSize: '0.625rem' }}>MANDATORY</span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>OPTIONAL</span>
                      )}
                    </td>
                    <td>
                      {doc.file_name ? (
                        <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                          {doc.file_name}
                        </span>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{doc.uploaded_at || '—'}</span>
                    </td>
                    <td>
                      <StatusBadge status={doc.status} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: doc.remark ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                        {doc.remark || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {doc.file_name && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Preview file"
                            onClick={() => setPreviewDoc(doc)}
                          >
                            <Eye size={13} />
                          </button>
                        )}
                        <button
                          className="btn btn-primary btn-sm"
                          title="Approve document"
                          onClick={() => handleApprove(doc)}
                          disabled={doc.status === 'Approved'}
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          title="Reject / Rework"
                          onClick={() => setReworkDoc(doc)}
                        >
                          <X size={13} /> Rework
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rework Modal */}
      {reworkDoc && (
        <div className="modal-backdrop" onClick={() => setReworkDoc(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--color-danger)' }}>
                Issue Rework Notice ({reworkDoc.label})
              </h3>
              <button className="btn-ghost" onClick={() => setReworkDoc(null)} style={{ padding: 4 }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleReworkSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.8125rem', color: '#991b1b' }}>
                  Venue <strong>{reworkDoc.centre_name}</strong> will receive an immediate notification to re-upload this document.
                </div>

                <div className="form-group">
                  <label className="form-label">Mandatory Discrepancy Reason *</label>
                  <textarea
                    className="form-control"
                    required
                    rows={3}
                    value={reworkReason}
                    onChange={e => setReworkReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setReworkDoc(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  <X size={14} /> Dispatch Rework Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="modal-backdrop" onClick={() => setPreviewDoc(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">{previewDoc.label}</h3>
              <button className="btn-ghost" onClick={() => setPreviewDoc(null)} style={{ padding: 4 }}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 20px', background: '#0f172a', color: '#fff', borderRadius: 'var(--radius-lg)' }}>
              <FileText size={48} color="#60a5fa" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{previewDoc.file_name}</div>
              <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: 4 }}>
                Centre: {previewDoc.centre_name} • Uploaded: {previewDoc.uploaded_at}
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    showToast(`Downloaded ${previewDoc.file_name}`);
                    setPreviewDoc(null);
                  }}
                >
                  <Download size={13} /> Download File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
