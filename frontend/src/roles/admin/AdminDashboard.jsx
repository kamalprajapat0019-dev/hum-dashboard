import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  AlertTriangle, Users, Building2, Briefcase, CheckCircle,
  Activity, ArrowRight, Plus, RefreshCw, AlertCircle, ShieldCheck
} from 'lucide-react';
import { KpiCard, StatusBadge, LastUpdated } from '@/components/common';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(226, 232, 240, 0.90)',
      borderRadius: 'var(--radius-md, 8px)',
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

const RENDERL = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (value < 1) return null;
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {value}
    </text>
  );
};

const EmptyChartPlaceholder = ({ title, message }) => (
  <div style={{
    height: 220,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '16px',
    background: 'rgba(248, 250, 252, 0.5)',
    borderRadius: 'var(--radius-md, 8px)',
    border: '1px dashed var(--border-default, #e2e8f0)',
  }}>
    <Activity size={28} style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: 8, opacity: 0.6 }} />
    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>{title}</span>
    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: 4, maxWidth: 220 }}>{message}</span>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [liveData, setLiveData] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, projectsRes] = await Promise.allSettled([
        apiClient.get(ENDPOINTS.ADMIN.ANALYTICS),
        apiClient.get(ENDPOINTS.ADMIN.PROJECTS, { params: { limit: 10 } }),
      ]);

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.success) {
        setLiveData(analyticsRes.value.data);
      } else {
        throw new Error(analyticsRes.reason?.message || 'Failed to fetch executive analytics');
      }

      if (projectsRes.status === 'fulfilled' && projectsRes.value?.success && Array.isArray(projectsRes.value.data)) {
        setProjectsList(projectsRes.value.data);
      } else {
        setProjectsList([]);
      }
    } catch (err) {
      console.error('Failed to load live dashboard data:', err);
      setError(err.message || 'Unable to connect to backend API server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Aggregate values directly from MySQL response - ZERO fake fallbacks
  const totalCentresCount = liveData?.kpis?.totalCentres?.value ?? 0;
  const activeCentresCount = liveData?.kpis?.totalCentres?.active ?? 0;
  const activeProjectsCount = liveData?.kpis?.activeProjects?.value ?? 0;
  const totalProjectsCount = liveData?.kpis?.activeProjects?.total ?? 0;
  const activeUsersCount = liveData?.kpis?.activeUsers?.value ?? 0;
  const totalUsersCount = liveData?.kpis?.activeUsers?.total ?? 0;
  const openExceptionsCount = liveData?.kpis?.openExceptions?.value ?? 0;
  const pendingApprovalsCount = liveData?.kpis?.pendingApprovals?.value ?? 0;

  const projectChartData = liveData?.charts?.projectStatusData || [];
  const centreChartData = liveData?.charts?.centreStatusData || [];
  const recentActivityData = liveData?.recentActivity || [];

  const slaColors = {
    OnTrack: 'var(--color-success, #16a34a)',
    AtRisk:  'var(--color-warning, #d97706)',
    Delayed: 'var(--color-danger, #dc2626)',
    Completed: 'var(--text-muted, #94a3b8)',
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">Executive Overview</h1>
            <p className="page-header__subtitle">Enterprise operations health &amp; live database aggregates</p>
          </div>
          <div className="page-header__actions">
            <span
              className={`badge ${!error && liveData ? 'badge-success' : 'badge-danger'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', fontSize: '0.75rem' }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: !error && liveData ? 'var(--color-success, #16a34a)' : 'var(--color-danger, #dc2626)',
                  display: 'inline-block',
                }}
              />
              {!error && liveData ? 'Connected (MySQL)' : 'API Disconnected'}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchDashboardData}
              disabled={loading}
              title="Refresh Data from Server"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
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

      {/* Error Banner with Retry */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#991b1b',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} />
            <div>
              <strong>Database Connection Error:</strong> {error}
            </div>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={fetchDashboardData}
            style={{ background: '#fff', borderColor: '#f87171', color: '#991b1b' }}
          >
            Retry Query
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard
          label="Active Projects"
          value={loading ? '...' : activeProjectsCount}
          sub={`${totalProjectsCount} total projects`}
          icon="Briefcase"
          variant="blue"
          iconBg="rgba(37, 99, 235, 0.12)"
          iconColor="#1d4ed8"
          onClick={() => navigate('/admin/projects')}
        />
        <KpiCard
          label="Total Centres"
          value={loading ? '...' : totalCentresCount}
          sub={`${activeCentresCount} active / verified`}
          icon="Building2"
          variant="teal"
          iconBg="rgba(13, 148, 136, 0.12)"
          iconColor="#0d9488"
          onClick={() => navigate('/admin/centres')}
        />
        <KpiCard
          label="Active Users"
          value={loading ? '...' : activeUsersCount}
          sub={`${totalUsersCount} accounts in DB`}
          icon="Users"
          variant="purple"
          iconBg="rgba(124, 58, 237, 0.10)"
          iconColor="#7c3aed"
          onClick={() => navigate('/admin/users')}
        />
        <KpiCard
          label="Open Exceptions"
          value={loading ? '...' : openExceptionsCount}
          sub={`${openExceptionsCount} active blacklists`}
          icon="AlertTriangle"
          variant="red"
          iconBg="rgba(220, 38, 38, 0.10)"
          iconColor="#dc2626"
          onClick={() => navigate('/admin/eligibility')}
        />
        <KpiCard
          label="Pending Approvals"
          value={loading ? '...' : pendingApprovalsCount}
          sub="Centres awaiting review"
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
            <span className="badge badge-neutral">{projectChartData.length} stages active</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {projectChartData.length > 0 ? (
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
            ) : (
              <EmptyChartPlaceholder
                title="No Projects Recorded"
                message="Add your first exam project to visualize project stage distribution."
              />
            )}
          </div>
        </div>

        {/* Centre Status */}
        <div className="card card--chart-teal" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Centre Status Distribution</span>
            <span className="badge badge-neutral">{totalCentresCount} centres total</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {centreChartData.length > 0 ? (
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
            ) : (
              <EmptyChartPlaceholder
                title="No Centres Registered"
                message="Add centres to the master database to track approval and status breakdowns."
              />
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity & System Status */}
      <div className="grid-cols-chart" style={{ marginBottom: 24 }}>
        <div className="card card--chart-activity" style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
          <div className="card-header">
            <span className="card-title">Recent Audit Log &amp; Activity</span>
            <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => navigate('/admin/config')}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ padding: '4px 0', flex: 1 }}>
            {recentActivityData.length > 0 ? (
              recentActivityData.map((a) => (
                <div key={a.id} style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid var(--glass-border-subtle, #f1f5f9)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--color-primary-light, #3b82f6)',
                    marginTop: 5,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {a.user}
                      <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> — {a.action}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {a.entity} {a.entityId ? `· Ref: ${a.entityId}` : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {new Date(a.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No recent activity recorded in database audit log.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Projects — Master Registry</span>
          <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => navigate('/admin/projects')}>
            Manage Projects <ArrowRight size={12} />
          </button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Stage</th>
                <th>Centres Target</th>
                <th>Candidates</th>
                <th>Exam Date</th>
                <th>SLA Health</th>
              </tr>
            </thead>
            <tbody>
              {projectsList.length > 0 ? (
                projectsList.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.projectCode}</div>
                    </td>
                    <td>{p.client?.name || p.clientId || '—'}</td>
                    <td><StatusBadge status={p.stage || 'Setup'} /></td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{p.centreTarget || 0}</span>
                      <span style={{ color: 'var(--text-muted)' }}> target</span>
                    </td>
                    <td>{(p.candidateTarget || 0).toLocaleString('en-IN')}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {p.examDate ? new Date(p.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: slaColors[p.slaHealth] || 'var(--text-muted)',
                      }}>
                        {p.slaHealth === 'OnTrack' ? '✓ On Track' :
                         p.slaHealth === 'AtRisk'  ? '⚠ At Risk' :
                         p.slaHealth === 'Delayed' ? '✗ Delayed' : '● ' + (p.slaHealth || 'Active')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                    No projects found in MySQL database. Click &quot;New Project&quot; to initialize one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
