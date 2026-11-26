import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, UserCheck, Upload, Trash2, Eye, Shield, Camera } from 'lucide-react';
import { validateAndCompressPhoto, formatBytes } from '@/utils/fileValidation';

const ROLES_CONFIG = [
  {
    key: 'owner',
    title: '1. Owner / Authorized Signatory Details',
    subtitle: 'Primary institutional head legally accountable for contract and compliance',
    roleTag: 'Owner',
    mandatory: true,
  },
  {
    key: 'cs',
    title: '2. Centre Superintendent (CS / TCA) Details',
    subtitle: 'Operational lead physically supervising examination day conduct and security',
    roleTag: 'Centre CS',
    mandatory: true,
  },
  {
    key: 'it',
    title: '3. IT Lead / Systems Administrator Details',
    subtitle: 'Technical specialist overseeing lab systems, LAN switches, and client server',
    roleTag: 'IT Person',
    mandatory: true,
  },
  {
    key: 'electrician',
    title: '4. Dedicated Electrician / SLA Support',
    subtitle: 'Certified electrician stationed on-site for UPS and generator failover management',
    roleTag: 'Electrician',
    mandatory: false,
  },
];

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
    setUploadingRole(roleKey);

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

      // Store in local personnel object as well
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

  const formatMaskedAadhaar = (val) => {
    if (!val) return '';
    const clean = val.replace(/\D/g, '');
    if (clean.length <= 4) return clean;
    if (clean.length <= 8) return `XXXX-${clean.slice(4)}`;
    return `XXXX-XXXX-${clean.slice(8, 12)}`;
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
              Rework Required for Personnel Details
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
              {reworkReason || 'Key operational personnel information or Aadhaar credentials need rectification.'}
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
          Key Operational Personnel verified and KYC-cleared.
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

      {ROLES_CONFIG.map((cfg) => {
        const p = personnel[cfg.key] || {};
        const isCurrentUploading = uploadingRole === cfg.key;
        const matchingAsset = mediaAssets.find(
          (m) => m.entityType === 'CONTACT' && m.entityId === cfg.key && m.fieldKey === 'photo'
        );
        const photoSource = p.photoUrl || matchingAsset?.fileUrl;

        return (
          <div key={cfg.key} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <UserCheck size={18} color="var(--color-primary, #2563eb)" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                    {cfg.title}
                  </h3>
                  {cfg.mandatory ? (
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Mandatory</span>
                  ) : (
                    <span className="badge badge-subtle" style={{ fontSize: '0.7rem' }}>Optional</span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
                  {cfg.subtitle}
                </p>
              </div>

              {/* Photo Thumbnail / Upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {photoSource ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={photoSource}
                      alt={`${cfg.roleTag} Photo`}
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 'var(--radius-md, 8px)',
                        objectFit: 'cover',
                        border: '2px solid var(--border-color, #e2e8f0)',
                      }}
                    />
                    {!isReadOnly && (
                      <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                        <Camera size={12} style={{ marginRight: 4 }} />
                        Change
                        <input
                          type="file"
                          accept=".jpg,.jpeg"
                          style={{ display: 'none' }}
                          onChange={(e) => handlePhotoSelect(cfg.key, cfg.roleTag, e.target.files?.[0])}
                          disabled={isCurrentUploading}
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  !isReadOnly && (
                    <label
                      className="btn btn-xs btn-secondary"
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Upload size={13} className={isCurrentUploading ? 'animate-spin' : ''} />
                      {isCurrentUploading ? 'Compressing...' : 'Upload JPG Photo'}
                      <input
                        type="file"
                        accept=".jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => handlePhotoSelect(cfg.key, cfg.roleTag, e.target.files?.[0])}
                        disabled={isCurrentUploading}
                      />
                    </label>
                  )
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor={`${cfg.key}-fullName`}>
                  Full Legal Name {cfg.mandatory && <span style={{ color: 'var(--color-danger)' }}>*</span>}
                </label>
                <input
                  id={`${cfg.key}-fullName`}
                  type="text"
                  className="form-control"
                  value={p.fullName || ''}
                  onChange={(e) => handleFieldChange(cfg.key, 'fullName', e.target.value)}
                  placeholder="Name as recorded in Aadhaar / PAN"
                  disabled={isReadOnly}
                  required={cfg.mandatory}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor={`${cfg.key}-contactNumber`}>
                  Primary Mobile Number (10 Digits) {cfg.mandatory && <span style={{ color: 'var(--color-danger)' }}>*</span>}
                </label>
                <input
                  id={`${cfg.key}-contactNumber`}
                  type="text"
                  maxLength={10}
                  className="form-control"
                  value={p.contactNumber || ''}
                  onChange={(e) => handleFieldChange(cfg.key, 'contactNumber', e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile"
                  disabled={isReadOnly}
                  required={cfg.mandatory}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor={`${cfg.key}-email`}>
                  Email Address
                </label>
                <input
                  id={`${cfg.key}-email`}
                  type="email"
                  className="form-control"
                  value={p.email || ''}
                  onChange={(e) => handleFieldChange(cfg.key, 'email', e.target.value)}
                  placeholder="official@centre.org"
                  disabled={isReadOnly}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor={`${cfg.key}-aadhaarNumber`}>
                  Aadhaar Number (Masked Display) {cfg.mandatory && <span style={{ color: 'var(--color-danger)' }}>*</span>}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id={`${cfg.key}-aadhaarNumber`}
                    type="text"
                    maxLength={14}
                    className="form-control"
                    value={p.aadhaarNumber ? (isReadOnly ? formatMaskedAadhaar(p.aadhaarNumber) : p.aadhaarNumber) : ''}
                    onChange={(e) => handleFieldChange(cfg.key, 'aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                    placeholder="12-digit Aadhaar number"
                    disabled={isReadOnly}
                  />
                  <Shield size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 12, top: 12 }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Aadhaar numbers are encrypted and masked as XXXX-XXXX-1234.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor={`${cfg.key}-fatherName`}>
                  Father's / Spouse Name
                </label>
                <input
                  id={`${cfg.key}-fatherName`}
                  type="text"
                  className="form-control"
                  value={p.fatherName || ''}
                  onChange={(e) => handleFieldChange(cfg.key, 'fatherName', e.target.value)}
                  placeholder="Father's or spouse's legal name"
                  disabled={isReadOnly}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor={`${cfg.key}-alternateNumber`}>
                  Alternate Contact Number
                </label>
                <input
                  id={`${cfg.key}-alternateNumber`}
                  type="text"
                  maxLength={10}
                  className="form-control"
                  value={p.alternateNumber || ''}
                  onChange={(e) => handleFieldChange(cfg.key, 'alternateNumber', e.target.value.replace(/\D/g, ''))}
                  placeholder="Alternate mobile"
                  disabled={isReadOnly}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" htmlFor={`${cfg.key}-permanentAddress`}>
                  Permanent Residential Address
                </label>
                <input
                  id={`${cfg.key}-permanentAddress`}
                  type="text"
                  className="form-control"
                  value={p.permanentAddress || ''}
                  onChange={(e) => handleFieldChange(cfg.key, 'permanentAddress', e.target.value)}
                  placeholder="Complete residential address as per Aadhaar"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Submodule2Personnel;
