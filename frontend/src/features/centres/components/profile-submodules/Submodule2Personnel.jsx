import React, { useState } from 'react';
import {
  AlertCircle, CheckCircle2, UserCheck, Upload, Trash2, Eye, Shield,
  Camera, FileText, Wrench, ShieldCheck, Cpu
} from 'lucide-react';
import { validateAndCompressPhoto, validateDocumentFile, formatBytes } from '@/utils/fileValidation';

export function Submodule2Personnel({
  personnel = {},
  setPersonnel,
  isReadOnly = false,
  reviewStatus = 'NOT_STARTED',
  reworkReason = '',
  mediaAssets = [],
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

  const handlePhotoSelect = async (roleKey, personType, file) => {
    if (!file) return;
    setUploadError(null);
    setUploadingRole(`${roleKey}-photo`);

    try {
      const result = await validateAndCompressPhoto(file);
      if (!result.success) {
        setUploadError(`[${personType}] ${result.error}`);
        return;
      }

      if (onUploadMedia) {
        await onUploadMedia({
          entityType: 'CONTACT',
          entityId: roleKey,
          fieldKey: 'photo',
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
      setUploadError(err.message || 'Failed to process photo.');
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <UserCheck size={18} color="var(--color-primary, #2563eb)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                1. Centre Owner Details (FRD Sec. 7)
              </h3>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Mandatory</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
              Primary institutional head / trustee legally accountable for the examination venue contract.
            </p>
          </div>

          {/* Photo Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {owner.photoUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src={owner.photoUrl}
                  alt="Owner Photo"
                  style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)' }}
                />
                {!isReadOnly && (
                  <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                    <Camera size={12} style={{ marginRight: 4 }} /> Change
                    <input
                      type="file"
                      accept=".jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => handlePhotoSelect('owner', 'Owner', e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            ) : (
              !isReadOnly && (
                <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Upload size={12} /> Upload Photo (JPG ≤ 2MB)
                  <input
                    type="file"
                    accept=".jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={(e) => handlePhotoSelect('owner', 'Owner', e.target.files?.[0])}
                  />
                </label>
              )
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="owner-designation">
              Owner Designation <span style={{ color: 'var(--color-danger)' }}>*</span>
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

          <div className="form-group">
            <label className="form-label" htmlFor="owner-fullName">
              Full Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="owner-fullName"
              type="text"
              className="form-control"
              value={owner.fullName || ''}
              onChange={(e) => handleFieldChange('owner', 'fullName', e.target.value)}
              placeholder="Full name as per Aadhaar"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="owner-contactNumber">
              Contact Number (10 Digits) <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="owner-contactNumber"
              type="text"
              maxLength={10}
              className="form-control"
              value={owner.contactNumber || ''}
              onChange={(e) => handleFieldChange('owner', 'contactNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit primary mobile"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="owner-alternateNumber">
              Alternate Number
            </label>
            <input
              id="owner-alternateNumber"
              type="text"
              maxLength={10}
              className="form-control"
              value={owner.alternateNumber || ''}
              onChange={(e) => handleFieldChange('owner', 'alternateNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit alternate mobile"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="owner-email">
              Email ID <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="owner-email"
              type="email"
              className="form-control"
              value={owner.email || ''}
              onChange={(e) => handleFieldChange('owner', 'email', e.target.value)}
              placeholder="owner@institution.edu.in"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="owner-aadhaarNumber">
              Aadhaar Number (Masked Display) <span style={{ color: 'var(--color-danger)' }}>*</span>
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

          <div className="form-group">
            <label className="form-label" htmlFor="owner-panNumber">
              PAN Number <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="owner-panNumber"
              type="text"
              maxLength={10}
              className="form-control"
              style={{ textTransform: 'uppercase' }}
              value={owner.panNumber || ''}
              onChange={(e) => handleFieldChange('owner', 'panNumber', e.target.value.trim().toUpperCase())}
              placeholder="10-character PAN"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="owner-policeVerification">
              Police Verification Status
            </label>
            <input
              id="owner-policeVerification"
              type="text"
              className="form-control"
              value={owner.policeVerification || ''}
              onChange={(e) => handleFieldChange('owner', 'policeVerification', e.target.value)}
              placeholder="Clear / Verification Certificate No."
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="owner-residentialAddress">
              Residential Address
            </label>
            <input
              id="owner-residentialAddress"
              type="text"
              className="form-control"
              value={owner.residentialAddress || owner.currentAddress || ''}
              onChange={(e) => {
                handleFieldChange('owner', 'residentialAddress', e.target.value);
                handleFieldChange('owner', 'currentAddress', e.target.value);
              }}
              placeholder="Current residential address"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="owner-permanentAddress">
              Permanent Address
            </label>
            <input
              id="owner-permanentAddress"
              type="text"
              className="form-control"
              value={owner.permanentAddress || ''}
              onChange={(e) => handleFieldChange('owner', 'permanentAddress', e.target.value)}
              placeholder="Permanent residential address as per Aadhaar"
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* ── 2. CENTRE SUPERINTENDENT / TCA DETAILS (FRD Sec. 7.2) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={18} color="var(--color-primary, #2563eb)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                2. Centre Superintendent (CS / TCA) Details (FRD Sec. 7)
              </h3>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Mandatory</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
              Operational chief physically present at the centre to supervise exam conduct, confidentiality, and session adherence.
            </p>
          </div>

          {/* Photo Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {cs.photoUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src={cs.photoUrl}
                  alt="CS Photo"
                  style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)' }}
                />
                {!isReadOnly && (
                  <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                    <Camera size={12} style={{ marginRight: 4 }} /> Change
                    <input
                      type="file"
                      accept=".jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => handlePhotoSelect('cs', 'Centre CS', e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            ) : (
              !isReadOnly && (
                <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Upload size={12} /> Upload Photo (JPG ≤ 2MB)
                  <input
                    type="file"
                    accept=".jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={(e) => handlePhotoSelect('cs', 'Centre CS', e.target.files?.[0])}
                  />
                </label>
              )
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="cs-designation">
              Designation <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="cs-designation"
              type="text"
              className="form-control"
              value={cs.designation || ''}
              onChange={(e) => handleFieldChange('cs', 'designation', e.target.value)}
              placeholder="e.g. Chief Superintendent / Vice Principal"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cs-fullName">
              Full Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="cs-fullName"
              type="text"
              className="form-control"
              value={cs.fullName || ''}
              onChange={(e) => handleFieldChange('cs', 'fullName', e.target.value)}
              placeholder="Full legal name"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cs-contactNumber">
              Contact Number (10 Digits) <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="cs-contactNumber"
              type="text"
              maxLength={10}
              className="form-control"
              value={cs.contactNumber || ''}
              onChange={(e) => handleFieldChange('cs', 'contactNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit mobile"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cs-email">
              Email ID <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="cs-email"
              type="email"
              className="form-control"
              value={cs.email || ''}
              onChange={(e) => handleFieldChange('cs', 'email', e.target.value)}
              placeholder="cs@institution.edu.in"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cs-alternateNumber">
              Alternate Number
            </label>
            <input
              id="cs-alternateNumber"
              type="text"
              maxLength={10}
              className="form-control"
              value={cs.alternateNumber || ''}
              onChange={(e) => handleFieldChange('cs', 'alternateNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="Alternate mobile"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cs-aadhaarNumber">
              Aadhaar Number (Masked Display) <span style={{ color: 'var(--color-danger)' }}>*</span>
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

          <div className="form-group">
            <label className="form-label" htmlFor="cs-panNumber">
              PAN Number
            </label>
            <input
              id="cs-panNumber"
              type="text"
              maxLength={10}
              className="form-control"
              style={{ textTransform: 'uppercase' }}
              value={cs.panNumber || ''}
              onChange={(e) => handleFieldChange('cs', 'panNumber', e.target.value.trim().toUpperCase())}
              placeholder="10-character PAN"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cs-policeVerification">
              Police Verification Status
            </label>
            <input
              id="cs-policeVerification"
              type="text"
              className="form-control"
              value={cs.policeVerification || ''}
              onChange={(e) => handleFieldChange('cs', 'policeVerification', e.target.value)}
              placeholder="Status / Reference ID"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="cs-address">
              Address
            </label>
            <input
              id="cs-address"
              type="text"
              className="form-control"
              value={cs.address || cs.permanentAddress || ''}
              onChange={(e) => handleFieldChange('cs', 'address', e.target.value)}
              placeholder="Residential address"
              disabled={isReadOnly}
            />
          </div>

          {/* TCA Authorization Letter Upload */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">
              TCA Authorization Letter (PDF) <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {cs.tcaLetterUrl || cs.tcaAuthorizationLetterUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                  <FileText size={16} />
                  <span>Authorized Letter Uploaded</span>
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      Replace PDF
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocUpload('cs', 'tcaLetter', 'TCA Letter', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} /> Upload TCA Authorization Letter (PDF ≤ 10MB)
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocUpload('cs', 'tcaLetter', 'TCA Letter', e.target.files?.[0])}
                    />
                  </label>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. CENTRE IT PERSON (FRD Sec. 7.3) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Cpu size={18} color="var(--color-primary, #2563eb)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                3. Centre IT Person Details (FRD Sec. 7)
              </h3>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Mandatory</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
              Technical lead accountable for lab networking, LAN switches, IP addressing, and client server operations.
            </p>
          </div>

          {/* Photo Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {it.photoUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src={it.photoUrl}
                  alt="IT Person Photo"
                  style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)' }}
                />
                {!isReadOnly && (
                  <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                    <Camera size={12} style={{ marginRight: 4 }} /> Change
                    <input
                      type="file"
                      accept=".jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => handlePhotoSelect('it', 'IT Person', e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            ) : (
              !isReadOnly && (
                <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Upload size={12} /> Upload Photo (JPG ≤ 2MB)
                  <input
                    type="file"
                    accept=".jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={(e) => handlePhotoSelect('it', 'IT Person', e.target.files?.[0])}
                  />
                </label>
              )
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="it-fullName">
              Full Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="it-fullName"
              type="text"
              className="form-control"
              value={it.fullName || ''}
              onChange={(e) => handleFieldChange('it', 'fullName', e.target.value)}
              placeholder="IT Administrator full legal name"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="it-contactNumber">
              Contact Number (10 Digits) <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="it-contactNumber"
              type="text"
              maxLength={10}
              className="form-control"
              value={it.contactNumber || ''}
              onChange={(e) => handleFieldChange('it', 'contactNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit mobile"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="it-email">
              Email ID <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="it-email"
              type="email"
              className="form-control"
              value={it.email || ''}
              onChange={(e) => handleFieldChange('it', 'email', e.target.value)}
              placeholder="it.lead@institution.edu.in"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="it-alternateNumber">
              Alternate Number
            </label>
            <input
              id="it-alternateNumber"
              type="text"
              maxLength={10}
              className="form-control"
              value={it.alternateNumber || ''}
              onChange={(e) => handleFieldChange('it', 'alternateNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="Alternate mobile"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="it-aadhaarNumber">
              Aadhaar Number (Masked Display) <span style={{ color: 'var(--color-danger)' }}>*</span>
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

          <div className="form-group">
            <label className="form-label" htmlFor="it-panNumber">
              PAN Number
            </label>
            <input
              id="it-panNumber"
              type="text"
              maxLength={10}
              className="form-control"
              style={{ textTransform: 'uppercase' }}
              value={it.panNumber || ''}
              onChange={(e) => handleFieldChange('it', 'panNumber', e.target.value.trim().toUpperCase())}
              placeholder="10-character PAN"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="it-qualification">
              Qualification
            </label>
            <input
              id="it-qualification"
              type="text"
              className="form-control"
              value={it.qualification || ''}
              onChange={(e) => handleFieldChange('it', 'qualification', e.target.value)}
              placeholder="e.g. B.Tech (CS/IT) / MCA / Diploma in Hardware & Networking"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="it-experienceYears">
              Total Experience (Years)
            </label>
            <input
              id="it-experienceYears"
              type="number"
              min={0}
              className="form-control"
              value={it.experienceYears ?? 3}
              onChange={(e) => handleFieldChange('it', 'experienceYears', Number(e.target.value))}
              placeholder="e.g. 5"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="it-address">
              Address
            </label>
            <input
              id="it-address"
              type="text"
              className="form-control"
              value={it.address || it.permanentAddress || ''}
              onChange={(e) => handleFieldChange('it', 'address', e.target.value)}
              placeholder="Residential address"
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* ── 4. ELECTRICIAN DETAILS (FRD Sec. 7.4) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wrench size={18} color="var(--color-primary, #2563eb)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                4. Centre Electrician Details (FRD Sec. 7)
              </h3>
              <span className="badge badge-subtle" style={{ fontSize: '0.7rem' }}>SLA / On-Site</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
              Certified electrician available on-site for UPS failover, DG switchover, and electrical safety.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="el-fullName">
              Full Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="el-fullName"
              type="text"
              className="form-control"
              value={electrician.fullName || ''}
              onChange={(e) => handleFieldChange('electrician', 'fullName', e.target.value)}
              placeholder="Electrician full name"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="el-contactNumber">
              Contact Number (10 Digits) <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="el-contactNumber"
              type="text"
              maxLength={10}
              className="form-control"
              value={electrician.contactNumber || ''}
              onChange={(e) => handleFieldChange('electrician', 'contactNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit mobile"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="el-alternateNumber">
              Alternate Number
            </label>
            <input
              id="el-alternateNumber"
              type="text"
              maxLength={10}
              className="form-control"
              value={electrician.alternateNumber || ''}
              onChange={(e) => handleFieldChange('electrician', 'alternateNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="Alternate mobile"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="el-licenseNumber">
              Electrician License / Certificate Number
            </label>
            <input
              id="el-licenseNumber"
              type="text"
              className="form-control"
              value={electrician.licenseNumber || ''}
              onChange={(e) => handleFieldChange('electrician', 'licenseNumber', e.target.value)}
              placeholder="e.g. ELEC-LIC-2024-9821"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="el-availabilityType">
              Availability Type
            </label>
            <select
              id="el-availabilityType"
              className="form-control"
              value={electrician.availabilityType || 'Full-time'}
              onChange={(e) => handleFieldChange('electrician', 'availabilityType', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Full-time">Full-time On-Campus</option>
              <option value="On-call">On-Call for Exam Shifts</option>
              <option value="Contract">Contract / Third-Party Vendor SLA</option>
            </select>
          </div>

          {/* Electrician License Document Upload */}
          <div className="form-group">
            <label className="form-label">
              Electrician License Document (PDF)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              {electrician.licenseDocUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                  <FileText size={16} />
                  <span>License Uploaded</span>
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      Replace
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocUpload('electrician', 'licenseDoc', 'License Document', e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={12} /> Upload License PDF
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleDocUpload('electrician', 'licenseDoc', 'License Document', e.target.files?.[0])}
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
