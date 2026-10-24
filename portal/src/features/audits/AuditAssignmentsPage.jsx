import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Search, Filter, ShieldCheck, AlertTriangle, 
  Calendar, CheckCircle2, Clock, AlertOctagon, UserCheck, 
  Plus, Eye, ArrowRight, UploadCloud, RefreshCw, X
} from 'lucide-react';
import { AuditStore, ProjectStore, CentreStore, UserStore, appendAuditLog } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';

export default function AuditAssignmentsPage({ isPmView = false }) {
  const { user } = useAuth();
  const [audits, setAudits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [centres, setCentres] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Modals
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Inspection State
  const [auditScores, setAuditScores] = useState({
    physical: 85,
    power: 70,
    network: 75,
    cctv: 80
  });
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const [newFindingSeverity, setNewFindingSeverity] = useState('High');
  const [newFindingDesc, setNewFindingDesc] = useState('');
  const [newFindingCategory, setNewFindingCategory] = useState('Power Redundancy');
  const [findingsList, setFindingsList] = useState([]);

  // New Assignment State
  const [assignForm, setAssignForm] = useState({
    centre_id: '',
    project_id: '',
    auditor_id: 'u003',
    scheduled_date: '2026-10-28'
  });

  const loadData = () => {
    setAudits(AuditStore.getAll());
    setProjects(ProjectStore.getAll());
    setCentres(CentreStore.getAll());
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const filteredAudits = audits.filter(a => {
    const matchSearch = a.centre_name.toLowerCase().includes(search.toLowerCase()) ||
                        a.audit_code.toLowerCase().includes(search.toLowerCase()) ||
                        a.city.toLowerCase().includes(search.toLowerCase()) ||
                        a.project_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchProj = projectFilter === 'ALL' || a.project_name === projectFilter;
    return matchSearch && matchStatus && matchProj;
  });

  const kpis = {
    total: audits.length,
    passed: audits.filter(a => a.status === 'Passed').length,
    rework: audits.filter(a => a.status === 'Rework Required' || a.status === 'Re-Audit Pending').length,
    scheduled: audits.filter(a => a.status === 'Assigned' || a.status === 'In Progress').length
  };

  const openInspection = (audit) => {
    setSelectedAudit(audit);
    setAuditScores(audit.scores || { physical: 80, power: 80, network: 80, cctv: 80 });
    setFindingsList(audit.findings || []);
    setEvidencePhotos([
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80'
    ]);
    setInspectionNotes(audit.status === 'Passed' ? 'Center infrastructure fully complies with NTA / NBE CBT Guidelines.' : 'Deficiencies flagged during simulated load & switchover tests.');
    setInspectModalOpen(true);
  };

  const handleAddFinding = () => {
    if (!newFindingDesc) return;
    const newFinding = {
      id: `f_${Date.now()}`,
      severity: newFindingSeverity,
      category: newFindingCategory,
      description: newFindingDesc,
      photo_url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&q=80',
      rework_required: 'True',
      corrective_owner: 'Centre Technical Administrator (TCA)',
      rework_due_date: new Date(Date.now() + 3*86400000).toISOString().split('T')[0],
      rework_status: 'Open'
    };
    setFindingsList([...findingsList, newFinding]);
    setNewFindingDesc('');
  };

  const handleSaveAudit = (finalStatus) => {
    const avgScore = Math.round((Number(auditScores.physical) + Number(auditScores.power) + Number(auditScores.network) + Number(auditScores.cctv)) / 4);
    
    AuditStore.update(selectedAudit.id, {
      status: finalStatus,
      overall_score: avgScore,
      scores: auditScores,
      conducted_date: new Date().toISOString().split('T')[0],
      validity_status: finalStatus === 'Passed' ? 'Valid (60 days remaining)' : 'Rework Pending',
      validity_days_left: 60,
      findings: findingsList
    });

    appendAuditLog({
      module: 'Compliance & Audit',
      action: finalStatus === 'Passed' ? 'Audit Passed' : 'Audit Marked for Rework',
      record_ref: selectedAudit.audit_code,
      user_id: user?.email || 'auditor@oemportal.in',
      details: `${selectedAudit.centre_name} audit evaluated at score ${avgScore}%. Final status: ${finalStatus}.`
    });

    loadData();
    setInspectModalOpen(false);
  };

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    if (!assignForm.centre_id || !assignForm.project_id) {
      alert('Please select both Centre and Project');
      return;
    }
    const centre = centres.find(c => c.id === assignForm.centre_id);
    const proj = projects.find(p => p.id === assignForm.project_id);

    const newAudit = {
      id: `aud_${Date.now()}`,
      audit_code: `AUD-2026-${String(audits.length + 1).padStart(3, '0')}`,
      centre_id: centre.id,
      centre_name: centre.name,
      city: centre.city || 'Delhi NCR',
      project_id: proj.id,
      project_name: proj.name,
      auditor_id: assignForm.auditor_id,
      auditor_name: assignForm.auditor_id === 'u003' ? 'Amit Verma (Senior IT Auditor)' : 'Ravi Shankar (Field Auditor)',
      scheduled_date: assignForm.scheduled_date,
      conducted_date: '',
      status: 'Assigned',
      validity_status: 'Audit Scheduled',
      validity_days_left: 60,
      overall_score: 0,
      scores: { physical: 0, power: 0, network: 0, cctv: 0 },
      evidence_count: 0,
      findings: []
    };

    AuditStore.create(newAudit);
    appendAuditLog({
      module: 'Compliance & Audit',
      action: 'Audit Assigned',
      record_ref: newAudit.audit_code,
      user_id: user?.email || 'admin@oemportal.in',
      details: `Audit assignment created for ${centre.name} under ${proj.name}.`
    });

    loadData();
    setAssignModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <ClipboardCheck size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {isPmView ? 'Project Audit & Compliance Gate' : 'Audit Assignments & Inspection Queue'}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                4-Pillar venue readiness compliance: Physical Infra, DG/UPS Power Redundancy, CBT Network, and IP CCTV
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className="btn btn-primary"
            onClick={() => setAssignModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={16} /> Assign New Audit
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #0891b2' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL ASSIGNED AUDITS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>{kpis.total}</div>
          <div style={{ fontSize: 12, color: '#0891b2', marginTop: 4 }}>Across all active exam projects</div>
        </div>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>CERTIFIED & PASSED</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#16a34a' }}>{kpis.passed}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Valid 60-day certificates</div>
        </div>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>REWORK / RE-AUDIT</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#dc2626' }}>{kpis.rework}</div>
          <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>Active blocker for allocation</div>
        </div>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>SCHEDULED IN-PROGRESS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#d97706' }}>{kpis.scheduled}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Auditor inspection due</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search by centre name, audit code, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={15} style={{ color: 'var(--text-tertiary)' }} />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
              style={{ fontSize: 13, padding: '6px 12px' }}
            >
              <option value="ALL">All Audit Status</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Passed">Passed</option>
              <option value="Rework Required">Rework Required</option>
              <option value="Re-Audit Pending">Re-Audit Pending</option>
            </select>
          </div>

          <select 
            value={projectFilter} 
            onChange={(e) => setProjectFilter(e.target.value)}
            className="input"
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
            <option value="ALL">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audits Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px' }}>Audit Code</th>
                <th style={{ padding: '12px 16px' }}>Centre Name & City</th>
                <th style={{ padding: '12px 16px' }}>Exam Project</th>
                <th style={{ padding: '12px 16px' }}>Auditor</th>
                <th style={{ padding: '12px 16px' }}>Audit Date</th>
                <th style={{ padding: '12px 16px' }}>Score</th>
                <th style={{ padding: '12px 16px' }}>Compliance Status</th>
                <th style={{ padding: '12px 16px' }}>Validity Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((a) => {
                  const isPassed = a.status === 'Passed';
                  const isRework = a.status === 'Rework Required' || a.status === 'Re-Audit Pending';
                  const isAssigned = a.status === 'Assigned' || a.status === 'In Progress';

                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, fontFamily: 'monospace', color: '#0891b2' }}>
                        {a.audit_code}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.centre_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.city}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-primary)' }}>
                        <span className="badge badge-info">{a.project_name}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {a.auditor_name}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        <div>{a.scheduled_date}</div>
                        {a.conducted_date && (
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Conducted: {a.conducted_date}</div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {a.overall_score > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ 
                              fontWeight: 700, 
                              fontSize: 14,
                              color: a.overall_score >= 85 ? '#16a34a' : a.overall_score >= 70 ? '#d97706' : '#dc2626'
                            }}>
                              {a.overall_score}%
                            </span>
                            <div style={{ width: 45, height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                              <div style={{ 
                                width: `${a.overall_score}%`, 
                                height: '100%', 
                                background: a.overall_score >= 85 ? '#16a34a' : a.overall_score >= 70 ? '#d97706' : '#dc2626' 
                              }} />
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={`badge ${
                          isPassed ? 'badge-success' : 
                          isRework ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12 }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 5,
                          color: isPassed ? '#16a34a' : isRework ? '#dc2626' : 'var(--text-secondary)'
                        }}>
                          {isPassed ? <CheckCircle2 size={13} /> : isRework ? <AlertOctagon size={13} /> : <Clock size={13} />}
                          {a.validity_status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => openInspection(a)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                        >
                          <Eye size={14} /> {isPassed ? 'Review Audit' : 'Conduct / Edit'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECTION MODAL */}
      {inspectModalOpen && selectedAudit && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: 840, maxHeight: '90vh', overflowY: 'auto',
            padding: 24, borderRadius: 16, border: '1px solid var(--border-color)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: 20
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>{selectedAudit.audit_code}</span>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {selectedAudit.centre_name}
                  </h2>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Project: <strong>{selectedAudit.project_name}</strong> | City: {selectedAudit.city} | Auditor: {selectedAudit.auditor_name}
                </div>
              </div>
              <button 
                onClick={() => setInspectModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 4 Pillars Scoring Sliders */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
                4-Pillar Infrastructure Scoring Checklist
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                <div style={{ padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    <span>1. Physical Infra</span>
                    <span style={{ color: '#0891b2' }}>{auditScores.physical}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={auditScores.physical}
                    onChange={(e) => setAuditScores({ ...auditScores, physical: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#0891b2' }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Labs, AC, partitions, frisking</div>
                </div>

                <div style={{ padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    <span>2. Power Redundancy</span>
                    <span style={{ color: auditScores.power < 70 ? '#dc2626' : '#16a34a' }}>{auditScores.power}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={auditScores.power}
                    onChange={(e) => setAuditScores({ ...auditScores, power: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: auditScores.power < 70 ? '#dc2626' : '#16a34a' }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>DG load test, UPS 60m backup</div>
                </div>

                <div style={{ padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    <span>3. CBT Network</span>
                    <span style={{ color: auditScores.network < 70 ? '#dc2626' : '#16a34a' }}>{auditScores.network}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={auditScores.network}
                    onChange={(e) => setAuditScores({ ...auditScores, network: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: auditScores.network < 70 ? '#dc2626' : '#16a34a' }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Dual ISP, managed switch, &lt;2ms</div>
                </div>

                <div style={{ padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    <span>4. IP CCTV Specs</span>
                    <span style={{ color: '#0891b2' }}>{auditScores.cctv}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={auditScores.cctv}
                    onChange={(e) => setAuditScores({ ...auditScores, cctv: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#0891b2' }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Zero blindspots, 30-day NVR</div>
                </div>
              </div>
            </div>

            {/* Evidence Photo Strip */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Audit Photo & Video Evidence</span>
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEvidencePhotos([...evidencePhotos, 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80'])}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
                >
                  <UploadCloud size={13} /> Add Evidence Photo
                </button>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
                {evidencePhotos.map((url, i) => (
                  <div key={i} style={{ width: 140, height: 95, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative', flexShrink: 0 }}>
                    <img src={url} alt={`evidence-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 9, padding: '2px 4px', textAlign: 'center' }}>
                      GeoTag: 28.61° N, 77.20° E
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logged Findings List */}
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Logged Non-Compliance Findings ({findingsList.length})</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {findingsList.map((f, idx) => (
                  <div key={idx} style={{ 
                    padding: '10px 14px', borderRadius: 8, 
                    background: f.severity === 'Critical' ? '#fef2f2' : '#fffbeb',
                    border: `1px solid ${f.severity === 'Critical' ? '#fecaca' : '#fde68a'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge ${f.severity === 'Critical' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                          {f.severity}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{f.category}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {f.description}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        Owner: {f.corrective_owner} | Due: {f.rework_due_date} | Status: <strong>{f.rework_status}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Finding Form */}
              <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Log New Non-Compliance Finding</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 10 }}>
                  <input 
                    type="text"
                    placeholder="Describe non-compliance issue (e.g. UPS fail, duplicate MAC, camera blindspot)..."
                    value={newFindingDesc}
                    onChange={(e) => setNewFindingDesc(e.target.value)}
                    className="input"
                    style={{ fontSize: 12 }}
                  />
                  <select 
                    value={newFindingSeverity}
                    onChange={(e) => setNewFindingSeverity(e.target.value)}
                    className="input"
                    style={{ fontSize: 12 }}
                  >
                    <option value="Critical">Critical (P0)</option>
                    <option value="High">High (P1)</option>
                    <option value="Medium">Medium (P2)</option>
                    <option value="Low">Low (P3)</option>
                  </select>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddFinding}
                    style={{ whiteSpace: 'nowrap', fontSize: 12 }}
                  >
                    Add Defect
                  </button>
                </div>
              </div>
            </div>

            {/* Auditor Overall Remarks */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Final Auditor Evaluation & Remarks
              </label>
              <textarea 
                rows={3}
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                className="input"
                style={{ width: '100%', fontSize: 13 }}
                placeholder="State formal findings, test conditions, load observations, and compliance recommendations..."
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setInspectModalOpen(false)}
              >
                Close Without Saving
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleSaveAudit('Rework Required')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <AlertTriangle size={15} /> Flag Rework Required
                </button>
                <button 
                  type="button"
                  className="btn btn-success"
                  onClick={() => handleSaveAudit('Passed')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a', color: '#fff' }}
                >
                  <CheckCircle2 size={15} /> Certify & Pass Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN AUDIT MODAL */}
      {assignModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <form onSubmit={handleCreateAssignment} className="card" style={{
            width: '100%', maxWidth: 520, padding: 24, borderRadius: 16,
            border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Assign New Venue Audit
              </h2>
              <button type="button" onClick={() => setAssignModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Select Examination Centre *
              </label>
              <select 
                value={assignForm.centre_id}
                onChange={(e) => setAssignForm({ ...assignForm, centre_id: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                required
              >
                <option value="">Choose Centre...</option>
                {centres.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Select Exam Project *
              </label>
              <select 
                value={assignForm.project_id}
                onChange={(e) => setAssignForm({ ...assignForm, project_id: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                required
              >
                <option value="">Choose Project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Auditor *
                </label>
                <select 
                  value={assignForm.auditor_id}
                  onChange={(e) => setAssignForm({ ...assignForm, auditor_id: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="u003">Amit Verma (Senior IT Auditor)</option>
                  <option value="u007">Ravi Shankar (Field Auditor)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Inspection Date *
                </label>
                <input 
                  type="date"
                  value={assignForm.scheduled_date}
                  onChange={(e) => setAssignForm({ ...assignForm, scheduled_date: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setAssignModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Dispatch Assignment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
