import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, LabelList
} from 'recharts';
import {
  AlertTriangle, Users, Building2, Briefcase, CheckCircle,
  XCircle, Activity, ArrowRight, TrendingUp, Settings, Plus
} from 'lucide-react';
import { KpiCard, StatusBadge, SectionHeader, LastUpdated } from '@/components/common';
import {
  ADMIN_KPIS, PROJECTS, PROJECT_STATUS_DATA, CENTRE_STATUS_DATA,
  EXCEPTION_DATA, RECENT_ACTIVITY
} from '@/data/mockData';
import { CentreStore, ProjectStore, UserStore } from '@/services/dataService';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.90)',
      borderRadius: 'var(--radius-md)',
      padding: '8px 12px',
      fontSize: '0.75rem',
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
    }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>}
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || 'var(--text-primary)', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const RENDERL = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (value < 5) return null;
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {value}
    </text>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [liveData, setLiveData] = useState(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadAnalytics() {
      try {
        const res = await apiClient.get(ENDPOINTS.ADMIN.ANALYTICS);
        if (isMounted && res && res.success && res.data) {
          setLiveData(res.data);
          setIsBackendConnected(true);
        }
      } catch {
        if (isMounted) {
          setIsBackendConnected(false);
        }
      }
    }
    loadAnalytics();
    return () => { isMounted = false; };
  }, []);

  const liveCentres = CentreStore.getAll();
  const liveProjects = ProjectStore.getAll();
  const liveUsers = UserStore.getAll();

  const totalCentresCount = liveData?.kpis?.totalCentres?.value ?? liveCentres.length;
  const activeCentresCount = liveData?.kpis?.totalCentres?.active ?? liveCentres.filter(c => c.centre_status === 'Approved' || c.centre_status === 'Active').length;
  const activeProjectsCount = liveData?.kpis?.activeProjects?.value ?? liveProjects.filter(p => p.status === 'Active').length;
  const totalProjectsCount = liveData?.kpis?.activeProjects?.total ?? liveProjects.length;
  const activeUsersCount = liveData?.kpis?.activeUsers?.value ?? liveUsers.filter(u => u.status === 'Active').length;
  const totalUsersCount = liveData?.kpis?.activeUsers?.total ?? liveUsers.length;
  const openExceptionsCount = liveData?.kpis?.openExceptions?.value ?? ADMIN_KPIS.openExceptions.value;
  const pendingApprovalsCount = liveData?.kpis?.pendingApprovals?.value ?? ADMIN_KPIS.pendingApprovals.value;

  const projectChartData = liveData?.charts?.projectStatusData?.length
    ? liveData.charts.projectStatusData
    : PROJECT_STATUS_DATA;

  const centreChartData = liveData?.charts?.centreStatusData?.length
    ? liveData.charts.centreStatusData
    : CENTRE_STATUS_DATA;

  const recentActivityData = liveData?.recentActivity?.length
    ? liveData.recentActivity.map(a => ({
        id: a.id,
        actor: a.user,
        action: a.action,
        module: a.entity,
        project: a.entityId || 'Master',
        ts: a.time,
      }))
    : RECENT_ACTIVITY;

  const slaColors = {
    OnTrack: 'var(--color-success)',
    AtRisk:  'var(--color-warning)',
    Delayed: 'var(--color-danger)',
    Completed: 'var(--text-muted)',
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">Executive Overview</h1>
            <p className="page-header__subtitle">Enterprise-wide operations health &amp; exception summary</p>
          </div>
          <div className="page-header__actions">
            <span
              className={`badge ${isBackendConnected ? 'badge-success' : 'badge-neutral'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', fontSize: '0.75rem' }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isBackendConnected ? 'var(--color-success)' : 'var(--text-muted)',
                  display: 'inline-block',
                }}
              />
              {isBackendConnected ? 'Connected (Neon API)' : 'Local Cache'}
            </span>
            <LastUpdated />
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/centres')}>
              <Building2 size={13} /> Centre Master
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/projects')}>
              <Plus size={13} /> New Project
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards with Live Navigation */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard
          label="Active Projects"
          value={activeProjectsCount}
          sub={`${totalProjectsCount} total projects`}
          icon="Briefcase"
          variant="blue"
          iconBg="rgba(37, 99, 235, 0.12)"
          iconColor="#1d4ed8"
          onClick={() => navigate('/admin/projects')}
        />
        <KpiCard
          label="Total Centres"
          value={totalCentresCount}
          sub={`${activeCentresCount} active / verified`}
          icon="Building2"
          variant="teal"
          iconBg="rgba(13, 148, 136, 0.12)"
          iconColor="#0d9488"
          onClick={() => navigate('/admin/centres')}
        />
        <KpiCard
          label="Active Users"
          value={activeUsersCount}
          sub={`${totalUsersCount} accounts`}
          icon="Users"
          variant="purple"
          iconBg="rgba(124, 58, 237, 0.10)"
          iconColor="#7c3aed"
          onClick={() => navigate('/admin/users')}
        />
        <KpiCard
          label="Open Exceptions"
          value={openExceptionsCount}
          sub={`${openExceptionsCount} critical`}
          icon="AlertTriangle"
          variant="red"
          iconBg="rgba(220, 38, 38, 0.10)"
          iconColor="#dc2626"
          onClick={() => navigate('/admin/config')}
        />
        <KpiCard
          label="Pending Approvals"
          value={pendingApprovalsCount}
          sub="Requires review"
          icon="CheckCircle"
          variant="orange"
          iconBg="rgba(217, 119, 6, 0.10)"
          iconColor="#d97706"
          onClick={() => navigate('/admin/centres')}
        />
        <KpiCard
          label="Security & Audit"
          value="Audit Trail"
          sub="Live immutable log"
          icon="ShieldCheck"
          variant="indigo"
          iconBg="rgba(37, 99, 235, 0.10)"
          iconColor="#2563eb"
          onClick={() => navigate('/admin/config')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid-cols-chart" style={{ marginBottom: 24 }}>

        {/* Project Status */}
        <div className="card card--chart-blue" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Project Status Distribution</span>
            <span className="badge badge-neutral">{projectChartData.length} stages</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={projectChartData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={RENDERL}
                >
                  {projectChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={v => <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Centre Status */}
        <div className="card card--chart-teal" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Centre Status Distribution</span>
            <span className="badge badge-neutral">{totalCentresCount} centres</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={centreChartData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={RENDERL}
                >
                  {centreChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={v => <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Exceptions by Severity */}
      <div className="grid-cols-chart" style={{ marginBottom: 24 }}>
        <div className="card card--chart-amber" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Exceptions by Severity</span>
            <span className="badge badge-danger">{EXCEPTION_DATA.reduce((s, d) => s + d.value, 0)} total</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={EXCEPTION_DATA} barSize={36} margin={{ left: -10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Exceptions">
                  {EXCEPTION_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                  <LabelList dataKey="value" position="top" style={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card card--chart-activity" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
            <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => navigate('/admin/config')}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ padding: '4px 0', flex: 1 }}>
            {recentActivityData.map((a) => (
              <div key={a.id} style={{
                padding: '10px 20px',
                borderBottom: '1px solid var(--glass-border-subtle)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--color-primary-light)',
                  marginTop: 5,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {a.actor}
                    <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> — {a.action}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {a.module} · {a.project}
                  </div>
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {new Date(a.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Projects — KPI Summary</span>
          <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => navigate('/admin/projects')}>
            Manage <ArrowRight size={12} />
          </button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Stage</th>
                <th>Centres (Booked / Target)</th>
                <th>Candidates</th>
                <th>Exam Date</th>
                <th>SLA</th>
              </tr>
            </thead>
            <tbody>
              {PROJECTS.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.id}</div>
                  </td>
                  <td>{p.client}</td>
                  <td><StatusBadge status={p.stage.split(' ')[0] === 'Document' ? 'Under Review' : p.stage === 'Closed' ? 'Closed' : 'Active'} /></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{p.centreBooked}</span>
                        <span style={{ color: 'var(--text-muted)' }}> / {p.centreTarget}</span>
                      </div>
                      <div style={{ flex: 1, maxWidth: 80 }}>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, (p.centreBooked / p.centreTarget) * 100)}%`,
                              background: 'var(--color-primary)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{p.candidateTarget.toLocaleString('en-IN')}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(p.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: slaColors[p.slaHealth],
                    }}>
                      {p.slaHealth === 'OnTrack' ? '✓ On Track' :
                       p.slaHealth === 'AtRisk'  ? '⚠ At Risk' :
                       p.slaHealth === 'Delayed' ? '✗ Delayed' : '● Completed'}
                    </span>
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
