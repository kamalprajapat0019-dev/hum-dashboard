import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip
} from 'recharts';
import { Building2, Plus, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
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
      boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
    }}>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill || p.color || '#1e40af', display: 'inline-block' }} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

export default function OpsDashboard() {
  const navigate = useNavigate();
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.CENTRES, { params: { limit: 100 } });
      if (res && res.success && Array.isArray(res.data)) {
        setCentres(res.data);
      } else {
        setCentres([]);
      }
    } catch (err) {
      console.error('Failed to query operations database:', err);
      setError(err.message || 'Unable to retrieve operations pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const approvedCentres = centres.filter(c => (c.centreStatus || c.centre_status) === 'Approved');
  const draftCentres = centres.filter(c => (c.centreStatus || c.centre_status) === 'Draft');
  const activeCentres = centres.filter(c => (c.centreStatus || c.centre_status) === 'Active');
  const inactiveCentres = centres.filter(c => (c.centreStatus || c.centre_status) === 'Rejected' || (c.centreStatus || c.centre_status) === 'Inactive');

  const statusChartData = [
    { name: 'Approved', value: approvedCentres.length, color: '#16a34a' },
    { name: 'Active', value: activeCentres.length, color: '#2563eb' },
    { name: 'Draft', value: draftCentres.length, color: '#d97706' },
    { name: 'Inactive', value: inactiveCentres.length, color: '#dc2626' },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">Operations Board</h1>
            <p className="page-header__subtitle">Live centre operations, capacity metrics, and venue onboarding status</p>
          </div>
          <div className="page-header__actions">
            <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <LastUpdated />
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/ops/booking')}>
              <Building2 size={13} /> Manage Centres
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
              <strong>Failed to query operations database:</strong> {error}
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
          label="Total Centres"
          value={loading ? '...' : centres.length}
          sub={`${approvedCentres.length} approved`}
          icon="Building2"
          iconBg="#eff6ff"
          iconColor="#1e40af"
          onClick={() => navigate('/ops/booking')}
        />
        <KpiCard
          label="Approved Venues"
          value={loading ? '...' : approvedCentres.length}
          sub="Verified and ready"
          icon="ShieldCheck"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
        <KpiCard
          label="Onboarding Drafts"
          value={loading ? '...' : draftCentres.length}
          sub="Awaiting verification"
          icon="FileWarning"
          iconBg="#fffbeb"
          iconColor="#d97706"
        />
        <KpiCard
          label="Inactive / Flagged"
          value={loading ? '...' : inactiveCentres.length}
          sub="Deactivated venues"
          icon="AlertCircle"
          iconBg="#fef2f2"
          iconColor="#dc2626"
        />
      </div>

      {/* Charts Row */}
      <div className="grid-cols-chart" style={{ marginBottom: 24 }}>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <span className="card-title">Centre Onboarding &amp; Status Distribution</span>
            <span className="badge badge-neutral">{centres.length} total venues in DB</span>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" labelLine={false}>
                    {statusChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No centre records available in MySQL database.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Operations Centre Registry — Live Records</span>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Centre Code</th>
                <th>Venue Name</th>
                <th>Jurisdiction</th>
                <th>Venue Status</th>
                <th>Operations Status</th>
                <th>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <Loader2 className="animate-spin" size={22} style={{ margin: '0 auto 8px', display: 'block' }} />
                    Loading operations queue from database...
                  </td>
                </tr>
              ) : centres.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No centres found in MySQL database.
                  </td>
                </tr>
              ) : (
                centres.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {c.centreCode || c.centre_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.centreName || c.centre_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.centreAddress || c.centre_address}</div>
                    </td>
                    <td>{c.cityName || '—'}, {c.stateName || '—'}</td>
                    <td>
                      <span className={`badge ${c.venueStatus === 'Old' ? 'badge-info' : 'badge-neutral'}`}>
                        {c.venueStatus || 'Old'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={c.centreStatus || c.centre_status || 'Draft'} />
                    </td>
                    <td>
                      <strong>{c.capacity?.examNodes || 0}</strong> nodes
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
