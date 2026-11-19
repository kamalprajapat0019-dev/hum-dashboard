import React from 'react';

export function Step6Safety({ safety, setSafety, isReadOnly }) {
  return (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
            Step 6 — Fire Safety, Emergency & Hygiene Standards
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label className="form-label">No. of Fire Extinguishers Installed</label>
              <input
                type="number"
                min={0}
                className="form-control"
                value={safety.noOfFireExtinguishers}
                onChange={(e) => setSafety({ ...safety, noOfFireExtinguishers: Number(e.target.value) })}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="form-label">Fire Safety Clearance Date</label>
              <input
                type="date"
                className="form-control"
                value={safety.fireSafetyClearanceDate}
                onChange={(e) => setSafety({ ...safety, fireSafetyClearanceDate: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="form-label">Extinguisher Refill Date</label>
              <input
                type="date"
                className="form-control"
                value={safety.fireExtinguisherRefillDate}
                onChange={(e) => setSafety({ ...safety, fireExtinguisherRefillDate: e.target.value })}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600 }}>Emergency & Risk Safeguards</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {[
                { key: 'firstAidKit', label: 'First Aid Medical Kit Available on Campus?' },
                { key: 'fireExtinguisherEachFloor', label: 'Fire Extinguishers Installed on Every Exam Floor?' },
                { key: 'fireEmergencyAccessible', label: 'Clear & Unobstructed Fire Emergency Evacuation Paths?' },
                { key: 'assemblyArea', label: 'Designated Open Assembly Area in Case of Fire/Emergency?' },
                { key: 'safetySignage', label: 'Emergency Exit & Evacuation Signage Installed?' },
                { key: 'adequateHygiene', label: 'Sanitation & Hygiene Standards Regularly Maintained?' },
                { key: 'insuranceCoverage', label: 'Third-Party Asset Loss & Risk Accident Insurance Cover?' },
              ].map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem' }}>{item.label}</span>
                  <select
                    style={{ width: 80, height: 30, padding: '2px 8px', fontSize: '0.8125rem' }}
                    className="form-control"
                    value={safety[item.key] ? 'Yes' : 'No'}
                    onChange={(e) => setSafety({ ...safety, [item.key]: e.target.value === 'Yes' })}
                    disabled={isReadOnly}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
  );
}
