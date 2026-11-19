import React from 'react';
import { Check, Clock, X, Eye } from 'lucide-react';

export function DocsTab({
  docs,
  setPreviewDocUrl,
  setShowDocActionModal,
  setDocRemarks,
  setDocRejectionReason,
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Submitted Supporting Documents</h3>
          <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            Review, download, verify or reject uploaded certificates and agreements.
          </p>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
          No documents have been uploaded for this centre application yet.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Document Name</th>
                <th>Document Type</th>
                <th>Version</th>
                <th>Uploaded On</th>
                <th>Verification Status</th>
                <th>Admin Remarks</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, idx) => (
                <tr key={doc.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{doc.documentName || doc.documentType}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{doc.fileName}</div>
                  </td>
                  <td><span className="badge badge-subtle">{doc.documentType}</span></td>
                  <td>v{doc.version}</td>
                  <td>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    {doc.status === 'Verified' && (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Check size={12} /> Verified
                      </span>
                    )}
                    {doc.status === 'Pending' && (
                      <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> Pending
                      </span>
                    )}
                    {doc.status === 'Rejected' && (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <X size={12} /> Rejected
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: doc.status === 'Rejected' ? '#dc2626' : '#64748b' }}>
                    {doc.rejectionReason || doc.remarks || '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {doc.fileUrl && (
                        <button
                          className="btn btn-xs btn-secondary"
                          onClick={() => setPreviewDocUrl(doc.fileUrl)}
                          title="Preview Document"
                        >
                          <Eye size={12} />
                        </button>
                      )}

                      {doc.status !== 'Verified' && (
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => {
                            setShowDocActionModal({ doc, action: 'verify' });
                            setDocRemarks('');
                            setDocRejectionReason('');
                          }}
                          style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
                          title="Verify Document"
                        >
                          <Check size={12} /> Verify
                        </button>
                      )}

                      {doc.status !== 'Rejected' && (
                        <button
                          className="btn btn-xs btn-secondary"
                          onClick={() => {
                            setShowDocActionModal({ doc, action: 'reject' });
                            setDocRemarks('');
                            setDocRejectionReason('');
                          }}
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                          title="Reject Document"
                        >
                          <X size={12} /> Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
