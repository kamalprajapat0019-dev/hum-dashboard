import React, { useState, useEffect } from 'react';
import { 
  Receipt, Search, Filter, CheckCircle2, Clock, 
  AlertTriangle, AlertOctagon, FileText, Plus, Check, X, ArrowUpRight
} from 'lucide-react';
import { InvoiceStore, CostSheetStore, CentreStore, ProjectStore, appendAuditLog } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';

export default function InvoiceManagementPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [costSheets, setCostSheets] = useState([]);
  const [centres, setCentres] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Submit Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    centre_id: '',
    project_id: '',
    cost_sheet_code: 'CST-2026-001',
    billed_candidates: 300,
    attended_candidates: 300,
    base_amount: 54000,
    bank_name: 'HDFC Bank Ltd',
    account_no: '501004829104',
    ifsc: 'HDFC0001234',
    pan_gst: '07AAACL1234A1Z5'
  });

  const loadData = () => {
    setInvoices(InvoiceStore.getAll());
    setCostSheets(CostSheetStore.getAll());
    setCentres(CentreStore.getAll());
    setProjects(ProjectStore.getAll());
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleApproveInvoice = (invId) => {
    const inv = invoices.find(i => i.id === invId);
    if (!inv) return;

    InvoiceStore.update(invId, {
      status: 'Approved for Payment'
    });

    appendAuditLog({
      module: 'Invoice Management',
      action: 'Invoice Approved for Payment',
      record_ref: inv.invoice_number,
      user_id: user?.email || 'finance@oemportal.in',
      details: `Invoice ${inv.invoice_number} approved for net payment of ₹${inv.net_payable_amount.toLocaleString()}.`
    });

    loadData();
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    const centre = centres.find(c => c.id === invoiceForm.centre_id);
    const proj = projects.find(p => p.id === invoiceForm.project_id);
    if (!centre || !proj) {
      alert('Please select both Centre and Project');
      return;
    }

    const base = Number(invoiceForm.base_amount);
    const cgst = Math.round(base * 0.09);
    const sgst = Math.round(base * 0.09);
    const total = base + cgst + sgst;
    const tds = Math.round(base * 0.02);
    const netPayable = total - tds;
    const match = Number(invoiceForm.billed_candidates) === Number(invoiceForm.attended_candidates);

    const newInv = {
      id: `inv_${Date.now()}`,
      invoice_number: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      invoice_date: new Date().toISOString().split('T')[0],
      centre_id: centre.id,
      centre_name: centre.name,
      city: centre.city || 'Delhi NCR',
      project_id: proj.id,
      project_name: proj.name,
      cost_sheet_code: invoiceForm.cost_sheet_code,
      billed_candidates: Number(invoiceForm.billed_candidates),
      attended_candidates: Number(invoiceForm.attended_candidates),
      attendance_match: match,
      base_amount: base,
      cgst_9pct: cgst,
      sgst_9pct: sgst,
      total_invoice_amount: total,
      tds_deducted_2pct: tds,
      net_payable_amount: netPayable,
      bank_details: {
        bank_name: invoiceForm.bank_name,
        account_no: invoiceForm.account_no,
        ifsc: invoiceForm.ifsc,
        pan_gst: invoiceForm.pan_gst
      },
      status: match ? 'Under Verification' : 'Rework Required',
      approval_notes: match ? 'Awaiting final finance officer cross-verification.' : 'Attendance count does not match biometric verification logs.',
      payment_status: 'Unpaid'
    };

    InvoiceStore.create(newInv);
    appendAuditLog({
      module: 'Invoice Management',
      action: 'Invoice Submitted',
      record_ref: newInv.invoice_number,
      user_id: user?.email || 'centre@oemportal.in',
      details: `New tax invoice raised by ${centre.name} for ₹${total.toLocaleString()}`
    });

    loadData();
    setCreateModalOpen(false);
  };

  const filteredInvoices = invoices.filter(i => {
    const matchSearch = i.centre_name.toLowerCase().includes(search.toLowerCase()) ||
                        i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
                        i.project_name.toLowerCase().includes(search.toLowerCase());
    const matchStat = statusFilter === 'ALL' || i.status === statusFilter;
    return matchSearch && matchStat;
  });

  const kpis = {
    totalInvoiced: invoices.reduce((acc, i) => acc + (i.total_invoice_amount || 0), 0),
    approvedCount: invoices.filter(i => i.status === 'Approved for Payment' || i.status === 'Paid').length,
    discrepancyCount: invoices.filter(i => !i.attendance_match).length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Receipt size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Centre Tax Invoicing & Attendance Verification Desk
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                Automated biometric attendance validation, 18% GST tax breakdown, 2% TDS deduction, and payment approvals
              </p>
            </div>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setCreateModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} /> Submit New Tax Invoice
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL INVOICE CLAIMS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#0284c7' }}>
            ₹{kpis.totalInvoiced.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Across verified exam centres</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>APPROVED FOR PAYMENT</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#16a34a' }}>{kpis.approvedCount}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Attendance match certified</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>ATTENDANCE DISCREPANCIES</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#dc2626' }}>{kpis.discrepancyCount}</div>
          <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>Billed vs biometric mismatch hold</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 'min(100%, 240px)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search by invoice number, centre name, project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Filter size={15} style={{ color: 'var(--text-tertiary)' }} />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
            <option value="ALL">All Status</option>
            <option value="Approved for Payment">Approved for Payment</option>
            <option value="Under Verification">Under Verification</option>
            <option value="Rework Required">Rework Required</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredInvoices.map((inv) => {
          const isApproved = inv.status === 'Approved for Payment' || inv.status === 'Paid';
          const hasMismatch = !inv.attendance_match;

          return (
            <div 
              key={inv.id}
              className="card"
              style={{
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                borderLeft: `5px solid ${hasMismatch ? '#dc2626' : isApproved ? '#16a34a' : '#0284c7'}`
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>{inv.invoice_number}</span>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {inv.centre_name}
                    </h2>
                    <span className={`badge ${
                      inv.status === 'Paid' ? 'badge-neutral' :
                      isApproved ? 'badge-success' : 
                      hasMismatch ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Project: <strong>{inv.project_name}</strong> | Invoice Date: {inv.invoice_date} | Cost Ref: {inv.cost_sheet_code}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Net Payable Amount (Post-TDS)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7' }}>
                    ₹{inv.net_payable_amount?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Attendance Discrepancy Banner */}
              {hasMismatch && (
                <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertOctagon size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: '#991b1b' }}>
                    <strong>Attendance Count Discrepancy:</strong> Venue billed for <strong>{inv.billed_candidates} candidates</strong>, but actual biometric gate logs recorded only <strong>{inv.attended_candidates} candidates</strong>. Payment on hold until revised.
                  </div>
                </div>
              )}

              {/* Commercial & Tax Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Billed Candidates</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    {inv.billed_candidates} nodes
                  </div>
                  <div style={{ fontSize: 11, color: inv.attendance_match ? '#16a34a' : '#dc2626', marginTop: 2 }}>
                    {inv.attendance_match ? '✓ Biometric Log Matched' : '✗ 2 Candidates Discrepancy'}
                  </div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Base Amount</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    ₹{inv.base_amount?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Excluding GST</div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>GST (CGST 9% + SGST 9%)</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    ₹{(inv.cgst_9pct + inv.sgst_9pct)?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>18% Tax Rate</div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>TDS Deduction (2%)</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginTop: 2 }}>
                    - ₹{inv.tds_deducted_2pct?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Sec 194C Contractor</div>
                </div>
              </div>

              {/* Bank & Tax Meta */}
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>Bank: <strong>{inv.bank_details?.bank_name}</strong> (A/C: {inv.bank_details?.account_no} • IFSC: {inv.bank_details?.ifsc})</div>
                <div>PAN / GSTIN: <strong style={{ fontFamily: 'monospace' }}>{inv.bank_details?.pan_gst}</strong></div>
              </div>

              {/* Bottom Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Notes: {inv.approval_notes}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  {!isApproved && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApproveInvoice(inv.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a' }}
                    >
                      <CheckCircle2 size={14} /> Verify & Approve for Disbursement
                    </button>
                  )}
                  {isApproved && (
                    <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={14} /> Cleared for NEFT / RTGS Payout
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE INVOICE MODAL */}
      {createModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <form onSubmit={handleCreateInvoice} className="card" style={{
            width: '100%', maxWidth: 560, padding: 24, borderRadius: 16,
            border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Submit Examination Centre Tax Invoice
              </h2>
              <button type="button" onClick={() => setCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Centre Venue *
                </label>
                <select 
                  value={invoiceForm.centre_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, centre_id: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Choose Centre...</option>
                  {centres.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Exam Project *
                </label>
                <select 
                  value={invoiceForm.project_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, project_id: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Choose Project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Billed Candidates *
                </label>
                <input 
                  type="number"
                  value={invoiceForm.billed_candidates}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, billed_candidates: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Actual Biometric Attended Candidates *
                </label>
                <input 
                  type="number"
                  value={invoiceForm.attended_candidates}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, attended_candidates: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Base Invoice Amount (₹ Excl. GST) *
              </label>
              <input 
                type="number"
                value={invoiceForm.base_amount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, base_amount: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Bank Name</label>
                <input 
                  type="text"
                  value={invoiceForm.bank_name}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, bank_name: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Account Number</label>
                <input 
                  type="text"
                  value={invoiceForm.account_no}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, account_no: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Transmit Invoice for Audit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
