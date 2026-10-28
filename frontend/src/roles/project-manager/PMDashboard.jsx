import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { FolderOpen, Building2, ArrowRight, Plus, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { KpiCard, StatusBadge, LastUpdated } from '@/components/common';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-default, #e2e8f0)',
      borderRadius: 'var(--radius-md, 8px)',
      padding: '8px 12px',
      fontSize: '0.75rem',
      boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))'
    }}>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-primary)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill || '#1e40af', display: 'inline-block' }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function PMDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, centreRes] = await Promise.allSettled([
        apiClient.get(ENDPOINTS.ADMIN.PROJECTS, { params: { limit: 100 } }),
        apiClient.get(ENDPOINTS.ADMIN.CENTRES, { params: { limit: 100 } }),
      ]);

      if (projRes.status === 'fulfilled' && projRes.value?.success && Array.isArray(projRes.value.data)) {
        setProjects(projRes.value.data);
      } else {
        setProjects([]);
      }

      if (centreRes.status === 'fulfilled' && centreRes.value?.success && Array.isArray(centreRes.value.data)) {
        setCentres(centreRes.value.data);
      } else {
        setCentres([]);
      }
    } catch (err) {
      console.error('Failed to query PM projects:', err);
      setError(err.message || 'Unable to retrieve assigned projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeProjects = projects.filter(p => p.status === 'Active');

  // Compute live SLA distribution from database
  const slaCounts = {
    OnTrack: activeProjects.filter(p => p.slaHealth === 'OnTrack').length,
    AtRisk: activeProjects.filter(p => p.slaHealth === 'AtRisk').length,
    Delayed: activeProjects.filter(p => p.slaHealth === 'Delayed').length,
  };

  const slaData = [
    { name: 'On Track', value: slaCounts.OnTrack, color: '#16a34a' },
    { name: 'At Risk',  value: slaCounts.AtRisk, color: '#d97706' },
    { name: 'Delayed',  value: slaCounts.Delayed, color: '#dc2626' },
  ].filter(d => d.value > 0);

  // Compute live Coverage data from database projects
  const coverageData = activeProjects.map(p => ({
    name: p.name?.split('–')[0]?.trim() || p.projectCode,
    target: p.centreTarget || 0,
    booked: p._count?.bookings || 0,
    ready: 0,
  }));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">Project Manager Overview</h1>
            <p className="page-header__subtitle">Active project lifecycle, database SLA health, and capacity tracking</p>
          </div>
          <div className="page-header__actions">
            <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
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

      {/* Error Banner */}
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
              <strong>Failed to query project database:</strong> {error}
            </div>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={loadData}
            style={{ background: '#fff', borderColor: '#f87171', color: '#991b1b' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard
          label="Assigned Projects"
          value={loading ? '...' : projects.length}
          sub={`${activeProjects.length} active`}
          icon="FolderOpen"
          iconBg="#eff6ff" iconColor="#1e40af"
          onClick={() => navigate('/pm/setup')}
        />
        <KpiCard
          label="Centres in Master"
          value={loading ? '...' : centres.length}
          sub={`${centres.filter(c => (c.centreStatus || c.centre_status) === 'Approved').length} approved`}
          icon="Building2"
          iconBg="#f0fdf4" iconColor="#16a34a"
          onClick={() => navigate('/pm/pipeline')}
        />
        <KpiCard
          label="At-Risk Projects"
          value={loading ? '...' : slaCounts.AtRisk}
          sub="Requires PM attention"
          icon="AlertTriangle"
          iconBg="#fffbeb" iconColor="#d97706"
        />
        <KpiCard
          label="Delayed Stages"
          value={loading ? '...' : slaCounts.Delayed}
          sub="Critical SLA breach"
          icon="AlertCircle"
          iconBg="#fef2f2" iconColor="#dc2626"
        />
      </div>

      {/* Charts */}
      <div className="grid-cols-chart" style={{ marginBottom: 24 }}>

        {/* SLA Compliance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">SLA Compliance Breakdown</span>
            <span className="badge badge-neutral">{activeProjects.length} active projects</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {slaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={slaData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" labelLine={false}>
                    {slaData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No active projects to calculate SLA compliance.
              </div>
            )}
          </div>
        </div>

        {/* Centre Coverage */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Target vs Booked Venues</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {coverageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={coverageData} barSize={16} margin={{ left: -20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
                  <Legend formatter={v => <span style={{ fontSize: '0.75rem' }}>{v}</span>} />
                  <Bar dataKey="target" name="Target" fill="#e2e8f0" radius={[3,3,0,0]} />
                  <Bar dataKey="booked" name="Booked" fill="#3b82f6" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No project target data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Project Pipeline — Live Records</span>
          <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => navigate('/pm/setup')}>
            Manage All <ArrowRight size={12} />
          </button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Stage</th>
                <th>Target Centres</th>
                <th>Exam Date</th>
                <th>SLA Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    <Loader2 className="animate-spin" size={20} style={{ margin: '0 auto 6px', display: 'block' }} />
                    Loading project pipeline from database...
                  </td>
                </tr>
              ) : activeProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No active projects found in database. Click &quot;New Project Setup&quot; to initialize one.
                  </td>
                </tr>
              ) : (
                activeProjects.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.projectCode}</div>
                    </td>
                    <td>{p.client?.name || p.clientId || '—'}</td>
                    <td><StatusBadge status={p.stage} /></td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{p.centreTarget || 0}</span>
                      <span style={{ color: 'var(--text-muted)' }}> target</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {p.examDate ? new Date(p.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}
                    </td>
                    <td>
                      <StatusBadge status={
                        p.slaHealth === 'OnTrack' ? 'Active' :
                        p.slaHealth === 'AtRisk'  ? 'Under Review' :
                        p.slaHealth === 'Delayed' ? 'Delayed' : 'Completed'
                      } />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
