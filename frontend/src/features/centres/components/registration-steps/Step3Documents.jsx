import React from 'react';
import { Upload, Eye, CheckCircle2, Clock } from 'lucide-react';

export function Step3Documents({
  documents,
  uploadingDocType,
  handleFileUpload,
  setPreviewDocUrl,
  isReadOnly,
}) {
  return (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
            Step 3 — Mandatory & Supporting Document Checklist
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.8125rem', color: '#64748b' }}>
            Upload high-resolution PDF or Image proofs (Max 10 MB per document). Mandatory items are marked with an asterisk (*).
          </p>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Mandatory</th>
                  <th>Status</th>
                  <th>File Upload / Replace</th>
                  <th style={{ textAlign: 'right' }}>Preview</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'current_electricity_bill', label: 'Current Electricity Bill', mandatory: true },
                  { key: 'cancelled_cheque', label: 'Cancelled Cheque Copy', mandatory: true },
                  { key: 'centre_pan', label: 'Centre / Entity PAN Card', mandatory: true },
                  { key: 'gst_document', label: 'GST Registration Certificate', mandatory: true },
                  { key: 'ef_data_sheet', label: 'EF Resource Data Sheet', mandatory: true },
                  { key: 'owner_id_proof', label: 'Owner ID Proof (Aadhaar / Voter ID)', mandatory: true },
                  { key: 'mou', label: 'MOU – ₹500 Stamp Paper', mandatory: true },
                  { key: 'nda', label: 'NDA – ₹100 Stamp Paper', mandatory: true },
                  { key: 'registration_certificate', label: 'Establishment / Registration Certificate', mandatory: true },
                  { key: 'trust_society_certificate', label: 'Trust Deed / Society Certificate', mandatory: basicInfo.organizationType === 'Trust' || basicInfo.organizationType === 'Society' },
                  { key: 'partnership_deed', label: 'Partnership Deed & KYC', mandatory: basicInfo.organizationType === 'Partnership' },
                ].map((item) => {
                  const uploaded = documents.find((d) => d.documentType.toLowerCase() === item.key.toLowerCase());
                  const isUploading = uploadingDocType === item.key;

                  return (
                    <tr key={item.key}>
                      <td>
                        <strong>{item.label}</strong>
                        {uploaded && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            File: {uploaded.fileName} (v{uploaded.version})
                          </div>
                        )}
                      </td>
                      <td>
                        {item.mandatory ? (
                          <span style={{ color: '#dc2626', fontWeight: 600 }}>Yes *</span>
                        ) : (
                          <span style={{ color: '#64748b' }}>Conditional</span>
                        )}
                      </td>
                      <td>
                        {uploaded ? (
                          <span className={`badge ${uploaded.status === 'Verified' ? 'badge-success' : uploaded.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                            {uploaded.status}
                          </span>
                        ) : (
                          <span className="badge badge-subtle">Not Uploaded</span>
                        )}
                      </td>
                      <td>
                        {!isReadOnly && (
                          <label
                            className="btn btn-xs btn-secondary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                          >
                            <Upload size={12} className={isUploading ? 'animate-spin' : ''} />
                            {isUploading ? 'Uploading...' : uploaded ? 'Replace File' : 'Upload File'}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileUpload(item.key, item.label, e.target.files[0]);
                                }
                              }}
                              disabled={isUploading}
                            />
                          </label>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {uploaded?.fileUrl ? (
                          <button
                            type="button"
                            className="btn btn-xs btn-secondary"
                            onClick={() => setPreviewDocUrl(uploaded.fileUrl)}
                          >
                            <Eye size={12} /> View
                          </button>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
  );
}
