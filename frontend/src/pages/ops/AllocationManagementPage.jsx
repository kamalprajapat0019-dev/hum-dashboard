import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Filter, Lock, Unlock, CheckCircle2, 
  AlertTriangle, Users, Calendar, Clock, Plus, ShieldAlert, X, AlertCircle
} from 'lucide-react';
import { AllocationStore, ProjectStore, CentreStore, appendAuditLog } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';

export default function AllocationManagementPage() {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [centres, setCentres] = useState([]);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Modals
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [changeReason, setChangeReason] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    centre_id: '',
    project_id: '',
    exam_date: '2026-11-20',
    shift1_candidates: 100,
    shift1_buffer: 15,
    shift2_candidates: 100,
    shift2_buffer: 15
  });

  const loadData = () => {
    setAllocations(AllocationStore.getAll());
    setProjects(ProjectStore.getAll());
    setCentres(CentreStore.getAll());
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleToggleLock = (alc) => {
    const willLock = !alc.is_locked;
    AllocationStore.update(alc.id, {
      is_locked: willLock,
      locked_at: willLock ? new Date().toISOString() : '',
      locked_by: willLock ? (user?.name || 'Project Manager') : '',
      lock_version: willLock ? 'v1.0 (Locked Final)' : 'v1.1 (Unlocked Draft)'
    });

    appendAuditLog({
      module: 'Allocation Management',
      action: willLock ? 'Allocation Sheet Locked' : 'Allocation Sheet Unlocked',
      record_ref: alc.allocation_code,
      user_id: user?.email || 'pm@oemportal.in',
      details: `Candidate allocation for ${alc.centre_name} (${alc.project_name}) was ${willLock ? 'locked by PM' : 'unlocked for review'}.`
    });

    loadData();
  };

  const handleOpenChangeRequest = (alc) => {
    setSelectedAllocation(alc);
    setChangeReason('');
    setChangeModalOpen(true);
  };

  const handleSubmitChangeRequest = (e) => {
    e.preventDefault();
    if (!changeReason) return;

    const newCR = {
      id: `cr_${Date.now()}`,
      requested_by: `${user?.name || 'Operations Exec'} (${user?.role || 'Ops'})`,
      reason: changeReason,
      requested_at: new Date().toISOString(),
      status: 'Pending PM Approval'
    };

    AllocationStore.update(selectedAllocation.id, {
      change_requests: [...(selectedAllocation.change_requests || []), newCR]
    });

    appendAuditLog({
      module: 'Allocation Management',
      action: 'Post-Lock Change Requested',
      record_ref: selectedAllocation.allocation_code,
      user_id: user?.email || 'ops@oemportal.in',
      details: `Change requested for ${selectedAllocation.centre_name}: "${changeReason}"`
    });

    alert(`✅ Formal Change Request submitted to Project Manager for review.`);
    loadData();
    setChangeModalOpen(false);
  };

  const handleCreateAllocation = (e) => {
    e.preventDefault();
    const centre = centres.find(c => c.id === createForm.centre_id);
    const proj = projects.find(p => p.id === createForm.project_id);
    if (!centre || !proj) {
      alert('Please select both Centre and Project');
      return;
    }

    const s1Total = Number(createForm.shift1_candidates) + Number(createForm.shift1_buffer);
    const s2Total = Number(createForm.shift2_candidates) + Number(createForm.shift2_buffer);
    const venueCap = centre.capacity?.total_systems || 150;

    if (s1Total > venueCap || s2Total > venueCap) {
      alert(`Validation Error: Shift candidate count + buffer exceeds venue total capacity (${venueCap} nodes).`);
      return;
    }

    const newAlc = {
      id: `alc_${Date.now()}`,
      allocation_code: `ALC-2026-${String(allocations.length + 1).padStart(3, '0')}`,
      project_id: proj.id,
      project_name: proj.name,
      centre_id: centre.id,
      centre_name: centre.name,
      city: centre.city || 'Delhi NCR',
      exam_date: createForm.exam_date,
      venue_capacity: venueCap,
      buffer_pct: 12,
      shifts: [
        { shift_no: 1, start_time: '09:00 AM', end_time: '12:20 PM', candidates: Number(createForm.shift1_candidates), buffer_nodes: Number(createForm.shift1_buffer) },
        { shift_no: 2, start_time: '02:30 PM', end_time: '05:50 PM', candidates: Number(createForm.shift2_candidates), buffer_nodes: Number(createForm.shift2_buffer) }
      ],
      total_candidates: Number(createForm.shift1_candidates) + Number(createForm.shift2_candidates),
      is_locked: false,
      locked_at: '',
      locked_by: '',
      lock_version: 'v0.1 (Draft)',
      change_requests: []
    };

    AllocationStore.create(newAlc);
    appendAuditLog({
      module: 'Allocation Management',
      action: 'Allocation Created',
      record_ref: newAlc.allocation_code,
      user_id: user?.email || 'ops@oemportal.in',
      details: `Created allocation sheet for ${centre.name} with ${newAlc.total_candidates} total candidates.`
    });

    loadData();
    setCreateModalOpen(false);
  };

  const filteredAllocations = allocations.filter(a => {
    const matchSearch = a.centre_name.toLowerCase().includes(search.toLowerCase()) ||
                        a.allocation_code.toLowerCase().includes(search.toLowerCase()) ||
                        a.city.toLowerCase().includes(search.toLowerCase());
    const matchProj = projectFilter === 'ALL' || a.project_name === projectFilter;
    return matchSearch && matchProj;
  });

  const kpis = {
    totalVenues: allocations.length,
    totalCandidates: allocations.reduce((acc, a) => acc + (a.total_candidates || 0), 0),
    lockedCount: allocations.filter(a => a.is_locked).length,
    pendingChanges: allocations.reduce((acc, a) => acc + (a.change_requests?.filter(cr => cr.status.includes('Pending')).length || 0), 0)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Candidate Allocation & Shift Locking Pipeline
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                Shift-wise candidate seat distribution, buffer capacity rules, PM approval lock & change audit governance
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className="btn btn-primary"
            onClick={() => setCreateModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={16} /> New Candidate Allocation
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL VENUES ALLOCATED</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>{kpis.totalVenues}</div>
          <div style={{ fontSize: 12, color: '#0284c7', marginTop: 4 }}>Approved Examination Venues</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL SEATED CANDIDATES</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#16a34a' }}>{kpis.totalCandidates.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Across all shift schedules</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>LOCKED ALLOCATIONS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#7c3aed' }}>
            {kpis.lockedCount} / {kpis.totalVenues}
          </div>
          <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 4 }}>Signed off by Project Manager</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>PENDING CHANGE REQUESTS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#d97706' }}>{kpis.pendingChanges}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Awaiting PM approval</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 'min(100%, 240px)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search by centre name, allocation code, city..."
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
            value={projectFilter} 
            onChange={(e) => setProjectFilter(e.target.value)}
            className="input"
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
            <option value="ALL">All Exam Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Allocation Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredAllocations.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No candidate allocations match your filters.
          </div>
        ) : (
          filteredAllocations.map((alc) => {
            const isLocked = alc.is_locked;
            const hasPendingChange = alc.change_requests?.some(cr => cr.status.includes('Pending'));

            return (
              <div 
                key={alc.id}
                className="card"
                style={{
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  borderLeft: `5px solid ${isLocked ? '#16a34a' : '#d97706'}`
                }}
              >
                {/* Top Info Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>{alc.allocation_code}</span>
                      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {alc.centre_name}
                      </h2>
                      <span className={`badge ${isLocked ? 'badge-success' : 'badge-warning'}`}>
                        {isLocked ? 'Locked & Approved' : 'Draft Open'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Exam Project: <strong>{alc.project_name}</strong> | City: {alc.city} | Exam Date: <strong>{alc.exam_date}</strong>
                    </div>
                  </div>

                  {/* Lock Action & Version */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{alc.lock_version}</div>
                      {isLocked && alc.locked_by && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>by {alc.locked_by}</div>
                      )}
                    </div>

                    <button 
                      className={`btn btn-sm ${isLocked ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleToggleLock(alc)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                      {isLocked ? 'Unlock Allocation' : 'PM Signoff & Lock'}
                    </button>
                  </div>
                </div>

                {/* Shift Breakdown Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  {alc.shifts?.map((s, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        padding: 16, borderRadius: 10, 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border-color)',
                        display: 'flex', flexDirection: 'column', gap: 8
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Shift {s.shift_no} ({s.start_time} – {s.end_time})
                        </span>
                        <span className="badge badge-info">Capacity: {alc.venue_capacity}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Assigned Candidates</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#0284c7' }}>{s.candidates}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Buffer Reserve Nodes</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>+{s.buffer_nodes}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Total Active Load</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                            {s.candidates + s.buffer_nodes}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Change Request Banner if exists */}
                {alc.change_requests && alc.change_requests.length > 0 && (
                  <div style={{ padding: 12, borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#92400e' }}>
                      <AlertTriangle size={14} /> Active Post-Lock Change Request:
                    </div>
                    {alc.change_requests.map((cr, idx) => (
                      <div key={idx} style={{ fontSize: 12, color: '#78350f', marginTop: 4 }}>
                        "{cr.reason}" — Requested by <strong>{cr.requested_by}</strong> ({cr.status})
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    Total Day Candidates: <strong>{alc.total_candidates}</strong> | Venue Peak Node Occupancy: <strong>{alc.shifts ? Math.max(...alc.shifts.map(s => s.candidates + s.buffer_nodes)) : 0} nodes</strong>
                  </div>

                  <div>
                    {isLocked ? (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenChangeRequest(alc)}
                        style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <AlertCircle size={14} /> Request Post-Lock Change
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>
                        Awaiting PM Approval Lock before dispatching final candidate admit cards.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* POST-LOCK CHANGE REQUEST MODAL */}
      {changeModalOpen && selectedAllocation && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <form onSubmit={handleSubmitChangeRequest} className="card" style={{
            width: '100%', maxWidth: 520, padding: 24, borderRadius: 16,
            border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Request Post-Lock Allocation Modification
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {selectedAllocation.centre_name} ({selectedAllocation.allocation_code})
                </div>
              </div>
              <button type="button" onClick={() => setChangeModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#991b1b' }}>
              ⚠️ Critical Rule: This allocation sheet has been formally locked by the Project Manager. Any modification requires mandatory business justification and re-audit approval.
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Business Justification & Change Scope *
              </label>
              <textarea 
                rows={3}
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="input"
                style={{ width: '100%', fontSize: 13 }}
                placeholder="State reason (e.g. client quota adjustment, lab node capacity revision, buffer expansion)..."
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setChangeModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit Change Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW ALLOCATION MODAL */}
      {createModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <form onSubmit={handleCreateAllocation} className="card" style={{
            width: '100%', maxWidth: 560, padding: 24, borderRadius: 16,
            border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Create Shift Allocation Sheet
              </h2>
              <button type="button" onClick={() => setCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Centre Venue *
                </label>
                <select 
                  value={createForm.centre_id}
                  onChange={(e) => setCreateForm({ ...createForm, centre_id: e.target.value })}
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
                  Exam Project *
                </label>
                <select 
                  value={createForm.project_id}
                  onChange={(e) => setCreateForm({ ...createForm, project_id: e.target.value })}
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
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Examination Date *
              </label>
              <input 
                type="date"
                value={createForm.exam_date}
                onChange={(e) => setCreateForm({ ...createForm, exam_date: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Shift 1 Allocation</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Candidates</label>
                    <input 
                      type="number" min="1"
                      value={createForm.shift1_candidates}
                      onChange={(e) => setCreateForm({ ...createForm, shift1_candidates: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Buffer Nodes (10-15%)</label>
                    <input 
                      type="number" min="0"
                      value={createForm.shift1_buffer}
                      onChange={(e) => setCreateForm({ ...createForm, shift1_buffer: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Shift 2 Allocation</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Candidates</label>
                    <input 
                      type="number" min="1"
                      value={createForm.shift2_candidates}
                      onChange={(e) => setCreateForm({ ...createForm, shift2_candidates: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Buffer Nodes (10-15%)</label>
                    <input 
                      type="number" min="0"
                      value={createForm.shift2_buffer}
                      onChange={(e) => setCreateForm({ ...createForm, shift2_buffer: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Allocation Sheet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
