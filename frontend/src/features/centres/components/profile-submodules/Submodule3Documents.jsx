import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Upload, Eye, Trash2, Clock, Check, X, ShieldAlert, Download } from 'lucide-react';
import { validateDocumentFile, formatBytes } from '@/utils/fileValidation';

export function Submodule3Documents({
  documents = [],
  organizationType = 'Trust',
  isReadOnly = false,
  reviewStatus = 'NOT_STARTED',
  reworkReason = '',
  onUploadDocument,
  onDeleteDocument,
  onViewDocument,
  uploadingDocType = null,
}) {
  const isRework = reviewStatus === 'REWORK_REQUIRED';
  const isVerified = reviewStatus === 'VERIFIED';

  const [localError, setLocalError] = useState(null);

  // Generate document checklist based on organizationType (FRD Sec. 8)
  const getDocChecklist = () => {
    const currentYear = new Date().getFullYear();
    const baseDocs = [
      { key: 'centre_pan', label: 'Centre / Legal Entity PAN Card', mandatory: true, hint: 'Clear scanned PDF of Entity or Proprietor PAN' },
      { key: 'gst_certificate', label: 'GST Certificate or Non-GST Declaration', mandatory: true, hint: 'Form GST REG-06 or official Non-GST declaration letter' },
      { key: 'registration_certificate', label: 'Centre Registration Certificate / Establishment Documents / Shop Act / MSME Certificate', mandatory: true, hint: 'Incorporation, Trust, Society, or Academic registration proof' },
      { key: 'current_electricity_bill', label: 'Current Electricity Bill (Last 2 Months)', mandatory: true, hint: 'Utility power bill showing venue address and sanctioned load' },
      { key: 'mou', label: `MOU - 500 Stamp (${currentYear}-${currentYear + 1})`, mandatory: true, hint: 'Notarized Master Service Agreement on ₹500 non-judicial stamp paper' },
      { key: 'nda', label: 'NDA-100 Stamp', mandatory: true, hint: 'Examination confidentiality undertaking on ₹100 stamp paper' },
      { key: 'notarized_affidavit', label: 'Notarized Affidavit', mandatory: true, hint: 'Stamp paper affidavit regarding examination integrity & infrastructure declaration' },
      { key: 'willingness_letter', label: 'Willingness Letter on Centre Letterhead', mandatory: true, hint: 'Signed & stamped willingness undertaking on official letterhead' },
      { key: 'cancelled_cheque', label: 'Cancelled Cheque', mandatory: true, hint: 'Original cancelled cheque showing Account Name, Account Number and IFSC' },
      { key: 'bank_passbook', label: 'Bank Passbook', mandatory: true, hint: 'Attested bank passbook showing active transaction history' },
      { key: 'rent_agreement', label: 'Rent Agreement in English', mandatory: false, hint: 'Registered lease deed / rent agreement in English (if premises are rented/leased)' },
    ];

    const conditionalDocs = [];
    if (organizationType === 'Trust' || organizationType === 'Society' || organizationType === 'Trust/Society') {
      conditionalDocs.push(
        { key: 'trust_deed', label: 'Registered Trust Deed / Society Registration Certificate', mandatory: true, hint: 'Complete Trust Deed / Society Certificate certified by Sub-Registrar' },
        { key: 'trustee_list', label: 'Certified List of Trustees / Governing Body Member List', mandatory: true, hint: 'Current Board of Trustees / Governing Body with contact details' },
        { key: 'tax_exemption_12a_80g', label: '12A / 80G Tax Exemption Certificate', mandatory: false, hint: 'Income Tax 12A/80G order (if applicable)' }
      );
    } else if (organizationType === 'Partnership' || organizationType === 'Partnership Firm') {
      conditionalDocs.push(
        { key: 'partnership_deed', label: 'Registered Partnership Deed', mandatory: true, hint: 'Partnership agreement registered with Registrar of Firms' },
        { key: 'partner_kyc', label: 'Partner List & Authorization', mandatory: true, hint: 'Certified partner list signed by all partners' }
      );
    } else if (organizationType === 'Proprietorship') {
      conditionalDocs.push(
        { key: 'proprietor_pan', label: 'Proprietor Personal PAN Card', mandatory: true, hint: 'Personal tax PAN of Sole Proprietor' },
        { key: 'udyam_shop_est', label: 'Shop Act / Trade License / MSME Certificate', mandatory: true, hint: 'MSME Udyam Certificate or Municipal Trade License' }
      );
    }

    return [...baseDocs, ...conditionalDocs];
  };

  const checklist = getDocChecklist();

  const handleFileChange = async (item, file) => {
    if (!file) return;
    setLocalError(null);

    const validation = await validateDocumentFile(file);
    if (!validation.success) {
      setLocalError(`[${item.label}] ${validation.error}`);
      return;
    }

    if (onUploadDocument) {
      try {
        await onUploadDocument({
          documentType: item.key,
          documentName: item.label,
          fileName: validation.fileName,
          fileUrl: validation.fileUrl,
          fileSize: validation.finalSizeBytes,
          mimeType: validation.mimeType,
        });
      } catch (err) {
        setLocalError(err.message || 'Failed to upload document.');
      }
    }
  };

  return (
    <div className="submodule-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Status / Rework Banner ── */}
      {isRework && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md, 8px)',
            background: 'var(--color-danger-bg, #fef2f2)',
            border: '1px solid var(--color-danger-border, #fca5a5)',
            color: 'var(--color-danger, #b91c1c)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 4 }}>
              Rework Required for Compliance Documents
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
              {reworkReason || 'One or more mandatory compliance documents have been rejected or require re-upload.'}
            </div>
          </div>
        </div>
      )}

      {isVerified && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md, 8px)',
            background: 'var(--color-success-bg, #f0fdf4)',
            border: '1px solid var(--color-success-border, #86efac)',
            color: 'var(--color-success, #15803d)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          All mandatory compliance documents verified and approved.
        </div>
      )}

      {localError && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md, 6px)',
            background: 'var(--color-danger-bg, #fef2f2)',
            border: '1px solid var(--color-danger-border, #fca5a5)',
            color: 'var(--color-danger, #b91c1c)',
            fontSize: '0.8125rem',
          }}
        >
          {localError}
        </div>
      )}

      {/* ── Document Checklist Table ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={20} color="var(--color-primary, #2563eb)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                Compliance & Legal Document Dossier
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
              Checklist tailored for <strong>{organizationType}</strong>. All files must be in PDF format (Max 10 MB).
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-subtle" style={{ fontSize: '0.75rem' }}>
              Uploaded: {documents.length} / {checklist.length}
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Document Name & Description</th>
                <th style={{ width: '15%' }}>Requirement</th>
                <th style={{ width: '18%' }}>Audit Status</th>
                <th style={{ width: '20%' }}>Upload / Replace</th>
                <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((item) => {
                const uploaded = documents.find((d) => {
                  const dt = d.documentType?.toLowerCase();
                  const ik = item.key.toLowerCase();
                  if (dt === ik) return true;
                  if (ik === 'gst_certificate' && dt === 'gst_document') return true;
                  if (ik === 'gst_document' && dt === 'gst_certificate') return true;
                  if (ik === 'current_electricity_bill' && dt === 'electricity_bill') return true;
                  if (ik === 'electricity_bill' && dt === 'current_electricity_bill') return true;
                  if (ik === 'trust_deed' && dt === 'trust_society_certificate') return true;
                  if (ik === 'society_certificate' && dt === 'trust_society_certificate') return true;
                  if (ik === 'trust_society_certificate' && (dt === 'trust_deed' || dt === 'society_certificate')) return true;
                  return false;
                });
                const isUploadingThis = uploadingDocType === item.key;
                const isDocVerified = uploaded?.status === 'Verified' || uploaded?.status === 'VERIFIED';
                const isDocRejected = uploaded?.status === 'Rejected' || uploaded?.status === 'REWORK_REQUIRED';

                return (
                  <tr key={item.key}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary, #1e293b)' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', marginTop: 2 }}>
                        {item.hint}
                      </div>
                      {uploaded && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: 3 }}>
                          File: {uploaded.fileName} ({formatBytes(uploaded.fileSize)}) • v{uploaded.version || 1}
                        </div>
                      )}
                    </td>

                    <td>
                      {item.mandatory ? (
                        <span style={{ color: 'var(--color-danger, #dc2626)', fontWeight: 600, fontSize: '0.8125rem' }}>
                          Mandatory *
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          Conditional / Optional
                        </span>
                      )}
                    </td>

                    <td>
                      {uploaded ? (
                        <span
                          className={`badge ${
                            isDocVerified
                              ? 'badge-success'
                              : isDocRejected
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                        >
                          {uploaded.status}
                        </span>
                      ) : (
                        <span className="badge badge-subtle">Pending Upload</span>
                      )}
                      {uploaded?.rejectionReason && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-danger)', marginTop: 4 }}>
                          Reason: {uploaded.rejectionReason}
                        </div>
                      )}
                    </td>

                    <td>
                      {!isReadOnly && (
                        <label
                          className={`btn btn-xs ${uploaded ? 'btn-secondary' : 'btn-primary'}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: isUploadingThis ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Upload size={12} className={isUploadingThis ? 'animate-spin' : ''} />
                          {isUploadingThis ? 'Uploading...' : uploaded ? 'Replace PDF' : 'Upload PDF'}
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileChange(item, e.target.files[0]);
                              }
                            }}
                            disabled={isUploadingThis}
                          />
                        </label>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        {uploaded && (
                          <button
                            type="button"
                            className="btn btn-xs btn-secondary"
                            onClick={() => onViewDocument && onViewDocument(uploaded)}
                            title="View / Download Document"
                          >
                            <Eye size={12} />
                          </button>
                        )}
                        {uploaded && !isReadOnly && !isDocVerified && (
                          <button
                            type="button"
                            className="btn btn-xs btn-danger"
                            onClick={() => onDeleteDocument && onDeleteDocument(uploaded.id)}
                            title="Delete Document"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Submodule3Documents;
