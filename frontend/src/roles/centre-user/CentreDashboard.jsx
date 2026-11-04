import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  FileText, Loader2, AlertCircle, RefreshCw, ClipboardList,
  ShieldCheck, Cpu, Send, Check
} from 'lucide-react';
import { KpiCard, StatusBadge, LastUpdated } from '@/components/common';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { ROUTES } from '@/constants/routes';
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
      const res = await apiClient.get(ENDPOINTS.CENTRE_PORTAL.MY_CENTRE);
      if (res && res.success && res.data) {
        setCentreProfile(res.data);
      } else {
        // Fallback: check /centres
        const fallback = await apiClient.get(ENDPOINTS.ADMIN.CENTRES, { params: { limit: 1 } });
        if (fallback && fallback.success && Array.isArray(fallback.data) && fallback.data.length > 0) {
          setCentreProfile(fallback.data[0]);
        } else {
          setCentreProfile(null);
        }
      }
    } catch (err) {
      console.warn('Failed to query centre profile:', err);
      // Fallback
      try {
        const fallback = await apiClient.get(ENDPOINTS.ADMIN.CENTRES, { params: { limit: 1 } });
        if (fallback && fallback.success && Array.isArray(fallback.data) && fallback.data.length > 0) {
          setCentreProfile(fallback.data[0]);
        } else {
          setCentreProfile(null);
        }
      } catch (e) {
        setError(err.message || 'Unable to retrieve centre record');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const status = centreProfile?.centreStatus || 'Not Started';
  const isDraft = status === 'Draft' || !centreProfile;
  const isSubmitted = status === 'Registered';
  const isApproved = status === 'Ready to Book' || status === 'Approved';
  const isRejected = status === 'Rejected';

  const docs = centreProfile?.documents || [];
  const verifiedDocsCount = docs.filter((d) => d.status === 'Verified').length;

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">Centre User Dashboard</h1>
            <p className="page-header__subtitle">
              {centreProfile
                ? `${centreProfile.centreName || centreProfile.centre_name} (${centreProfile.centreCode || centreProfile.centre_id})`
                : 'Centre onboarding workspace and application dossier'}
            </p>
          </div>
          <div className="page-header__actions" style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={loadProfile} disabled={loading} title="Refresh Dashboard">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <LastUpdated />
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#991b1b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} />
            <div>
              <strong>Connection Notice:</strong> {error}
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

      {/* ── Dynamic Lifecycle Banner (Centre Portal Workflow) ── */}
      {!loading && (
        <div
          className="card"
          style={{
            padding: '18px 24px',
            marginBottom: 24,
            background: isApproved
              ? '#f0fdf4'
              : isSubmitted
              ? '#eff6ff'
              : isRejected
              ? '#fef2f2'
              : '#fffbeb',
            border: `1px solid ${
              isApproved
                ? '#86efac'
                : isSubmitted
                ? '#bfdbfe'
                : isRejected
                ? '#fecaca'
                : '#fde68a'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {isApproved && <CheckCircle2 size={28} color="#16a34a" />}
            {isSubmitted && <Clock size={28} color="#2563eb" />}
            {isRejected && <AlertTriangle size={28} color="#dc2626" />}
            {isDraft && <ClipboardList size={28} color="#d97706" />}

            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: isApproved ? '#166534' : isSubmitted ? '#1e40af' : isRejected ? '#991b1b' : '#92400e',
                }}
              >
                {isApproved && 'Centre Application Approved — Ready to Book'}
                {isSubmitted && 'Application Submitted — Under Verification'}
                {isRejected && 'Application Returned for Correction / Rejected'}
                {isDraft && (centreProfile ? 'Application Draft Saved — Incomplete' : 'Centre Onboarding Not Started')}
              </div>
              <div
                style={{
                  fontSize: '0.8125rem',
                  marginTop: 2,
                  color: isApproved ? '#15803d' : isSubmitted ? '#1d4ed8' : isRejected ? '#b91c1c' : '#b45309',
                }}
              >
                {isApproved && 'Your centre has passed document and infrastructure verification and is eligible for examination booking.'}
                {isSubmitted && 'Your 7-step registration dossier is being reviewed by the OEMP operations team.'}
                {isRejected && `Reason: ${centreProfile?.rejectionReason || 'Please review your submitted documents and re-apply.'}`}
                {isDraft && 'Complete all seven sections (Basic Info, Personnel, Documents, Facilities, Power, Safety, and Bank Details).'}
              </div>
            </div>
          </div>

          <button
            className="btn btn-sm btn-primary"
            onClick={() => navigate(ROUTES.CENTRE.REGISTRATION)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: isApproved ? '#16a34a' : isRejected ? '#dc2626' : '#1e40af',
              borderColor: isApproved ? '#16a34a' : isRejected ? '#dc2626' : '#1e40af',
              color: '#fff',
            }}
          >
            {isDraft ? (centreProfile ? 'Continue Registration' : 'Start Centre Registration') : 'View Application Dossier'}
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard
          label="Centre Code"
          value={loading ? '...' : (centreProfile?.centreCode || centreProfile?.centre_id || 'Not Assigned')}
          sub={centreProfile ? 'Unique venue identifier' : 'Auto-generated on draft'}
          icon="Building2"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        />
        <KpiCard
          label="Workflow Status"
          value={loading ? '...' : status}
          sub="Application lifecycle"
          icon="CheckCircle"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
        <KpiCard
          label="Declared Nodes"
          value={loading ? '...' : `${centreProfile?.capacity?.examNodes || centreProfile?.totalNodes || 0} nodes`}
          sub="Examination capacity"
          icon="Cpu"
          iconBg="#faf5ff"
          iconColor="#7c3aed"
        />
        <KpiCard
          label="Verified Documents"
          value={loading ? '...' : `${verifiedDocsCount} / ${docs.length}`}
          sub="Verification progress"
          icon="ShieldCheck"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
      </div>

      {/* ── Centre Details Card ── */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Centre Profile Record — Real-time Database</span>
          <button
            className="btn btn-xs btn-secondary"
            onClick={() => navigate(ROUTES.CENTRE.REGISTRATION)}
          >
            Open 7-Step Form
          </button>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
              Loading centre records from MySQL database...
            </div>
          ) : centreProfile ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Venue Name</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: 2 }}>
                  {centreProfile.centreName || centreProfile.centre_name}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Postal Address</div>
                <div style={{ fontSize: '0.875rem', marginTop: 2 }}>
                  {centreProfile.centreAddress || centreProfile.centre_address}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jurisdiction</div>
                <div style={{ fontSize: '0.875rem', marginTop: 2 }}>
                  {centreProfile.cityName || '—'}, {centreProfile.stateName || '—'} (PIN: {centreProfile.pincode})
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official Email</div>
                <div style={{ fontSize: '0.875rem', marginTop: 2 }}>
                  {centreProfile.officialEmail || '—'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <Building2 size={32} style={{ margin: '0 auto 8px', opacity: 0.5, display: 'block' }} />
              <div style={{ fontWeight: 600, color: '#334155' }}>No Centre Registered Yet</div>
              <div style={{ fontSize: '0.8125rem', marginTop: 4 }}>
                Click below to start your seven-step centre registration form.
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => navigate(ROUTES.CENTRE.REGISTRATION)}
                style={{ marginTop: 14 }}
              >
                Begin Centre Registration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
