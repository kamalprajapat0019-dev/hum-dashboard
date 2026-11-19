import React from 'react';
import { MAJOR_BANKS } from './constants';

export function Step7BankDetails({ bank, setBank, isReadOnly }) {
  return (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
            Step 7 — Beneficiary Bank Account Details
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.8125rem', color: '#64748b' }}>
            Enter the official bank account of the registered centre or operating legal entity for commercial settlement and exam payouts.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Account Holder Name *</label>
              <input
                type="text"
                className="form-control"
                value={bank.accountName}
                onChange={(e) => setBank({ ...bank, accountName: e.target.value })}
                placeholder="Name as recorded in the bank passbook"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bank Name *</label>
              <select
                className="form-control"
                value={bank.bankName}
                onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                disabled={isReadOnly}
              >
                {MAJOR_BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Branch Name *</label>
              <input
                type="text"
                className="form-control"
                value={bank.branchName}
                onChange={(e) => setBank({ ...bank, branchName: e.target.value })}
                placeholder="Branch name (e.g. Rohini Sector 8)"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Number (Digits only) *</label>
              <input
                type="text"
                className="form-control"
                value={bank.accountNumber}
                onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="Account number"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Account Number *</label>
              <input
                type="text"
                className="form-control"
                value={bank.confirmAccountNumber}
                onChange={(e) => setBank({ ...bank, confirmAccountNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="Re-enter exact account number"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">IFSC Code (11 characters) *</label>
              <input
                type="text"
                maxLength={11}
                className="form-control"
                style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 }}
                value={bank.ifscCode}
                onChange={(e) => setBank({ ...bank, ifscCode: e.target.value.trim().toUpperCase() })}
                placeholder="e.g. SBIN0001234"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Type *</label>
              <select
                className="form-control"
                value={bank.accountType}
                onChange={(e) => setBank({ ...bank, accountType: e.target.value })}
                disabled={isReadOnly}
              >
                <option value="Current Account">Current Account</option>
                <option value="Savings Account">Savings Account</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Bank Branch Address (Optional)</label>
              <input
                type="text"
                className="form-control"
                value={bank.branchAddress}
                onChange={(e) => setBank({ ...bank, branchAddress: e.target.value })}
                placeholder="Bank branch physical address"
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>
  );
}
