import { useState } from 'react';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, Search, Filter, CheckCircle2,
  XCircle, Check, X, RefreshCw, Eye, Lock, Unlock, AlertOctagon, History,
  Building2, BatteryCharging, Video, Info
} from 'lucide-react';
import { EligibilityStore, ProjectStore, appendAuditLog } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/common';

export default function EligibilityPage() {
  const { user } = useAuth();
  const [eligibilityList, setEligibilityList] = useState(() => EligibilityStore.getAll());
  const [projects] = useState(() => ProjectStore.getAll());
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || 'p001');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Drawers
  const [activeCentre, setActiveCentre] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadData = () => setEligibilityList(EligibilityStore.getAll());

  const currentProject = projects.find(p => p.id === selectedProject) || projects[0];

  const filteredCentres = eligibilityList.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      const match = c.centre_name?.toLowerCase().includes(q) ||
                    c.city?.toLowerCase().includes(q) ||
                    c.state?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'All' && c.eligibility_status !== statusFilter) return false;
    return true;
  });

  const eligibleCount = eligibilityList.filter(c => c.eligibility_status === 'Eligible').length;
  const conditionalCount = eligibilityList.filter(c => c.eligibility_status === 'Conditional').length;
  const blacklistedCount = eligibilityList.filter(c => c.eligibility_status === 'Blacklisted').length;

  const handleBlacklistSubmit = (e) => {
    e.preventDefault();
    if (!activeCentre || !blacklistReason) return;

    EligibilityStore.update(activeCentre.id, {
      eligibility_status: 'Blacklisted',
      is_blacklisted: true,
      blacklist_reason: blacklistReason,
      blacklist_date: new Date().toISOString().split('T')[0],
      score: Math.min(activeCentre.score, 40),
    });

    appendAuditLog({
      user: user?.name || 'Admin',
      role: user?.role || 'admin',
      action: 'CENTRE_BLACKLISTED',
      entity: `Centre: ${activeCentre.centre_name}`,
      details: `Blacklisted with reason: ${blacklistReason}`,
    });

    reloadData();
    setShowBlacklistModal(false);
    setActiveCentre(null);
    setBlacklistReason('');
    showToast(`Centre "${activeCentre.centre_name}" has been de-paneled & blacklisted.`);
  };

  const handleOverrideSubmit = (e) => {
    e.preventDefault();
    if (!activeCentre || !overrideReason) return;

    const newHistory = [
      ...(activeCentre.overrule_history || []),
      {
        date: new Date().toISOString().split('T')[0],
        authorized_by: `${user?.name || 'Authorized Lead'} (${user?.role || 'admin'})`,
        justification: overrideReason,
      }
    ];

    EligibilityStore.update(activeCentre.id, {
      eligibility_status: 'Eligible',
      is_blacklisted: false,
      blacklist_reason: '',
      score: Math.max(activeCentre.score, 80),
      overrule_history: newHistory,
    });

    appendAuditLog({
      user: user?.name || 'Admin',
      role: user?.role || 'admin',
      action: 'BLACKLIST_OVERRULED',
      entity: `Centre: ${activeCentre.centre_name}`,
      details: `Exception granted. Reason: ${overrideReason}`,
    });

    reloadData();
    setShowOverrideModal(false);
    setActiveCentre(null);
    setOverrideReason('');
    showToast(`Exception granted for "${activeCentre.centre_name}". Status set to Eligible.`);
  };

  return (
    <div>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: 'var(--color-primary-dark)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <div className="breadcrumb">
              <span>Operations</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Eligibility & Blacklist Engine</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>Venue Eligibility & Compliance Scoring</h1>
            <p className="page-header__subtitle">
              Module 3A — Automated multi-factor eligibility verification, power/CCTV thresholds, and de-panelment security controls
            </p>
          </div>
          <div className="page-header__actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                EligibilityStore.reset();
                reloadData();
                showToast('Reset eligibility dataset to default');
              }}
            >
              <RefreshCw size={14} /> Reset Rules
            </button>
          </div>
        </div>
      </div>

      {/* Project Selector Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, background: '#f8fafc', border: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Evaluate Against Project:
            </span>
            <select
              className="form-control"
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              style={{ width: 280, fontSize: '0.8125rem', fontWeight: 600 }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.project_code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div>Client: <strong style={{ color: 'var(--color-primary)' }}>{currentProject?.client_name || 'NTA'}</strong></div>
            <div>Target Candidates: <strong>{Number(currentProject?.candidate_target || 0).toLocaleString()}</strong></div>
            <div>Exam Date: <strong>{currentProject?.exam_date || 'Upcoming'}</strong></div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Eligible Venues</span>
            <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
              <ShieldCheck size={16} color="#16a34a" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-success)' }}>{eligibleCount}</div>
          <div className="kpi-card__sub">All security &amp; power criteria met</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Conditional Clearance</span>
            <div className="kpi-card__icon" style={{ background: '#fffbeb' }}>
              <AlertTriangle size={16} color="#d97706" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-warning)' }}>{conditionalCount}</div>
          <div className="kpi-card__sub">Pending secondary generator / audit fix</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">De-Paneled / Blacklisted</span>
            <div className="kpi-card__icon" style={{ background: '#fef2f2' }}>
              <ShieldAlert size={16} color="#dc2626" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-danger)' }}>{blacklistedCount}</div>
          <div className="kpi-card__sub">Blocked from exam booking invitations</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search centre, city, state..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 30, fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {['All', 'Eligible', 'Conditional', 'Blacklisted'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: statusFilter === st ? 'var(--color-primary)' : 'var(--border-default)',
                  background: statusFilter === st ? '#eff6ff' : 'var(--bg-surface)',
                  color: statusFilter === st ? 'var(--color-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Centre &amp; Location</th>
                <th>Capacity</th>
                <th>Power &amp; Generator Spec</th>
                <th>CCTV / Surveillance</th>
                <th>Audit History</th>
                <th>Eligibility Score</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCentres.map(centre => {
                const isBlacklisted = centre.eligibility_status === 'Blacklisted';
                const isConditional = centre.eligibility_status === 'Conditional';

                return (
                  <tr key={centre.id} style={{ background: isBlacklisted ? '#fef2f220' : 'transparent' }}>
                    <td>
                      <div style={{ fontWeight: 600, color: isBlacklisted ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                        {centre.centre_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {centre.city}, {centre.state}
                      </div>
                      {isBlacklisted && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-danger)', marginTop: 2, fontWeight: 500 }}>
                          Reason: {centre.blacklist_reason}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{centre.total_capacity}</span> nodes
                    </td>
                    <td>
                      <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BatteryCharging size={13} color="var(--color-primary)" />
                        <span>{centre.power_backup}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Video size={13} color="var(--color-purple)" />
                        <span className="truncate" style={{ maxWidth: 180 }} title={centre.cctv_coverage}>
                          {centre.cctv_coverage}
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={centre.audit_status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 44, fontWeight: 700, fontSize: '0.875rem', color: centre.score >= 80 ? 'var(--color-success)' : centre.score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                          {centre.score}%
                        </div>
                        <div style={{ width: 60 }}>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${centre.score}%`,
                                background: centre.score >= 80 ? 'var(--color-success)' : centre.score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${centre.eligibility_status === 'Eligible' ? 'badge-success' : centre.eligibility_status === 'Conditional' ? 'badge-warning' : 'badge-danger'}`}>
                        {centre.eligibility_status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {isBlacklisted ? (
                          <button
                            className="btn btn-primary btn-sm"
                            title="Grant Administrative Whitelist Overrule"
                            onClick={() => {
                              setActiveCentre(centre);
                              setShowOverrideModal(true);
                            }}
                          >
                            <Unlock size={13} /> Overrule &amp; Clear
                          </button>
                        ) : (
                          <>
                            {centre.overrule_history?.length > 0 && (
                              <button
                                className="btn btn-secondary btn-sm"
                                title="View override history"
                                onClick={() => {
                                  setActiveCentre(centre);
                                }}
                              >
                                <History size={13} />
                              </button>
                            )}
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--color-danger)' }}
                              title="De-panel / Blacklist Centre"
                              onClick={() => {
                                setActiveCentre(centre);
                                setShowBlacklistModal(true);
                              }}
                            >
                              <Lock size={13} /> Blacklist
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blacklist Modal */}
      {showBlacklistModal && activeCentre && (
        <div className="modal-backdrop" onClick={() => setShowBlacklistModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertOctagon size={20} color="var(--color-danger)" />
                <h3 className="modal-title" style={{ color: 'var(--color-danger)' }}>De-panel &amp; Blacklist Venue</h3>
              </div>
              <button className="btn-ghost" onClick={() => setShowBlacklistModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleBlacklistSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.8125rem', color: '#991b1b' }}>
                  <strong>Security Warning:</strong> Blacklisting <strong>{activeCentre.centre_name}</strong> will instantly disqualify the venue from all ongoing and future project booking pipelines across NTA, UGC, and AICTE drives.
                </div>

                <div className="form-group">
                  <label className="form-label">Confidential De-panelment Reason *</label>
                  <textarea
                    className="form-control"
                    required
                    rows={3}
                    placeholder="Enter explicit findings (e.g., Audit failure, CCTV tampering, power breakdown during live exam, integrity issue)..."
                    value={blacklistReason}
                    onChange={e => setBlacklistReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBlacklistModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  <Lock size={14} /> Confirm Blacklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Whitelist / Override Modal */}
      {showOverrideModal && activeCentre && (
        <div className="modal-backdrop" onClick={() => setShowOverrideModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Unlock size={20} color="var(--color-primary)" />
                <h3 className="modal-title">Administrative Whitelist Overrule</h3>
              </div>
              <button className="btn-ghost" onClick={() => setShowOverrideModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleOverrideSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.8125rem', color: '#166534' }}>
                  Overruling blacklist for <strong>{activeCentre.centre_name}</strong>. An immutable authorization log with your digital stamp will be recorded.
                </div>

                <div className="form-group">
                  <label className="form-label">Mandatory Re-activation Justification *</label>
                  <textarea
                    className="form-control"
                    required
                    rows={3}
                    placeholder="Specify corrective actions completed (e.g. Lab equipment replaced, re-audit cleared, DG set installed and tested)..."
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOverrideModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} /> Authorize Clearance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
