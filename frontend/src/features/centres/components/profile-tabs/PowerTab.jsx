import React from 'react';

export function PowerTab({ inf, capacity }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
      <div className="card" style={{ padding: 16 }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
          Power Backup Resilience
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
          <div><span style={{ color: '#64748b' }}>Online UPS Available?</span> <strong>{inf.upsAvailable ? 'Yes' : 'No'}</strong></div>
          {inf.upsAvailable && <div><span style={{ color: '#64748b' }}>UPS Capacity:</span> <strong>{inf.upsCapacityKva || capacity.upsCapacityKva || 0} kVA</strong></div>}
          {inf.upsAvailable && <div><span style={{ color: '#64748b' }}>UPS Backup Time:</span> {inf.upsBackupDurationMins || 60} mins</div>}
          <div><span style={{ color: '#64748b' }}>Generator (DG Set) Present?</span> <strong>{inf.generatorAvailable ? 'Yes' : 'No'}</strong></div>
          {inf.generatorAvailable && <div><span style={{ color: '#64748b' }}>DG Set Capacity:</span> <strong>{inf.generatorCapacityKva || 0} kVA</strong></div>}
          {inf.generatorAvailable && <div><span style={{ color: '#64748b' }}>DG Fuel Backup:</span> {inf.dgFuelArrangement ? 'Arranged' : 'Standard'}</div>}
          <div><span style={{ color: '#64748b' }}>Auto Power Switchover:</span> {inf.autoSwitchover ? 'Automatic (AMF Panel)' : 'Manual'}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
          Network & Internet Topology
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
          <div><span style={{ color: '#64748b' }}>Dedicated Internet Line:</span> <strong>{inf.dedicatedInternetLine ? 'Yes' : 'Shared'}</strong></div>
          <div><span style={{ color: '#64748b' }}>Primary ISP:</span> {inf.primaryIspName || 'Not specified'}</div>
          <div><span style={{ color: '#64748b' }}>Primary Speed:</span> <strong>{inf.primaryBandwidthMbps || capacity.networkSpeedMbps || 100} Mbps</strong></div>
          <div><span style={{ color: '#64748b' }}>Secondary ISP Line:</span> {inf.secondaryIspAvailable ? `Yes (${inf.secondaryIspName || 'Redundant Line'})` : 'No'}</div>
          {inf.secondaryIspAvailable && <div><span style={{ color: '#64748b' }}>Secondary Speed:</span> {inf.secondaryBandwidthMbps || 0} Mbps</div>}
          <div><span style={{ color: '#64748b' }}>LAN Topology:</span> {inf.lanStructured ? 'Structured CAT6 Cabling' : 'Standard Cabling'}</div>
          <div><span style={{ color: '#64748b' }}>Network Switches:</span> {inf.switchType || 'Manageable 1 Gbps Gigabit Switches'}</div>
        </div>
      </div>
    </div>
  );
}
