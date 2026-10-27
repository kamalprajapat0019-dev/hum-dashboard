import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList
} from 'recharts';
import { ArrowRight, Building2, FileText, Plus } from 'lucide-react';
import { KpiCard, StatusBadge, LastUpdated } from '@/components/common';
import { OPS_KPIS, BOOKING_FUNNEL_DATA, CONSENT_STATUS_DATA, CENTRES } from '@/data/mockData';
import { CentreStore, DocStore } from '@/services/dataService';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: '0.75rem', boxShadow: 'var(--shadow-md)' }}>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill || '#1e40af', display: 'inline-block' }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const DOC_COMPLETION = [
  { name: 'Complete',   value: 102, color: '#16a34a' },
  { name: 'Incomplete', value: 47,  color: '#d97706' },
  { name: 'Rework',     value: 13,  color: '#dc2626' },
];

const INCIDENT_DATA = [
  { region: 'Delhi',   high: 2, medium: 1, low: 0 },
  { region: 'Mumbai',  high: 0, medium: 2, low: 1 },
  { region: 'Bangalore',high: 1, medium: 0, low: 2 },
  { region: 'Hyderabad',high: 0, medium: 1, low: 1 },
  { region: 'Kolkata', high: 0, medium: 0, low: 1 },
];

export default function OpsDashboard() {
  const navigate = useNavigate();
  const liveCentres = CentreStore.getAll();
  const liveDocs = DocStore.getAll();
  const pendingDocsCount = liveDocs.filter(d => d.status === 'Pending').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">Operations Board</h1>
            <p className="page-header__subtitle">Booking pipeline, consent, documents, readiness and incidents</p>
          </div>
          <div className="page-header__actions">
            <LastUpdated />
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/ops/documents')}>
              <FileText size={13} /> Document Checklist
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/ops/booking')}>
              <Building2 size={13} /> Manage Centres
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard
          label="Total Centres"
          value={liveCentres.length}
          sub={`${liveCentres.filter(c => c.centre_status === 'Approved').length} approved`}
          icon="CalendarCheck"
          iconBg="#eff6ff" iconColor="#1e40af"
          onClick={() => navigate('/ops/booking')}
        />
        <KpiCard
          label="Consent Pending"
          value={OPS_KPIS.consentPending.value}
          icon="MessageSquare"
          iconBg="#fffbeb" iconColor="#d97706"
        />
        <KpiCard
          label="Docs Pending / Checklist"
          value={pendingDocsCount || OPS_KPIS.docsIncomplete.value}
          sub="Requires verification"
          icon="FileWarning"
          iconBg="#fef2f2" iconColor="#dc2626"
          onClick={() => navigate('/ops/documents')}
        />
        <KpiCard
          label="Open Incidents"
          value={OPS_KPIS.incidentsOpen.value}
          icon="AlertCircle"
          iconBg="#faf5ff" iconColor="#7c3aed"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid-cols-chart" style={{ marginBottom: 24 }}>

        {/* Booking Funnel as horizontal bar */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Booking Pipeline</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {BOOKING_FUNNEL_DATA.map((d, i) => {
                const pct = Math.round((d.count / BOOKING_FUNNEL_DATA[0].count) * 100);
                const colors = ['#1e40af','#3b82f6','#0ea5e9','#16a34a','#16a34a'];
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{d.stage}</span>
                      <span style={{ fontWeight: 700 }}>{d.count} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: colors[i] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Consent Status */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Consent Status</span>
            <span className="badge badge-neutral">{CONSENT_STATUS_DATA.reduce((s,d) => s+d.value, 0)} centres</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={CONSENT_STATUS_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" labelLine={false}>
                  {CONSENT_STATUS_DATA.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-cols-chart" style={{ marginBottom: 24 }}>

        {/* Document Completion */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Document Completion Status</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ flex: '0 0 160px', width: 160, height: 160, minWidth: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={DOC_COMPLETION} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" labelLine={false}>
                      {DOC_COMPLETION.map((e,i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DOC_COMPLETION.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', flex: 1, color: 'var(--text-secondary)' }}>{d.name}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Incident by Region */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Incidents by Region &amp; Priority</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={INCIDENT_DATA} barSize={14} margin={{ left: -20 }}>
                <XAxis dataKey="region" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
                <Legend formatter={v => <span style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{v}</span>} />
                <Bar dataKey="high"   name="High"   fill="#dc2626" radius={[3,3,0,0]} stackId="a" />
                <Bar dataKey="medium" name="Medium" fill="#d97706" radius={[3,3,0,0]} stackId="a" />
                <Bar dataKey="low"    name="Low"    fill="#0ea5e9" radius={[3,3,0,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Centre Status Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Centre Operational Status</span>
          <button className="btn btn-ghost btn-sm" style={{ gap: 4 }}>All Centres <ArrowRight size={12} /></button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Centre</th>
                <th>City</th>
                <th>Eligibility</th>
                <th>Consent</th>
                <th>Documents</th>
                <th>Audit</th>
              </tr>
            </thead>
            <tbody>
              {CENTRES.map(c => (
                <tr key={c.id}>
                  <td><span style={{ fontWeight: 500 }}>{c.name}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.city}</td>
                  <td><StatusBadge status={c.eligibility === 'Eligible' ? 'Active' : c.eligibility === 'Under Review' ? 'Pending' : 'Rejected'} /></td>
                  <td><StatusBadge status={c.consentStatus === 'Accepted' ? 'Active' : c.consentStatus === 'Pending' ? 'Pending' : 'Rejected'} /></td>
                  <td>
                    {c.docsComplete
                      ? <span className="badge badge-success">Complete</span>
                      : <span className="badge badge-warning">Incomplete</span>
                    }
                  </td>
                  <td><StatusBadge status={
                    c.auditStatus === 'Passed' ? 'Approved' :
                    c.auditStatus === 'Pending' ? 'Pending' :
                    c.auditStatus === 'Re-audit Required' ? 'Under Review' : 'Draft'
                  } /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
