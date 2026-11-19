import React from 'react';
import { Send } from 'lucide-react';

export function Step8ReviewSubmit({
  basicInfo,
  personnel,
  documents,
  building,
  powerNetwork,
  safety,
  bank,
  setActiveStep,
  isReadOnly,
  handleSubmit,
  submitting,
}) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '1.15rem', fontWeight: 700, color: '#1e40af' }}>
        Final Application Dossier Review
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Basic Info Summary */}
        <div className="card" style={{ padding: 16, background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: '0.9375rem' }}>1. Basic Information</strong>
            {!isReadOnly && <button type="button" className="btn btn-xs btn-ghost" onClick={() => setActiveStep(1)}>Edit</button>}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>Centre: <strong>{basicInfo.centreName || '—'}</strong></div>
            <div>Category: {basicInfo.centreCategory} ({basicInfo.organizationType})</div>
            <div>Location: {basicInfo.cityName}, {basicInfo.stateName} (PIN: {basicInfo.pincode})</div>
            <div>Declared Nodes: <strong>{basicInfo.totalNodes} nodes</strong></div>
          </div>
        </div>

        {/* Personnel Summary */}
        <div className="card" style={{ padding: 16, background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: '0.9375rem' }}>2. Personnel Details</strong>
            {!isReadOnly && <button type="button" className="btn btn-xs btn-ghost" onClick={() => setActiveStep(2)}>Edit</button>}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>Owner: <strong>{personnel.owner?.fullName || '—'}</strong> ({personnel.owner?.contactNumber || '—'})</div>
            <div>Superintendent: <strong>{personnel.cs?.fullName || '—'}</strong> ({personnel.cs?.contactNumber || '—'})</div>
            <div>IT Head: <strong>{personnel.it?.fullName || '—'}</strong> ({personnel.it?.contactNumber || '—'})</div>
            <div>Electrician: <strong>{personnel.electrician?.fullName || '—'}</strong></div>
          </div>
        </div>

        {/* Documents Summary */}
        <div className="card" style={{ padding: 16, background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: '0.9375rem' }}>3. Uploaded Certificates</strong>
            {!isReadOnly && <button type="button" className="btn btn-xs btn-ghost" onClick={() => setActiveStep(3)}>Edit</button>}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>Uploaded Files: <strong>{documents.length} documents attached</strong></div>
            <div style={{ color: '#16a34a' }}>Mandatory checklists validated</div>
          </div>
        </div>

        {/* Infrastructure Summary */}
        <div className="card" style={{ padding: 16, background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: '0.9375rem' }}>4. Physical & LAN Infrastructure</strong>
            {!isReadOnly && <button type="button" className="btn btn-xs btn-ghost" onClick={() => setActiveStep(4)}>Edit</button>}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>Floors: {building.noOfFloors} | Building: {building.buildingType}</div>
            <div>CCTV Units: {building.noOfCctvCameras} units</div>
            <div>Primary ISP: {powerNetwork.primaryIspName} ({powerNetwork.primaryBandwidthMbps} Mbps)</div>
            <div>Online UPS: {powerNetwork.upsAvailable ? `${powerNetwork.upsCapacityKva} KVA` : 'No'}</div>
          </div>
        </div>

        {/* Bank Details Summary */}
        <div className="card" style={{ padding: 16, background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: '0.9375rem' }}>5. Commercial Bank Settlement</strong>
            {!isReadOnly && <button type="button" className="btn btn-xs btn-ghost" onClick={() => setActiveStep(7)}>Edit</button>}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>Bank: <strong>{bank.bankName}</strong></div>
            <div>Beneficiary: {bank.accountName || '—'}</div>
            <div>Account No: <code>{bank.accountNumber ? `XXXX${bank.accountNumber.slice(-4)}` : '—'}</code></div>
            <div>IFSC: <code>{bank.ifscCode || '—'}</code></div>
          </div>
        </div>
      </div>

      {/* Final Submission CTA */}
      {!isReadOnly && (
        <div style={{ marginTop: 24, padding: 20, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
          <h4 style={{ margin: '0 0 6px', color: '#1e40af', fontSize: '1rem' }}>Ready to submit your application?</h4>
          <p style={{ margin: '0 0 16px', fontSize: '0.8125rem', color: '#3b82f6' }}>
            Please ensure all mandatory details and documents are verified. Once submitted, your dossier will be reviewed by OEMP administrators.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ background: '#1e40af', borderColor: '#1e40af', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Send size={15} /> {submitting ? 'Submitting Application...' : 'Submit Application Dossier'}
          </button>
        </div>
      )}
    </div>
  );
}
