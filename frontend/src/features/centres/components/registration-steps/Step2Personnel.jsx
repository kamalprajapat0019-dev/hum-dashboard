import React from 'react';

export function Step2Personnel({ personnel, setPersonnel, isReadOnly }) {
  return (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
            Step 2 — Owner & Key Operational Personnel
          </h3>

          {/* Section 1: Owner Details */}
          <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
              1. Owner / Authorized Signatory Details *
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={personnel.owner.fullName}
                  onChange={(e) => setPersonnel({ ...personnel, owner: { ...personnel.owner, fullName: e.target.value } })}
                  placeholder="Full name as per Aadhaar / PAN"
                  disabled={isReadOnly}
                  required
                />
              </div>
              <div>
                <label className="form-label">Contact Mobile *</label>
                <input
                  type="text"
                  maxLength={10}
                  className="form-control"
                  value={personnel.owner.contactNumber}
                  onChange={(e) => setPersonnel({ ...personnel, owner: { ...personnel.owner, contactNumber: e.target.value.replace(/\D/g, '') } })}
                  placeholder="10-digit mobile number"
                  disabled={isReadOnly}
                  required
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={personnel.owner.email}
                  onChange={(e) => setPersonnel({ ...personnel, owner: { ...personnel.owner, email: e.target.value } })}
                  placeholder="official@email.com"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Aadhaar Number *</label>
                <input
                  type="text"
                  maxLength={12}
                  className="form-control"
                  value={personnel.owner.aadhaarNumber}
                  onChange={(e) => setPersonnel({ ...personnel, owner: { ...personnel.owner, aadhaarNumber: e.target.value.replace(/\D/g, '') } })}
                  placeholder="12-digit Aadhaar"
                  disabled={isReadOnly}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Permanent Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={personnel.owner.permanentAddress}
                  onChange={(e) => setPersonnel({ ...personnel, owner: { ...personnel.owner, permanentAddress: e.target.value } })}
                  placeholder="Residential address"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Centre CS Details */}
          <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
              2. Centre Superintendent (CS / TCA) Details *
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label">CS Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={personnel.cs.fullName}
                  onChange={(e) => setPersonnel({ ...personnel, cs: { ...personnel.cs, fullName: e.target.value } })}
                  placeholder="Centre Superintendent name"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Contact Mobile *</label>
                <input
                  type="text"
                  maxLength={10}
                  className="form-control"
                  value={personnel.cs.contactNumber}
                  onChange={(e) => setPersonnel({ ...personnel, cs: { ...personnel.cs, contactNumber: e.target.value.replace(/\D/g, '') } })}
                  placeholder="10-digit mobile"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={personnel.cs.email}
                  onChange={(e) => setPersonnel({ ...personnel, cs: { ...personnel.cs, email: e.target.value } })}
                  placeholder="cs@centre.com"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Aadhaar Number</label>
                <input
                  type="text"
                  maxLength={12}
                  className="form-control"
                  value={personnel.cs.aadhaarNumber}
                  onChange={(e) => setPersonnel({ ...personnel, cs: { ...personnel.cs, aadhaarNumber: e.target.value.replace(/\D/g, '') } })}
                  placeholder="12-digit Aadhaar"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Section 3: IT Person Details */}
          <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
              3. Centre IT Person / Network Administrator *
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label">IT Lead Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={personnel.it.fullName}
                  onChange={(e) => setPersonnel({ ...personnel, it: { ...personnel.it, fullName: e.target.value } })}
                  placeholder="IT lead name"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Contact Mobile *</label>
                <input
                  type="text"
                  maxLength={10}
                  className="form-control"
                  value={personnel.it.contactNumber}
                  onChange={(e) => setPersonnel({ ...personnel, it: { ...personnel.it, contactNumber: e.target.value.replace(/\D/g, '') } })}
                  placeholder="10-digit mobile"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={personnel.it.email}
                  onChange={(e) => setPersonnel({ ...personnel, it: { ...personnel.it, email: e.target.value } })}
                  placeholder="it@centre.com"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Electrician Details */}
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
              4. Dedicated Electrician Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label">Electrician Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={personnel.electrician.fullName}
                  onChange={(e) => setPersonnel({ ...personnel, electrician: { ...personnel.electrician, fullName: e.target.value } })}
                  placeholder="Electrician name"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Mobile Number</label>
                <input
                  type="text"
                  maxLength={10}
                  className="form-control"
                  value={personnel.electrician.contactNumber}
                  onChange={(e) => setPersonnel({ ...personnel, electrician: { ...personnel.electrician, contactNumber: e.target.value.replace(/\D/g, '') } })}
                  placeholder="10-digit mobile"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        </div>
  );
}
