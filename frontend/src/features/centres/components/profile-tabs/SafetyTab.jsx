import React from 'react';

export function SafetyTab({ inf }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
      <div className="card" style={{ padding: 16 }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
          Fire Safety & Certifications
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
          <div><span style={{ color: '#64748b' }}>Fire NOC Certificate:</span> <strong>{inf.fireNocAvailable ? 'Available & Valid' : 'Not Uploaded'}</strong></div>
          {inf.fireNocExpiryDate && <div><span style={{ color: '#64748b' }}>Fire NOC Expiry:</span> {new Date(inf.fireNocExpiryDate).toLocaleDateString()}</div>}
          <div><span style={{ color: '#64748b' }}>Fire Extinguishers in Labs:</span> <strong>{inf.fireExtinguishersCount || 0} units</strong></div>
          <div><span style={{ color: '#64748b' }}>Extinguisher Expiry:</span> {inf.fireExtinguisherExpiryDate ? new Date(inf.fireExtinguisherExpiryDate).toLocaleDateString() : '—'}</div>
          <div><span style={{ color: '#64748b' }}>Fire Smoke Alarms:</span> {inf.smokeAlarmsAvailable ? 'Functional' : 'No'}</div>
          <div><span style={{ color: '#64748b' }}>Emergency Exits Clearly Marked:</span> {inf.emergencyExitsMarked ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
          Security & Perimeter Control
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
          <div><span style={{ color: '#64748b' }}>Security Guards Deployed:</span> <strong>{inf.securityGuardsAvailable ? `Yes (${inf.noOfSecurityGuards || 2} guards)` : 'No'}</strong></div>
          <div><span style={{ color: '#64748b' }}>Boundary Wall Enclosed:</span> {inf.boundaryWall ? 'Yes' : 'No'}</div>
          <div><span style={{ color: '#64748b' }}>Metal Detectors / Frisking Area:</span> {inf.friskingArea ? 'Available' : 'No'}</div>
          <div><span style={{ color: '#64748b' }}>First Aid & Medical Kit:</span> {inf.firstAidAvailable ? 'Available' : 'No'}</div>
        </div>
      </div>
    </div>
  );
}
