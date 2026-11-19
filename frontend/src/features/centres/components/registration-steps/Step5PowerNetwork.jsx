import React from 'react';

export function Step5PowerNetwork({ powerNetwork, setPowerNetwork, isReadOnly }) {
  return (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
            Step 5 — Power Resilience & Network Infrastructure
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Online UPS Backup</h4>
              <div>
                <label className="form-label">Online UPS Available?</label>
                <select
                  className="form-control"
                  value={powerNetwork.upsAvailable ? 'Yes' : 'No'}
                  onChange={(e) => setPowerNetwork({ ...powerNetwork, upsAvailable: e.target.value === 'Yes' })}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {powerNetwork.upsAvailable && (
                <div style={{ marginTop: 12 }}>
                  <label className="form-label">UPS Capacity (KVA) *</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={powerNetwork.upsCapacityKva}
                    onChange={(e) => setPowerNetwork({ ...powerNetwork, upsCapacityKva: Number(e.target.value) })}
                    disabled={isReadOnly}
                    required
                  />
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Diesel Generator (GENSET)</h4>
              <div>
                <label className="form-label">GENSET Available?</label>
                <select
                  className="form-control"
                  value={powerNetwork.gensetAvailable ? 'Yes' : 'No'}
                  onChange={(e) => setPowerNetwork({ ...powerNetwork, gensetAvailable: e.target.value === 'Yes' })}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {powerNetwork.gensetAvailable && (
                <div style={{ marginTop: 12 }}>
                  <label className="form-label">GENSET Capacity (KVA) *</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={powerNetwork.gensetCapacityKva}
                    onChange={(e) => setPowerNetwork({ ...powerNetwork, gensetCapacityKva: Number(e.target.value) })}
                    disabled={isReadOnly}
                    required
                  />
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Network & Internet Infrastructure</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label className="form-label">Core Switch</label>
                  <select
                    className="form-control"
                    value={powerNetwork.coreSwitch1Gbps ? 'Yes' : 'No'}
                    onChange={(e) => setPowerNetwork({ ...powerNetwork, coreSwitch1Gbps: e.target.value === 'Yes' })}
                    disabled={isReadOnly}
                  >
                    <option value="Yes">1 Gbps Core Switch Available</option>
                    <option value="No">Standard 100 Mbps Switch</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">LAN Architecture</label>
                  <select
                    className="form-control"
                    value={powerNetwork.lanType}
                    onChange={(e) => setPowerNetwork({ ...powerNetwork, lanType: e.target.value })}
                    disabled={isReadOnly}
                  >
                    <option value="Single LAN">Single Unified LAN</option>
                    <option value="Multiple LAN">Multiple Segmented LANs</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}
