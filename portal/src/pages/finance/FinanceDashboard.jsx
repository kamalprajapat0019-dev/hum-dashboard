import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { IndianRupee, ArrowRight } from 'lucide-react';
import { KpiCard, StatusBadge, LastUpdated } from '../../components/common';
import { FINANCE_KPIS, INVOICE_STATUS_DATA, INVOICE_AMOUNT_DATA } from '../../data/mockData';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: '0.75rem', boxShadow: 'var(--shadow-md)' }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>}
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill || p.color, display: 'inline-block' }} />
          {p.name}: <strong>₹{p.value}L</strong>
        </div>
      ))}
    </div>
  );
};

const INVOICES = [
  { id: 'INV-1042', centre: 'Lotus Computer Education', project: 'NEET UG 2026', amount: '₹1,24,500', status: 'Paid',     submittedOn: '2026-10-10' },
  { id: 'INV-1041', centre: 'Pioneer Academy',          project: 'NEET UG 2026', amount: '₹98,000',   status: 'Approved', submittedOn: '2026-10-12' },
  { id: 'INV-1040', centre: 'Sunrise IT Academy',       project: 'JEE Mains 2027',amount: '₹1,42,000', status: 'Pending',  submittedOn: '2026-10-15' },
  { id: 'INV-1039', centre: 'Tech Valley Institute',    project: 'CUET PG 2026',  amount: '₹87,500',   status: 'Rejected', submittedOn: '2026-10-08' },
  { id: 'INV-1038', centre: 'Saraswati Computers',      project: 'NEET UG 2026', amount: '₹76,000',   status: 'Pending',  submittedOn: '2026-10-16' },
];

export default function FinanceDashboard() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">Finance Overview</h1>
            <p className="page-header__subtitle">Invoices, payments, reconciliation and commercial closure</p>
          </div>
          <div className="page-header__actions">
            <LastUpdated />
            <button className="btn btn-secondary btn-sm"><IndianRupee size={13} /> Export Ledger</button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard label="Invoices Pending" value={FINANCE_KPIS.invoicesPending.value} icon="FileText" iconBg="#fffbeb" iconColor="#d97706" />
        <KpiCard label="Invoices Paid" value={FINANCE_KPIS.invoicesPaid.value} icon="CheckCircle" iconBg="#f0fdf4" iconColor="#16a34a" />
        <KpiCard label="Outstanding Amount" value={FINANCE_KPIS.outstandingAmt.value} icon="IndianRupee" iconBg="#fef2f2" iconColor="#dc2626" />
        <KpiCard label="Total Paid Amount" value={FINANCE_KPIS.paidAmt.value} icon="TrendingUp" iconBg="#eff6ff" iconColor="#1e40af" />
      </div>

      {/* Charts */}
      <div className="grid-cols-chart" style={{ marginBottom: 24 }}>

        {/* Invoice Status Donut */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Invoice Status Distribution</span>
            <span className="badge badge-neutral">{INVOICE_STATUS_DATA.reduce((s,d) => s+d.value, 0)} invoices</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={INVOICE_STATUS_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" labelLine={false}>
                  {INVOICE_STATUS_DATA.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: '0.75rem', boxShadow: 'var(--shadow-md)' }}>
                      {payload.map(p => <div key={p.name}><strong>{p.name}:</strong> {p.value}</div>)}
                    </div>
                  );
                }} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Payment Trend */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Payment Trend (₹ Lakh)</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={INVOICE_AMOUNT_DATA} barSize={18} margin={{ left: -10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
                <Legend formatter={v => <span style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{v}</span>} />
                <Bar dataKey="paid"    name="Paid"    fill="#16a34a" radius={[3,3,0,0]} />
                <Bar dataKey="pending" name="Pending" fill="#d97706" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Invoices</span>
          <button className="btn btn-ghost btn-sm" style={{ gap: 4 }}>All Invoices <ArrowRight size={12} /></button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Centre</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Submitted On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map(inv => (
                <tr key={inv.id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)' }}>{inv.id}</span></td>
                  <td style={{ fontWeight: 500 }}>{inv.centre}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{inv.project}</td>
                  <td style={{ fontWeight: 600 }}>{inv.amount}</td>
                  <td>
                    <StatusBadge status={
                      inv.status === 'Paid' ? 'Active' :
                      inv.status === 'Approved' ? 'Eligible' :
                      inv.status === 'Pending' ? 'Pending' : 'Rejected'
                    } />
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{inv.submittedOn}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm">
                      {inv.status === 'Pending' ? 'Review' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
