import React from 'react';
import { Send } from 'lucide-react';

export function PersonnelTab({
  owner,
  cs,
  it,
  electrician,
  handleOpenInvite,
}) {
  const personnelList = [
    { title: 'Centre Owner / Authorized Head', data: owner, roleBadge: 'Owner' },
    { title: 'Centre Superintendent (CS / TCA)', data: cs, roleBadge: 'Centre Head' },
    { title: 'Centre IT Person / Technical Lead', data: it, roleBadge: 'IT Lead' },
    { title: 'Dedicated Electrician', data: electrician, roleBadge: 'Electrician' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
      {personnelList.map((p, idx) => (
        <div key={idx} className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{p.title}</h4>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: '#f1f5f9', fontWeight: 600 }}>
              {p.roleBadge}
            </span>
          </div>
          {p.data?.fullName ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem' }}>
              <div><span style={{ color: '#64748b' }}>Name:</span> <strong>{p.data.fullName}</strong></div>
              <div><span style={{ color: '#64748b' }}>Mobile:</span> {p.data.contactNumber}</div>
              {p.data.email && <div><span style={{ color: '#64748b' }}>Email:</span> {p.data.email}</div>}
              {p.data.aadhaarNumber && (
                <div>
                  <span style={{ color: '#64748b' }}>Aadhaar:</span>{' '}
                  <code style={{ background: '#f8fafc', padding: '1px 6px', borderRadius: 4 }}>
                    {p.data.aadhaarNumber.length > 4 ? `XXXX-XXXX-${p.data.aadhaarNumber.slice(-4)}` : p.data.aadhaarNumber}
                  </code>
                </div>
              )}
              {p.data.fatherName && <div><span style={{ color: '#64748b' }}>Father's Name:</span> {p.data.fatherName}</div>}
              {p.data.permanentAddress && <div><span style={{ color: '#64748b' }}>Address:</span> {p.data.permanentAddress}</div>}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleOpenInvite(p.data)}
                style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}
                title="Send 72-Hour Sign-Up Link to this contact (FRD Sec. 4.1)"
              >
                <Send size={13} /> Send Sign-Up Link
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '0.8125rem', color: '#94a3b8', padding: '12px 0' }}>
              No personnel record submitted for this role.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
