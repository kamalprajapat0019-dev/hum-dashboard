import React from 'react';
import { Eye, EyeOff, Check, X, FileText } from 'lucide-react';

export function BankTab({
  bank,
  showFullAccount,
  setShowFullAccount,
  setPreviewDocUrl,
  setShowBankActionModal,
  setBankRemarks,
  setBankRejectionReason,
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Bank & Commercial Settlement Account</h3>
          <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            Official account used for payment dispatches, venue advances, and balance settlements.
          </p>
        </div>
        {bank.accountNumber && (
          <div style={{ display: 'flex', gap: 8 }}>
            {bank.status !== 'Verified' && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setShowBankActionModal({ action: 'verify' });
                  setBankRemarks('');
                  setBankRejectionReason('');
                }}
                style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={14} /> Verify Bank Account
              </button>
            )}

            {bank.status !== 'Rejected' && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowBankActionModal({ action: 'reject' });
                  setBankRemarks('');
                  setBankRejectionReason('');
                }}
                style={{ color: '#dc2626', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <X size={14} /> Reject Bank Account
              </button>
            )}
          </div>
        )}
      </div>

      {!bank.accountNumber ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
          No bank account details submitted yet for this centre.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Main Bank Card */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e40af' }}>
                {bank.bankName || 'Bank Account Record'}
              </h4>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontWeight: 600,
                  background: bank.status === 'Verified' ? '#dcfce7' : bank.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                  color: bank.status === 'Verified' ? '#166534' : bank.status === 'Rejected' ? '#991b1b' : '#92400e',
                }}
              >
                {bank.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Beneficiary / Account Name</div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: 2 }}>{bank.accountHolderName}</div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Account Number</span>
                  <button
                    type="button"
                    onClick={() => setShowFullAccount(!showFullAccount)}
                    style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
                  >
                    {showFullAccount ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showFullAccount ? 'Mask' : 'Reveal'}
                  </button>
                </div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.05em', marginTop: 2 }}>
                  {showFullAccount ? (bank.accountNumber || '—') : (bank.accountNumber?.length > 4 ? `XXXX XXXX ${bank.accountNumber.slice(-4)}` : bank.accountNumber)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>IFSC Code</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, marginTop: 2 }}>{bank.ifscCode}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Account Type</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{bank.accountType}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Payment Clearance Status</div>
                <div style={{ fontWeight: 600, color: bank.isPaymentEligible ? '#16a34a' : '#d97706', marginTop: 2 }}>
                  {bank.isPaymentEligible ? 'Payment Eligible' : 'Awaiting Full Verification'}
                </div>
              </div>

              {bank.rejectionReason && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: 6, color: '#991b1b', fontSize: '0.8125rem' }}>
                  <strong>Rejection Reason:</strong> {bank.rejectionReason}
                </div>
              )}
            </div>
          </div>

          {/* Supporting Bank Proof Previews */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600 }}>Supporting Bank Proofs</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bank.cancelledChequeUrl && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={20} color="#1e40af" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Cancelled Cheque Copy</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Uploaded bank proof</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-xs btn-secondary"
                    onClick={() => setPreviewDocUrl(bank.cancelledChequeUrl)}
                  >
                    <Eye size={12} /> View
                  </button>
                </div>
              )}

              {bank.passbookUrl && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={20} color="#1e40af" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Bank Passbook (Front Page)</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Uploaded bank proof</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-xs btn-secondary"
                    onClick={() => setPreviewDocUrl(bank.passbookUrl)}
                  >
                    <Eye size={12} /> View
                  </button>
                </div>
              )}

              {!bank.cancelledChequeUrl && !bank.passbookUrl && (
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  No cheque or passbook file attached directly to bank record. Check Documents tab for uploaded proofs.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
