import React from 'react';
import { AlertCircle, CheckCircle2, Zap, Wifi, ShieldAlert, Cpu, Wrench } from 'lucide-react';
import { LAN_TYPES } from './constants';

export function Submodule5PowerNetwork({
  powerNetwork = {},
  setPowerNetwork,
  isReadOnly = false,
  reviewStatus = 'NOT_STARTED',
  reworkReason = '',
}) {
  const isRework = reviewStatus === 'REWORK_REQUIRED';
  const isVerified = reviewStatus === 'VERIFIED';

  const handleChange = (field, value) => {
    setPowerNetwork((prev) => ({
      ...prev,
      [field]: value,
    }));
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

      {/* ── Section 1: Power Backup & Generators ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Zap size={20} color="var(--color-primary, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            1. Power Resilience & Dual Backup (UPS & Generators)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* Online UPS Block */}
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700 }}>
              Primary Online UPS Backup
            </h4>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Online UPS Available?</label>
              <select
                className="form-control"
                value={powerNetwork.upsAvailable ? 'Yes' : 'No'}
                onChange={(e) => handleChange('upsAvailable', e.target.value === 'Yes')}
                disabled={isReadOnly}
              >
                <option value="Yes">Yes, Online Dedicated UPS</option>
                <option value="No">No</option>
              </select>
            </div>

            {powerNetwork.upsAvailable && (
              <>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">UPS Capacity (KVA) *</label>
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

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Backup Duration on Full Load (Minutes) *</label>
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
              </>
            )}
          </div>

          {/* Primary DG Set Block */}
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700 }}>
              Primary Diesel Generator (DG Set 1)
            </h4>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Generator Available?</label>
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
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Generator Capacity (KVA) *</label>
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

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Auto Switchover (AMF Panel) Active?</label>
                  <select
                    className="form-control"
                    value={powerNetwork.autoSwitchover ? 'Yes' : 'No'}
                    onChange={(e) => handleChange('autoSwitchover', e.target.value === 'Yes')}
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
                    <option value="Yes">Yes, min 8 hours fuel storage</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Backup DG & Electrician Block */}
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700 }}>
              Secondary DG Set & SLA Support
            </h4>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Secondary Backup Generator Available?</label>
              <select
                className="form-control"
                value={powerNetwork.backupGeneratorAvailable ? 'Yes' : 'No'}
                onChange={(e) => handleChange('backupGeneratorAvailable', e.target.value === 'Yes')}
                disabled={isReadOnly}
              >
                <option value="Yes">Yes, Secondary Standby DG</option>
                <option value="No">No</option>
              </select>
            </div>

            {powerNetwork.backupGeneratorAvailable && (
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Secondary DG Capacity (KVA)</label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  value={powerNetwork.backupGeneratorCapacityKva ?? 30}
                  onChange={(e) => handleChange('backupGeneratorCapacityKva', Number(e.target.value))}
                  disabled={isReadOnly}
                  placeholder="e.g. 30"
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Dedicated Electrician SLA on Exam Day?</label>
              <select
                className="form-control"
                value={powerNetwork.electricianSlaAvailable ? 'Yes' : 'No'}
                onChange={(e) => handleChange('electricianSlaAvailable', e.target.value === 'Yes')}
                disabled={isReadOnly}
              >
                <option value="Yes">Yes, Certified SLA on-site</option>
                <option value="No">No</option>
              </select>
            </div>

            {powerNetwork.electricianSlaAvailable && (
              <div className="form-group">
                <label className="form-label">Electrician / SLA Vendor Details</label>
                <input
                  type="text"
                  className="form-control"
                  value={powerNetwork.electricianSlaDetails || ''}
                  onChange={(e) => handleChange('electricianSlaDetails', e.target.value)}
                  placeholder="Vendor name / Technician mobile"
                  disabled={isReadOnly}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Internet, LAN & Network Infrastructure ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Wifi size={20} color="var(--color-primary, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            2. Dual High-Speed Internet & Structured LAN Network
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Dedicated Leased Line / Fiber?</label>
            <select
              className="form-control"
              value={powerNetwork.dedicatedInternetLine ? 'Yes' : 'No'}
              onChange={(e) => handleChange('dedicatedInternetLine', e.target.value === 'Yes')}
              disabled={isReadOnly}
            >
              <option value="Yes">Yes, Dedicated Optical Fiber Leased Line</option>
              <option value="No">Broadband / Shared Connection</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Primary ISP Name *</label>
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
            <label className="form-label">Primary Bandwidth (Mbps) *</label>
            <input
              type="number"
              min={10}
              className="form-control"
              value={powerNetwork.primaryBandwidthMbps ?? 100}
              onChange={(e) => handleChange('primaryBandwidthMbps', Number(e.target.value))}
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Secondary ISP Available? (Failover)</label>
            <select
              className="form-control"
              value={powerNetwork.secondaryIspAvailable ? 'Yes' : 'No'}
              onChange={(e) => handleChange('secondaryIspAvailable', e.target.value === 'Yes')}
              disabled={isReadOnly}
            >
              <option value="Yes">Yes, Redundant Secondary ISP</option>
              <option value="No">No</option>
            </select>
          </div>

          {powerNetwork.secondaryIspAvailable && (
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
                  value={powerNetwork.secondaryBandwidthMbps ?? 50}
                  onChange={(e) => handleChange('secondaryBandwidthMbps', Number(e.target.value))}
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
              value={powerNetwork.lanType || 'Single Unified LAN'}
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
              value={powerNetwork.wirelessDonglesCount ?? 2}
              onChange={(e) => handleChange('wirelessDonglesCount', Number(e.target.value))}
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

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Onsite Spare Hardware Inventory</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
              {[
                { key: 'spareMonitors', label: 'Spare Monitors (min 5)' },
                { key: 'spareKeyboardsMice', label: 'Spare Keyboards & Mice (min 15 pairs)' },
                { key: 'sparePatchCables', label: 'Spare Cat6 RJ45 Patch Cables' },
                { key: 'spareSmpsRam', label: 'Spare SMPS Power Supplies & RAM Sticks' },
              ].map((sp) => (
                <label
                  key={sp.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md, 6px)',
                    background: 'var(--bg-subtle, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    cursor: isReadOnly ? 'default' : 'pointer',
                    fontSize: '0.8125rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(powerNetwork[sp.key])}
                    onChange={(e) => handleChange(sp.key, e.target.checked)}
                    disabled={isReadOnly}
                  />
                  {sp.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Submodule5PowerNetwork;
