import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Search, Filter, AlertTriangle, CheckCircle2, 
  XCircle, Clock, Send, ShieldAlert, ArrowUpRight, X, AlertOctagon
} from 'lucide-react';
import { MockExamStore, ProjectStore, CentreStore, appendAuditLog } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';

export default function MockStatusPage() {
  const { user } = useAuth();
  const [mocks, setMocks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [selectedMock, setSelectedMock] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formStatus, setFormStatus] = useState('Pass');
  const [formRemarks, setFormRemarks] = useState('');
  const [formFailureReason, setFormFailureReason] = useState('');
  const [formCrashes, setFormCrashes] = useState(0);
  const [formSwitchover, setFormSwitchover] = useState(1.0);

  const loadData = () => {
    setMocks(MockExamStore.getAll());
    setProjects(ProjectStore.getAll());
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const openUpdateModal = (mock) => {
    setSelectedMock(mock);
    setFormStatus(mock.status);
    setFormRemarks(mock.remarks || '');
    setFormFailureReason(mock.failure_reason || '');
    setFormCrashes(mock.system_crashes || 0);
    setFormSwitchover(mock.power_switchover_sec || 1.0);
    setModalOpen(true);
  };

  const handleSaveStatus = (e) => {
    e.preventDefault();
    if (formStatus === 'Fail' && (!formRemarks || !formFailureReason)) {
      alert('Mandatory Rule: Detailed failure reason and remarks are required when marking a Mock as Failed.');
      return;
    }

    const isFail = formStatus === 'Fail';
    const isEscalated = isFail ? 'Escalated to PM' : 'Normal';

    MockExamStore.update(selectedMock.id, {
      status: formStatus,
      remarks: formRemarks,
      failure_reason: isFail ? formFailureReason : '',
      system_crashes: Number(formCrashes),
      power_switchover_sec: Number(formSwitchover),
      escalation_status: isEscalated,
      auditor_sign: user?.name || 'Amit Verma (Senior IT Auditor)'
    });

    appendAuditLog({
      module: 'Mock Examination Drill',
      action: isFail ? 'Mock Failed — Escalated to PM' : `Mock Marked ${formStatus}`,
      record_ref: selectedMock.mock_code,
      user_id: user?.email || 'auditor@oemportal.in',
      details: `${selectedMock.centre_name} mock exam result updated to ${formStatus}. Crashes: ${formCrashes}. Reason: ${formFailureReason || 'N/A'}`
    });

    loadData();
    setModalOpen(false);

    if (isFail) {
      alert(`🚨 CRITICAL ESCALATION DISPATCHED:\n\nMock failure at ${selectedMock.centre_name} has been immediately flagged to the Project Manager for emergency venue intervention!`);
    }
  };

  const filteredMocks = mocks.filter(m => {
    const matchSearch = m.centre_name.toLowerCase().includes(search.toLowerCase()) ||
                        m.mock_code.toLowerCase().includes(search.toLowerCase()) ||
                        m.city.toLowerCase().includes(search.toLowerCase()) ||
                        m.project_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const kpis = {
    total: mocks.length,
    passed: mocks.filter(m => m.status === 'Pass').length,
    failed: mocks.filter(m => m.status === 'Fail').length,
    pending: mocks.filter(m => m.status === 'Not Conducted').length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <CheckSquare size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Mock Exam Status & Escalation Monitor
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                End-to-end simulated load drills, candidate load tests, UPS failover validation, and critical PM escalation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #0891b2' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL MOCK DRILLS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>{kpis.total}</div>
          <div style={{ fontSize: 12, color: '#0891b2', marginTop: 4 }}>Scheduled across venues</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>PASSED DRILLS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#16a34a' }}>{kpis.passed}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Zero-fault switchovers</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #dc2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>FAILED MOCKS</div>
            <span className="badge badge-danger">Critical Gate</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#dc2626' }}>{kpis.failed}</div>
          <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>Escalated to Project Manager</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>NOT CONDUCTED</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#d97706' }}>{kpis.pending}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Pending weekend run</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 'min(100%, 240px)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search by centre name, mock code, city, project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Filter size={15} style={{ color: 'var(--text-tertiary)' }} />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
            <option value="ALL">All Mock Status</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail (Escalated)</option>
            <option value="Not Conducted">Not Conducted</option>
          </select>
        </div>
      </div>

      {/* Mock Records Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px' }}>Mock Code</th>
                <th style={{ padding: '12px 16px' }}>Centre Name & City</th>
                <th style={{ padding: '12px 16px' }}>Exam Project</th>
                <th style={{ padding: '12px 16px' }}>Mock Date</th>
                <th style={{ padding: '12px 16px' }}>Simulated Load</th>
                <th style={{ padding: '12px 16px' }}>Power Switchover</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Escalation</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMocks.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
                    No mock records match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredMocks.map((m) => {
                  const isPass = m.status === 'Pass';
                  const isFail = m.status === 'Fail';
                  const isPending = m.status === 'Not Conducted';

                  return (
                    <tr key={m.id} style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      background: isFail ? '#fff8f8' : 'transparent'
                    }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, fontFamily: 'monospace', color: '#0891b2' }}>
                        {m.mock_code}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.centre_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.city}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge badge-info">{m.project_name}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {m.mock_date}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13 }}>
                        <div><strong>{m.candidate_count}</strong> candidates</div>
                        {m.system_crashes > 0 ? (
                          <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>
                            {m.system_crashes} PC Crashes Logged
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: '#16a34a' }}>0 Crashes</div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13 }}>
                        <span style={{ 
                          fontWeight: 600,
                          color: m.power_switchover_sec > 2.0 ? '#dc2626' : '#16a34a'
                        }}>
                          {m.power_switchover_sec} sec
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          {m.power_switchover_sec > 2.0 ? 'Exceeds SLA (<2s)' : 'Within SLA'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={`badge ${
                          isPass ? 'badge-success' : 
                          isFail ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12 }}>
                        {m.escalation_status === 'Escalated to PM' ? (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <AlertOctagon size={11} /> PM Escalated
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>Normal</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => openUpdateModal(m)}
                          style={{ fontSize: 12 }}
                        >
                          Update Status
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

      {/* UPDATE STATUS MODAL */}
      {modalOpen && selectedMock && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <form onSubmit={handleSaveStatus} className="card" style={{
            width: '100%', maxWidth: 580, padding: 24, borderRadius: 16,
            border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Update Mock Exam Results & Findings
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {selectedMock.centre_name} ({selectedMock.project_name})
                </div>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Mock Drill Result *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <button 
                  type="button"
                  className={`btn ${formStatus === 'Pass' ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setFormStatus('Pass')}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontWeight: 700 }}
                >
                  <CheckCircle2 size={16} /> Pass
                </button>
                <button 
                  type="button"
                  className={`btn ${formStatus === 'Fail' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => setFormStatus('Fail')}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontWeight: 700 }}
                >
                  <XCircle size={16} /> Fail (Escalate)
                </button>
                <button 
                  type="button"
                  className={`btn ${formStatus === 'Not Conducted' ? 'btn-warning' : 'btn-secondary'}`}
                  onClick={() => setFormStatus('Not Conducted')}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontWeight: 700 }}
                >
                  <Clock size={16} /> Pending
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  System Crashes During Drill
                </label>
                <input 
                  type="number"
                  min="0"
                  value={formCrashes}
                  onChange={(e) => setFormCrashes(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  DG/UPS Switchover (Seconds)
                </label>
                <input 
                  type="number"
                  step="0.1"
                  min="0"
                  value={formSwitchover}
                  onChange={(e) => setFormSwitchover(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {formStatus === 'Fail' && (
              <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', display: 'block', marginBottom: 4 }}>
                  Root Cause of Mock Failure (Mandatory for PM Escalation) *
                </label>
                <input 
                  type="text"
                  placeholder="e.g. UPS Phase 2 battery collapse, server freeze, switch restart..."
                  value={formFailureReason}
                  onChange={(e) => setFormFailureReason(e.target.value)}
                  className="input"
                  style={{ width: '100%', borderColor: '#f87171' }}
                  required
                />
                <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 4 }}>
                  ⚠️ Marking as 'Fail' will immediately notify the Project Manager and freeze final candidate allocation.
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Detailed Drill Remarks & Observations {formStatus !== 'Pass' && '*'}
              </label>
              <textarea 
                rows={3}
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                className="input"
                style={{ width: '100%' }}
                placeholder="Log network packet drops, candidate login concurrency response, AC performance during peak load..."
                required={formStatus !== 'Pass'}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button 
                type="submit" 
                className={`btn ${formStatus === 'Fail' ? 'btn-danger' : 'btn-primary'}`}
              >
                {formStatus === 'Fail' ? 'Submit & Escalate to PM' : 'Save Mock Status'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
