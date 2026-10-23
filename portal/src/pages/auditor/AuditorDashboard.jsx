import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowRight, AlertOctagon, RefreshCw } from 'lucide-react';
import { KpiCard, StatusBadge, LastUpdated } from '../../components/common';
import { AUDITOR_KPIS, AUDIT_FINDINGS_DATA, MOCK_STATUS_DATA, CENTRES } from '../../data/mockData';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: '0.75rem', boxShadow: 'var(--shadow-md)' }}>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-primary)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill, display: 'inline-block' }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const ASSIGNED_AUDITS = [
  { centre: 'Lotus Computer Education', city: 'Delhi',    status: 'Passed',            findings: 2, mockStatus: 'Passed',        lastAudit: '2026-10-20' },
  { centre: 'Sunrise IT Academy',       city: 'Mumbai',   status: 'Passed',            findings: 0, mockStatus: 'Passed',        lastAudit: '2026-10-19' },
  { centre: 'Tech Valley Institute',    city: 'Bangalore',status: 'Re-audit Required', findings: 5, mockStatus: 'Failed',        lastAudit: '2026-10-18' },
  { centre: 'Saraswati Computers',      city: 'Hyderabad',status: 'Pending',           findings: 0, mockStatus: 'Not Conducted', lastAudit: '—' },
  { centre: 'Pioneer Academy',          city: 'Kolkata',  status: 'Passed',            findings: 1, mockStatus: 'Passed',        lastAudit: '2026-10-17' },
];

export default function AuditorDashboard() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">My Audits</h1>
            <p className="page-header__subtitle">Assigned audits, findings, technical scans and mock status</p>
          </div>
          <div className="page-header__actions">
            <LastUpdated />
            <button className="btn btn-primary btn-sm"><AlertOctagon size={13} /> Record Finding</button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard label="Assigned Audits" value={AUDITOR_KPIS.assignedAudits.value} sub={`${AUDITOR_KPIS.assignedAudits.pending} pending`} icon="ClipboardCheck" iconBg="#eff6ff" iconColor="#1e40af" />
        <KpiCard label="Critical Findings" value={AUDITOR_KPIS.critical.value} icon="AlertOctagon" iconBg="#fef2f2" iconColor="#dc2626" />
        <KpiCard label="Failed Mocks" value={AUDITOR_KPIS.mockFailed.value} icon="XCircle" iconBg="#fffbeb" iconColor="#d97706" />
        <KpiCard label="Re-audit Pending" value={AUDITOR_KPIS.reAuditPending.value} icon="RefreshCw" iconBg="#faf5ff" iconColor="#7c3aed" />
      </div>

      {/* Charts */}
      <div className="grid-cols-chart" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Audit Findings by Severity</span>
            <span className="badge badge-danger">{AUDIT_FINDINGS_DATA.reduce((s,d) => s+d.value, 0)} total</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={AUDIT_FINDINGS_DATA} barSize={44} margin={{ left: -10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
                <Bar dataKey="value" name="Findings" radius={[4,4,0,0]}>
                  {AUDIT_FINDINGS_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Mock Status Distribution</span>
            <span className="badge badge-neutral">{MOCK_STATUS_DATA.reduce((s,d) => s+d.value, 0)} centres</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={MOCK_STATUS_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" labelLine={false}>
                  {MOCK_STATUS_DATA.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Assigned Audit Queue</span>
          <button className="btn btn-ghost btn-sm" style={{ gap: 4 }}>All Audits <ArrowRight size={12} /></button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Centre</th>
                <th>Audit Status</th>
                <th>Findings</th>
                <th>Mock Status</th>
                <th>Last Audit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ASSIGNED_AUDITS.map((a, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{a.centre}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.city}</div>
                  </td>
                  <td><StatusBadge status={a.status === 'Passed' ? 'Approved' : a.status === 'Pending' ? 'Pending' : 'Under Review'} /></td>
                  <td>
                    {a.findings > 0
                      ? <span className="badge badge-danger">{a.findings} finding{a.findings > 1 ? 's' : ''}</span>
                      : <span className="badge badge-success">None</span>
                    }
                  </td>
                  <td><StatusBadge status={a.mockStatus === 'Passed' ? 'Active' : a.mockStatus === 'Failed' ? 'Rejected' : 'Draft'} /></td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{a.lastAudit}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm">
                      {a.status === 'Pending' ? 'Start Audit' : a.status === 'Re-audit Required' ? 'Re-audit' : 'View'}
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
