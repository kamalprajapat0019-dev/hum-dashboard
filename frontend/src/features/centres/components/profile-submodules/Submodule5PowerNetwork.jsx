import React, { useState } from 'react';
import {
  AlertCircle, CheckCircle2, Zap, Wifi, ShieldAlert, Cpu, Wrench,
  Upload, Eye, FileText, Check, ShieldCheck
} from 'lucide-react';
import { ELECTRICITY_CONNECTION_TYPES, GENERATOR_FUEL_TYPES, LAN_TYPES } from './constants';
import { validateDocumentFile, validateAndCompressPhoto, formatBytes } from '@/utils/fileValidation';

export function Submodule5PowerNetwork({
  powerNetwork = {},
  setPowerNetwork,
  isReadOnly = false,
  reviewStatus = 'NOT_STARTED',
  reworkReason = '',
  onUploadDocument,
  onUploadMedia,
  documents = [],
  mediaAssets = [],
}) {
  const isRework = reviewStatus === 'REWORK_REQUIRED';
  const isVerified = reviewStatus === 'VERIFIED';
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleChange = (field, value) => {
    setPowerNetwork((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getDoc = (type) => documents.find((d) => d.documentType === type || d.documentType === type.toLowerCase());

  const handleFileUpload = async (file, docType, docName, isPhotoOnly = false) => {
    if (!file) return;
    setUploadError(null);
    setUploadingDoc(docType);

    try {
      let result;
      const isPdf = file.type === 'application/pdf';

      if (isPhotoOnly) {
        result = await validateAndCompressPhoto(file);
      } else if (isPdf) {
        result = await validateDocumentFile(file);
      } else {
        result = await validateAndCompressPhoto(file);
      }

      if (!result.success) {
        setUploadError(result.error);
        return;
      }

      if (onUploadDocument) {
        await onUploadDocument({
          documentType: docType,
          documentName: docName,
          fileName: result.fileName,
          fileUrl: result.fileUrl,
          fileSize: result.finalSizeBytes,
          mimeType: result.mimeType,
        });
      }
    } catch (err) {
      setUploadError(err.message || `Failed to upload ${docName}`);
    } finally {
      setUploadingDoc(null);
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
              Rework Required for Power & Network Infrastructure
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
              {reworkReason || 'The generator failover capacity, secondary ISP bandwidth, or LAN switch specifications need revision.'}
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
          Power resilience and Network connectivity audited and certified for live testing.
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

      {/* ── Section 1: Mains Electricity Details (FRD Sec. 10) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Zap size={20} color="var(--color-primary, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            1. Mains Electricity & Grid Power Details (FRD Sec. 10)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="connectionType">
              Electricity Connection Type <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              id="connectionType"
              className="form-control"
              value={powerNetwork.connectionType || 'Commercial'}
              onChange={(e) => handleChange('connectionType', e.target.value)}
              disabled={isReadOnly}
            >
              {ELECTRICITY_CONNECTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="electricityProvider">
              Electricity Provider / Board Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="electricityProvider"
              type="text"
              className="form-control"
              value={powerNetwork.electricityProvider || ''}
              onChange={(e) => handleChange('electricityProvider', e.target.value)}
              placeholder="e.g. BSES Rajdhani, MSEDCL, TPDDL"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sanctionedLoadKw">
              Sanctioned Power Load (KW) <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="sanctionedLoadKw"
              type="number"
              min={1}
              className="form-control"
              value={powerNetwork.sanctionedLoadKw ?? 50}
              onChange={(e) => handleChange('sanctionedLoadKw', Number(e.target.value))}
              disabled={isReadOnly}
              placeholder="e.g. 50"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="avgMonthlyKwh">
              Monthly Average Consumption (KWH)
            </label>
            <input
              id="avgMonthlyKwh"
              type="number"
              min={0}
              className="form-control"
              value={powerNetwork.avgMonthlyKwh ?? 3500}
              onChange={(e) => handleChange('avgMonthlyKwh', Number(e.target.value))}
              disabled={isReadOnly}
              placeholder="e.g. 3500"
            />
          </div>

          {/* Electricity Bill Upload */}
          <div
            className="form-group"
            style={{
              gridColumn: '1 / -1',
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <strong style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={16} color="var(--color-primary)" />
                Electricity Bill (Last 3 Months) <span style={{ color: 'var(--color-danger)' }}>*</span>
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Mandatory document verifying sanctioned commercial load and active meter connection (PDF ≤ 10MB or JPG ≤ 2MB).
              </span>
              {getDoc('electricity_bill') && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-success, #15803d)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check size={14} /> Uploaded: {getDoc('electricity_bill').fileName}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {getDoc('electricity_bill') && (
                <a
                  href={getDoc('electricity_bill').fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-xs btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Eye size={12} /> View
                </a>
              )}
              {!isReadOnly && (
                <label
                  className="btn btn-xs btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                >
                  <Upload size={12} className={uploadingDoc === 'electricity_bill' ? 'animate-spin' : ''} />
                  {uploadingDoc === 'electricity_bill' ? 'Uploading...' : getDoc('electricity_bill') ? 'Replace Bill' : 'Upload Bill'}
                  <input
                    type="file"
                    accept=".pdf,application/pdf,.jpg,.jpeg,image/jpeg"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], 'electricity_bill', 'Electricity Bill (Last 3 Months)');
                      }
                    }}
                    disabled={uploadingDoc === 'electricity_bill'}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Online UPS Backup (FRD Sec. 10) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Zap size={20} color="var(--color-primary, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            2. Dedicated Online UPS Backup (FRD Sec. 10)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Dedicated Online UPS Available? <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select
              className="form-control"
              value={powerNetwork.upsAvailable ? 'Yes' : 'No'}
              onChange={(e) => handleChange('upsAvailable', e.target.value === 'Yes')}
              disabled={isReadOnly}
            >
              <option value="Yes">Yes, Dedicated Online UPS</option>
              <option value="No">No</option>
            </select>
          </div>

          {powerNetwork.upsAvailable && (
            <>
              <div className="form-group">
                <label className="form-label">UPS Capacity (KVA) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  value={powerNetwork.upsCapacityKva ?? 20}
                  onChange={(e) => handleChange('upsCapacityKva', Number(e.target.value))}
                  disabled={isReadOnly}
                  placeholder="e.g. 20"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Backup Duration on Full Load (Minutes) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  type="number"
                  min={15}
                  className="form-control"
                  value={powerNetwork.upsBackupDurationMins ?? 60}
                  onChange={(e) => handleChange('upsBackupDurationMins', Number(e.target.value))}
                  disabled={isReadOnly}
                  placeholder="e.g. 60"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Battery Health / Age (Months)</label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  value={powerNetwork.batteryAgeMonths ?? 12}
                  onChange={(e) => handleChange('batteryAgeMonths', Number(e.target.value))}
                  disabled={isReadOnly}
                  placeholder="Age in months"
                />
              </div>

              <div className="form-group">
                <label className="form-label">UPS Model / Vendor</label>
                <input
                  type="text"
                  className="form-control"
                  value={powerNetwork.upsModel || ''}
                  onChange={(e) => handleChange('upsModel', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. APC Smart-UPS VT 20kVA"
                />
              </div>

              {/* UPS Invoice & Photo Uploads */}
              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 12,
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    padding: 12,
                    borderRadius: 'var(--radius-md, 6px)',
                    background: 'var(--bg-subtle, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.8125rem' }}>UPS Purchase Invoice / AMC Document</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>PDF / JPG proof</div>
                    {getDoc('ups_invoice') && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-success)' }}>Uploaded</span>
                    )}
                  </div>
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      <Upload size={12} /> Upload
                      <input
                        type="file"
                        accept=".pdf,application/pdf,.jpg,.jpeg,image/jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0], 'ups_invoice', 'UPS Purchase Invoice / AMC');
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 'var(--radius-md, 6px)',
                    background: 'var(--bg-subtle, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.8125rem' }}>UPS Setup & Battery Bank Photo</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>JPG format ≤ 2MB</div>
                    {getDoc('ups_photo') && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-success)' }}>Uploaded</span>
                    )}
                  </div>
                  {!isReadOnly && (
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                      <Upload size={12} /> Upload Photo
                      <input
                        type="file"
                        accept=".jpg,.jpeg,image/jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0], 'ups_photo', 'UPS Setup Photo', true);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Section 3: Generator Backup (FRD Sec. 10) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Zap size={20} color="var(--color-primary, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            3. Generator Backup (Primary & Secondary DG Sets) (FRD Sec. 10)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Primary Generator Available? <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select
              className="form-control"
              value={powerNetwork.generatorAvailable ?? powerNetwork.gensetAvailable ? 'Yes' : 'No'}
              onChange={(e) => {
                const val = e.target.value === 'Yes';
                handleChange('generatorAvailable', val);
                handleChange('gensetAvailable', val);
              }}
              disabled={isReadOnly}
            >
              <option value="Yes">Yes, Dedicated DG Set</option>
              <option value="No">No</option>
            </select>
          </div>

          {(powerNetwork.generatorAvailable ?? powerNetwork.gensetAvailable) && (
            <>
              <div className="form-group">
                <label className="form-label">Generator Capacity (KVA) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  value={powerNetwork.generatorCapacityKva ?? powerNetwork.gensetCapacityKva ?? 40}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    handleChange('generatorCapacityKva', num);
                    handleChange('gensetCapacityKva', num);
                  }}
                  disabled={isReadOnly}
                  placeholder="e.g. 40"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Generator Fuel Type <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <select
                  className="form-control"
                  value={powerNetwork.generatorFuelType || 'Diesel'}
                  onChange={(e) => handleChange('generatorFuelType', e.target.value)}
                  disabled={isReadOnly}
                >
                  {GENERATOR_FUEL_TYPES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Auto Switchover (AMF Panel) Active? <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <select
                  className="form-control"
                  value={powerNetwork.autoSwitchover ?? powerNetwork.generatorAutoSwitchover ? 'Yes' : 'No'}
                  onChange={(e) => {
                    const val = e.target.value === 'Yes';
                    handleChange('autoSwitchover', val);
                    handleChange('generatorAutoSwitchover', val);
                  }}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes (Automatic Mains Failure Panel)</option>
                  <option value="No">No (Manual Changeover Switch)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">DG Fuel Contract / Storage Available?</label>
                <select
                  className="form-control"
                  value={powerNetwork.dgFuelArrangement ? 'Yes' : 'No'}
                  onChange={(e) => handleChange('dgFuelArrangement', e.target.value === 'Yes')}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes, min 8 hours fuel storage/contract</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Secondary / Backup Generator Available?</label>
                <select
                  className="form-control"
                  value={powerNetwork.backupGeneratorAvailable ?? powerNetwork.backupGensetAvailable ? 'Yes' : 'No'}
                  onChange={(e) => {
                    const val = e.target.value === 'Yes';
                    handleChange('backupGeneratorAvailable', val);
                    handleChange('backupGensetAvailable', val);
                  }}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes, Secondary Standby DG</option>
                  <option value="No">No</option>
                </select>
              </div>

              {(powerNetwork.backupGeneratorAvailable ?? powerNetwork.backupGensetAvailable) && (
                <div className="form-group">
                  <label className="form-label">Secondary DG Capacity (KVA)</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={powerNetwork.backupGeneratorCapacityKva ?? powerNetwork.backupGensetCapacityKva ?? 30}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      handleChange('backupGeneratorCapacityKva', num);
                      handleChange('backupGensetCapacityKva', num);
                    }}
                    disabled={isReadOnly}
                    placeholder="e.g. 30"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Dedicated Electrician Available on Exam Day?</label>
                <select
                  className="form-control"
                  value={powerNetwork.electricianSlaAvailable ?? powerNetwork.electricianAvailableOnsite ? 'Yes' : 'No'}
                  onChange={(e) => {
                    const val = e.target.value === 'Yes';
                    handleChange('electricianSlaAvailable', val);
                    handleChange('electricianAvailableOnsite', val);
                  }}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes, Certified SLA on-site</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Electrician Name & Contact Details</label>
                <input
                  type="text"
                  className="form-control"
                  value={powerNetwork.electricianSlaDetails || ''}
                  onChange={(e) => handleChange('electricianSlaDetails', e.target.value)}
                  placeholder="Technician name / Contact number"
                  disabled={isReadOnly}
                />
              </div>

              {/* Generator Photo Upload */}
              <div
                style={{
                  gridColumn: '1 / -1',
                  padding: 12,
                  borderRadius: 'var(--radius-md, 6px)',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.8125rem' }}>Generator (DG Set) Installation Photo</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Clear photo of DG set and fuel tank (JPG ≤ 2MB)</div>
                  {getDoc('generator_photo') && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-success)' }}>Uploaded</span>
                  )}
                </div>
                {!isReadOnly && (
                  <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                    <Upload size={12} /> Upload Photo
                    <input
                      type="file"
                      accept=".jpg,.jpeg,image/jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0], 'generator_photo', 'Generator Photo', true);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Section 4: Internet, LAN & Structured Network (FRD Sec. 10) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Wifi size={20} color="var(--color-primary, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            4. Dual High-Speed Internet & Structured LAN Network (FRD Sec. 10)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Dedicated Leased Line / Fiber?</label>
            <select
              className="form-control"
              value={powerNetwork.dedicatedInternetLine ?? powerNetwork.primaryInternet ? 'Yes' : 'No'}
              onChange={(e) => {
                const val = e.target.value === 'Yes';
                handleChange('dedicatedInternetLine', val);
                handleChange('primaryInternet', val);
              }}
              disabled={isReadOnly}
            >
              <option value="Yes">Yes, Dedicated Optical Fiber Leased Line</option>
              <option value="No">Broadband / Shared Connection</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Primary ISP Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              type="text"
              className="form-control"
              value={powerNetwork.primaryIspName || ''}
              onChange={(e) => handleChange('primaryIspName', e.target.value)}
              placeholder="e.g. Airtel Enterprise, Tata Tele, BSNL"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Primary Bandwidth (Mbps) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              type="number"
              min={10}
              className="form-control"
              value={powerNetwork.primaryBandwidthMbps ?? powerNetwork.primaryIspBandwidthMbps ?? 100}
              onChange={(e) => {
                const num = Number(e.target.value);
                handleChange('primaryBandwidthMbps', num);
                handleChange('primaryIspBandwidthMbps', num);
              }}
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Secondary ISP Available? (Failover)</label>
            <select
              className="form-control"
              value={powerNetwork.secondaryIspAvailable ?? powerNetwork.backupInternet ? 'Yes' : 'No'}
              onChange={(e) => {
                const val = e.target.value === 'Yes';
                handleChange('secondaryIspAvailable', val);
                handleChange('backupInternet', val);
              }}
              disabled={isReadOnly}
            >
              <option value="Yes">Yes, Redundant Secondary ISP</option>
              <option value="No">No</option>
            </select>
          </div>

          {(powerNetwork.secondaryIspAvailable ?? powerNetwork.backupInternet) && (
            <>
              <div className="form-group">
                <label className="form-label">Secondary ISP Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={powerNetwork.secondaryIspName || ''}
                  onChange={(e) => handleChange('secondaryIspName', e.target.value)}
                  placeholder="e.g. Jio Fiber, RailWire"
                  disabled={isReadOnly}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Secondary Bandwidth (Mbps)</label>
                <input
                  type="number"
                  min={10}
                  className="form-control"
                  value={powerNetwork.secondaryBandwidthMbps ?? powerNetwork.secondaryIspBandwidthMbps ?? 50}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    handleChange('secondaryBandwidthMbps', num);
                    handleChange('secondaryIspBandwidthMbps', num);
                  }}
                  disabled={isReadOnly}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Core LAN Switch Architecture</label>
            <select
              className="form-control"
              value={powerNetwork.coreSwitch1Gbps ?? powerNetwork.switchType?.includes('Gigabit') ? 'Yes' : 'No'}
              onChange={(e) => handleChange('coreSwitch1Gbps', e.target.value === 'Yes')}
              disabled={isReadOnly}
            >
              <option value="Yes">1 Gbps Full Duplex Gigabit Managed Switch</option>
              <option value="No">100 Mbps Standard Switch</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">LAN Cabling & Topology</label>
            <select
              className="form-control"
              value={powerNetwork.lanType || 'Single LAN'}
              onChange={(e) => handleChange('lanType', e.target.value)}
              disabled={isReadOnly}
            >
              {LAN_TYPES.map((lt) => (
                <option key={lt} value={lt}>{lt}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Backup 4G / 5G Wireless Dongles Count</label>
            <input
              type="number"
              min={0}
              className="form-control"
              value={powerNetwork.wirelessDonglesCount ?? powerNetwork.backupDonglesCount ?? 2}
              onChange={(e) => {
                const num = Number(e.target.value);
                handleChange('wirelessDonglesCount', num);
                handleChange('backupDonglesCount', num);
              }}
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Onsite Network Administrators Count</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={powerNetwork.networkAdminsCount ?? 2}
              onChange={(e) => handleChange('networkAdminsCount', Number(e.target.value))}
              disabled={isReadOnly}
            />
          </div>

          {/* Network Diagram Upload */}
          <div
            style={{
              gridColumn: '1 / -1',
              padding: 14,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <strong style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={16} color="var(--color-primary)" />
                Network Architecture & Topology Diagram
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Detailed schematic of switches, VLANs, rack layout, and server room uplinks (PDF/JPG/PNG ≤ 10MB).
              </span>
              {getDoc('network_diagram') && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: 4 }}>
                  Uploaded: {getDoc('network_diagram').fileName}
                </div>
              )}
            </div>
            {!isReadOnly && (
              <label className="btn btn-xs btn-primary" style={{ cursor: 'pointer' }}>
                <Upload size={12} /> Upload Diagram
                <input
                  type="file"
                  accept=".pdf,application/pdf,.jpg,.jpeg,image/jpeg,.png,image/png"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0], 'network_diagram', 'Network Architecture Diagram');
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Submodule5PowerNetwork;
