import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, LabelList
} from 'recharts';
import { FolderOpen, Clock, Lock, Building2, ArrowRight, TrendingUp, Plus } from 'lucide-react';
import { KpiCard, StatusBadge, ProgressRing, LastUpdated } from '@/components/common';
import { PM_KPIS, PROJECTS, PROJECT_STATUS_DATA } from '@/data/mockData';
import { ProjectStore, CentreStore } from '@/services/dataService';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: '0.75rem', boxShadow: 'var(--shadow-md)' }}>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-primary)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || '#1e40af', display: 'inline-block' }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const SLA_DATA = [
  { name: 'On Track', value: 2, color: '#16a34a' },
  { name: 'At Risk',  value: 1, color: '#d97706' },
  { name: 'Delayed',  value: 1, color: '#dc2626' },
];

const COVERAGE_DATA = PROJECTS.filter(p => p.status === 'Active').map(p => ({
  name: p.name.split('–')[0].trim(),
  booked: p.centreBooked,
  target: p.centreTarget,
  ready:  p.centreReady,
}));

export default function PMDashboard() {
  const navigate = useNavigate();
  const liveProjects = ProjectStore.getAll();
  const activeProjects = liveProjects.filter(p => p.status === 'Active');
  const liveCentres = CentreStore.getAll();

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">My Projects</h1>
            <p className="page-header__subtitle">Project lifecycle, SLA health, allocation and closure</p>
          </div>
          <div className="page-header__actions">
            <LastUpdated />
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/pm/pipeline')}>
              <Building2 size={13} /> Centre Pipeline
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/pm/setup')}>
              <Plus size={13} /> New Project Setup
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard
          label="Assigned Projects"
          value={liveProjects.length}
          sub={`${activeProjects.length} active`}
          icon="FolderOpen"
          iconBg="#eff6ff" iconColor="#1e40af"
          onClick={() => navigate('/pm/setup')}
        />
        <KpiCard
          label="Centres in Pipeline"
          value={liveCentres.length}
          sub={`${liveCentres.filter(c => c.centre_status === 'Approved').length} approved`}
          icon="Building2"
          iconBg="#f0fdf4" iconColor="#16a34a"
          onClick={() => navigate('/pm/pipeline')}
        />
        <KpiCard
          label="Overdue Actions"
          value={PM_KPIS.overdueActions.value}
          icon="Clock"
          iconBg="#fffbeb" iconColor="#d97706"
        />
        <KpiCard
          label="Allocations Locked"
          value={`${PM_KPIS.allocationLocked.value}/${PM_KPIS.allocationLocked.total}`}
          icon="Lock"
          iconBg="#faf5ff" iconColor="#7c3aed"
        />
      </div>

      {/* Charts */}
      <div className="grid-cols-chart" style={{ marginBottom: 24 }}>

        {/* SLA Compliance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">SLA Compliance</span>
            <span className="badge badge-neutral">{activeProjects.length} active projects</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={SLA_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" labelLine={false}>
                  {SLA_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Centre Coverage */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Centre Coverage &amp; Readiness</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={COVERAGE_DATA} barSize={16} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
                <Legend formatter={v => <span style={{ fontSize: '0.75rem' }}>{v}</span>} />
                <Bar dataKey="target" name="Target"  fill="#e2e8f0" radius={[3,3,0,0]} />
                <Bar dataKey="booked" name="Booked"  fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar dataKey="ready"  name="Ready"   fill="#16a34a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Project Pipeline</span>
          <button className="btn btn-ghost btn-sm" style={{ gap: 4 }}>All Projects <ArrowRight size={12} /></button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Stage</th>
                <th>Centres Ready</th>
                <th>Exam Date</th>
                <th>SLA Status</th>
              </tr>
            </thead>
            <tbody>
              {activeProjects.map(p => {
                const readyPct = Math.round((p.centreReady / p.centreTarget) * 100);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.client}</div>
                    </td>
                    <td><StatusBadge status={p.stage} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ProgressRing value={p.centreReady} max={p.centreTarget} size={36} strokeWidth={4}
                          color={readyPct >= 80 ? '#16a34a' : readyPct >= 50 ? '#d97706' : '#dc2626'} />
                        <span style={{ fontSize: '0.8125rem' }}>
                          <strong>{p.centreReady}</strong>
                          <span style={{ color: 'var(--text-muted)' }}> / {p.centreTarget} ({readyPct}%)</span>
                        </span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(p.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <StatusBadge status={
                        p.slaHealth === 'OnTrack' ? 'Active' :
                        p.slaHealth === 'AtRisk'  ? 'Under Review' :
                        p.slaHealth === 'Delayed' ? 'Delayed' : 'Completed'
                      } />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
