import React from 'react';
import { Save } from 'lucide-react';

export function BasicTab({
  centre,
  capacity,
  inf,
  isEditing,
  setIsEditing,
  editForm,
  setEditForm,
  handleSaveEdit,
  savingEdit,
}) {
  return (
    <>
      {/* 1. Basic Information Tab - Edit Mode */}
      {isEditing && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e40af' }}>
              Edit Centre Information (Authorized Admin / Operations)
            </h4>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setIsEditing(false)}
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Save size={14} /> {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Centre Name (As per Document)</label>
              <input
                type="text"
                className="form-control"
                value={editForm.centreName}
                onChange={(e) => setEditForm({ ...editForm, centreName: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Centre Category</label>
              <select
                className="form-control"
                value={editForm.centreCategory}
                onChange={(e) => setEditForm({ ...editForm, centreCategory: e.target.value })}
              >
                {['College', 'School', 'University', 'Government Institution', 'Private Educational Institution', 'Dedicated Examination Centre', 'Other'].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Organization Type</label>
              <select
                className="form-control"
                value={editForm.organizationType}
                onChange={(e) => setEditForm({ ...editForm, organizationType: e.target.value })}
              >
                {['Trust', 'Society', 'Partnership', 'Company', 'Individual', 'Other'].map((org) => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>State</label>
              <input
                type="text"
                className="form-control"
                value={editForm.stateName}
                onChange={(e) => setEditForm({ ...editForm, stateName: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>City</label>
              <input
                type="text"
                className="form-control"
                value={editForm.cityName}
                onChange={(e) => setEditForm({ ...editForm, cityName: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>PIN Code</label>
              <input
                type="text"
                className="form-control"
                value={editForm.pincode}
                maxLength={6}
                onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Full Centre Address</label>
              <textarea
                className="form-control"
                rows={2}
                value={editForm.centreAddress}
                onChange={(e) => setEditForm({ ...editForm, centreAddress: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* 1. Basic Information Tab - View Mode */}
      {!isEditing && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
              Venue Identification & Location
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
              <div><span style={{ color: '#64748b' }}>Category:</span> <strong>{centre.centreCategory || 'Educational Institution'}</strong></div>
              <div><span style={{ color: '#64748b' }}>Region:</span> <strong>{centre.regionId || 'North'}</strong></div>
              <div><span style={{ color: '#64748b' }}>Full Address:</span> <div>{centre.centreAddress}</div></div>
              <div><span style={{ color: '#64748b' }}>Jurisdiction:</span> <strong>{centre.cityName}, {centre.stateName} (PIN: {centre.pincode})</strong></div>
              {centre.taluka && <div><span style={{ color: '#64748b' }}>Taluka:</span> <strong>{centre.taluka}</strong></div>}
              <div><span style={{ color: '#64748b' }}>Edu Code:</span> {centre.eduCode || '—'}</div>
              <div><span style={{ color: '#64748b' }}>TC Code:</span> {centre.tcCode || '—'}</div>
              <div><span style={{ color: '#64748b' }}>Venue Classification:</span> {centre.venueStatus}</div>
              <div><span style={{ color: '#64748b' }}>Organization Entity:</span> {centre.organizationType}</div>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
              Capacity & Prior Experience
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
              <div><span style={{ color: '#64748b' }}>Declared Total Nodes:</span> <strong style={{ fontSize: '1.05rem', color: '#1e40af' }}>{capacity.examNodes || centre.totalNodes || 0} nodes</strong></div>
              <div><span style={{ color: '#64748b' }}>Buffer Percentage:</span> {capacity.bufferPercent || 10}%</div>
              <div><span style={{ color: '#64748b' }}>Registration Desks:</span> {capacity.regDeskCount || 2}</div>
              <div><span style={{ color: '#64748b' }}>Server Units:</span> {capacity.serverCount || 1}</div>
              <div><span style={{ color: '#64748b' }}>Previous CBT Exam Conducted?</span> <strong>{centre.previousExamConducted ? 'Yes' : 'No'}</strong></div>
              {centre.previousEduExam && (
                <div><span style={{ color: '#64748b' }}>Prior Exam Details:</span> <div>{centre.previousEduExam}</div></div>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
              Official Contact & Transit
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
              <div><span style={{ color: '#64748b' }}>Official Email:</span> {centre.officialEmail || '—'}</div>
              <div><span style={{ color: '#64748b' }}>Official Mobile:</span> {centre.officialMobile || '—'}</div>
              <div><span style={{ color: '#64748b' }}>Alternate Mobile:</span> {centre.alternateMobile || '—'}</div>
              <div><span style={{ color: '#64748b' }}>Landline with STD:</span> {centre.phoneStd || '—'}</div>
              <div><span style={{ color: '#64748b' }}>Nearby Bus Stand:</span> {inf.busStandNearby ? `Yes (${inf.busStandName || 'Nearby'})` : 'No'}</div>
              <div><span style={{ color: '#64748b' }}>Nearby Metro Station:</span> {inf.metroNearby ? `Yes (${inf.metroStationName || 'Nearby'})` : 'No'}</div>
              <div><span style={{ color: '#64748b' }}>Distance from Highway:</span> {inf.distanceFromMainRoad !== null ? `${inf.distanceFromMainRoad} km` : '—'}</div>
              <div><span style={{ color: '#64748b' }}>PH Friendly Centre:</span> {inf.phFriendly ? `Yes (${inf.phCandidateCount || 0} candidates)` : 'No'}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
