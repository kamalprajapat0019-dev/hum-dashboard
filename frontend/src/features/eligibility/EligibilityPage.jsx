import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, Search, Filter, CheckCircle2,
  XCircle, Check, X, RefreshCw, Eye, Lock, AlertOctagon,
  Building2, Loader2, AlertCircle
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/common';

export default function EligibilityPage() {
  const { user } = useAuth();
  const [centres, setCentres] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Drawers
  const [activeCentre, setActiveCentre] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [centresRes, projectsRes] = await Promise.allSettled([
        apiClient.get(ENDPOINTS.ADMIN.CENTRES, { params: { limit: 100 } }),
        apiClient.get(ENDPOINTS.ADMIN.PROJECTS, { params: { limit: 100 } }),
      ]);

      if (centresRes.status === 'fulfilled' && centresRes.value?.success && Array.isArray(centresRes.value.data)) {
        setCentres(centresRes.value.data);
      } else {
        setCentres([]);
      }

      if (projectsRes.status === 'fulfilled' && projectsRes.value?.success && Array.isArray(projectsRes.value.data)) {
        setProjects(projectsRes.value.data);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('Failed to load eligibility data:', err);
      setError(err.message || 'Unable to retrieve eligibility records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCentres = centres.filter(c => {
    const name = c.centreName || c.centre_name || '';
    const city = c.cityName || '';
    const state = c.stateName || '';
    const eligibility = c.eligibilityStatus || 'Eligible';

    if (search) {
      const q = search.toLowerCase();
      const match = name.toLowerCase().includes(q) ||
                    city.toLowerCase().includes(q) ||
                    state.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'All' && eligibility !== statusFilter) return false;
    return true;
  });

  const eligibleCount = centres.filter(c => (c.eligibilityStatus || 'Eligible') === 'Eligible').length;
  const conditionalCount = centres.filter(c => c.eligibilityStatus === 'ConditionallyEligible' || c.eligibilityStatus === 'Conditional').length;
  const blacklistedCount = centres.filter(c => c.eligibilityStatus === 'Blacklisted').length;

  const handleBlacklistSubmit = async (e) => {
    e.preventDefault();
    if (!activeCentre || !blacklistReason.trim()) return;

    setSubmitting(true);
    try {
      const res = await apiClient.post(ENDPOINTS.ADMIN.BLACKLIST, {
        centreId: activeCentre.id,
        reason: blacklistReason.trim(),
      });
      if (res && res.success) {
        showToast(`Centre "${activeCentre.centreName || activeCentre.centre_name}" has been de-paneled & blacklisted in database.`);
        setShowBlacklistModal(false);
        setActiveCentre(null);
        setBlacklistReason('');
        await loadData();
      }
    } catch (err) {
      const msg = err.data?.error?.message || err.message || 'Failed to blacklist centre';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!activeCentre || !overrideReason.trim()) return;

    setSubmitting(true);
    try {
      const res = await apiClient.post(ENDPOINTS.ADMIN.OVERRIDE_ELIGIBILITY, {
        centreId: activeCentre.id,
        eligibilityStatus: 'Eligible',
        overrideReason: overrideReason.trim(),
      });
      if (res && res.success) {
        showToast(`Executive override granted for "${activeCentre.centreName || activeCentre.centre_name}".`);
        setShowOverrideModal(false);
        setActiveCentre(null);
        setOverrideReason('');
        await loadData();
      }
    } catch (err) {
      const msg = err.data?.error?.message || err.message || 'Failed to override eligibility';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: toast.type === 'error' ? '#b91c1c' : 'var(--color-primary-dark, #1e3a8a)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} color="#4ade80" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <div className="breadcrumb">
              <span>Admin</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Eligibility &amp; Blacklist</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>Centre Eligibility &amp; Blacklist Oversight</h1>
            <p className="page-header__subtitle">
              Live automated eligibility scoring, de-paneling controls, and dual-authorized executive overrides
            </p>
          </div>
          <div className="page-header__actions">
            <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
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
              <strong>Failed to query eligibility database:</strong> {error}
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
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Eligible Venues</span>
            <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
              <ShieldCheck size={16} color="#16a34a" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-success, #16a34a)' }}>
            {loading ? '...' : eligibleCount}
          </div>
          <div className="kpi-card__sub">Clear compliance record in DB</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Conditional / Under Review</span>
            <div className="kpi-card__icon" style={{ background: '#fffbeb' }}>
              <AlertTriangle size={16} color="#d97706" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-warning, #d97706)' }}>
            {loading ? '...' : conditionalCount}
          </div>
          <div className="kpi-card__sub">Subject to rework or verification</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Blacklisted Venues</span>
            <div className="kpi-card__icon" style={{ background: '#fef2f2' }}>
              <AlertOctagon size={16} color="#dc2626" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-danger, #dc2626)' }}>
            {loading ? '...' : blacklistedCount}
          </div>
          <div className="kpi-card__sub">De-paneled from examination drives</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ position: 'relative', width: 'min(100%, 300px)' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search venue name, city, state..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 30, fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${statusFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('All')}
            >
              All Venues ({centres.length})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'Eligible' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Eligible')}
            >
              Eligible ({eligibleCount})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'Blacklisted' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Blacklisted')}
            >
              Blacklisted ({blacklistedCount})
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Centre Code</th>
                <th>Centre Name</th>
                <th>Location</th>
                <th>Eligibility Status</th>
                <th>Venue Status</th>
                <th style={{ textAlign: 'right' }}>Governance Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                    Querying eligibility records from MySQL...
                  </td>
                </tr>
              ) : filteredCentres.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No centre records found matching filter.
                  </td>
                </tr>
              ) : (
                filteredCentres.map(c => {
                  const isBlacklisted = c.eligibilityStatus === 'Blacklisted';
                  return (
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
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.cityName || '—'}, {c.stateName || '—'}</div>
                      </td>
                      <td>
                        <StatusBadge status={c.eligibilityStatus || 'Eligible'} />
                      </td>
                      <td>
                        <span className={`badge ${c.venueStatus === 'Old' ? 'badge-info' : 'badge-neutral'}`}>
                          {c.venueStatus || 'Old'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {isBlacklisted ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--color-success, #16a34a)' }}
                              onClick={() => {
                                setActiveCentre(c);
                                setShowOverrideModal(true);
                              }}
                            >
                              <ShieldCheck size={13} /> Override
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--color-danger, #dc2626)' }}
                              onClick={() => {
                                setActiveCentre(c);
                                setShowBlacklistModal(true);
                              }}
                            >
                              <AlertOctagon size={13} /> Blacklist
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blacklist Modal */}
      {showBlacklistModal && activeCentre && (
        <div className="modal-backdrop" onClick={() => setShowBlacklistModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--color-danger, #dc2626)' }}>
                De-panel &amp; Blacklist Testing Centre
              </h3>
              <button className="btn-ghost" onClick={() => setShowBlacklistModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleBlacklistSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  You are about to blacklist <strong>{activeCentre.centreName || activeCentre.centre_name}</strong>.
                  This action is recorded in the immutable audit log and prevents the venue from booking examination drives.
                </p>
                <div className="form-group">
                  <label className="form-label">Mandatory Reason for Blacklisting *</label>
                  <textarea
                    className="form-control"
                    required
                    rows={3}
                    placeholder="Provide specific legal, technical or security justification..."
                    value={blacklistReason}
                    onChange={e => setBlacklistReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBlacklistModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <AlertOctagon size={14} />}
                  <span>Confirm Blacklist</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && activeCentre && (
        <div className="modal-backdrop" onClick={() => setShowOverrideModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title">Executive Eligibility Override</h3>
              <button className="btn-ghost" onClick={() => setShowOverrideModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleOverrideSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Authorizing executive override for <strong>{activeCentre.centreName || activeCentre.centre_name}</strong> restores
                  venue eligibility status to Eligible.
                </p>
                <div className="form-group">
                  <label className="form-label">Authorization Justification *</label>
                  <textarea
                    className="form-control"
                    required
                    rows={3}
                    placeholder="Enter board sanction, re-audit clearance, or legal approval details..."
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOverrideModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>Authorize Override</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
