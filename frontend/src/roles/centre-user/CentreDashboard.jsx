import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Upload, Bell, Clock, AlertTriangle, ArrowRight, Building2, FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { KpiCard, StatusBadge, LastUpdated } from '@/components/common';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { useAuth } from '@/context/AuthContext';

export default function CentreDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [centreProfile, setCentreProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.CENTRES, { params: { limit: 1 } });
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setCentreProfile(res.data[0]);
      } else {
        setCentreProfile(null);
      }
    } catch (err) {
      console.error('Failed to query centre profile:', err);
      setError(err.message || 'Unable to retrieve centre record');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">Centre User Dashboard</h1>
            <p className="page-header__subtitle">
              {centreProfile
                ? `${centreProfile.centreName || centreProfile.centre_name} (${centreProfile.centreCode || centreProfile.centre_id})`
                : 'Centre profile and document checklist'}
            </p>
          </div>
          <div className="page-header__actions">
            <button className="btn btn-secondary btn-sm" onClick={loadProfile} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <LastUpdated />
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
              <strong>Database Connection Error:</strong> {error}
            </div>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={loadProfile}
            style={{ background: '#fff', borderColor: '#f87171', color: '#991b1b' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard
          label="Centre Code"
          value={loading ? '...' : (centreProfile?.centreCode || centreProfile?.centre_id || 'N/A')}
          sub={centreProfile ? 'Assigned venue ID' : 'Not assigned'}
          icon="Building2"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        />
        <KpiCard
          label="Verification Status"
          value={loading ? '...' : (centreProfile?.centreStatus || centreProfile?.centre_status || 'Draft')}
          sub="Governance compliance"
          icon="CheckCircle"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
        <KpiCard
          label="Eligibility Rating"
          value={loading ? '...' : (centreProfile?.eligibilityStatus || 'Eligible')}
          sub="De-paneling status"
          icon="ShieldCheck"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
        <KpiCard
          label="Assigned Capacity"
          value={loading ? '...' : `${centreProfile?.capacity?.examNodes || 0} nodes`}
          sub="Verified exam nodes"
          icon="Cpu"
          iconBg="#faf5ff"
          iconColor="#7c3aed"
        />
      </div>

      {/* Details Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Centre Profile Details — Live Records</span>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
              Loading centre records from MySQL database...
            </div>
          ) : centreProfile ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Venue Name</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: 2 }}>{centreProfile.centreName || centreProfile.centre_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Postal Address</div>
                <div style={{ fontSize: '0.875rem', marginTop: 2 }}>{centreProfile.centreAddress || centreProfile.centre_address}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jurisdiction</div>
                <div style={{ fontSize: '0.875rem', marginTop: 2 }}>
                  {centreProfile.cityName || '—'}, {centreProfile.stateName || '—'} (PIN: {centreProfile.pincode})
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official Email</div>
                <div style={{ fontSize: '0.875rem', marginTop: 2 }}>{centreProfile.officialEmail || '—'}</div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              No examination centre assigned to this user in MySQL database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
