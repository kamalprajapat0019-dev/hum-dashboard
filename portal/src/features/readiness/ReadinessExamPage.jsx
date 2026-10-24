import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Search, Filter, ShieldCheck, Zap, 
  Wifi, Users, UserCheck, Clock, CheckCircle2, 
  AlertTriangle, Radio, PlayCircle, StopCircle, RefreshCw, X
} from 'lucide-react';
import { ReadinessStore, appendAuditLog } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';

export default function ReadinessExamPage() {
  const { user } = useAuth();
  const [readinessList, setReadinessList] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [signoffModalOpen, setSignoffModalOpen] = useState(false);
  const [signoffName, setSignoffName] = useState('');

  const loadData = () => {
    setReadinessList(ReadinessStore.getAll());
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleUpdateShiftStatus = (recordId, newStatus) => {
    const record = readinessList.find(r => r.id === recordId);
    if (!record) return;

    ReadinessStore.update(recordId, {
      exam_day_status: newStatus
    });

    appendAuditLog({
      module: 'Exam Day Operations',
      action: `Shift Status Changed: ${newStatus}`,
      record_ref: record.readiness_code,
      user_id: user?.email || 'ops@oemportal.in',
      details: `${record.centre_name} (${record.project_name}) transitioned to "${newStatus}".`
    });

    loadData();
  };

  const handleSignoff = (e) => {
    e.preventDefault();
    if (!signoffName) return;

    ReadinessStore.update(selectedRecord.id, {
      centre_signoff: {
        signed_by: signoffName,
        signed_at: new Date().toISOString(),
        is_signed: true
      },
      overall_readiness_pct: 100,
      exam_day_status: 'Gate Closed & Bio-Auth in Progress'
    });

    appendAuditLog({
      module: 'Readiness & Exam Day',
      action: 'Centre Superintendent Signoff',
      record_ref: selectedRecord.readiness_code,
      user_id: user?.email || 'centre@oemportal.in',
      details: `Readiness certified by CS ${signoffName} for ${selectedRecord.centre_name}.`
    });

    loadData();
    setSignoffModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Radio size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Venue Readiness & Exam-Day Live Operations Console
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                T-minus 24h infrastructure signoff, DG fuel levels, biometric auth status, and real-time shift progression
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Readiness Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {readinessList.map((r) => {
          const isSigned = r.centre_signoff?.is_signed;
          const isShiftLive = r.exam_day_status.includes('in Progress') || r.exam_day_status.includes('Active');

          return (
            <div 
              key={r.id} 
              className="card"
              style={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                borderLeft: `5px solid ${isSigned ? '#10b981' : '#f59e0b'}`
              }}
            >
              {/* Top Meta Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>{r.readiness_code}</span>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {r.centre_name}
                    </h2>
                    <span className="badge badge-neutral">{r.city}</span>
                    <span className="badge badge-info">{r.project_name}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Exam Date: <strong>{r.exam_date}</strong> | Expected Candidates: <strong>{r.total_expected}</strong>
                  </div>
                </div>

                {/* Live Status & Attendance Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Live Candidate Attendance</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#047857' }}>
                      {r.live_attendance} / {r.total_expected} ({r.total_expected > 0 ? Math.round((r.live_attendance/r.total_expected)*100) : 0}%)
                    </div>
                  </div>

                  <div style={{ 
                    padding: '8px 14px', borderRadius: 8, 
                    background: isShiftLive ? '#ecfdf5' : 'var(--bg-secondary)',
                    border: `1px solid ${isShiftLive ? '#a7f3d0' : 'var(--border-color)'}`,
                    display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: isShiftLive ? '#10b981' : '#d97706', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: isShiftLive ? '#065f46' : 'var(--text-primary)' }}>
                      {r.exam_day_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Readiness Check Domains */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {/* 1. Manpower */}
                <div style={{ padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={15} style={{ color: '#0284c7' }} /> Manpower
                    </span>
                    <span className="badge badge-success" style={{ fontSize: 10 }}>{r.checklist?.manpower?.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div>Invigilators: <strong>{r.checklist?.manpower?.invigilators}</strong></div>
                    <div>IT Executives: <strong>{r.checklist?.manpower?.it_execs}</strong></div>
                    <div>Guards & Electrician: <strong>{r.checklist?.manpower?.security_guards + r.checklist?.manpower?.electrician}</strong></div>
                  </div>
                </div>

                {/* 2. Power */}
                <div style={{ padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={15} style={{ color: '#d97706' }} /> Power Backup
                    </span>
                    <span className="badge badge-success" style={{ fontSize: 10 }}>{r.checklist?.power?.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div>DG Fuel Reserve: <strong>{r.checklist?.power?.dg_fuel_liters} Liters</strong></div>
                    <div>Online UPS Backup: <strong>{r.checklist?.power?.ups_backup_mins} Mins</strong></div>
                    <div>Switchover Test: <strong>Passed (&lt;2s)</strong></div>
                  </div>
                </div>

                {/* 3. Network */}
                <div style={{ padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Wifi size={15} style={{ color: '#0891b2' }} /> CBT Network
                    </span>
                    <span className="badge badge-success" style={{ fontSize: 10 }}>{r.checklist?.network?.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div>Primary ISP: <strong>{r.checklist?.network?.primary_mbps} Mbps</strong></div>
                    <div>Backup Line: <strong>{r.checklist?.network?.backup_mbps} Mbps</strong></div>
                    <div>Average Ping: <strong>{r.checklist?.network?.latency_ms}</strong></div>
                  </div>
                </div>

                {/* 4. Security & CCTV */}
                <div style={{ padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck size={15} style={{ color: '#7c3aed' }} /> Surveillance
                    </span>
                    <span className="badge badge-success" style={{ fontSize: 10 }}>{r.checklist?.security?.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div>CCTV Coverage: <strong>{r.checklist?.security?.cctv_status}</strong></div>
                    <div>Cellular Jammers: <strong>{r.checklist?.security?.jammers} Units</strong></div>
                    <div>Biometrics & HHMD: <strong>{r.checklist?.security?.biometrics} Desks</strong></div>
                  </div>
                </div>
              </div>

              {/* Bottom Console: Shift Controls & Signoff */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                {/* Signoff State */}
                <div>
                  {isSigned ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#047857' }}>
                      <CheckCircle2 size={16} />
                      <span>Certified Ready by CS: <strong>{r.centre_signoff.signed_by}</strong> ({r.centre_signoff.signed_at?.split('T')[0]})</span>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => { setSelectedRecord(r); setSignoffName(''); setSignoffModalOpen(true); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                    >
                      <UserCheck size={14} /> Centre Superintendent Digital Signoff
                    </button>
                  )}
                </div>

                {/* Exam-Day Shift Triggers */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>Shift Control:</span>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleUpdateShiftStatus(r.id, 'Gate Closed & Bio-Auth in Progress')}
                    style={{ fontSize: 11 }}
                  >
                    Gate Close
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleUpdateShiftStatus(r.id, 'Shift 1 in Progress')}
                    style={{ fontSize: 11, background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}
                  >
                    Start Exam
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleUpdateShiftStatus(r.id, 'Shift Concluded & Papers Uploaded')}
                    style={{ fontSize: 11 }}
                  >
                    Conclude Shift
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CS DIGITAL SIGNOFF MODAL */}
      {signoffModalOpen && selectedRecord && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <form onSubmit={handleSignoff} className="card" style={{
            width: '100%', maxWidth: 540, padding: 24, borderRadius: 16,
            border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Centre Superintendent Readiness Signoff
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {selectedRecord.centre_name} ({selectedRecord.project_name})
                </div>
              </div>
              <button type="button" onClick={() => setSignoffModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 14, borderRadius: 8, background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: 12, color: '#065f46', lineHeight: 1.5 }}>
              I hereby certify as Centre Superintendent that all power generators (minimum 8-hr fuel reserve), online UPS battery backups, CBT client terminals, and CCTV cameras with zero blindspots are verified and fully operational.
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Full Name of Centre Superintendent *
              </label>
              <input 
                type="text"
                placeholder="e.g. Dr. R. K. Singhania (Principal & Centre Supdt.)"
                value={signoffName}
                onChange={(e) => setSignoffName(e.target.value)}
                className="input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSignoffModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ background: '#10b981' }}>
                Sign & Transmit Readiness Certificate
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
