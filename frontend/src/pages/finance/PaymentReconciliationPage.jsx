import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, Filter, Plus, CheckCircle2, 
  Clock, DollarSign, FileCheck, ArrowUpRight, ShieldCheck, X
} from 'lucide-react';
import { PaymentStore, InvoiceStore, appendAuditLog } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';

export default function PaymentReconciliationPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');

  // Disburse Payment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [disburseForm, setDisburseForm] = useState({
    invoice_id: '',
    payment_mode: 'NEFT',
    utr_number: `HDFCN${Date.now().toString().slice(-8)}`,
    bank_ref: `REF-TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    payment_date: new Date().toISOString().split('T')[0]
  });

  const loadData = () => {
    setPayments(PaymentStore.getAll());
    setInvoices(InvoiceStore.getAll());
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleDisbursePayment = (e) => {
    e.preventDefault();
    const inv = invoices.find(i => i.id === disburseForm.invoice_id);
    if (!inv) {
      alert('Please select an invoice');
      return;
    }

    const newPay = {
      id: `pay_${Date.now()}`,
      payment_code: `PAY-2026-${String(payments.length + 1).padStart(3, '0')}`,
      invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      centre_name: inv.centre_name,
      project_name: inv.project_name,
      payment_mode: disburseForm.payment_mode,
      utr_number: disburseForm.utr_number,
      paid_amount: inv.net_payable_amount,
      payment_date: disburseForm.payment_date,
      bank_ref: disburseForm.bank_ref,
      status: 'Completed',
      commercial_closure_signed: true,
      closure_certificate_no: `CLS-${inv.project_name.slice(0, 4).toUpperCase()}-2026-${String(payments.length + 1).padStart(2, '0')}`
    };

    PaymentStore.create(newPay);
    InvoiceStore.update(inv.id, {
      status: 'Paid',
      payment_status: 'Paid'
    });

    appendAuditLog({
      module: 'Payment Reconciliation',
      action: 'Payment Disbursed & Reconciled',
      record_ref: newPay.utr_number,
      user_id: user?.email || 'finance@oemportal.in',
      details: `Disbursed ₹${newPay.paid_amount.toLocaleString()} to ${newPay.centre_name} via ${newPay.payment_mode} (UTR: ${newPay.utr_number}). Commercial milestone closed.`
    });

    loadData();
    setModalOpen(false);
  };

  const filteredPayments = payments.filter(p => {
    const matchSearch = p.centre_name.toLowerCase().includes(search.toLowerCase()) ||
                        p.utr_number.toLowerCase().includes(search.toLowerCase()) ||
                        p.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
                        p.project_name.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const kpis = {
    totalDisbursed: payments.reduce((acc, p) => acc + (p.paid_amount || 0), 0),
    totalTransactions: payments.length,
    closedMilestones: payments.filter(p => p.commercial_closure_signed).length,
    approvedUnpaidInvoices: invoices.filter(i => i.status === 'Approved for Payment').length
  };

  const eligibleInvoices = invoices.filter(i => i.status === 'Approved for Payment');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <CreditCard size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Payment Reconciliation & Commercial Closure Ledger
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                Bank disbursement records, UTR transaction audits, full ledger reconciliation, and financial closure certificates
              </p>
            </div>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#059669' }}
        >
          <Plus size={16} /> Record Payment Disbursement
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL DISBURSED PAYMENTS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#059669' }}>
            ₹{kpis.totalDisbursed.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>100% Verified UTR Settlement</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>COMPLETED SETTLEMENTS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#16a34a' }}>{kpis.totalTransactions}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Bank confirmed transfers</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>COMMERCIAL CLOSURE CERTS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#7c3aed' }}>{kpis.closedMilestones}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Final financial signoffs</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>AWAITING DISBURSEMENT</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#d97706' }}>{kpis.approvedUnpaidInvoices}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Approved invoices in queue</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 'min(100%, 240px)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search by UTR number, centre name, invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px' }}>Payment Ref</th>
                <th style={{ padding: '12px 16px' }}>Centre Name</th>
                <th style={{ padding: '12px 16px' }}>Project</th>
                <th style={{ padding: '12px 16px' }}>Invoice Ref</th>
                <th style={{ padding: '12px 16px' }}>Bank UTR Number</th>
                <th style={{ padding: '12px 16px' }}>Payment Mode</th>
                <th style={{ padding: '12px 16px' }}>Disbursed Amount</th>
                <th style={{ padding: '12px 16px' }}>Disbursement Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Closure Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, fontFamily: 'monospace', color: '#059669' }}>
                      {p.payment_code}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {p.centre_name}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-info">{p.project_name}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 13 }}>
                      {p.invoice_number}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                        {p.utr_number}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Ref: {p.bank_ref}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-neutral">{p.payment_mode}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#059669', fontSize: 14 }}>
                      ₹{p.paid_amount?.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {p.payment_date}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> Milestone Closed
                        </span>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>
                          {p.closure_certificate_no}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD DISBURSEMENT MODAL */}
      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <form onSubmit={handleDisbursePayment} className="card" style={{
            width: '100%', maxWidth: 520, padding: 24, borderRadius: 16,
            border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Record Bank Payout & UTR Transaction
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Select Approved Invoice *
              </label>
              <select 
                value={disburseForm.invoice_id}
                onChange={(e) => setDisburseForm({ ...disburseForm, invoice_id: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                required
              >
                <option value="">Choose Approved Invoice...</option>
                {eligibleInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} — {inv.centre_name} (₹{inv.net_payable_amount.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Payment Mode *
                </label>
                <select 
                  value={disburseForm.payment_mode}
                  onChange={(e) => setDisburseForm({ ...disburseForm, payment_mode: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="NEFT">NEFT Transfer</option>
                  <option value="RTGS">RTGS Real-Time</option>
                  <option value="IMPS">IMPS Immediate</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Payment Date *
                </label>
                <input 
                  type="date"
                  value={disburseForm.payment_date}
                  onChange={(e) => setDisburseForm({ ...disburseForm, payment_date: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Bank UTR / Transaction Reference *
              </label>
              <input 
                type="text"
                value={disburseForm.utr_number}
                onChange={(e) => setDisburseForm({ ...disburseForm, utr_number: e.target.value })}
                className="input"
                style={{ width: '100%', fontFamily: 'monospace' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Internal ERP Bank Ref
              </label>
              <input 
                type="text"
                value={disburseForm.bank_ref}
                onChange={(e) => setDisburseForm({ ...disburseForm, bank_ref: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ background: '#059669' }}>
                Complete Reconciliation & Sign Closure
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
