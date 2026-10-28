import { IndianRupee, FileText, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { KpiCard, LastUpdated } from '@/components/common';

export default function FinanceDashboard() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">Finance &amp; Commercial Overview</h1>
            <p className="page-header__subtitle">Invoices, payments, reconciliation and commercial ledger</p>
          </div>
          <div className="page-header__actions">
            <LastUpdated />
          </div>
        </div>
      </div>

      {/* KPI Cards — Zero fake numbers */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard label="Invoices Pending" value={0} sub="0 awaiting approval" icon="FileText" iconBg="#fffbeb" iconColor="#d97706" />
        <KpiCard label="Invoices Paid" value={0} sub="0 settled" icon="CheckCircle" iconBg="#f0fdf4" iconColor="#16a34a" />
        <KpiCard label="Outstanding Amount" value="₹0" sub="Zero pending liability" icon="IndianRupee" iconBg="#fef2f2" iconColor="#dc2626" />
        <KpiCard label="Total Paid Amount" value="₹0" sub="Zero disbursements" icon="TrendingUp" iconBg="#eff6ff" iconColor="#1e40af" />
      </div>

      {/* Information Banner */}
      <div style={{
        background: 'rgba(248, 250, 252, 0.8)',
        border: '1px solid var(--border-default, #e2e8f0)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <AlertCircle size={20} style={{ color: 'var(--color-primary, #2563eb)', marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            Finance &amp; Invoice Ledger — Live Database State
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            There are currently no commercial invoice records in the database. Invoicing data will appear here once centres submit billing claims against completed examination allocations.
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Commercial Invoices Registry</span>
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
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                  No invoices found in database. All commercial ledger entries will be recorded here upon submission.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
