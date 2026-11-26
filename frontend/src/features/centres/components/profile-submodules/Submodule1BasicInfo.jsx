import React from 'react';
import { AlertCircle, CheckCircle2, Building, MapPin, Monitor, Navigation, Utensils } from 'lucide-react';
import { INDIAN_STATES, CENTRE_CATEGORIES, ORGANIZATION_TYPES, REGIONS } from './constants';

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
      // Auto-compute buffer nodes if actual & exam are present
      if (field === 'actualNodes' || field === 'examNodes') {
        const actual = field === 'actualNodes' ? num : (prev.actualNodes || 0);
        const exam = field === 'examNodes' ? num : (prev.examNodes || 0);
        next.bufferNodes = Math.max(0, actual - exam);
        next.totalNodes = actual;
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

      {/* ── Section 1: Centre Identification & Category ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Building size={20} color="var(--color-primary, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            1. Centre Identification & Organization Type
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="centreName">
              Centre Name (As per Legal Document) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
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
              value={basicInfo.centreCategory || 'Engineering College'}
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
                Specify Other Category <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
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
              Organization Legal Structure <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <select
              id="organizationType"
              className="form-control"
              value={basicInfo.organizationType || 'Trust'}
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
              Geographic Region <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <select
              id="regionId"
              className="form-control"
              value={basicInfo.regionId || 'North'}
              onChange={(e) => handleChange('regionId', e.target.value)}
              disabled={isReadOnly}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="venueStatus">
              Venue Classification
            </label>
            <select
              id="venueStatus"
              className="form-control"
              value={basicInfo.venueStatus || 'COMMERCIAL'}
              onChange={(e) => handleChange('venueStatus', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="COMMERCIAL">Commercial Venue</option>
              <option value="INSTITUTIONAL">Institutional / Academic Campus</option>
              <option value="GOVERNMENT">Government Premises</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="eduCode">
              EDU Code (if allotted)
            </label>
            <input
              id="eduCode"
              type="text"
              className="form-control"
              value={basicInfo.eduCode || ''}
              onChange={(e) => handleChange('eduCode', e.target.value)}
              placeholder="e.g. EDU-10492"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tcCode">
              Test Centre (TC) Code
            </label>
            <input
              id="tcCode"
              type="text"
              className="form-control"
              value={basicInfo.tcCode || ''}
              onChange={(e) => handleChange('tcCode', e.target.value)}
              placeholder="e.g. TC-8921"
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Address & Geographic Location ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <MapPin size={20} color="var(--color-primary, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            2. Address & Communication Details
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
              placeholder="Plot No., Street, Landmark, Area"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="stateName">
              State / UT <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
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
              placeholder="e.g. North West Delhi"
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
              placeholder="e.g. Rohini"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pincode">
              PIN Code (6 Digits) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="pincode"
              type="text"
              maxLength={6}
              className={`form-control ${validationErrors.pincode ? 'is-invalid' : ''}`}
              value={basicInfo.pincode || ''}
              onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 110085"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="googleMapLink">
              Google Maps Location Link
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

          <div className="form-group">
            <label className="form-label" htmlFor="officialEmail">
              Official Email Address <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="officialEmail"
              type="email"
              className="form-control"
              value={basicInfo.officialEmail || ''}
              onChange={(e) => handleChange('officialEmail', e.target.value)}
              placeholder="centre@institution.ac.in"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="officialMobile">
              Official Contact Mobile (10 Digits) <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="officialMobile"
              type="text"
              maxLength={10}
              className="form-control"
              value={basicInfo.officialMobile || ''}
              onChange={(e) => handleChange('officialMobile', e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit primary mobile"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="alternateMobile">
              Alternate Mobile / Landline
            </label>
            <input
              id="alternateMobile"
              type="text"
              maxLength={12}
              className="form-control"
              value={basicInfo.alternateMobile || ''}
              onChange={(e) => handleChange('alternateMobile', e.target.value)}
              placeholder="Alternate contact number"
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Node Capacity Summary ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Monitor size={20} color="var(--color-primary, #2563eb)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
              3. Computer Node Capacity
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
              Summary capacity across all examination labs.
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="actualNodes">
              Total Actual Physical Nodes <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
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
              Total functional PCs in the venue.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="examNodes">
              Active Exam Node Capacity <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
            </label>
            <input
              id="examNodes"
              type="number"
              min={1}
              className="form-control"
              value={basicInfo.examNodes ?? 80}
              onChange={(e) => handleCapacityChange('examNodes', e.target.value)}
              disabled={isReadOnly}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Nodes committed for candidates per shift.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bufferNodes">
              Mandatory Buffer Nodes
            </label>
            <input
              id="bufferNodes"
              type="number"
              min={0}
              className="form-control"
              value={basicInfo.bufferNodes ?? 20}
              onChange={(e) => handleCapacityChange('bufferNodes', e.target.value)}
              disabled={isReadOnly}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Reserve hot-standby nodes (min 15-20%).
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 4: Exam History & Experience ── */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
          4. Previous Examination Track Record
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">
              Has this venue conducted computer-based tests (CBT) previously?
            </label>
            <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
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
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="previousEduExam">
                Details of Previous Exams Conducted (Clients, Year, Max Nodes)
              </label>
              <textarea
                id="previousEduExam"
                rows={2}
                className="form-control"
                value={basicInfo.previousEduExam || ''}
                onChange={(e) => handleChange('previousEduExam', e.target.value)}
                placeholder="e.g. NTA JEE Mains (2024, 250 nodes), TCS iON banking tests (2023)"
                disabled={isReadOnly}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Section 5: Transport, Accessibility & Food ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Navigation size={20} color="var(--color-primary, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            5. Transport Accessibility & Canteen Facilities
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="busStandDistanceKm">
              Distance from Nearest Bus Stand (km)
            </label>
            <input
              id="busStandDistanceKm"
              type="number"
              step="0.1"
              min={0}
              className="form-control"
              value={basicInfo.busStandDistanceKm ?? basicInfo.distanceFromBusStand ?? ''}
              onChange={(e) => handleChange('busStandDistanceKm', e.target.value)}
              placeholder="e.g. 1.5"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="metroStationDistanceKm">
              Distance from Metro / Railway Station (km)
            </label>
            <input
              id="metroStationDistanceKm"
              type="number"
              step="0.1"
              min={0}
              className="form-control"
              value={basicInfo.metroStationDistanceKm ?? basicInfo.distanceFromRailway ?? ''}
              onChange={(e) => handleChange('metroStationDistanceKm', e.target.value)}
              placeholder="e.g. 3.0"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="distanceFromMainRoad">
              Distance from Main Arterial Road (km)
            </label>
            <input
              id="distanceFromMainRoad"
              type="number"
              step="0.1"
              min={0}
              className="form-control"
              value={basicInfo.distanceFromMainRoad ?? 0.5}
              onChange={(e) => handleChange('distanceFromMainRoad', e.target.value)}
              placeholder="e.g. 0.2"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Utensils size={16} color="var(--color-primary)" />
              <label className="form-label" style={{ margin: 0 }}>
                Nearby Canteen / Food Arrangement Available for Candidates & Staff?
              </label>
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="canteenArrangement"
                  checked={Boolean(basicInfo.canteenArrangement ?? basicInfo.canteenAvailable)}
                  onChange={() => handleChange('canteenArrangement', true)}
                  disabled={isReadOnly}
                />
                Yes, On-Campus / Adjacent Canteen Available
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="canteenArrangement"
                  checked={!(basicInfo.canteenArrangement ?? basicInfo.canteenAvailable)}
                  onChange={() => handleChange('canteenArrangement', false)}
                  disabled={isReadOnly}
                />
                No (Nearby commercial shops only)
              </label>
            </div>
            <input
              type="text"
              className="form-control"
              value={basicInfo.canteenRemarks || ''}
              onChange={(e) => handleChange('canteenRemarks', e.target.value)}
              placeholder="Canteen capacity, operating hours, drinking water points..."
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Submodule1BasicInfo;
