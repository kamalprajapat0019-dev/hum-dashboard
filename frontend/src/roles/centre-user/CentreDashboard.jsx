import { useNavigate } from 'react-router-dom';
import { CheckCircle, Upload, Bell, Clock, AlertTriangle, ArrowRight, Building2, FileText } from 'lucide-react';
import { KpiCard, StatusBadge, LastUpdated } from '@/components/common';
import { CENTRE_KPIS, CENTRE_PENDING_ACTIONS } from '@/data/mockData';
import { DocStore, DOC_TYPES, CentreStore } from '@/services/dataService';

const priorityColor = (p) =>
  p === 'High' ? 'var(--color-danger)' :
  p === 'Medium' ? 'var(--color-warning)' : 'var(--color-info)';

const priorityBg = (p) =>
  p === 'High' ? 'var(--color-danger-bg)' :
  p === 'Medium' ? 'var(--color-warning-bg)' : 'var(--color-info-bg)';

export default function CentreDashboard() {
  const navigate = useNavigate();
  const liveDocs = DocStore.getAll().filter(d => d.centre_id === 'cn001');
  const centreProfile = CentreStore.getById('cn001') || {
    centre_name: 'Lotus Computer Education',
    edu_code: 'EDU-DL-2041',
    tc_code: 'TC-DL-1082',
    organization_type: 'Trust',
    centre_status: 'Approved',
  };

  // Combine liveDocs with full 20 DOC_TYPES
  const docRows = DOC_TYPES.map(dt => {
    const matched = liveDocs.find(d => d.doc_type === dt.key);
    return {
      key: dt.key,
      name: dt.label,
      mandatory: dt.mandatory,
      status: matched ? matched.status : 'Pending',
      date: matched ? matched.uploaded_at || '—' : '—',
      file: matched ? matched.file_name : null,
    };
  });

  const approvedCount = docRows.filter(d => d.status === 'Approved').length;
  const totalCount    = docRows.length;
  const pct           = Math.round((approvedCount / totalCount) * 100);
  const pendingTCA    = docRows.find(d => d.key === 'tca_police_verification')?.status === 'Pending';

  return (
    <div>
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">Centre Dashboard</h1>
            <p className="page-header__subtitle">Your pending actions, document checklist and centre status</p>
          </div>
          <div className="page-header__actions">
            <LastUpdated />
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/centre/profile')}>
              <Building2 size={13} /> My Centre Profile
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/centre/documents')}>
              <FileText size={13} /> Document Checklist
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {pendingTCA && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>Action Required:</strong> TCA Police Verification is pending upload.
            Please submit before the verification deadline of <strong>25 Oct 2026</strong>.
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard
          label="Pending Actions"
          value={CENTRE_PENDING_ACTIONS.length}
          icon="Bell"
          iconBg="#fffbeb"
          iconColor="#d97706"
          onClick={() => navigate('/centre/documents')}
        />
        <KpiCard
          label="Documents Uploaded"
          value={`${approvedCount}/${totalCount}`}
          sub={`${pct}% complete`}
          icon="Upload"
          iconBg="#eff6ff"
          iconColor="#1e40af"
          onClick={() => navigate('/centre/documents')}
        />
        <KpiCard
          label="Profile & Verification"
          value={centreProfile.centre_status || 'Approved'}
          icon="CheckCircle"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          onClick={() => navigate('/centre/profile')}
        />
        <KpiCard
          label="Readiness"
          value="Confirmed"
          icon="CheckSquare"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>

        {/* Pending Actions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pending Actions</span>
            <span className="badge badge-warning">{CENTRE_PENDING_ACTIONS.length} pending</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {CENTRE_PENDING_ACTIONS.map(a => (
              <div key={a.id} style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}>
                <div style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: priorityColor(a.priority),
                  marginTop: 5, flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{a.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    {a.module} · Due: <strong style={{ color: 'var(--text-secondary)' }}>{a.dueDate}</strong>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 600,
                  padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  background: priorityBg(a.priority),
                  color: priorityColor(a.priority),
                  flexShrink: 0,
                }}>
                  {a.priority}
                </span>
              </div>
            ))}
            <div style={{ padding: '12px 20px' }}>
              <button
                className="btn btn-primary btn-sm w-full"
                style={{ justifyContent: 'center' }}
                onClick={() => navigate('/centre/documents')}
              >
                <Upload size={13} /> Upload &amp; Verify Mandatory Documents
              </button>
            </div>
          </div>
        </div>

        {/* Centre Info Summary */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Centre Information</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/centre/profile')}>
              Edit Profile
            </button>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Centre Name',     value: centreProfile.centre_name },
              { label: 'EDU Code',         value: centreProfile.edu_code },
              { label: 'TC Code',          value: centreProfile.tc_code },
              { label: 'City / State',     value: 'New Delhi, Delhi' },
              { label: 'Organisation',     value: centreProfile.organization_type },
              { label: 'Total Systems',    value: '45 (Nodes: 40, Buffer: 5)' },
              { label: 'Assigned Project', value: 'NEET UG 2026 – Season 1' },
              { label: 'Status',           value: centreProfile.centre_status },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                <span style={{ fontWeight: 500, textAlign: 'right' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document Checklist */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <span className="card-title">Document Checklist</span>
            <div style={{ flex: 1, maxWidth: 200 }}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--color-primary)' }} />
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {approvedCount}/{totalCount} ({pct}%)
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => navigate('/centre/documents')}>
            All 20 Docs <ArrowRight size={12} />
          </button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Requirement</th>
                <th>Status</th>
                <th>Uploaded On</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {docRows.slice(0, 8).map((d, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{d.name}</td>
                  <td>
                    {d.mandatory ? (
                      <span className="badge badge-danger" style={{ fontSize: '0.625rem' }}>MANDATORY</span>
                    ) : (
                      <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>OPTIONAL</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={d.status === 'Approved' ? 'Approved' : 'Pending'} />
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{d.date}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className={`btn ${d.status === 'Pending' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      onClick={() => navigate('/centre/documents')}
                    >
                      {d.status === 'Pending' ? <><Upload size={11} /> Upload</> : 'View & Manage'}
                    </button>
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
