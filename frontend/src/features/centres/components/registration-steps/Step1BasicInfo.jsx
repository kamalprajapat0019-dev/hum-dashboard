import React from 'react';
import { INDIAN_STATES, CENTRE_CATEGORIES } from './constants';

export function Step1BasicInfo({ basicInfo, setBasicInfo, isReadOnly }) {
  return (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
            Step 1 — Centre Basic Identification & Location
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Centre Name (As per Document) *</label>
              <input
                type="text"
                className="form-control"
                value={basicInfo.centreName}
                onChange={(e) => setBasicInfo({ ...basicInfo, centreName: e.target.value })}
                placeholder="Enter registered centre name"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Centre Category *</label>
              <select
                className="form-control"
                value={basicInfo.centreCategory}
                onChange={(e) => setBasicInfo({ ...basicInfo, centreCategory: e.target.value })}
                disabled={isReadOnly}
              >
                {CENTRE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Region *</label>
              <select
                className="form-control"
                value={basicInfo.regionId}
                onChange={(e) => setBasicInfo({ ...basicInfo, regionId: e.target.value })}
                disabled={isReadOnly}
              >
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="Central">Central</option>
                <option value="North-East">North-East</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Centre Address *</label>
              <textarea
                className="form-control"
                rows={2}
                value={basicInfo.centreAddress}
                onChange={(e) => setBasicInfo({ ...basicInfo, centreAddress: e.target.value })}
                placeholder="Complete postal address of the examination venue"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">State *</label>
              <select
                className="form-control"
                value={basicInfo.stateName}
                onChange={(e) => setBasicInfo({ ...basicInfo, stateName: e.target.value })}
                disabled={isReadOnly}
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                className="form-control"
                value={basicInfo.cityName}
                onChange={(e) => setBasicInfo({ ...basicInfo, cityName: e.target.value })}
                placeholder="e.g. Mumbai, New Delhi, Pune"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Taluka (Optional)</label>
              <input
                type="text"
                className="form-control"
                value={basicInfo.taluka}
                onChange={(e) => setBasicInfo({ ...basicInfo, taluka: e.target.value })}
                placeholder="Tehsil / Taluka"
                disabled={isReadOnly}
              />
            </div>

            <div className="form-group">
              <label className="form-label">PIN Code (6 digits) *</label>
              <input
                type="text"
                className="form-control"
                maxLength={6}
                value={basicInfo.pincode}
                onChange={(e) => setBasicInfo({ ...basicInfo, pincode: e.target.value.replace(/\D/g, '') })}
                placeholder="e.g. 110085"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Exam Nodes (Capacity) *</label>
              <input
                type="number"
                className="form-control"
                min={1}
                value={basicInfo.totalNodes}
                onChange={(e) => setBasicInfo({ ...basicInfo, totalNodes: Number(e.target.value) })}
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Edu Code (Optional)</label>
              <input
                type="text"
                className="form-control"
                value={basicInfo.eduCode}
                onChange={(e) => setBasicInfo({ ...basicInfo, eduCode: e.target.value })}
                placeholder="e.g. EDU-104"
                disabled={isReadOnly}
              />
            </div>

            <div className="form-group">
              <label className="form-label">TC Code (Optional)</label>
              <input
                type="text"
                className="form-control"
                value={basicInfo.tcCode}
                onChange={(e) => setBasicInfo({ ...basicInfo, tcCode: e.target.value })}
                placeholder="e.g. TC-990"
                disabled={isReadOnly}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Organization Type *</label>
              <select
                className="form-control"
                value={basicInfo.organizationType}
                onChange={(e) => setBasicInfo({ ...basicInfo, organizationType: e.target.value })}
                disabled={isReadOnly}
              >
                <option value="Trust">Trust</option>
                <option value="Society">Society</option>
                <option value="Partnership">Partnership</option>
                <option value="Company">Company / Pvt Ltd</option>
                <option value="Individual">Individual Proprietor</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Conditional Previous Examination */}
          <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="checkbox"
                id="prevExam"
                checked={basicInfo.previousExamConducted}
                onChange={(e) => setBasicInfo({ ...basicInfo, previousExamConducted: e.target.checked })}
                disabled={isReadOnly}
              />
              <label htmlFor="prevExam" style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                Has this centre conducted major computer-based examinations previously?
              </label>
            </div>

            {basicInfo.previousExamConducted && (
              <div style={{ marginTop: 12 }}>
                <label className="form-label">Previous Exam Details *</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={basicInfo.previousEduExam}
                  onChange={(e) => setBasicInfo({ ...basicInfo, previousEduExam: e.target.value })}
                  placeholder="e.g. NEET UG 2024, JEE Main 2025, IBPS RRB"
                  disabled={isReadOnly}
                  required
                />
              </div>
            )}
          </div>

          {/* Transit & Accessibility (Section 2.4 & 2.5) */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Transit & Physical Accessibility</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <label className="form-label">Local Bus Stand Nearby?</label>
                <select
                  className="form-control"
                  value={basicInfo.busStandNearby ? 'Yes' : 'No'}
                  onChange={(e) => setBasicInfo({ ...basicInfo, busStandNearby: e.target.value === 'Yes' })}
                  disabled={isReadOnly}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {basicInfo.busStandNearby && (
                <div>
                  <label className="form-label">Bus Stand Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={basicInfo.busStandName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, busStandName: e.target.value })}
                    placeholder="e.g. Rohini Sector 8 Bus Stand"
                    disabled={isReadOnly}
                  />
                </div>
              )}

              <div>
                <label className="form-label">Metro Station Nearby?</label>
                <select
                  className="form-control"
                  value={basicInfo.metroNearby ? 'Yes' : 'No'}
                  onChange={(e) => setBasicInfo({ ...basicInfo, metroNearby: e.target.value === 'Yes' })}
                  disabled={isReadOnly}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {basicInfo.metroNearby && (
                <div>
                  <label className="form-label">Metro Station Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={basicInfo.metroStationName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, metroStationName: e.target.value })}
                    placeholder="e.g. Rohini West Metro Station"
                    disabled={isReadOnly}
                  />
                </div>
              )}

              <div>
                <label className="form-label">Distance from Highway / Main Road (KM)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="form-control"
                  value={basicInfo.distanceFromMainRoad}
                  onChange={(e) => setBasicInfo({ ...basicInfo, distanceFromMainRoad: Number(e.target.value) })}
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="form-label">PH (PwD) Friendly Centre?</label>
                <select
                  className="form-control"
                  value={basicInfo.phFriendly ? 'Yes' : 'No'}
                  onChange={(e) => setBasicInfo({ ...basicInfo, phFriendly: e.target.value === 'Yes' })}
                  disabled={isReadOnly}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {basicInfo.phFriendly && (
                <div>
                  <label className="form-label">Dedicated PwD Capacity Count</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={basicInfo.phCandidateCount}
                    onChange={(e) => setBasicInfo({ ...basicInfo, phCandidateCount: Number(e.target.value) })}
                    disabled={isReadOnly}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
  );
}
