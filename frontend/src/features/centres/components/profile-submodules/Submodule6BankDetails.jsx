import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, Upload, Eye, ShieldCheck, Lock, Check, FileCheck } from 'lucide-react';
import { MAJOR_BANKS } from './constants';
import { validateDocumentFile, validateAndCompressPhoto, formatBytes } from '@/utils/fileValidation';

export function Submodule6BankDetails({
  bank = {},
  setBank,
  isReadOnly = false,
  reviewStatus = 'NOT_STARTED',
  reworkReason = '',
  onUploadProof,
  uploadingProof = false,
  validationErrors = {},
}) {
  const isRework = reviewStatus === 'REWORK_REQUIRED';
  const isVerified = reviewStatus === 'VERIFIED';

  const [localError, setLocalError] = useState(null);
  const [showPlainAccount, setShowPlainAccount] = useState(!bank.accountNumber || !isReadOnly);

  const handleChange = (field, value) => {
    setBank((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProofUpload = async (file) => {
    if (!file) return;
    setLocalError(null);

    const isPdf = file.type === 'application/pdf';
    let result;

    if (isPdf) {
      result = await validateDocumentFile(file);
    } else {
      result = await validateAndCompressPhoto(file);
    }

    if (!result.success) {
      setLocalError(result.error);
      return;
    }

    if (onUploadProof) {
      try {
        await onUploadProof({
          documentType: 'cancelled_cheque',
          documentName: 'Cancelled Cheque / Bank Passbook Copy',
          fileName: result.fileName,
          fileUrl: result.fileUrl,
          fileSize: result.finalSizeBytes,
          mimeType: result.mimeType,
        });

        setBank((prev) => ({
          ...prev,
          cancelledChequeUrl: result.fileUrl,
          proofFileName: result.fileName,
        }));
      } catch (err) {
        setLocalError(err.message || 'Failed to upload bank proof document.');
      }
    }
  };

  const formatMaskedAccount = (num) => {
    if (!num) return '';
    const clean = String(num).replace(/\s/g, '');
    if (clean.length <= 4) return clean;
    return `XXXX XXXX ${clean.slice(-4)}`;
  };

  const isAccountMatched =
    !bank.confirmAccountNumber || bank.accountNumber === bank.confirmAccountNumber;

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
              Rework Required for Bank Account & Commercial Details
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
              {reworkReason || 'Finance audit failed or beneficiary name does not match legal entity documents. Please update.'}
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
          Beneficiary bank account verified and approved for automated examination fee payouts.
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

      {/* ── Bank Account Form ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CreditCard size={20} color="var(--color-primary, #2563eb)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                Centre Beneficiary Bank Account & Payout Settlement
              </h3>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
                Account used for processing booking advances, exam day allowances, and final invoicing.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className={`badge ${
                isVerified ? 'badge-success' : bank.accountNumber ? 'badge-warning' : 'badge-subtle'
              }`}
              style={{ fontSize: '0.75rem' }}
            >
              {isVerified ? 'Payout Active' : bank.accountNumber ? 'Pending Verification' : 'Not Configured'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="accountName">
              Centre Beneficiary Account Holder Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="accountName"
              type="text"
              className={`form-control ${validationErrors.accountName ? 'is-invalid' : ''}`}
              value={bank.accountName || ''}
              onChange={(e) => handleChange('accountName', e.target.value)}
              placeholder="Name as recorded in the bank passbook"
              disabled={isReadOnly}
              required
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Must match registered Trust, Society, Firm, or Centre Name.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bankName">
              Bank Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              id="bankName"
              className="form-control"
              value={bank.bankName || 'State Bank of India'}
              onChange={(e) => handleChange('bankName', e.target.value)}
              disabled={isReadOnly}
            >
              {MAJOR_BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="branchName">
              Branch Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="branchName"
              type="text"
              className="form-control"
              value={bank.branchName || ''}
              onChange={(e) => handleChange('branchName', e.target.value)}
              placeholder="e.g. Rohini Sector 14, New Delhi"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="accountType">
              Account Type <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              id="accountType"
              className="form-control"
              value={bank.accountType?.includes('Savings') ? 'Savings' : 'Current'}
              onChange={(e) => handleChange('accountType', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Current">Current</option>
              <option value="Savings">Savings</option>
            </select>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="accountNumber" style={{ margin: 0 }}>
                Bank Account Number <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              {isReadOnly && bank.accountNumber && (
                <button
                  type="button"
                  className="btn btn-link btn-xs"
                  onClick={() => setShowPlainAccount(!showPlainAccount)}
                  style={{ padding: 0, fontSize: '0.75rem', textDecoration: 'none' }}
                >
                  {showPlainAccount ? 'Mask' : 'Reveal'}
                </button>
              )}
            </div>
            <input
              id="accountNumber"
              type={showPlainAccount ? 'text' : 'password'}
              className={`form-control ${validationErrors.accountNumber ? 'is-invalid' : ''}`}
              value={
                isReadOnly && !showPlainAccount
                  ? formatMaskedAccount(bank.accountNumber)
                  : bank.accountNumber || ''
              }
              onChange={(e) => handleChange('accountNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 10482910394"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmAccountNumber">
              Confirm Account Number <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="confirmAccountNumber"
              type="text"
              className={`form-control ${!isAccountMatched ? 'is-invalid' : ''}`}
              value={bank.confirmAccountNumber || ''}
              onChange={(e) => handleChange('confirmAccountNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="Re-enter exact account number"
              disabled={isReadOnly}
              required
            />
            {!isAccountMatched && (
              <span className="form-feedback" style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>
                Account numbers do not match!
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ifscCode">
              Bank IFSC Code (11 Characters) <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="ifscCode"
              type="text"
              maxLength={11}
              className={`form-control ${validationErrors.ifscCode ? 'is-invalid' : ''}`}
              style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 }}
              value={bank.ifscCode || ''}
              onChange={(e) => handleChange('ifscCode', e.target.value.trim().toUpperCase())}
              placeholder="e.g. SBIN0001234"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="branchAddress">
              Bank Branch Postal Address
            </label>
            <input
              id="branchAddress"
              type="text"
              className="form-control"
              value={bank.branchAddress || ''}
              onChange={(e) => handleChange('branchAddress', e.target.value)}
              placeholder="Branch address, City, District"
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* ── Cancelled Cheque / Passbook Upload ── */}
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 'var(--radius-md, 8px)',
            background: 'var(--bg-subtle, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCheck size={18} color="var(--color-primary)" />
              <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Bank Account Proof (Cancelled Cheque or Passbook Copy) *
              </strong>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Mandatory proof for verifying account holder name and IFSC. Accepts PDF (≤ 10MB) or JPG (≤ 2MB).
            </p>
            {bank.proofFileName && (
              <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', marginTop: 4, display: 'inline-block' }}>
                Uploaded: {bank.proofFileName}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {bank.cancelledChequeUrl && (
              <a
                href={bank.cancelledChequeUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-xs btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Eye size={12} /> View Proof
              </a>
            )}

            {!isReadOnly && (
              <label
                className="btn btn-xs btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: uploadingProof ? 'not-allowed' : 'pointer',
                }}
              >
                <Upload size={12} className={uploadingProof ? 'animate-spin' : ''} />
                {uploadingProof ? 'Uploading...' : bank.cancelledChequeUrl ? 'Replace Proof' : 'Upload Proof'}
                <input
                  type="file"
                  accept=".pdf,application/pdf,.jpg,.jpeg,image/jpeg"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleProofUpload(e.target.files[0]);
                    }
                  }}
                  disabled={uploadingProof}
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Submodule6BankDetails;
