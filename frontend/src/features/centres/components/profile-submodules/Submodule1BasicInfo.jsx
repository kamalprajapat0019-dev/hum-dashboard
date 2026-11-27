import React from 'react';
import {
  AlertCircle, CheckCircle2, Building, MapPin, Monitor, Navigation,
  Utensils, Phone, Mail, Globe, Train, Bus, Hotel
} from 'lucide-react';
import {
  INDIAN_STATES, CENTRE_CATEGORIES, ORGANIZATION_TYPES,
  REGIONS, REGION_LABELS
} from './constants';

export function Submodule1BasicInfo({
  basicInfo = {},
  setBasicInfo,
  isReadOnly = false,
  reviewStatus = 'NOT_STARTED',
  reworkReason = '',
  validationErrors = {},
}) {
  const isRework = reviewStatus === 'REWORK_REQUIRED';
  const isVerified = reviewStatus === 'VERIFIED';

  const handleChange = (field, value) => {
    setBasicInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCapacityChange = (field, value) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setBasicInfo((prev) => {
      const next = { ...prev, [field]: num };
      if (field === 'actualNodes') {
        next.totalNodes = num;
      }
      return next;
    });
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
              Rework Required for Basic Information
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
              {reworkReason || 'The Project Manager or Auditor has flagged basic identification details for rework. Please update and save.'}
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
          Basic Information & Capacity verified and approved by Project Management.
        </div>
      )}

      {/* ── Section 1: Centre Identification & Category (FRD Sec. 6.1) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Building size={20} color="var(--color-primary, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            1. Centre Identification & Category (FRD Sec. 6.1)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="centreName">
              Centre Name (As per Document) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="centreName"
              type="text"
              className={`form-control ${validationErrors.centreName ? 'is-invalid' : ''}`}
              value={basicInfo.centreName || ''}
              onChange={(e) => handleChange('centreName', e.target.value)}
              placeholder="e.g. Cambridge Institute of Technology"
              disabled={isReadOnly}
              required
            />
            {validationErrors.centreName && (
              <span className="form-feedback" style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>
                {validationErrors.centreName}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="centreCategory">
              Centre Category <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <select
              id="centreCategory"
              className="form-control"
              value={basicInfo.centreCategory || 'College'}
              onChange={(e) => handleChange('centreCategory', e.target.value)}
              disabled={isReadOnly}
            >
              {CENTRE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {basicInfo.centreCategory === 'Other' && (
            <div className="form-group">
              <label className="form-label" htmlFor="customCentreCategory">
                Specify Centre Category <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              </label>
              <input
                id="customCentreCategory"
                type="text"
                className="form-control"
                value={basicInfo.customCentreCategory || ''}
                onChange={(e) => handleChange('customCentreCategory', e.target.value)}
                placeholder="Enter custom category"
                disabled={isReadOnly}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="organizationType">
              Centre Type / Legal Entity <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <select
              id="organizationType"
              className="form-control"
              value={basicInfo.organizationType || 'Trust/Society'}
              onChange={(e) => handleChange('organizationType', e.target.value)}
              disabled={isReadOnly}
            >
              {ORGANIZATION_TYPES.map((org) => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="regionId">
              Region (FRD 8 Zones) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <select
              id="regionId"
              className="form-control"
              value={basicInfo.regionId || 'NR'}
              onChange={(e) => handleChange('regionId', e.target.value)}
              disabled={isReadOnly}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{REGION_LABELS[r] || r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 2: Address & Geographic Location (FRD Sec. 6.1) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <MapPin size={20} color="var(--color-primary, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            2. Address & Communication Details (FRD Sec. 6.1)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="centreAddress">
              Complete Postal Address <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <textarea
              id="centreAddress"
              rows={2}
              className={`form-control ${validationErrors.centreAddress ? 'is-invalid' : ''}`}
              value={basicInfo.centreAddress || ''}
              onChange={(e) => handleChange('centreAddress', e.target.value)}
              placeholder="Plot No., Campus Road, Landmark, Area"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="stateName">
              State <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <select
              id="stateName"
              className="form-control"
              value={basicInfo.stateName || 'Delhi'}
              onChange={(e) => handleChange('stateName', e.target.value)}
              disabled={isReadOnly}
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cityName">
              City <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="cityName"
              type="text"
              className="form-control"
              value={basicInfo.cityName || ''}
              onChange={(e) => handleChange('cityName', e.target.value)}
              placeholder="e.g. New Delhi"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="district">
              District
            </label>
            <input
              id="district"
              type="text"
              className="form-control"
              value={basicInfo.district || ''}
              onChange={(e) => handleChange('district', e.target.value)}
              placeholder="e.g. Gautam Buddha Nagar"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="taluka">
              Taluka / Tehsil
            </label>
            <input
              id="taluka"
              type="text"
              className="form-control"
              value={basicInfo.taluka || ''}
              onChange={(e) => handleChange('taluka', e.target.value)}
              placeholder="e.g. Dadri"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pincode">
              Pin Code (6 Digits) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="pincode"
              type="text"
              maxLength={6}
              className={`form-control ${validationErrors.pincode ? 'is-invalid' : ''}`}
              value={basicInfo.pincode || ''}
              onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 201310"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="googleMapLink">
              Google Map Link
            </label>
            <input
              id="googleMapLink"
              type="url"
              className="form-control"
              value={basicInfo.googleMapLink || ''}
              onChange={(e) => handleChange('googleMapLink', e.target.value)}
              placeholder="https://maps.google.com/?q=..."
              disabled={isReadOnly}
            />
          </div>

          {/* Contact Fields per FRD Sec. 6.1 */}
          <div className="form-group">
            <label className="form-label" htmlFor="centreOfficialEmail">
              Centre Official Email <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="centreOfficialEmail"
              type="email"
              className="form-control"
              value={basicInfo.centreOfficialEmail || basicInfo.officialEmail || ''}
              onChange={(e) => {
                const val = e.target.value;
                handleChange('centreOfficialEmail', val);
                handleChange('officialEmail', val);
              }}
              placeholder="official@institution.edu.in"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="alternativeEmail">
              Centre Alternate Email ID
            </label>
            <input
              id="alternativeEmail"
              type="email"
              className="form-control"
              value={basicInfo.centreAlternateEmail || basicInfo.alternativeEmail || ''}
              onChange={(e) => {
                const val = e.target.value;
                handleChange('alternativeEmail', val);
                handleChange('centreAlternateEmail', val);
              }}
              placeholder="alternate@institution.edu.in"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="officialMobile">
              Centre Official Mobile Number <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="officialMobile"
              type="text"
              maxLength={10}
              className="form-control"
              value={basicInfo.centreOfficialMobile || basicInfo.officialMobile || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                handleChange('officialMobile', val);
                handleChange('centreOfficialMobile', val);
              }}
              placeholder="10-digit official mobile"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="whatsappMobile">
              Centre WhatsApp Mobile Number <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="whatsappMobile"
              type="text"
              maxLength={10}
              className="form-control"
              value={basicInfo.centreWhatsappMobile || basicInfo.whatsappMobile || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                handleChange('whatsappMobile', val);
                handleChange('centreWhatsappMobile', val);
              }}
              placeholder="10-digit WhatsApp number"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="alternateMobile">
              Centre Alternate Mobile Number
            </label>
            <input
              id="alternateMobile"
              type="text"
              maxLength={10}
              className="form-control"
              value={basicInfo.centreAlternateMobile || basicInfo.alternateMobile || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                handleChange('alternateMobile', val);
                handleChange('centreAlternateMobile', val);
              }}
              placeholder="10-digit alternate mobile"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="phoneStd">
              Centre Phone Number with STD Code
            </label>
            <input
              id="phoneStd"
              type="text"
              maxLength={15}
              className="form-control"
              value={basicInfo.phoneStd || basicInfo.landlineStd || ''}
              onChange={(e) => {
                const val = e.target.value;
                handleChange('phoneStd', val);
                handleChange('landlineStd', val);
              }}
              placeholder="e.g. 011-23456789"
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Node Capacity Summary (FRD Sec. 6.1) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Monitor size={20} color="var(--color-primary, #2563eb)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
              3. Computer Node Capacity (FRD Sec. 6.1)
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
              Actual Nodes vs Active Exam Nodes.
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="actualNodes">
              Actual Nodes (Total Functional) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="actualNodes"
              type="number"
              min={1}
              className="form-control"
              value={basicInfo.actualNodes ?? basicInfo.totalNodes ?? 100}
              onChange={(e) => handleCapacityChange('actualNodes', e.target.value)}
              disabled={isReadOnly}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Physical computer systems installed in centre labs.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="examNodes">
              Exam Nodes (For Candidates) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="examNodes"
              type="number"
              min={1}
              className={`form-control ${
                basicInfo.actualNodes && Number(basicInfo.examNodes || 0) > Number(basicInfo.actualNodes)
                  ? 'is-invalid'
                  : ''
              }`}
              value={basicInfo.examNodes ?? 80}
              onChange={(e) => handleCapacityChange('examNodes', e.target.value)}
              disabled={isReadOnly}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Systems allotted per shift for candidate testing (Must be ≤ Actual Nodes).
            </span>
            {basicInfo.actualNodes && Number(basicInfo.examNodes || 0) > Number(basicInfo.actualNodes) && (
              <span className="form-feedback" style={{ color: 'var(--color-danger, #dc2626)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                Exam Nodes cannot exceed Actual Nodes ({basicInfo.actualNodes}).
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 4: Previous Exam Conducted Track Record (FRD Sec. 6.1) ── */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
          4. Previous Exam Conducted? (FRD Sec. 6.1)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">
              Has this venue conducted any computer-based tests (CBT) previously?
            </label>
            <div style={{ display: 'flex', gap: 24, marginTop: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="prevExam"
                  checked={Boolean(basicInfo.previousExamConducted)}
                  onChange={() => handleChange('previousExamConducted', true)}
                  disabled={isReadOnly}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="prevExam"
                  checked={!basicInfo.previousExamConducted}
                  onChange={() => handleChange('previousExamConducted', false)}
                  disabled={isReadOnly}
                />
                No
              </label>
            </div>
          </div>

          {basicInfo.previousExamConducted && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="previousExamName">
                  Name of Exam
                </label>
                <input
                  id="previousExamName"
                  type="text"
                  className="form-control"
                  value={basicInfo.previousExamName || ''}
                  onChange={(e) => handleChange('previousExamName', e.target.value)}
                  placeholder="e.g. JEE Mains / IBPS PO"
                  disabled={isReadOnly}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="previousExamDate">
                  Date of Exam
                </label>
                <input
                  id="previousExamDate"
                  type="date"
                  className="form-control"
                  value={
                    basicInfo.previousExamDate
                      ? new Date(basicInfo.previousExamDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => handleChange('previousExamDate', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" htmlFor="previousEduExam">
                  Previous Exam Conducted Details
                </label>
                <textarea
                  id="previousEduExam"
                  rows={2}
                  className="form-control"
                  value={basicInfo.previousEduExam || ''}
                  onChange={(e) => handleChange('previousEduExam', e.target.value)}
                  placeholder="Clients, vendor details, peak concurrent nodes conducted..."
                  disabled={isReadOnly}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Section 5: Transportation & Accessibility (FRD Table 6.1.3) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Navigation size={20} color="var(--color-primary, #2563eb)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
              5. Transportation & Accessibility (FRD Table 6.1.3)
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
              Transit proximity to bus stands, railway stations, main roads, and directional signage.
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* 1. Distance from Nearby Local Bus Stand? (KM) - Mandatory */}
          <div className="form-group">
            <label className="form-label" htmlFor="busStandDistanceKm">
              Distance from Nearby Local Bus Stand? (KM) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                id="busStandDistanceKm"
                type="number"
                step="0.1"
                min={0}
                className="form-control"
                value={basicInfo.busStandDistanceKm ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('busStandDistanceKm', val === '' ? '' : Number(val));
                }}
                placeholder="e.g. 1.5"
                disabled={isReadOnly}
                required
              />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary, #64748b)', padding: '0 4px' }}>
                KM
              </span>
            </div>
          </div>

          {/* 2. Bus Stand Name - Conditional */}
          <div className="form-group">
            <label className="form-label" htmlFor="busStandName">
              Bus Stand Name {basicInfo.busStandDistanceKm !== '' && basicInfo.busStandDistanceKm !== undefined && (
                <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              )}
            </label>
            <input
              id="busStandName"
              type="text"
              className="form-control"
              value={basicInfo.busStandName || ''}
              onChange={(e) => handleChange('busStandName', e.target.value)}
              placeholder="e.g. Anand Vihar ISBT / Local Depot"
              disabled={isReadOnly}
            />
          </div>

          {/* 3. Distance from Nearby Railway Station? (KM) - Mandatory */}
          <div className="form-group">
            <label className="form-label" htmlFor="railwayStationDistanceKm">
              Distance from Nearby Railway Station? (KM) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                id="railwayStationDistanceKm"
                type="number"
                step="0.1"
                min={0}
                className="form-control"
                value={basicInfo.railwayStationDistanceKm ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('railwayStationDistanceKm', val === '' ? '' : Number(val));
                }}
                placeholder="e.g. 4.2"
                disabled={isReadOnly}
                required
              />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary, #64748b)', padding: '0 4px' }}>
                KM
              </span>
            </div>
          </div>

          {/* 4. Railway Station Name - Conditional */}
          <div className="form-group">
            <label className="form-label" htmlFor="railwayStationName">
              Railway Station Name {basicInfo.railwayStationDistanceKm !== '' && basicInfo.railwayStationDistanceKm !== undefined && (
                <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
              )}
            </label>
            <input
              id="railwayStationName"
              type="text"
              className="form-control"
              value={basicInfo.railwayStationName || ''}
              onChange={(e) => handleChange('railwayStationName', e.target.value)}
              placeholder="e.g. New Delhi Railway Station"
              disabled={isReadOnly}
            />
          </div>

          {/* 5. Centre Distance from Main Road (KM) - Mandatory */}
          <div className="form-group">
            <label className="form-label" htmlFor="mainRoadDistanceKm">
              Centre Distance from Main Road (KM) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                id="mainRoadDistanceKm"
                type="number"
                step="0.1"
                min={0}
                className="form-control"
                value={basicInfo.mainRoadDistanceKm ?? basicInfo.distanceFromMainRoad ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = val === '' ? '' : Number(val);
                  handleChange('mainRoadDistanceKm', num);
                  handleChange('distanceFromMainRoad', num);
                }}
                placeholder="e.g. 0.5"
                disabled={isReadOnly}
                required
              />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary, #64748b)', padding: '0 4px' }}>
                KM
              </span>
            </div>
          </div>

          {/* 6. Sign Boards Available to Approach Centre Easily? - Mandatory */}
          <div className="form-group">
            <label className="form-label">
              Sign Boards Available to Approach Centre Easily? <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="signBoardsAvailable"
                  checked={Boolean(basicInfo.signBoardsAvailable ?? basicInfo.signBoards ?? true)}
                  onChange={() => {
                    handleChange('signBoardsAvailable', true);
                    handleChange('signBoards', true);
                  }}
                  disabled={isReadOnly}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="signBoardsAvailable"
                  checked={!(basicInfo.signBoardsAvailable ?? basicInfo.signBoards ?? true)}
                  onChange={() => {
                    handleChange('signBoardsAvailable', false);
                    handleChange('signBoards', false);
                  }}
                  disabled={isReadOnly}
                />
                No
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 6: Accommodation & Food Facilities (FRD Sec. 6.1) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Utensils size={20} color="var(--color-primary, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            6. Accommodation & Food Facilities (FRD Sec. 6.1)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* Hotels Nearby */}
          <div className="form-group">
            <label className="form-label">Hotels Nearby?</label>
            <div style={{ display: 'flex', gap: 20, marginTop: 4, marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="hotelsNearby"
                  checked={Boolean(basicInfo.hotelsNearby)}
                  onChange={() => handleChange('hotelsNearby', true)}
                  disabled={isReadOnly}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="hotelsNearby"
                  checked={!basicInfo.hotelsNearby}
                  onChange={() => handleChange('hotelsNearby', false)}
                  disabled={isReadOnly}
                />
                No
              </label>
            </div>
            {basicInfo.hotelsNearby && (
              <input
                type="number"
                step="0.1"
                min={0}
                className="form-control"
                value={basicInfo.nearestHotelDistanceKm ?? ''}
                onChange={(e) => handleChange('nearestHotelDistanceKm', Number(e.target.value))}
                placeholder="Distance in km (e.g. 1.5)"
                disabled={isReadOnly}
              />
            )}
          </div>

          {/* Canteen within Campus */}
          <div className="form-group">
            <label className="form-label">Canteen Within Campus?</label>
            <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="canteenAvailable"
                  checked={Boolean(basicInfo.canteenAvailable ?? basicInfo.canteenArrangement)}
                  onChange={() => {
                    handleChange('canteenAvailable', true);
                    handleChange('canteenArrangement', true);
                  }}
                  disabled={isReadOnly}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="canteenAvailable"
                  checked={!(basicInfo.canteenAvailable ?? basicInfo.canteenArrangement)}
                  onChange={() => {
                    handleChange('canteenAvailable', false);
                    handleChange('canteenArrangement', false);
                  }}
                  disabled={isReadOnly}
                />
                No
              </label>
            </div>
          </div>

          {/* Canteen Food for Staff */}
          <div className="form-group">
            <label className="form-label">Canteen Food for Staff / Coordinators / Observers?</label>
            <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="canteenFoodForStaff"
                  checked={Boolean(basicInfo.canteenFoodForStaff)}
                  onChange={() => handleChange('canteenFoodForStaff', true)}
                  disabled={isReadOnly}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="canteenFoodForStaff"
                  checked={!basicInfo.canteenFoodForStaff}
                  onChange={() => handleChange('canteenFoodForStaff', false)}
                  disabled={isReadOnly}
                />
                No
              </label>
            </div>
          </div>

          {/* Food for Testing Days */}
          <div className="form-group">
            <label className="form-label">Food for Testing Days?</label>
            <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="foodForTestingDays"
                  checked={Boolean(basicInfo.foodForTestingDays)}
                  onChange={() => handleChange('foodForTestingDays', true)}
                  disabled={isReadOnly}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="foodForTestingDays"
                  checked={!basicInfo.foodForTestingDays}
                  onChange={() => handleChange('foodForTestingDays', false)}
                  disabled={isReadOnly}
                />
                No
              </label>
            </div>
          </div>

          {/* Food for Mock Days */}
          <div className="form-group">
            <label className="form-label">Food for Mock Days?</label>
            <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="foodForMockDays"
                  checked={Boolean(basicInfo.foodForMockDays)}
                  onChange={() => handleChange('foodForMockDays', true)}
                  disabled={isReadOnly}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="foodForMockDays"
                  checked={!basicInfo.foodForMockDays}
                  onChange={() => handleChange('foodForMockDays', false)}
                  disabled={isReadOnly}
                />
                No
              </label>
            </div>
          </div>

          {/* Outside Food Possible */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Outside Food Possible?</label>
            <div style={{ display: 'flex', gap: 20, marginTop: 4, marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="outsideFoodPossible"
                  checked={Boolean(basicInfo.outsideFoodPossible)}
                  onChange={() => handleChange('outsideFoodPossible', true)}
                  disabled={isReadOnly}
                />
                Yes, Outside Packed Catering Allowed
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="outsideFoodPossible"
                  checked={!basicInfo.outsideFoodPossible}
                  onChange={() => handleChange('outsideFoodPossible', false)}
                  disabled={isReadOnly}
                />
                No
              </label>
            </div>
            {basicInfo.outsideFoodPossible && (
              <textarea
                rows={2}
                className="form-control"
                value={basicInfo.outsideFoodDetails || ''}
                onChange={(e) => handleChange('outsideFoodDetails', e.target.value)}
                placeholder="Details of food arrangements, preferred vendors, dining halls..."
                disabled={isReadOnly}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Submodule1BasicInfo;
