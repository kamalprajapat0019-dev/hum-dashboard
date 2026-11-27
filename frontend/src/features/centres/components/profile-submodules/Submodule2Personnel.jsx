import React, { useState } from 'react';
import {
  AlertCircle, CheckCircle2, UserCheck, Upload, Trash2, Eye, Shield,
  Camera, FileText, Wrench, ShieldCheck, Cpu, Image as ImageIcon
} from 'lucide-react';
import { validateAndCompressPhoto, validateDocumentFile, formatBytes } from '@/utils/fileValidation';

export function Submodule2Personnel({
  personnel = {},
  setPersonnel,
  isReadOnly = false,
  reviewStatus = 'NOT_STARTED',
  reworkReason = '',
  onUploadMedia,
  validationErrors = {},
}) {
  const isRework = reviewStatus === 'REWORK_REQUIRED';
  const isVerified = reviewStatus === 'VERIFIED';

  const [uploadingRole, setUploadingRole] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleFieldChange = (roleKey, field, value) => {
    setPersonnel((prev) => ({
      ...prev,
      [roleKey]: {
        ...(prev[roleKey] || {}),
        [field]: value,
      },
    }));
  };

  const handlePhotoSelect = async (roleKey, fieldKey, label, file) => {
    if (!file) return;
    setUploadError(null);
    setUploadingRole(`${roleKey}-${fieldKey}`);

    try {
      const result = await validateAndCompressPhoto(file);
      if (!result.success) {
        setUploadError(`[${label}] ${result.error}`);
        return;
      }

      if (onUploadMedia) {
        await onUploadMedia({
          entityType: 'CONTACT',
          entityId: roleKey,
          fieldKey,
          assetCategory: 'PHOTO',
          fileName: result.fileName,
          fileUrl: result.fileUrl,
          fileSize: result.finalSizeBytes,
          mimeType: result.mimeType,
          originalSizeBytes: result.originalSizeBytes,
          isCompressed: result.isCompressed,
        });
      }

      setPersonnel((prev) => ({
        ...prev,
        [roleKey]: {
          ...(prev[roleKey] || {}),
          photoUrl: result.fileUrl,
          photoFileName: result.fileName,
          photoSize: result.finalSizeBytes,
        },
      }));
    } catch (err) {
      setUploadError(err.message || `Failed to process ${label}.`);
    } finally {
      setUploadingRole(null);
    }
  };

  const handleDocUpload = async (roleKey, fieldKey, label, file) => {
    if (!file) return;
    setUploadError(null);
    setUploadingRole(`${roleKey}-${fieldKey}`);

    try {
      const result = await validateDocumentFile(file);
      if (!result.success) {
        setUploadError(`[${label}] ${result.error}`);
        return;
      }

      if (onUploadMedia) {
        await onUploadMedia({
          entityType: 'CONTACT',
          entityId: roleKey,
          fieldKey,
          assetCategory: 'DOCUMENT',
          fileName: result.fileName,
          fileUrl: result.fileUrl,
          fileSize: result.finalSizeBytes,
          mimeType: result.mimeType,
          originalSizeBytes: result.originalSizeBytes,
        });
      }

      setPersonnel((prev) => ({
        ...prev,
        [roleKey]: {
          ...(prev[roleKey] || {}),
          [`${fieldKey}Url`]: result.fileUrl,
          [`${fieldKey}FileName`]: result.fileName,
        },
      }));
    } catch (err) {
      setUploadError(err.message || `Failed to process ${label}.`);
    } finally {
      setUploadingRole(null);
    }
  };

  const formatMaskedAadhaar = (val) => {
    if (!val) return '';
    const clean = val.replace(/\D/g, '');
    if (clean.length <= 4) return clean;
    if (clean.length <= 8) return `XXXX-${clean.slice(4)}`;
    return `XXXX-XXXX-${clean.slice(8, 12)}`;
  };

  const owner = personnel.owner || {};
  const cs = personnel.cs || {};
  const it = personnel.it || {};
  const electrician = personnel.electrician || {};

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
              Rework Required for Personnel Details (FRD Sec. 7)
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
              {reworkReason || 'Key operational personnel information or Aadhaar/KYC credentials need rectification.'}
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
          Key Operational Personnel verified and KYC-cleared by Project Management.
        </div>
      )}

      {uploadError && (
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
          {uploadError}
        </div>
      )}

      {/* ── 1. OWNER DETAILS (FRD Sec. 7.1) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <UserCheck size={20} color="var(--color-primary, #2563eb)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
              1. Owner Details (FRD Sec. 7.1)
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
              Primary institutional head / trustee legally accountable for the examination venue contract.
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* 1. Owner Name - Mandatory */}
          <div className="form-group">
            <label className="form-label" htmlFor="owner-name">
              Owner Name <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="owner-name"
              type="text"
              className="form-control"
              value={owner.fullName || owner.name || ''}
              onChange={(e) => {
                handleFieldChange('owner', 'fullName', e.target.value);
                handleFieldChange('owner', 'name', e.target.value);
              }}
              placeholder="Full name as per Aadhaar"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 2. Owner Designation - Mandatory */}
          <div className="form-group">
            <label className="form-label" htmlFor="owner-designation">
              Owner Designation <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="owner-designation"
              type="text"
              className="form-control"
              value={owner.designation || ''}
              onChange={(e) => handleFieldChange('owner', 'designation', e.target.value)}
              placeholder="e.g. Trustee / Director / Principal / Owner"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 3. Owner Contact Number - Mandatory */}
          <div className="form-group">
            <label className="form-label" htmlFor="owner-contactNumber">
              Owner Contact Number <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="owner-contactNumber"
              type="text"
              maxLength={10}
              className="form-control"
              value={owner.contactNumber || ''}
              onChange={(e) => handleFieldChange('owner', 'contactNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit primary mobile number"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 4. Owner Email - Optional */}
          <div className="form-group">
            <label className="form-label" htmlFor="owner-email">
              Owner Email
            </label>
            <input
              id="owner-email"
              type="email"
              className="form-control"
              value={owner.email || ''}
              onChange={(e) => handleFieldChange('owner', 'email', e.target.value)}
              placeholder="owner@institution.edu.in"
              disabled={isReadOnly}
            />
          </div>

          {/* 5. Owner Aadhaar Number - Mandatory (UI Masked) */}
          <div className="form-group">
            <label className="form-label" htmlFor="owner-aadhaarNumber">
              Owner Aadhaar Number <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="owner-aadhaarNumber"
                type="text"
                maxLength={14}
                className="form-control"
                value={owner.aadhaarNumber ? (isReadOnly ? formatMaskedAadhaar(owner.aadhaarNumber) : owner.aadhaarNumber) : ''}
                onChange={(e) => handleFieldChange('owner', 'aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="12-digit Aadhaar number"
                disabled={isReadOnly}
                required
              />
              <Shield size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 12, top: 12 }} />
            </div>
          </div>

          {/* 6. Owner Father's Name - Optional */}
          <div className="form-group">
            <label className="form-label" htmlFor="owner-fatherName">
              Owner Father's Name
            </label>
            <input
              id="owner-fatherName"
              type="text"
              className="form-control"
              value={owner.fatherName || ''}
              onChange={(e) => handleFieldChange('owner', 'fatherName', e.target.value)}
              placeholder="Father's full name"
              disabled={isReadOnly}
            />
          </div>

          {/* 7. Owner Mother's Name - Optional */}
          <div className="form-group">
            <label className="form-label" htmlFor="owner-motherName">
              Owner Mother's Name
            </label>
            <input
              id="owner-motherName"
              type="text"
              className="form-control"
              value={owner.motherName || ''}
              onChange={(e) => handleFieldChange('owner', 'motherName', e.target.value)}
              placeholder="Mother's full name"
              disabled={isReadOnly}
            />
          </div>

          {/* 8. Owner Permanent Address - Mandatory */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="owner-permanentAddress">
              Owner Permanent Address <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <textarea
              id="owner-permanentAddress"
              rows={2}
              className="form-control"
              value={owner.permanentAddress || ''}
              onChange={(e) => handleFieldChange('owner', 'permanentAddress', e.target.value)}
              placeholder="Permanent residential address as per Aadhaar"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 9. Owner Current Address - Mandatory */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="owner-currentAddress">
              Owner Current Address <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <textarea
              id="owner-currentAddress"
              rows={2}
              className="form-control"
              value={owner.currentAddress || owner.residentialAddress || ''}
              onChange={(e) => {
                handleFieldChange('owner', 'currentAddress', e.target.value);
                handleFieldChange('owner', 'residentialAddress', e.target.value);
              }}
              placeholder="Current residential address"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 10. Owner Passport Photograph - Mandatory */}
          <div
            className="form-group"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <label className="form-label" style={{ marginBottom: 4, fontWeight: 700 }}>
                Owner Passport Photograph <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                Recent color passport photograph (JPG/JPEG format only, ≤ 2MB).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {owner.photoUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={owner.photoUrl}
                    alt="Owner Passport Photo"
                    style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)' }}
                  />
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      <Camera size={12} style={{ marginRight: 4 }} /> Change Photo
                      <input
                        type="file"
                        accept=".jpg,.jpeg,image/jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => handlePhotoSelect('owner', 'photo', 'Owner Passport Photograph', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} className={uploadingRole === 'owner-photo' ? 'animate-spin' : ''} />
                    {uploadingRole === 'owner-photo' ? 'Uploading...' : 'Capture / Upload Photo'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,image/jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => handlePhotoSelect('owner', 'photo', 'Owner Passport Photograph', e.target.files?.[0])}
                      disabled={uploadingRole === 'owner-photo'}
                    />
                  </label>
                )
              )}
            </div>
          </div>

          {/* 11. Owner ID Proof - Mandatory */}
          <div
            className="form-group"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <label className="form-label" style={{ marginBottom: 4, fontWeight: 700 }}>
                Owner ID Proof (Aadhar Card/Voter ID Card/Passport/Ration Card) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                Government issued photo ID proof (PDF format only, ≤ 10MB).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {owner.idProofUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                  <FileText size={16} />
                  <span>ID Proof Uploaded</span>
                  <a href={owner.idProofUrl} target="_blank" rel="noreferrer" className="btn btn-xs btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> View
                  </a>
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      Replace
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocUpload('owner', 'idProof', 'Owner ID Proof', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} className={uploadingRole === 'owner-idProof' ? 'animate-spin' : ''} />
                    {uploadingRole === 'owner-idProof' ? 'Uploading...' : 'Upload ID Proof (PDF)'}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocUpload('owner', 'idProof', 'Owner ID Proof', e.target.files?.[0])}
                      disabled={uploadingRole === 'owner-idProof'}
                    />
                  </label>
                )
              )}
            </div>
          </div>

          {/* 12. Owner Police Verification - Mandatory */}
          <div
            className="form-group"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <label className="form-label" style={{ marginBottom: 4, fontWeight: 700 }}>
                Owner Police Verification <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                Police verification certificate / character clearance (PDF format only, ≤ 10MB).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {owner.policeVerificationUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                  <FileText size={16} />
                  <span>Police Verification Uploaded</span>
                  <a href={owner.policeVerificationUrl} target="_blank" rel="noreferrer" className="btn btn-xs btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> View
                  </a>
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      Replace
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocUpload('owner', 'policeVerification', 'Owner Police Verification', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} className={uploadingRole === 'owner-policeVerification' ? 'animate-spin' : ''} />
                    {uploadingRole === 'owner-policeVerification' ? 'Uploading...' : 'Upload Police Verification (PDF)'}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocUpload('owner', 'policeVerification', 'Owner Police Verification', e.target.files?.[0])}
                      disabled={uploadingRole === 'owner-policeVerification'}
                    />
                  </label>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. CENTRE SUPERINTENDENT DETAILS (FRD Sec. 7.2) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <ShieldCheck size={20} color="var(--color-primary, #2563eb)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
              2. Centre Superintendent Details (FRD Sec. 7.2)
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
              Test Centre Administrator (TCA) physically present to supervise examination session integrity.
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* 1. TCA Name - Mandatory */}
          <div className="form-group">
            <label className="form-label" htmlFor="cs-name">
              TCA Name <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="cs-name"
              type="text"
              className="form-control"
              value={cs.fullName || cs.name || ''}
              onChange={(e) => {
                handleFieldChange('cs', 'fullName', e.target.value);
                handleFieldChange('cs', 'name', e.target.value);
              }}
              placeholder="Full legal name of Test Centre Administrator"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 2. TCA Contact Number - Mandatory */}
          <div className="form-group">
            <label className="form-label" htmlFor="cs-contactNumber">
              TCA Contact Number <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="cs-contactNumber"
              type="text"
              maxLength={10}
              className="form-control"
              value={cs.contactNumber || ''}
              onChange={(e) => handleFieldChange('cs', 'contactNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit primary mobile number"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 3. TCA Email - Optional */}
          <div className="form-group">
            <label className="form-label" htmlFor="cs-email">
              TCA Email
            </label>
            <input
              id="cs-email"
              type="email"
              className="form-control"
              value={cs.email || ''}
              onChange={(e) => handleFieldChange('cs', 'email', e.target.value)}
              placeholder="tca@institution.edu.in"
              disabled={isReadOnly}
            />
          </div>

          {/* 4. TCA Aadhaar Number - Mandatory (UI Masked) */}
          <div className="form-group">
            <label className="form-label" htmlFor="cs-aadhaarNumber">
              TCA Aadhaar Number <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="cs-aadhaarNumber"
                type="text"
                maxLength={14}
                className="form-control"
                value={cs.aadhaarNumber ? (isReadOnly ? formatMaskedAadhaar(cs.aadhaarNumber) : cs.aadhaarNumber) : ''}
                onChange={(e) => handleFieldChange('cs', 'aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="12-digit Aadhaar number"
                disabled={isReadOnly}
                required
              />
              <Shield size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 12, top: 12 }} />
            </div>
          </div>

          {/* 5. TCA Father's Name - Optional */}
          <div className="form-group">
            <label className="form-label" htmlFor="cs-fatherName">
              TCA Father's Name
            </label>
            <input
              id="cs-fatherName"
              type="text"
              className="form-control"
              value={cs.fatherName || ''}
              onChange={(e) => handleFieldChange('cs', 'fatherName', e.target.value)}
              placeholder="Father's full name"
              disabled={isReadOnly}
            />
          </div>

          {/* 6. TCA Mother's Name - Optional */}
          <div className="form-group">
            <label className="form-label" htmlFor="cs-motherName">
              TCA Mother's Name
            </label>
            <input
              id="cs-motherName"
              type="text"
              className="form-control"
              value={cs.motherName || ''}
              onChange={(e) => handleFieldChange('cs', 'motherName', e.target.value)}
              placeholder="Mother's full name"
              disabled={isReadOnly}
            />
          </div>

          {/* 7. TCA Permanent Address - Mandatory */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="cs-permanentAddress">
              TCA Permanent Address <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <textarea
              id="cs-permanentAddress"
              rows={2}
              className="form-control"
              value={cs.permanentAddress || ''}
              onChange={(e) => handleFieldChange('cs', 'permanentAddress', e.target.value)}
              placeholder="Permanent address as per Aadhaar"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 8. TCA Current Address - Mandatory */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="cs-currentAddress">
              TCA Current Address <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <textarea
              id="cs-currentAddress"
              rows={2}
              className="form-control"
              value={cs.currentAddress || cs.address || ''}
              onChange={(e) => {
                handleFieldChange('cs', 'currentAddress', e.target.value);
                handleFieldChange('cs', 'address', e.target.value);
              }}
              placeholder="Current residential address"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 9. TCA ID Proof - Mandatory */}
          <div
            className="form-group"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <label className="form-label" style={{ marginBottom: 4, fontWeight: 700 }}>
                TCA ID Proof (Aadhar Card/Voter ID Card/Passport/Ration Card) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                Government issued photo ID proof (PDF format only, ≤ 10MB).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {cs.idProofUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                  <FileText size={16} />
                  <span>ID Proof Uploaded</span>
                  <a href={cs.idProofUrl} target="_blank" rel="noreferrer" className="btn btn-xs btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> View
                  </a>
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      Replace
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocUpload('cs', 'idProof', 'TCA ID Proof', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} className={uploadingRole === 'cs-idProof' ? 'animate-spin' : ''} />
                    {uploadingRole === 'cs-idProof' ? 'Uploading...' : 'Upload ID Proof (PDF)'}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocUpload('cs', 'idProof', 'TCA ID Proof', e.target.files?.[0])}
                      disabled={uploadingRole === 'cs-idProof'}
                    />
                  </label>
                )
              )}
            </div>
          </div>

          {/* 10. TCA Passport Photograph - Mandatory */}
          <div
            className="form-group"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <label className="form-label" style={{ marginBottom: 4, fontWeight: 700 }}>
                TCA Passport Photograph <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                Recent color passport photograph (JPG/JPEG format only, ≤ 2MB).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {cs.photoUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={cs.photoUrl}
                    alt="TCA Passport Photo"
                    style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)' }}
                  />
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      <Camera size={12} style={{ marginRight: 4 }} /> Change Photo
                      <input
                        type="file"
                        accept=".jpg,.jpeg,image/jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => handlePhotoSelect('cs', 'photo', 'TCA Passport Photograph', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} className={uploadingRole === 'cs-photo' ? 'animate-spin' : ''} />
                    {uploadingRole === 'cs-photo' ? 'Uploading...' : 'Capture / Upload Photo'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,image/jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => handlePhotoSelect('cs', 'photo', 'TCA Passport Photograph', e.target.files?.[0])}
                      disabled={uploadingRole === 'cs-photo'}
                    />
                  </label>
                )
              )}
            </div>
          </div>

          {/* 11. TCA Police Verification - Mandatory */}
          <div
            className="form-group"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <label className="form-label" style={{ marginBottom: 4, fontWeight: 700 }}>
                TCA Police Verification <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                Police verification certificate / clearance (PDF format only, ≤ 10MB).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {cs.policeVerificationUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                  <FileText size={16} />
                  <span>Police Verification Uploaded</span>
                  <a href={cs.policeVerificationUrl} target="_blank" rel="noreferrer" className="btn btn-xs btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> View
                  </a>
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      Replace
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocUpload('cs', 'policeVerification', 'TCA Police Verification', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} className={uploadingRole === 'cs-policeVerification' ? 'animate-spin' : ''} />
                    {uploadingRole === 'cs-policeVerification' ? 'Uploading...' : 'Upload Police Verification (PDF)'}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocUpload('cs', 'policeVerification', 'TCA Police Verification', e.target.files?.[0])}
                      disabled={uploadingRole === 'cs-policeVerification'}
                    />
                  </label>
                )
              )}
            </div>
          </div>

          {/* 12. TCA Authorization Letter - Mandatory */}
          <div
            className="form-group"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <label className="form-label" style={{ marginBottom: 4, fontWeight: 700 }}>
                TCA Authorization Letter <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                Official authorization letter on letterhead assigning TCA duties (PDF ≤ 10MB).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {cs.tcaLetterUrl || cs.tcaAuthorizationLetterUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                  <FileText size={16} />
                  <span>Authorized Letter Uploaded</span>
                  <a href={cs.tcaLetterUrl || cs.tcaAuthorizationLetterUrl} target="_blank" rel="noreferrer" className="btn btn-xs btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> View
                  </a>
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      Replace
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocUpload('cs', 'tcaLetter', 'TCA Authorization Letter', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} className={uploadingRole === 'cs-tcaLetter' ? 'animate-spin' : ''} />
                    {uploadingRole === 'cs-tcaLetter' ? 'Uploading...' : 'Upload Authorization Letter (PDF)'}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocUpload('cs', 'tcaLetter', 'TCA Authorization Letter', e.target.files?.[0])}
                      disabled={uploadingRole === 'cs-tcaLetter'}
                    />
                  </label>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. CENTRE IT PERSON DETAILS (FRD Sec. 7.3) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Cpu size={20} color="var(--color-primary, #2563eb)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
              3. Centre IT Person Details (FRD Sec. 7.3)
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
              Technical lead accountable for lab networking, LAN switches, IP addressing, and client server operations.
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* 1. Centre IT Person Name - Mandatory */}
          <div className="form-group">
            <label className="form-label" htmlFor="it-name">
              Centre IT Person Name <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="it-name"
              type="text"
              className="form-control"
              value={it.fullName || it.name || ''}
              onChange={(e) => {
                handleFieldChange('it', 'fullName', e.target.value);
                handleFieldChange('it', 'name', e.target.value);
              }}
              placeholder="IT Administrator full legal name"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 2. Centre IT Person Contact Number - Mandatory */}
          <div className="form-group">
            <label className="form-label" htmlFor="it-contactNumber">
              Centre IT Person Contact Number <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="it-contactNumber"
              type="text"
              maxLength={10}
              className="form-control"
              value={it.contactNumber || ''}
              onChange={(e) => handleFieldChange('it', 'contactNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit primary mobile number"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 3. Centre IT Person Email - Optional */}
          <div className="form-group">
            <label className="form-label" htmlFor="it-email">
              Centre IT Person Email
            </label>
            <input
              id="it-email"
              type="email"
              className="form-control"
              value={it.email || ''}
              onChange={(e) => handleFieldChange('it', 'email', e.target.value)}
              placeholder="it.lead@institution.edu.in"
              disabled={isReadOnly}
            />
          </div>

          {/* 4. Centre IT Person Aadhaar Number - Mandatory (UI Masked) */}
          <div className="form-group">
            <label className="form-label" htmlFor="it-aadhaarNumber">
              Centre IT Person Aadhaar Number <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="it-aadhaarNumber"
                type="text"
                maxLength={14}
                className="form-control"
                value={it.aadhaarNumber ? (isReadOnly ? formatMaskedAadhaar(it.aadhaarNumber) : it.aadhaarNumber) : ''}
                onChange={(e) => handleFieldChange('it', 'aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="12-digit Aadhaar number"
                disabled={isReadOnly}
                required
              />
              <Shield size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 12, top: 12 }} />
            </div>
          </div>

          {/* 5. Centre IT Person Father's Name - Optional */}
          <div className="form-group">
            <label className="form-label" htmlFor="it-fatherName">
              Centre IT Person Father's Name
            </label>
            <input
              id="it-fatherName"
              type="text"
              className="form-control"
              value={it.fatherName || ''}
              onChange={(e) => handleFieldChange('it', 'fatherName', e.target.value)}
              placeholder="Father's full name"
              disabled={isReadOnly}
            />
          </div>

          {/* 6. Centre IT Person Mother's Name - Optional */}
          <div className="form-group">
            <label className="form-label" htmlFor="it-motherName">
              Centre IT Person Mother's Name
            </label>
            <input
              id="it-motherName"
              type="text"
              className="form-control"
              value={it.motherName || ''}
              onChange={(e) => handleFieldChange('it', 'motherName', e.target.value)}
              placeholder="Mother's full name"
              disabled={isReadOnly}
            />
          </div>

          {/* 7. Centre IT Person Permanent Address - Mandatory */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="it-permanentAddress">
              Centre IT Person Permanent Address <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <textarea
              id="it-permanentAddress"
              rows={2}
              className="form-control"
              value={it.permanentAddress || ''}
              onChange={(e) => handleFieldChange('it', 'permanentAddress', e.target.value)}
              placeholder="Permanent address as per Aadhaar"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 8. Centre IT Person Current Address - Mandatory */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="it-currentAddress">
              Centre IT Person Current Address <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <textarea
              id="it-currentAddress"
              rows={2}
              className="form-control"
              value={it.currentAddress || it.address || ''}
              onChange={(e) => {
                handleFieldChange('it', 'currentAddress', e.target.value);
                handleFieldChange('it', 'address', e.target.value);
              }}
              placeholder="Current residential address"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 9. Centre IT Person ID Proof - Mandatory */}
          <div
            className="form-group"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <label className="form-label" style={{ marginBottom: 4, fontWeight: 700 }}>
                Centre IT Person ID Proof (Aadhar Card/Voter ID Card/Passport/Ration Card) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                Government issued photo ID proof (PDF format only, ≤ 10MB).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {it.idProofUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                  <FileText size={16} />
                  <span>ID Proof Uploaded</span>
                  <a href={it.idProofUrl} target="_blank" rel="noreferrer" className="btn btn-xs btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> View
                  </a>
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      Replace
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocUpload('it', 'idProof', 'IT Person ID Proof', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} className={uploadingRole === 'it-idProof' ? 'animate-spin' : ''} />
                    {uploadingRole === 'it-idProof' ? 'Uploading...' : 'Upload ID Proof (PDF)'}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocUpload('it', 'idProof', 'IT Person ID Proof', e.target.files?.[0])}
                      disabled={uploadingRole === 'it-idProof'}
                    />
                  </label>
                )
              )}
            </div>
          </div>

          {/* 10. Centre IT Person Passport Photograph - Mandatory */}
          <div
            className="form-group"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <label className="form-label" style={{ marginBottom: 4, fontWeight: 700 }}>
                Centre IT Person Passport Photograph <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                Recent color passport photograph (JPG/JPEG format only, ≤ 2MB).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {it.photoUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={it.photoUrl}
                    alt="IT Person Passport Photo"
                    style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)' }}
                  />
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      <Camera size={12} style={{ marginRight: 4 }} /> Change Photo
                      <input
                        type="file"
                        accept=".jpg,.jpeg,image/jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => handlePhotoSelect('it', 'photo', 'Centre IT Person Passport Photograph', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} className={uploadingRole === 'it-photo' ? 'animate-spin' : ''} />
                    {uploadingRole === 'it-photo' ? 'Uploading...' : 'Capture / Upload Photo'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,image/jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => handlePhotoSelect('it', 'photo', 'Centre IT Person Passport Photograph', e.target.files?.[0])}
                      disabled={uploadingRole === 'it-photo'}
                    />
                  </label>
                )
              )}
            </div>
          </div>

          {/* 11. Centre IT Person Police Verification - Mandatory */}
          <div
            className="form-group"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <label className="form-label" style={{ marginBottom: 4, fontWeight: 700 }}>
                Centre IT Person Police Verification <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                Police verification certificate / character certificate (PDF format only, ≤ 10MB).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {it.policeVerificationUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                  <FileText size={16} />
                  <span>Police Verification Uploaded</span>
                  <a href={it.policeVerificationUrl} target="_blank" rel="noreferrer" className="btn btn-xs btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> View
                  </a>
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      Replace
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocUpload('it', 'policeVerification', 'IT Person Police Verification', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} className={uploadingRole === 'it-policeVerification' ? 'animate-spin' : ''} />
                    {uploadingRole === 'it-policeVerification' ? 'Uploading...' : 'Upload Police Verification (PDF)'}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocUpload('it', 'policeVerification', 'IT Person Police Verification', e.target.files?.[0])}
                      disabled={uploadingRole === 'it-policeVerification'}
                    />
                  </label>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. ELECTRICIAN DETAILS (FRD Sec. 7.4) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Wrench size={20} color="var(--color-primary, #2563eb)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
              4. Electrician Details (FRD Sec. 7.4)
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
              Certified electrician available on-site for UPS failover, DG switchover, and electrical safety.
            </span>
          </div>
        </div>

        {/* Top Input Row: 3 Fields per FRD Table 7.4 */}
        <div className="grid-3" style={{ gap: 16, marginBottom: 16 }}>
          {/* 1. Electrician Name - Mandatory */}
          <div className="form-group">
            <label className="form-label" htmlFor="el-name">
              Electrician Name <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="el-name"
              type="text"
              className="form-control"
              value={electrician.fullName || electrician.name || ''}
              onChange={(e) => {
                handleFieldChange('electrician', 'fullName', e.target.value);
                handleFieldChange('electrician', 'name', e.target.value);
              }}
              placeholder="Electrician full legal name"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 2. Electrician Contact Number - Mandatory */}
          <div className="form-group">
            <label className="form-label" htmlFor="el-contactNumber">
              Electrician Contact Number <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="el-contactNumber"
              type="text"
              maxLength={10}
              className="form-control"
              value={electrician.contactNumber || ''}
              onChange={(e) => handleFieldChange('electrician', 'contactNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit primary mobile number"
              disabled={isReadOnly}
              required
            />
          </div>

          {/* 3. Electrician Aadhaar Number - Mandatory (UI Masked) */}
          <div className="form-group">
            <label className="form-label" htmlFor="el-aadhaarNumber">
              Electrician Aadhaar Number <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="el-aadhaarNumber"
                type="text"
                maxLength={14}
                className="form-control"
                value={electrician.aadhaarNumber ? (isReadOnly ? formatMaskedAadhaar(electrician.aadhaarNumber) : electrician.aadhaarNumber) : ''}
                onChange={(e) => handleFieldChange('electrician', 'aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="12-digit Aadhaar number"
                disabled={isReadOnly}
                required
              />
              <Shield size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 12, top: 12 }} />
            </div>
          </div>
        </div>

        {/* Bottom Upload Row: All 3 Upload Cards Aligned Together (FRD Sec. 7.4) */}
        <div className="grid-3" style={{ gap: 16, alignItems: 'stretch' }}>
          {/* 4. Electrician Passport Photograph - Mandatory */}
          <div
            className="form-group"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              minHeight: 140,
            }}
          >
            <div style={{ minHeight: 52 }}>
              <label className="form-label" style={{ marginBottom: 4, fontWeight: 700 }}>
                Electrician Passport Photograph <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', display: 'block', lineHeight: 1.4 }}>
                Recent color passport photograph (JPG/JPEG format only, ≤ 2MB).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 40 }}>
              {electrician.photoUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={electrician.photoUrl}
                    alt="Electrician Passport Photo"
                    style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)' }}
                  />
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      <Camera size={12} style={{ marginRight: 4 }} /> Change Photo
                      <input
                        type="file"
                        accept=".jpg,.jpeg,image/jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => handlePhotoSelect('electrician', 'photo', 'Electrician Passport Photograph', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} className={uploadingRole === 'electrician-photo' ? 'animate-spin' : ''} />
                    {uploadingRole === 'electrician-photo' ? 'Uploading...' : 'Capture / Upload Photo'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,image/jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => handlePhotoSelect('electrician', 'photo', 'Electrician Passport Photograph', e.target.files?.[0])}
                      disabled={uploadingRole === 'electrician-photo'}
                    />
                  </label>
                )
              )}
            </div>
          </div>

          {/* 5. Electrician ID Proof - Mandatory */}
          <div
            className="form-group"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              minHeight: 140,
            }}
          >
            <div style={{ minHeight: 52 }}>
              <label className="form-label" style={{ marginBottom: 4, fontWeight: 700 }}>
                Electrician ID Proof (Aadhar Card/Voter ID Card/Passport/Ration Card) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', display: 'block', lineHeight: 1.4 }}>
                Government issued photo ID proof (PDF format only, ≤ 10MB).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 40 }}>
              {electrician.idProofUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                  <FileText size={16} />
                  <span>ID Proof Uploaded</span>
                  <a href={electrician.idProofUrl} target="_blank" rel="noreferrer" className="btn btn-xs btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> View
                  </a>
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      Replace
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocUpload('electrician', 'idProof', 'Electrician ID Proof', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} className={uploadingRole === 'electrician-idProof' ? 'animate-spin' : ''} />
                    {uploadingRole === 'electrician-idProof' ? 'Uploading...' : 'Upload ID Proof (PDF)'}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocUpload('electrician', 'idProof', 'Electrician ID Proof', e.target.files?.[0])}
                      disabled={uploadingRole === 'electrician-idProof'}
                    />
                  </label>
                )
              )}
            </div>
          </div>

          {/* 6. Electrician Police Verification - Mandatory */}
          <div
            className="form-group"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              minHeight: 140,
            }}
          >
            <div style={{ minHeight: 52 }}>
              <label className="form-label" style={{ marginBottom: 4, fontWeight: 700 }}>
                Electrician Police Verification <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', display: 'block', lineHeight: 1.4 }}>
                Police verification certificate / character certificate (PDF format only, ≤ 10MB).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 40 }}>
              {electrician.policeVerificationUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                  <FileText size={16} />
                  <span>Police Verification Uploaded</span>
                  <a href={electrician.policeVerificationUrl} target="_blank" rel="noreferrer" className="btn btn-xs btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> View
                  </a>
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      Replace
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocUpload('electrician', 'policeVerification', 'Electrician Police Verification', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} className={uploadingRole === 'electrician-policeVerification' ? 'animate-spin' : ''} />
                    {uploadingRole === 'electrician-policeVerification' ? 'Uploading...' : 'Upload Police Verification (PDF)'}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocUpload('electrician', 'policeVerification', 'Electrician Police Verification', e.target.files?.[0])}
                      disabled={uploadingRole === 'electrician-policeVerification'}
                    />
                  </label>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Submodule2Personnel;
