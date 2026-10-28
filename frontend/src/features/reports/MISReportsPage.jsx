import { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import {
  BarChart3, Download, Filter, Search, Calendar, FileSpreadsheet,
  Printer, TrendingUp, ShieldCheck, CheckCircle2, AlertTriangle,
  Building2, Users, IndianRupee, Layers, Briefcase, Eye,
  ArrowUpRight, RefreshCw, ChevronDown, Check, Clock
} from 'lucide-react';
import { useAuth, ROLES, ROLE_LABELS } from '@/context/AuthContext';
import {
  CentreStore, ProjectStore, UserStore,
  BookingStore, AuditStore, AllocationStore,
  InvoiceStore, PaymentStore
} from '@/services/dataService';


// Chart Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.95)',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '0.75rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      color: '#f8fafc'
    }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4, color: '#38bdf8' }}>{label}</div>}
      {payload.map((p, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || '#38bdf8' }} />
          <span>{p.name}:</span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function MISReportsPage() {
  const { user } = useAuth();
  const isPM = user?.role === ROLES.PM;

  const [activeTab, setActiveTab] = useState('operational'); // 'operational' | 'compliance' | 'finance' | 'executive'
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedCycle, setSelectedCycle] = useState('2026-2027');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live Data Pulls
  const liveProjects = ProjectStore.getAll();
  const liveCentres = CentreStore.getAll();
  const liveUsers = UserStore.getAll();
  const liveInvoices = InvoiceStore.getAll();
  const livePayments = PaymentStore.getAll();

  // Filter projects by PM scope if PM role
  const scopedProjects = useMemo(() => {
    if (isPM && user?.assignedProjects?.length) {
      return liveProjects.filter(p => user.assignedProjects.includes(p.id));
    }
    return liveProjects;
  }, [liveProjects, isPM, user]);

  // Master Operational MIS Table Data
  const operationalData = useMemo(() => {
    const raw = [
      {
        id: 'p001',
        name: 'NEET UG 2026',
        client: 'National Testing Agency (NTA)',
        examDate: '07 May 2026',
        targetCandidates: 145000,
        allocatedCandidates: 142800,
        centresRequired: 140,
        centresBooked: 138,
        auditPassed: 132,
        allocationLocked: true,
        readinessScore: 94,
        stage: 'Execution Ready',
        slaStatus: 'On Track',
        financialOutlay: 18500000,
        invoicedAmount: 14200000
      },
      {
        id: 'p002',
        name: 'JEE Mains 2027',
        client: 'Joint Apex Board',
        examDate: '12 Jan 2027',
        targetCandidates: 98000,
        allocatedCandidates: 88500,
        centresRequired: 95,
        centresBooked: 90,
        auditPassed: 81,
        allocationLocked: false,
        readinessScore: 82,
        stage: 'Audit & Scanning',
        slaStatus: 'Action Required',
        financialOutlay: 12200000,
        invoicedAmount: 4800000
      },
      {
        id: 'p003',
        name: 'CUET PG 2026',
        client: 'Central Universities Consortium',
        examDate: '15 Jun 2026',
        targetCandidates: 65000,
        allocatedCandidates: 54000,
        centresRequired: 65,
        centresBooked: 58,
        auditPassed: 49,
        allocationLocked: false,
        readinessScore: 76,
        stage: 'Consent & Booking',
        slaStatus: 'On Track',
        financialOutlay: 8100000,
        invoicedAmount: 1800000
      },
      {
        id: 'p004',
        name: 'State Police Constable 2026',
        client: 'Police Recruitment Board',
        examDate: '22 Aug 2026',
        targetCandidates: 110000,
        allocatedCandidates: 92000,
        centresRequired: 115,
        centresBooked: 98,
        auditPassed: 85,
        allocationLocked: false,
        readinessScore: 68,
        stage: 'Eligibility Review',
        slaStatus: 'At Risk',
        financialOutlay: 14000000,
        invoicedAmount: 0
      }
    ];

    return raw.filter(item => {
      if (selectedProject !== 'all' && item.id !== selectedProject) return false;
      if (stageFilter !== 'all' && item.stage !== stageFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) ||
               item.client.toLowerCase().includes(q) ||
               item.stage.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedProject, stageFilter, searchQuery]);

  // Aggregated KPIs
  const metrics = useMemo(() => {
    const totalTarget = operationalData.reduce((acc, c) => acc + c.targetCandidates, 0);
    const totalAllocated = operationalData.reduce((acc, c) => acc + c.allocatedCandidates, 0);
    const totalCentresReq = operationalData.reduce((acc, c) => acc + c.centresRequired, 0);
    const totalCentresBooked = operationalData.reduce((acc, c) => acc + c.centresBooked, 0);
    const totalOutlay = operationalData.reduce((acc, c) => acc + c.financialOutlay, 0);
    const totalInvoiced = operationalData.reduce((acc, c) => acc + c.invoicedAmount, 0);

    const coveragePct = totalCentresReq > 0 ? Math.round((totalCentresBooked / totalCentresReq) * 100) : 0;
    const capacityPct = totalTarget > 0 ? Math.round((totalAllocated / totalTarget) * 100) : 0;

    return {
      totalTarget,
      totalAllocated,
      totalCentresReq,
      totalCentresBooked,
      coveragePct,
      capacityPct,
      totalOutlay,
      totalInvoiced
    };
  }, [operationalData]);

  // Compliance Statistics
  const complianceData = [
    { category: 'Physical Infrastructure', pass: 142, rework: 8, fail: 2 },
    { category: 'Network & Firewalls', pass: 138, rework: 11, fail: 3 },
    { category: 'Power & UPS Backup', pass: 129, rework: 18, fail: 5 },
    { category: 'CCTV & Surveillance', pass: 145, rework: 5, fail: 2 },
    { category: 'Biometric & Desks', pass: 139, rework: 9, fail: 4 },
  ];

  const findingsSeverityData = [
    { name: 'Critical (Blocker)', value: 14, color: '#ef4444' },
    { name: 'High (Immediate Action)', value: 36, color: '#f97316' },
    { name: 'Medium (Rework Due)', value: 68, color: '#eab308' },
    { name: 'Low (Advisory)', value: 112, color: '#38bdf8' },
  ];

  // CSV Export Engine
  const exportToCSV = (type = 'operational') => {
    let filename = `OEM_${type.toUpperCase()}_MIS_REPORT_${new Date().toISOString().slice(0, 10)}.csv`;
    let headers = [];
    let rows = [];

    if (type === 'operational') {
      headers = [
        'Project Name', 'Client', 'Exam Date', 'Target Candidates',
        'Allocated Candidates', 'Centres Required', 'Centres Booked',
        'Audit Passed', 'Locked', 'Readiness Score %', 'Stage', 'SLA Status'
      ];
      rows = operationalData.map(r => [
        `"${r.name}"`,
        `"${r.client}"`,
        `"${r.examDate}"`,
        r.targetCandidates,
        r.allocatedCandidates,
        r.centresRequired,
        r.centresBooked,
        r.auditPassed,
        r.allocationLocked ? 'YES' : 'NO',
        `${r.readinessScore}%`,
        `"${r.stage}"`,
        `"${r.slaStatus}"`
      ]);
    } else if (type === 'finance') {
      headers = [
        'Project Name', 'Client', 'Total Commercial Outlay (INR)',
        'Invoiced Amount (INR)', 'Pending Disbursement (INR)', 'Payment Status'
      ];
      rows = operationalData.map(r => [
        `"${r.name}"`,
        `"${r.client}"`,
        r.financialOutlay,
        r.invoicedAmount,
        r.financialOutlay - r.invoicedAmount,
        r.invoicedAmount > 0 ? 'PARTIALLY_DISBURSED' : 'PENDING'
      ]);
    } else {
      headers = ['Category', 'Pass Count', 'Rework Required', 'Failed Count'];
      rows = complianceData.map(c => [
        `"${c.category}"`,
        c.pass,
        c.rework,
        c.fail
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filename} successfully`);
  };

  return (
    <div className="mis-page-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="mis-toast">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="mis-header-banner">
        <div className="mis-title-area">
          <div className="mis-scope-pill">
            <span className="pulsing-green-dot" />
            <span>Scope: {isPM ? 'Project Manager MIS (Assigned Portfolio)' : 'Executive Enterprise MIS'}</span>
          </div>
          <h1 className="mis-main-title">
            {isPM ? 'Project MIS & Execution Analytics' : 'Enterprise MIS & Executive Reporting'}
          </h1>
          <p className="mis-subtitle">
            Cross-project operational intelligence, capacity utilization, compliance heatmaps, and financial reconciliations.
          </p>
        </div>

        <div className="mis-action-group">
          <div className="cycle-selector-box">
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <select value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)}>
              <option value="2026-2027">AY 2026–2027 Cycle</option>
              <option value="2025-2026">AY 2025–2026 (Archived)</option>
              <option value="all">Lifetime Cycle</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={() => exportToCSV(activeTab)}>
            <Download size={15} style={{ color: '#38bdf8' }} />
            <span>Export CSV</span>
          </button>

          <button className="btn btn-ghost" onClick={() => window.print()} title="Print / PDF View">
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* Top Level Metric Deck */}
      <div className="mis-metrics-deck">
        <div className="mis-kpi-card">
          <div className="mis-kpi-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
            <Users size={22} />
          </div>
          <div className="mis-kpi-body">
            <div className="mis-kpi-lbl">Target Capacity</div>
            <div className="mis-kpi-val">{metrics.totalTarget.toLocaleString('en-IN')}</div>
            <div className="mis-kpi-sub" style={{ color: '#10b981' }}>
              <span>{metrics.capacityPct}% Allocated</span>
              <span className="dot-sep">·</span>
              <span>{metrics.totalAllocated.toLocaleString('en-IN')} nodes</span>
            </div>
          </div>
        </div>

        <div className="mis-kpi-card">
          <div className="mis-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <Building2 size={22} />
          </div>
          <div className="mis-kpi-body">
            <div className="mis-kpi-lbl">Venue Coverage</div>
            <div className="mis-kpi-val">{metrics.totalCentresBooked} / {metrics.totalCentresReq}</div>
            <div className="mis-kpi-sub" style={{ color: '#38bdf8' }}>
              <span>{metrics.coveragePct}% Booked & Consented</span>
            </div>
          </div>
        </div>

        <div className="mis-kpi-card">
          <div className="mis-kpi-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
            <IndianRupee size={22} />
          </div>
          <div className="mis-kpi-body">
            <div className="mis-kpi-lbl">Sanctioned Commercials</div>
            <div className="mis-kpi-val">₹{(metrics.totalOutlay / 10000000).toFixed(2)} Cr</div>
            <div className="mis-kpi-sub" style={{ color: 'var(--text-muted)' }}>
              <span>₹{(metrics.totalInvoiced / 10000000).toFixed(2)} Cr Invoiced</span>
            </div>
          </div>
        </div>

        <div className="mis-kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="mis-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <ShieldCheck size={22} />
          </div>
          <div className="mis-kpi-body">
            <div className="mis-kpi-lbl">Overall SLA Adherence</div>
            <div className="mis-kpi-val" style={{ color: '#10b981' }}>97.4%</div>
            <div className="mis-kpi-sub">
              <span style={{ color: '#f97316' }}>3 Overdue Actions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mis-tabs-row">
        <button
          className={`mis-tab-btn ${activeTab === 'operational' ? 'active' : ''}`}
          onClick={() => setActiveTab('operational')}
        >
          <Layers size={16} />
          <span>Cross-Project Operational MIS</span>
        </button>

        <button
          className={`mis-tab-btn ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          <ShieldCheck size={16} />
          <span>Compliance & Audit Analytics</span>
        </button>

        <button
          className={`mis-tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
          onClick={() => setActiveTab('finance')}
        >
          <IndianRupee size={16} />
          <span>Commercial & Outlay MIS</span>
        </button>

        <button
          className={`mis-tab-btn ${activeTab === 'executive' ? 'active' : ''}`}
          onClick={() => setActiveTab('executive')}
        >
          <TrendingUp size={16} />
          <span>Executive / CEO Summary Deck</span>
        </button>
      </div>

      {/* ── TAB 1: OPERATIONAL MIS ── */}
      {activeTab === 'operational' && (
        <div className="mis-tab-content">
          {/* Controls Bar */}
          <div className="mis-controls-card">
            <div className="search-input-wrap">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Filter by examination, client name, or stage…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && <button className="clear-btn" onClick={() => setSearchQuery('')}>✕</button>}
            </div>

            <div className="controls-right">
              <div className="control-select-group">
                <span>Project:</span>
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                  <option value="all">All Projects ({liveProjects.length})</option>
                  {scopedProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="control-select-group">
                <span>Stage:</span>
                <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
                  <option value="all">All Stages</option>
                  <option value="Execution Ready">Execution Ready</option>
                  <option value="Audit & Scanning">Audit & Scanning</option>
                  <option value="Consent & Booking">Consent & Booking</option>
                  <option value="Eligibility Review">Eligibility Review</option>
                </select>
              </div>

              <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV('operational')}>
                <FileSpreadsheet size={14} style={{ color: '#10b981' }} />
                <span>Export Operational CSV</span>
              </button>
            </div>
          </div>

          {/* Master Operational Table */}
          <div className="mis-table-card">
            <div className="table-responsive">
              <table className="mis-table">
                <thead>
                  <tr>
                    <th>Examination Project</th>
                    <th>Client Agency</th>
                    <th>Exam Date</th>
                    <th>Target Nodes</th>
                    <th>Booked Venues</th>
                    <th>Audit Passed</th>
                    <th>Locked</th>
                    <th>Readiness Score</th>
                    <th>Pipeline Stage</th>
                    <th>SLA Status</th>
                  </tr>
                </thead>
                <tbody>
                  {operationalData.map(row => {
                    const bookedRatio = `${row.centresBooked}/${row.centresRequired}`;
                    const auditRatio = `${row.auditPassed}/${row.centresBooked}`;
                    const coveragePercent = Math.round((row.centresBooked / row.centresRequired) * 100);

                    return (
                      <tr key={row.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {row.name}
                          </div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            ID: {row.id.toUpperCase()}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>{row.client}</td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{row.examDate}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{row.allocatedCandidates.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Target: {row.targetCandidates.toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600 }}>{bookedRatio}</span>
                            <span className="percentage-pill" style={{
                              background: coveragePercent >= 90 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                              color: coveragePercent >= 90 ? '#10b981' : '#eab308'
                            }}>
                              {coveragePercent}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: row.auditPassed === row.centresBooked ? '#10b981' : 'var(--text-primary)' }}>
                            {auditRatio}
                          </span>
                        </td>
                        <td>
                          <span className={`lock-badge ${row.allocationLocked ? 'locked' : 'open'}`}>
                            {row.allocationLocked ? '🔒 LOCKED' : '🔓 OPEN'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="mini-progress-bar">
                              <div
                                className="mini-progress-fill"
                                style={{
                                  width: `${row.readinessScore}%`,
                                  background: row.readinessScore >= 85 ? '#10b981' : row.readinessScore >= 70 ? '#eab308' : '#ef4444'
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{row.readinessScore}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="stage-pill">{row.stage}</span>
                        </td>
                        <td>
                          <span className={`sla-pill ${row.slaStatus.toLowerCase().replace(' ', '-')}`}>
                            {row.slaStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: COMPLIANCE & AUDIT MIS ── */}
      {activeTab === 'compliance' && (
        <div className="mis-tab-content">
          <div className="mis-charts-grid">
            {/* Chart 1: Findings Severity Breakdown */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Audit Findings Breakdown</h3>
                  <p>Aggregate non-compliance issues identified across active centres</p>
                </div>
              </div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={findingsSeverityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {findingsSeverityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Parameter-wise Audit Performance */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Category-Wise Audit Compliance</h3>
                  <p>Pass vs Rework vs Fail rates per technical & physical parameter</p>
                </div>
              </div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="pass" name="Passed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rework" name="Rework Required" fill="#eab308" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fail" name="Failed / Blocker" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Compliance Checklist Table */}
          <div className="mis-table-card" style={{ marginTop: 20 }}>
            <div className="table-header-box">
              <h3>Technical Scan & Compliance Health Tracker</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV('compliance')}>
                <Download size={14} /> Export Compliance CSV
              </button>
            </div>
            <div className="table-responsive">
              <table className="mis-table">
                <thead>
                  <tr>
                    <th>Audit Parameter</th>
                    <th>Compliant Centres</th>
                    <th>Rework In-Progress</th>
                    <th>Flagged Failures</th>
                    <th>Compliance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceData.map(c => {
                    const total = c.pass + c.rework + c.fail;
                    const passRate = Math.round((c.pass / total) * 100);
                    return (
                      <tr key={c.category}>
                        <td style={{ fontWeight: 600 }}>{c.category}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>{c.pass} centres</td>
                        <td style={{ color: '#eab308', fontWeight: 600 }}>{c.rework} centres</td>
                        <td style={{ color: '#ef4444', fontWeight: 600 }}>{c.fail} centres</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="mini-progress-bar">
                              <div className="mini-progress-fill" style={{ width: `${passRate}%`, background: '#10b981' }} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{passRate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: COMMERCIAL & OUTLAY MIS ── */}
      {activeTab === 'finance' && (
        <div className="mis-tab-content">
          <div className="mis-charts-grid">
            {/* Outlay vs Invoiced Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Commercial Outlay vs Invoiced Value (₹ Lakhs)</h3>
                  <p>Client sanctioned budget vs generated centre invoice liabilities</p>
                </div>
              </div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={INVOICE_AMOUNT_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="paid" name="Disbursed & Paid (L)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name="Pending Reconciliation (L)" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Invoicing Status Doughnut */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Tax Invoice Processing Status</h3>
                  <p>Distribution of centre bills across verification lifecycle</p>
                </div>
              </div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={INVOICE_STATUS_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {INVOICE_STATUS_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Financial Reconciliation Table */}
          <div className="mis-table-card" style={{ marginTop: 20 }}>
            <div className="table-header-box">
              <h3>Project Financial Reconciliation & Payout Commitment</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV('finance')}>
                <FileSpreadsheet size={14} /> Export Financial CSV
              </button>
            </div>
            <div className="table-responsive">
              <table className="mis-table">
                <thead>
                  <tr>
                    <th>Examination Project</th>
                    <th>Sanctioned Outlay (₹)</th>
                    <th>Invoiced (₹)</th>
                    <th>Disbursed via UTR (₹)</th>
                    <th>Hold / Pending Reconciliation</th>
                    <th>Closure Status</th>
                  </tr>
                </thead>
                <tbody>
                  {operationalData.map(p => {
                    const pending = p.financialOutlay - p.invoicedAmount;
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹{p.financialOutlay.toLocaleString('en-IN')}</td>
                        <td style={{ fontFamily: 'monospace', color: '#38bdf8' }}>₹{p.invoicedAmount.toLocaleString('en-IN')}</td>
                        <td style={{ fontFamily: 'monospace', color: '#10b981' }}>
                          ₹{(p.invoicedAmount * 0.85).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td style={{ fontFamily: 'monospace', color: '#f97316' }}>₹{pending.toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`status-pill ${p.invoicedAmount > 0 ? 'partially-closed' : 'open'}`}>
                            {p.invoicedAmount > 0 ? 'PARTIAL RECONCILIATION' : 'INITIAL PHASE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: EXECUTIVE / CEO SUMMARY DECK ── */}
      {activeTab === 'executive' && (
        <div className="mis-tab-content">
          <div className="executive-banner">
            <div>
              <h3>Board & CEO Executive Snapshot</h3>
              <p>High-level portfolio health, major delivery milestones, and immediate executive action items.</p>
            </div>
            <span className="badge badge-primary">Confidential — Executive Level</span>
          </div>

          <div className="executive-kpi-row">
            <div className="exec-card">
              <div className="exec-title">Total Exam Pipeline Value</div>
              <div className="exec-num">₹5.28 Cr</div>
              <div className="exec-sub">Across 4 major competitive client drives</div>
            </div>
            <div className="exec-card">
              <div className="exec-title">Active Candidate Footprint</div>
              <div className="exec-num">4,18,000</div>
              <div className="exec-sub">Pan-India capacity sanctioned</div>
            </div>
            <div className="exec-card">
              <div className="exec-title">Audit Qualified Venues</div>
              <div className="exec-num">347 / 415</div>
              <div className="exec-sub">83.6% compliance clearance rate</div>
            </div>
            <div className="exec-card">
              <div className="exec-title">Critical Exception Flag</div>
              <div className="exec-num" style={{ color: '#ef4444' }}>02</div>
              <div className="exec-sub">Duplicate MAC & Power cutover escalated</div>
            </div>
          </div>

          <div className="exec-watchlist-card">
            <h4>🚨 Executive Watchlist & Risk Mitigation Items</h4>
            <div className="watchlist-items">
              <div className="watchlist-item high-risk">
                <div className="risk-indicator" />
                <div className="risk-content">
                  <div className="risk-head">
                    <strong>NEET UG 2026:</strong> Lotus Computer Education, Jaipur
                  </div>
                  <div className="risk-desc">
                    Duplicate MAC address detected on 3 examination nodes. IT Auditor onsite investigation required prior to allocation lock.
                  </div>
                </div>
                <span className="badge badge-danger">Critical Blocker</span>
              </div>

              <div className="watchlist-item medium-risk">
                <div className="risk-indicator amber" />
                <div className="risk-content">
                  <div className="risk-head">
                    <strong>JEE Mains 2027:</strong> Sunrise IT Academy, Lucknow
                  </div>
                  <div className="risk-desc">
                    Rehearsal mock power switchover failed during 30-minute blackout test. Secondary DG set vendor dispatched.
                  </div>
                </div>
                <span className="badge badge-warning">High Priority</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Component Styles */}
      <style>{`
        .mis-page-root {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .mis-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #0f172a;
          color: #f8fafc;
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-radius: 8px;
          padding: 12px 18px;
          font-size: 0.8125rem;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          z-index: 9999;
          animation: slideIn 0.2s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .mis-header-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 24px 28px;
          margin-bottom: 24px;
          gap: 20px;
          flex-wrap: wrap;
        }
        .mis-scope-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 0.725rem;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .pulsing-green-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .mis-main-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px 0;
        }
        .mis-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 0;
          max-width: 720px;
          line-height: 1.5;
        }
        .mis-action-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .cycle-selector-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-subtle);
          border: 1px solid var(--border-default);
          padding: 6px 12px;
          border-radius: 8px;
        }
        .cycle-selector-box select {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.8125rem;
          cursor: pointer;
          outline: none;
        }

        /* KPI Deck */
        .mis-metrics-deck {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .mis-kpi-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .mis-kpi-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.3);
        }
        .mis-kpi-icon-wrap {
          width: 46px;
          height: 46px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .mis-kpi-lbl {
          font-size: 0.725rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .mis-kpi-val {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
          margin-bottom: 4px;
        }
        .mis-kpi-sub {
          font-size: 0.725rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dot-sep {
          opacity: 0.5;
        }

        /* Tabs */
        .mis-tabs-row {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--border-default);
          margin-bottom: 20px;
          overflow-x: auto;
        }
        .mis-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          padding: 12px 18px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .mis-tab-btn:hover {
          color: var(--text-primary);
        }
        .mis-tab-btn.active {
          color: #38bdf8;
          border-bottom-color: #38bdf8;
        }

        /* Controls */
        .mis-controls-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 18px;
        }
        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: min(100%, 240px);
          max-width: 420px;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .search-input-wrap input {
          width: 100%;
          padding: 8px 32px 8px 36px;
          border-radius: 8px;
          border: 1px solid var(--border-default);
          background: var(--bg-subtle);
          color: var(--text-primary);
          font-size: 0.8125rem;
        }
        .clear-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .controls-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .control-select-group {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.775rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .control-select-group select {
          padding: 7px 10px;
          border-radius: 6px;
          border: 1px solid var(--border-default);
          background: var(--bg-subtle);
          color: var(--text-primary);
          font-size: 0.775rem;
          cursor: pointer;
        }

        /* Tables */
        .mis-table-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          overflow: hidden;
        }
        .table-responsive {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .table-header-box {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .table-header-box h3 {
          margin: 0;
          font-size: 1rem;
        }
        .mis-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8125rem;
        }
        .mis-table th {
          text-align: left;
          padding: 12px 16px;
          background: var(--bg-subtle);
          border-bottom: 1px solid var(--border-default);
          color: var(--text-muted);
          font-size: 0.725rem;
          font-weight: 600;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .mis-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-default);
        }
        .percentage-pill {
          font-size: 0.675rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .lock-badge {
          font-size: 0.675rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .lock-badge.locked {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        .lock-badge.open {
          background: rgba(234, 179, 8, 0.15);
          color: #eab308;
        }
        .mini-progress-bar {
          width: 70px;
          height: 6px;
          background: var(--bg-subtle);
          border-radius: 999px;
          overflow: hidden;
        }
        .mini-progress-fill {
          height: 100%;
          border-radius: 999px;
        }
        .stage-pill {
          background: var(--bg-subtle);
          color: var(--text-primary);
          border: 1px solid var(--border-default);
          font-size: 0.725rem;
          padding: 2px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .sla-pill {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .sla-pill.on-track {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        .sla-pill.action-required {
          background: rgba(234, 179, 8, 0.15);
          color: #eab308;
        }
        .sla-pill.at-risk {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        .status-pill.partially-closed {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          font-size: 0.675rem;
          padding: 2px 7px;
          border-radius: 999px;
          font-weight: 700;
        }

        /* Charts Grid */
        .mis-charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
          gap: 20px;
        }
        .chart-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          padding: 20px;
          min-width: 0;
        }
        .chart-header h3 {
          margin: 0 0 4px 0;
          font-size: 1rem;
        }
        .chart-header p {
          margin: 0 0 16px 0;
          font-size: 0.775rem;
          color: var(--text-muted);
        }

        /* Executive Tab */
        .executive-banner {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 20px;
        }
        .executive-banner h3 {
          margin: 0 0 4px 0;
        }
        .executive-banner p {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        .executive-kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .mis-charts-grid {
            grid-template-columns: 1fr;
          }
          .executive-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .executive-banner .btn {
            width: 100%;
            justify-content: center;
          }
        }
        @media (max-width: 480px) {
          .mis-metrics-deck {
            grid-template-columns: 1fr;
          }
          .executive-kpi-row {
            grid-template-columns: 1fr;
          }
        }
        .exec-card {
          background: var(--glass-surface);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          box-shadow: var(--glass-shadow);
          padding: 22px;
          text-align: center;
        }
        .exec-title {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .exec-num {
          font-size: 2rem;
          font-weight: 800;
          color: var(--color-primary);
          margin-bottom: 6px;
        }
        .exec-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .exec-watchlist-card {
          background: var(--glass-surface);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          box-shadow: var(--glass-shadow);
          padding: 24px;
        }
        .exec-watchlist-card h4 {
          margin: 0 0 16px 0;
          font-size: 1.05rem;
          color: var(--text-primary);
        }
        .watchlist-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .watchlist-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 18px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.50);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border-subtle);
        }
        .risk-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
          flex-shrink: 0;
        }
        .risk-indicator.amber {
          background: #f59e0b;
          box-shadow: 0 0 8px #f59e0b;
        }
        .risk-content {
          flex: 1;
        }
        .risk-head {
          font-size: 0.85rem;
          margin-bottom: 2px;
        }
        .risk-desc {
          font-size: 0.775rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
