import React, { useState, useEffect } from 'react';
import { 
  Calculator, Search, Filter, Plus, CheckCircle2, 
  Clock, AlertTriangle, FileText, History, ArrowRight, X, DollarSign
} from 'lucide-react';
import { CostSheetStore, ProjectStore, CentreStore, appendAuditLog } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';

export default function CostSheetPage() {
  const { user } = useAuth();
  const [costSheets, setCostSheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [centres, setCentres] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    centre_id: '',
    project_id: '',
    node_rate: 180,
    shift_count: 2,
    allocated_candidates: 300,
    buffer_nodes: 40,
    buffer_rate: 90,
    manpower_charge: 10000,
    surveillance_charge: 6000,
    diesel_generator_charge: 5000
  });

  const loadData = () => {
    setCostSheets(CostSheetStore.getAll());
    setProjects(ProjectStore.getAll());
    setCentres(CentreStore.getAll());
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleApproveSheet = (sheetId) => {
    const sheet = costSheets.find(s => s.id === sheetId);
    if (!sheet) return;

    CostSheetStore.update(sheetId, {
      status: 'Approved',
      version: 'v1.0 (Approved)',
      approved_by: user?.name || 'Head of Finance',
      approved_at: new Date().toISOString()
    });

    appendAuditLog({
      module: 'Commercials & Cost Sheets',
      action: 'Cost Sheet Approved',
      record_ref: sheet.sheet_code,
      user_id: user?.email || 'finance@oemportal.in',
      details: `Approved total commercial budget of ₹${sheet.total_cost.toLocaleString()} for ${sheet.centre_name}.`
    });

    loadData();
  };

  const handleCreateSheet = (e) => {
    e.preventDefault();
    const centre = centres.find(c => c.id === formData.centre_id);
    const proj = projects.find(p => p.id === formData.project_id);
    if (!centre || !proj) {
      alert('Please select both Centre and Project');
      return;
    }

    const candidateTotal = Number(formData.allocated_candidates) * Number(formData.node_rate);
    const bufferTotal = Number(formData.buffer_nodes) * Number(formData.buffer_rate);
    const subtotal = candidateTotal + bufferTotal + Number(formData.manpower_charge) + Number(formData.surveillance_charge) + Number(formData.diesel_generator_charge);
    const gstAmount = Math.round(subtotal * 0.18);
    const totalCost = subtotal + gstAmount;

    const newSheet = {
      id: `cst_${Date.now()}`,
      sheet_code: `CST-2026-${String(costSheets.length + 1).padStart(3, '0')}`,
      project_id: proj.id,
      project_name: proj.name,
      centre_id: centre.id,
      centre_name: centre.name,
      city: centre.city || 'Delhi NCR',
      rates: {
        node_rate: Number(formData.node_rate),
        shift_count: Number(formData.shift_count),
        allocated_candidates: Number(formData.allocated_candidates),
        buffer_nodes: Number(formData.buffer_nodes),
        buffer_rate: Number(formData.buffer_rate),
        manpower_charge: Number(formData.manpower_charge),
        surveillance_charge: Number(formData.surveillance_charge),
        diesel_generator_charge: Number(formData.diesel_generator_charge)
      },
      subtotal,
      gst_pct: 18,
      gst_amount: gstAmount,
      total_cost: totalCost,
      version: 'v1.0 (Draft)',
      status: 'Submitted for Review',
      approved_by: '',
      approved_at: '',
      versions_history: [
        {
          version: 'v1.0',
          updated_by: user?.name || 'Operations Executive',
          date: new Date().toISOString().split('T')[0],
          total_amount: totalCost,
          diff_summary: 'Initial commercial proposal generated.'
        }
      ]
    };

    CostSheetStore.create(newSheet);
    appendAuditLog({
      module: 'Commercials & Cost Sheets',
      action: 'Cost Sheet Created',
      record_ref: newSheet.sheet_code,
      user_id: user?.email || 'ops@oemportal.in',
      details: `Created commercial cost sheet for ${centre.name} with total budget ₹${totalCost.toLocaleString()}`
    });

    loadData();
    setCreateModalOpen(false);
  };

  const filteredSheets = costSheets.filter(s => {
    const matchSearch = s.centre_name.toLowerCase().includes(search.toLowerCase()) ||
                        s.sheet_code.toLowerCase().includes(search.toLowerCase()) ||
                        s.project_name.toLowerCase().includes(search.toLowerCase());
    const matchStat = statusFilter === 'ALL' || s.status === statusFilter;
    return matchSearch && matchStat;
  });

  const kpis = {
    totalBudget: costSheets.reduce((acc, s) => acc + (s.total_cost || 0), 0),
    approvedCount: costSheets.filter(s => s.status === 'Approved').length,
    underReviewCount: costSheets.filter(s => s.status === 'Submitted for Review' || s.status === 'Draft').length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Calculator size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Venue Commercial Cost Sheets & Version Control
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                Shift candidate rates, DG & surveillance tariffs, GST 18% calculation, and version audit diffs
              </p>
            </div>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setCreateModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} /> Build New Cost Sheet
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL COMMERCIAL VALUE</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#059669' }}>
            ₹{kpis.totalBudget.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Across all active venue agreements</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>FINANCE APPROVED SHEETS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#16a34a' }}>{kpis.approvedCount}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Ready for Centre billing</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>UNDER FINANCE REVIEW</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#d97706' }}>{kpis.underReviewCount}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Rate negotiations in progress</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search by centre name, cost sheet code, project..."
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
            <option value="ALL">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Submitted for Review">Submitted for Review</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Cost Sheets Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredSheets.map((s) => {
          const isApproved = s.status === 'Approved';

          return (
            <div 
              key={s.id}
              className="card"
              style={{
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                borderLeft: `5px solid ${isApproved ? '#16a34a' : '#d97706'}`
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>{s.sheet_code}</span>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {s.centre_name}
                    </h2>
                    <span className={`badge ${isApproved ? 'badge-success' : 'badge-warning'}`}>
                      {s.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Project: <strong>{s.project_name}</strong> | City: {s.city} | Version: <strong>{s.version}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Commercial Value (Inc. 18% GST)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#059669' }}>
                    ₹{s.total_cost?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Rates Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Candidate Node Rate</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    ₹{s.rates?.node_rate} / candidate
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.rates?.allocated_candidates} nodes allocated</div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Buffer Reserve Rate</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    ₹{s.rates?.buffer_rate} / buffer node
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.rates?.buffer_nodes} reserve nodes</div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Manpower & Staffing</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    ₹{s.rates?.manpower_charge?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>TCA, IT & Security</div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>DG Power & Fuel</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    ₹{s.rates?.diesel_generator_charge?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>8-hour load backup</div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>IP CCTV Surveillance</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    ₹{s.rates?.surveillance_charge?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>30-day NVR backup</div>
                </div>
              </div>

              {/* Bottom Actions & Version History */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSelectedSheet(s); setVersionModalOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                >
                  <History size={14} /> View Version History ({s.versions_history?.length || 1})
                </button>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {!isApproved && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApproveSheet(s.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a' }}
                    >
                      <CheckCircle2 size={14} /> Finance Head Approval
                    </button>
                  )}
                  {isApproved && s.approved_by && (
                    <span style={{ fontSize: 12, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={14} /> Approved by {s.approved_by}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VERSION HISTORY MODAL */}
      {versionModalOpen && selectedSheet && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: 600, padding: 24, borderRadius: 16,
            border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Cost Sheet Version & Audit History
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {selectedSheet.centre_name} ({selectedSheet.sheet_code})
                </div>
              </div>
              <button type="button" onClick={() => setVersionModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(selectedSheet.versions_history || []).map((vh, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#059669' }}>Version {vh.version}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{vh.date} by {vh.updated_by}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                    Total Amount: ₹{vh.total_amount?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {vh.diff_summary}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setVersionModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COST SHEET MODAL */}
      {createModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <form onSubmit={handleCreateSheet} className="card" style={{
            width: '100%', maxWidth: 580, padding: 24, borderRadius: 16,
            border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Generate Venue Cost Sheet
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
                  value={formData.centre_id}
                  onChange={(e) => setFormData({ ...formData, centre_id: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Choose Centre...</option>
                  {centres.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Exam Project *
                </label>
                <select 
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Rate / Candidate (₹)</label>
                <input 
                  type="number"
                  value={formData.node_rate}
                  onChange={(e) => setFormData({ ...formData, node_rate: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Total Candidates</label>
                <input 
                  type="number"
                  value={formData.allocated_candidates}
                  onChange={(e) => setFormData({ ...formData, allocated_candidates: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Buffer Nodes</label>
                <input 
                  type="number"
                  value={formData.buffer_nodes}
                  onChange={(e) => setFormData({ ...formData, buffer_nodes: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Manpower Tariff (₹)</label>
                <input 
                  type="number"
                  value={formData.manpower_charge}
                  onChange={(e) => setFormData({ ...formData, manpower_charge: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>DG Power Tariff (₹)</label>
                <input 
                  type="number"
                  value={formData.diesel_generator_charge}
                  onChange={(e) => setFormData({ ...formData, diesel_generator_charge: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>CCTV Tariff (₹)</label>
                <input 
                  type="number"
                  value={formData.surveillance_charge}
                  onChange={(e) => setFormData({ ...formData, surveillance_charge: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ background: '#059669' }}>
                Save & Dispatch for Review
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
