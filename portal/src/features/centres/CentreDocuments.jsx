import { useState } from 'react';
import {
  FileText, CheckCircle2, Clock, AlertTriangle, Upload, Eye,
  Download, RefreshCw, Filter, Search, Check, X, ShieldCheck, AlertCircle
} from 'lucide-react';
import { DocStore, DOC_TYPES, appendAuditLog } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge, ProgressRing } from '@/components/common';

export default function CentreDocuments() {
  const { user } = useAuth();
  const [docs, setDocs] = useState(() => DocStore.getAll().filter(d => d.centre_id === 'cn001'));
  const [filterType, setFilterType] = useState('all'); // all | mandatory | pending | approved
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalDoc, setUploadModalDoc] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadRemark, setUploadRemark] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Merge full DOC_TYPES with docs in store
  const allDocRows = DOC_TYPES.map(typeConfig => {
    const existing = docs.find(d => d.doc_type === typeConfig.key);
    return {
      doc_type: typeConfig.key,
      label: typeConfig.label,
      mandatory: typeConfig.mandatory,
      id: existing ? existing.id : null,
      status: existing ? existing.status : 'Pending',
      file_name: existing ? existing.file_name : '',
      uploaded_at: existing ? existing.uploaded_at : '',
      version: existing ? existing.version : 0,
      remark: existing ? existing.remark : '',
    };
  });

  const mandatoryTotal = DOC_TYPES.filter(d => d.mandatory).length;
  const mandatoryUploaded = allDocRows.filter(d => d.mandatory && d.status === 'Approved').length;
  const totalApproved = allDocRows.filter(d => d.status === 'Approved').length;
  const totalPending = allDocRows.filter(d => d.status === 'Pending').length;
  const totalActionNeeded = allDocRows.filter(d => d.status === 'Rejected' || (d.mandatory && !d.file_name)).length;

  const filteredDocs = allDocRows.filter(row => {
    if (searchQuery && !row.label.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterType === 'mandatory') return row.mandatory;
    if (filterType === 'approved') return row.status === 'Approved';
    if (filterType === 'pending') return row.status === 'Pending' || !row.file_name;
    if (filterType === 'rejected') return row.status === 'Rejected';
    return true;
  });

  const handleOpenUpload = (row) => {
    setUploadModalDoc(row);
    setUploadFileName(row.file_name || `${row.doc_type}_signed.pdf`);
    setUploadRemark('');
  };

  const handleSaveUpload = (e) => {
    e.preventDefault();
    if (!uploadModalDoc) return;

    const existing = DocStore.getAll().find(d => d.centre_id === 'cn001' && d.doc_type === uploadModalDoc.doc_type);

    if (existing) {
      DocStore.update(existing.id, {
        file_name: uploadFileName,
        uploaded_at: new Date().toISOString().split('T')[0],
        status: 'Approved',
        version: (existing.version || 1) + 1,
        remark: uploadRemark || 'Uploaded by centre representative',
      });
    } else {
      DocStore.create({
        centre_id: 'cn001',
        doc_type: uploadModalDoc.doc_type,
        status: 'Approved',
        file_name: uploadFileName,
        uploaded_at: new Date().toISOString().split('T')[0],
        version: 1,
        remark: uploadRemark || 'Uploaded by centre representative',
      });
    }

    appendAuditLog({
      user: user?.name || 'Centre Rep',
      role: 'centre_user',
      action: 'UPLOAD_DOCUMENT',
      entity: `Doc: ${uploadModalDoc.label}`,
      details: `Uploaded ${uploadFileName} (v${(uploadModalDoc.version || 0) + 1})`,
    });

    setDocs(DocStore.getAll().filter(d => d.centre_id === 'cn001'));
    setUploadModalDoc(null);
    showToast(`Successfully uploaded "${uploadModalDoc.label}"!`);
  };

  return (
    <div>
      {/* Toast */}
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
              <span>Centre</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Document Checklist</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>Centre Document Compliance</h1>
            <p className="page-header__subtitle">
              Module 4 — Mandatory legal compliance, agreements, certifications, and infrastructure undertakings
            </p>
          </div>
          <div className="page-header__actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                DocStore.reset();
                setDocs(DocStore.getAll().filter(d => d.centre_id === 'cn001'));
                showToast('Reset documents to default seed data');
              }}
            >
              <RefreshCw size={14} /> Reset Docs
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                const firstPending = allDocRows.find(d => d.status === 'Pending' || !d.file_name);
                if (firstPending) handleOpenUpload(firstPending);
                else showToast('All documents are already uploaded!');
              }}
            >
              <Upload size={14} /> Upload Next Document
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <ProgressRing value={mandatoryUploaded} max={mandatoryTotal} size={64} strokeWidth={6} color="#16a34a" />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Mandatory Compliance
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
              {mandatoryUploaded} / {mandatoryTotal}
            </div>
            <div style={{ fontSize: '0.75rem', color: mandatoryUploaded === mandatoryTotal ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 500, marginTop: 2 }}>
              {mandatoryUploaded === mandatoryTotal ? 'All Mandatory Complete' : `${mandatoryTotal - mandatoryUploaded} pending uploads`}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} color="#16a34a" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Approved Documents
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
              {totalApproved}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Out of {DOC_TYPES.length} total doc types
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} color="#d97706" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Pending Uploads
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
              {totalPending}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Action required from centre
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} color="#dc2626" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Urgent Attention
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: 2 }}>
              {totalActionNeeded}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Mandatory or re-submission
            </div>
          </div>
        </div>
      </div>

      {/* Main Checklist Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="var(--color-primary)" />
            <h3 className="card-title">Document Checklist (20 Items)</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search document name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 30, width: 220, fontSize: '0.8125rem' }}
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'mandatory', label: 'Mandatory' },
                { id: 'approved', label: 'Approved' },
                { id: 'pending', label: 'Pending' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    border: 'none',
                    background: filterType === tab.id ? 'var(--color-primary)' : 'var(--bg-surface)',
                    color: filterType === tab.id ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Document Type</th>
                <th>Requirement</th>
                <th>Status</th>
                <th>File Attached</th>
                <th>Version</th>
                <th>Upload Date</th>
                <th>Remarks / Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No documents matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => (
                  <tr key={doc.doc_type}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.label}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        code: {doc.doc_type}
                      </div>
                    </td>
                    <td>
                      {doc.mandatory ? (
                        <span className="badge badge-danger" style={{ fontSize: '0.625rem' }}>MANDATORY</span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>OPTIONAL</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={doc.status} />
                    </td>
                    <td>
                      {doc.file_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={14} color="var(--color-primary-light)" />
                          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }} className="truncate" title={doc.file_name}>
                            {doc.file_name}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                          No file uploaded
                        </span>
                      )}
                    </td>
                    <td>
                      {doc.version > 0 ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: 4 }}>
                          v{doc.version}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {doc.uploaded_at || '—'}
                      </span>
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
                            title="Preview Document"
                            onClick={() => setPreviewDoc(doc)}
                          >
                            <Eye size={13} /> View
                          </button>
                        )}
                        <button
                          className={`btn ${doc.status === 'Approved' ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                          title="Upload new version"
                          onClick={() => handleOpenUpload(doc)}
                        >
                          <Upload size={13} /> {doc.file_name ? 'Re-upload' : 'Upload'}
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

      {/* Upload Modal */}
      {uploadModalDoc && (
        <div className="modal-backdrop" onClick={() => setUploadModalDoc(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Upload {uploadModalDoc.label}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {uploadModalDoc.mandatory ? '⚠️ Required legal compliance document' : 'Optional supplementary verification document'}
                </p>
              </div>
              <button className="btn-ghost" onClick={() => setUploadModalDoc(null)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveUpload}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  border: '2px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  textAlign: 'center',
                  background: 'var(--bg-subtle)',
                  cursor: 'pointer'
                }} onClick={() => {
                  const sampleFiles = ['signed_affidavit.pdf', 'stamped_agreement.pdf', 'notary_copy.pdf', 'pan_card_scanned.pdf', 'pcc_clearance.pdf'];
                  const picked = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
                  setUploadFileName(`${uploadModalDoc.doc_type}_${picked}`);
                }}>
                  <Upload size={32} color="var(--color-primary-light)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Choose a file or click to simulate upload</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Accepted formats: PDF, JPG, PNG (Max 15MB)
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">File Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={uploadFileName}
                    onChange={e => setUploadFileName(e.target.value)}
                    placeholder="e.g. mou_stamped_signed.pdf"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks / Note (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={uploadRemark}
                    onChange={e => setUploadRemark(e.target.value)}
                    placeholder="e.g. Stamped on 100 Rs non-judicial stamp paper"
                  />
                </div>

                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', gap: 10 }}>
                  <AlertCircle size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                    Once uploaded, this document will be tagged for operational review by the Operations Executive and Project Manager.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setUploadModalDoc(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} /> Submit & Verify Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="modal-backdrop" onClick={() => setPreviewDoc(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{previewDoc.label}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {previewDoc.file_name} • Version {previewDoc.version}
                </div>
              </div>
              <button className="btn-ghost" onClick={() => setPreviewDoc(null)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{
                background: '#0f172a',
                color: '#f8fafc',
                borderRadius: 'var(--radius-lg)',
                padding: '36px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}>
                <FileText size={48} color="#60a5fa" />
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{previewDoc.label}</div>
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                  Document File: <code style={{ color: '#38bdf8' }}>{previewDoc.file_name}</code>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: 400 }}>
                  Verified digital record stored in compliance vault. Digitally stamped on {previewDoc.uploaded_at || 'recent'}.
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      showToast(`Downloaded ${previewDoc.file_name}`);
                      setPreviewDoc(null);
                    }}
                  >
                    <Download size={13} /> Download PDF
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setPreviewDoc(null)}>
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
