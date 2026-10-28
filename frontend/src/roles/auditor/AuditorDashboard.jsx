import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertOctagon, RefreshCw, ClipboardCheck, ShieldCheck, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { KpiCard, StatusBadge, LastUpdated } from '@/components/common';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';

export default function AuditorDashboard() {
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
      console.error('Failed to query auditor centres:', err);
      setError(err.message || 'Unable to retrieve assigned centres');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const approvedCentres = centres.filter(c => (c.centreStatus || c.centre_status) === 'Approved');
  const pendingReview = centres.filter(c => (c.centreStatus || c.centre_status) === 'Draft');
  const blacklistedCentres = centres.filter(c => c.eligibilityStatus === 'Blacklisted');

  return (
    <div>
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">Auditor Portal</h1>
            <p className="page-header__subtitle">Assigned venue audits, compliance status, and security checkpoints</p>
          </div>
          <div className="page-header__actions">
            <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <LastUpdated />
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/auditor/audits')}>
              <AlertOctagon size={13} /> Record Finding
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
              <strong>Failed to query audit database:</strong> {error}
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
          label="Registered Venues"
          value={loading ? '...' : centres.length}
          sub={`${pendingReview.length} pending review`}
          icon="ClipboardCheck"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        />
        <KpiCard
          label="Compliant / Approved"
          value={loading ? '...' : approvedCentres.length}
          sub="Passed verification"
          icon="ShieldCheck"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
        <KpiCard
          label="De-paneled / Blacklisted"
          value={loading ? '...' : blacklistedCentres.length}
          sub="Critical compliance breach"
          icon="AlertOctagon"
          iconBg="#fef2f2"
          iconColor="#dc2626"
        />
        <KpiCard
          label="Pending Review"
          value={loading ? '...' : pendingReview.length}
          sub="Awaiting audit signoff"
          icon="RefreshCw"
          iconBg="#faf5ff"
          iconColor="#7c3aed"
        />
      </div>

      {/* Audit Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Centre Audit Master Registry</span>
          <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => navigate('/auditor/audits')}>
            All Audits <ArrowRight size={12} />
          </button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Centre Code</th>
                <th>Centre Name &amp; Address</th>
                <th>Location</th>
                <th>Audit / Onboarding Status</th>
                <th>Eligibility Status</th>
                <th>Capacity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <Loader2 className="animate-spin" size={22} style={{ margin: '0 auto 8px', display: 'block' }} />
                    Loading assigned centres from database...
                  </td>
                </tr>
              ) : centres.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No audit records or venues found in MySQL database.
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {c.centreAddress || c.centre_address}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {c.cityName || '—'}, {c.stateName || '—'}
                    </td>
                    <td>
                      <StatusBadge status={c.centreStatus || c.centre_status || 'Draft'} />
                    </td>
                    <td>
                      <StatusBadge status={c.eligibilityStatus || 'Eligible'} />
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      <strong>{c.capacity?.examNodes || 0}</strong> nodes
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate('/auditor/audits')}
                      >
                        Inspect
                      </button>
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
