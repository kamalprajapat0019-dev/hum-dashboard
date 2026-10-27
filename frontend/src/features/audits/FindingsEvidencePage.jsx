import React, { useState, useEffect } from 'react';
import { 
  FileWarning, Search, Filter, AlertTriangle, AlertOctagon, 
  CheckCircle2, Clock, Image, ExternalLink, RefreshCw, X, ShieldAlert
} from 'lucide-react';
import { AuditStore, appendAuditLog } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';

export default function FindingsEvidencePage() {
  const { user } = useAuth();
  const [audits, setAudits] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Selected Photo Modal
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const loadData = () => {
    setAudits(AuditStore.getAll());
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Collect all findings across all audits
  const allFindings = audits.flatMap(a => (a.findings || []).map(f => ({
    ...f,
    audit_id: a.id,
    audit_code: a.audit_code,
    centre_name: a.centre_name,
    project_name: a.project_name,
    city: a.city
  })));

  const handleUpdateFindingStatus = (auditId, findingId, newStatus) => {
    const audit = audits.find(a => a.id === auditId);
    if (!audit) return;

    const updatedFindings = (audit.findings || []).map(f => {
      if (f.id === findingId) {
        return { ...f, rework_status: newStatus };
      }
      return f;
    });

    AuditStore.update(auditId, {
      findings: updatedFindings
    });

    appendAuditLog({
      module: 'Audit Findings',
      action: `Finding Status: ${newStatus}`,
      record_ref: audit.audit_code,
      user_id: user?.email || 'auditor@oemportal.in',
      details: `Finding ${findingId} at ${audit.centre_name} transitioned to ${newStatus}.`
    });

    loadData();
  };

  const filteredFindings = allFindings.filter(f => {
    const matchSearch = f.description.toLowerCase().includes(search.toLowerCase()) ||
                        f.centre_name.toLowerCase().includes(search.toLowerCase()) ||
                        f.category.toLowerCase().includes(search.toLowerCase()) ||
                        f.audit_code.toLowerCase().includes(search.toLowerCase());
    const matchSev = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchStat = statusFilter === 'ALL' || f.rework_status === statusFilter;
    return matchSearch && matchSev && matchStat;
  });

  const kpis = {
    total: allFindings.length,
    critical: allFindings.filter(f => f.severity === 'Critical').length,
    open: allFindings.filter(f => f.rework_status === 'Open').length,
    resolved: allFindings.filter(f => f.rework_status === 'Resolved').length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <FileWarning size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Audit Findings, Photo Evidence & Rework Desk
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                Track severity-categorized defects, photographic proof, corrective action owners, and re-audit triggers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #0891b2' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL LOGGED DEFECTS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>{kpis.total}</div>
          <div style={{ fontSize: 12, color: '#0891b2', marginTop: 4 }}>Across all audit rounds</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>CRITICAL (P0) BLOCKERS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#dc2626' }}>{kpis.critical}</div>
          <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>Immediate allocation freeze</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>REWORK IN-PROGRESS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#d97706' }}>{kpis.open}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Pending rectification by TCA</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>RESOLVED & CLOSED</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#16a34a' }}>{kpis.resolved}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Verified in re-audit</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 'min(100%, 240px)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search findings by issue description, category, centre name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input"
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical (P0)</option>
            <option value="High">High (P1)</option>
            <option value="Medium">Medium (P2)</option>
            <option value="Low">Low (P3)</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
            <option value="ALL">All Rework Status</option>
            <option value="Open">Open</option>
            <option value="Submitted">Submitted by Centre</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Findings Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
        {filteredFindings.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', gridColumn: '1 / -1' }}>
            No findings match your filter criteria.
          </div>
        ) : (
          filteredFindings.map((f) => {
            const isCrit = f.severity === 'Critical';
            const isHigh = f.severity === 'High';

            return (
              <div 
                key={f.id} 
                className="card" 
                style={{ 
                  padding: 20, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${isCrit ? '#dc2626' : isHigh ? '#ea580c' : '#d97706'}`,
                  gap: 16
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${isCrit ? 'badge-danger' : isHigh ? 'badge-warning' : 'badge-info'}`}>
                        {f.severity}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {f.category}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {f.audit_code}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '10px 0 6px' }}>
                    {f.centre_name}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    {f.project_name} • {f.city}
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, margin: 0 }}>
                    {f.description}
                  </p>

                  {f.photo_url && (
                    <div style={{ marginTop: 12 }}>
                      <div 
                        onClick={() => setPreviewPhoto(f.photo_url)}
                        style={{ 
                          width: '100%', height: 130, borderRadius: 8, overflow: 'hidden', 
                          border: '1px solid var(--border-color)', position: 'relative', cursor: 'pointer' 
                        }}
                      >
                        <img src={f.photo_url} alt="finding evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 11, padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Click to Inspect Full Photo</span>
                          <ExternalLink size={12} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>Owner: <strong style={{ color: 'var(--text-secondary)' }}>{f.corrective_owner}</strong></div>
                    <div>Rectification Due Date: <strong style={{ color: '#dc2626' }}>{f.rework_due_date}</strong></div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${
                    f.rework_status === 'Resolved' ? 'badge-success' : 
                    f.rework_status === 'Submitted' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    Status: {f.rework_status}
                  </span>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {f.rework_status === 'Open' && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleUpdateFindingStatus(f.audit_id, f.id, 'Submitted')}
                        style={{ fontSize: 11 }}
                      >
                        Mark Submitted
                      </button>
                    )}
                    {f.rework_status !== 'Resolved' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleUpdateFindingStatus(f.audit_id, f.id, 'Resolved')}
                        style={{ fontSize: 11, background: '#16a34a' }}
                      >
                        Verify & Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: 20
        }}>
          <div style={{ position: 'relative', maxWidth: 800, width: '100%', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
            <button 
              onClick={() => setPreviewPhoto(null)}
              style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              <X size={20} />
            </button>
            <img src={previewPhoto} alt="evidence-large" style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
            <div style={{ padding: 14, color: '#fff', fontSize: 13, background: '#1e293b' }}>
              Photographic Evidence with Time-Stamping & Subnet Hardware Metadata
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
