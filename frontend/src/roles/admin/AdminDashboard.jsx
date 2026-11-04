import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  Building2, Plus, RefreshCw, AlertCircle,
  Filter, ChevronRight, X, Activity, ArrowRight
} from 'lucide-react';
import { KpiCard, StatusBadge, LastUpdated, ClientDropdown } from '../../components/common';
import { useClientFilter } from '../../context/ClientContext';
import { apiClient } from '../../services/apiClient';
import { ENDPOINTS } from '../../services/endpoints';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !Array.isArray(payload) || !payload.length) return null;
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(226, 232, 240, 0.90)',
      borderRadius: 'var(--radius-md, 8px)',
      padding: '8px 12px',
      fontSize: '0.75rem',
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
    }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>}
      {payload.map((p, idx) => (
        <div key={p?.name || idx} style={{ color: p?.color || 'var(--text-primary)', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p?.color || '#2563eb', display: 'inline-block' }} />
          {p?.name || 'Item'}: <strong>{p?.value ?? 0}</strong>
        </div>
      ))}
    </div>
  );
};

const RENDERL = (props) => {
  if (!props || typeof props !== 'object') return null;
  const { cx, cy, midAngle, innerRadius, outerRadius, value } = props;
  if (!value || Number(value) < 1) return null;

  const numCx = typeof cx === 'number' ? cx : parseFloat(cx);
  const numCy = typeof cy === 'number' ? cy : parseFloat(cy);
  const numInner = typeof innerRadius === 'number' ? innerRadius : parseFloat(innerRadius);
  const numOuter = typeof outerRadius === 'number' ? outerRadius : parseFloat(outerRadius);
  const numAngle = typeof midAngle === 'number' ? midAngle : parseFloat(midAngle);

  if (isNaN(numCx) || isNaN(numCy) || isNaN(numInner) || isNaN(numOuter) || isNaN(numAngle)) {
    return null;
  }

  const RADIAN = Math.PI / 180;
  const radius = numInner + (numOuter - numInner) * 0.5;
  const x = numCx + radius * Math.cos(-numAngle * RADIAN);
  const y = numCy + radius * Math.sin(-numAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {value}
    </text>
  );
};

const EmptyChartPlaceholder = ({ title, message }) => (
  <div style={{
    height: 220,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '16px',
    background: 'rgba(248, 250, 252, 0.5)',
    borderRadius: 'var(--radius-md, 8px)',
    border: '1px dashed var(--border-default, #e2e8f0)',
  }}>
    <Activity size={28} style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: 8, opacity: 0.6 }} />
    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>{title}</span>
    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: 4, maxWidth: 220 }}>{message}</span>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const clientFilterContext = useClientFilter();
  const {
    clients = [],
    selectedClientId = '',
    selectedClient = null,
    setSelectedClientId = () => {},
    loadingClients = false,
  } = clientFilterContext || {};

  // Cascading hierarchy filter states
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');

  // Dropdown options lists
  const [availableProjects, setAvailableProjects] = useState([]);
  const [availableExamTypes, setAvailableExamTypes] = useState([]);
  const [availableExams, setAvailableExams] = useState([]);

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingExamTypes, setLoadingExamTypes] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);

  // Safe normalized arrays
  const safeAvailableProjects = Array.isArray(availableProjects) ? availableProjects : [];
  const safeAvailableExamTypes = Array.isArray(availableExamTypes) ? availableExamTypes : [];
  const safeAvailableExams = Array.isArray(availableExams) ? availableExams : [];

  // When selectedClientId changes: reset downstream & load projects
  useEffect(() => {
    setSelectedProjectId('');
    setSelectedExamTypeId('');
    setSelectedExamId('');
    setAvailableProjects([]);
    setAvailableExamTypes([]);
    setAvailableExams([]);

    if (selectedClientId) {
      setLoadingProjects(true);
      apiClient.get(ENDPOINTS.ADMIN.PROJECTS, { params: { clientId: selectedClientId, limit: 100 } })
        .then(res => {
          if (res?.success && Array.isArray(res.data)) {
            setAvailableProjects(res.data);
          }
        })
        .catch(err => console.error('Failed to load projects for client:', err))
        .finally(() => setLoadingProjects(false));
    }
  }, [selectedClientId]);

  // When selectedProjectId changes: reset downstream & load exam types
  useEffect(() => {
    setSelectedExamTypeId('');
    setSelectedExamId('');
    setAvailableExamTypes([]);
    setAvailableExams([]);

    if (selectedProjectId) {
      setLoadingExamTypes(true);
      apiClient.get(ENDPOINTS.ADMIN.EXAM_TYPES, { params: { projectId: selectedProjectId, limit: 100 } })
        .then(res => {
          if (res?.success && Array.isArray(res.data)) {
            setAvailableExamTypes(res.data);
          }
        })
        .catch(err => console.error('Failed to load exam types for project:', err))
        .finally(() => setLoadingExamTypes(false));
    }
  }, [selectedProjectId]);

  // When selectedExamTypeId changes: reset downstream & load exams
  useEffect(() => {
    setSelectedExamId('');
    setAvailableExams([]);

    if (selectedExamTypeId) {
      setLoadingExams(true);
      apiClient.get(ENDPOINTS.ADMIN.EXAMS, { params: { examTypeId: selectedExamTypeId, limit: 100 } })
        .then(res => {
          if (res?.success && Array.isArray(res.data)) {
            setAvailableExams(res.data);
          }
        })
        .catch(err => console.error('Failed to load exams for exam type:', err))
        .finally(() => setLoadingExams(false));
    }
  }, [selectedExamTypeId]);

  const [liveData, setLiveData] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const activeRequestRef = useRef(0);

  const fetchDashboardData = useCallback(async () => {
    if (!selectedClientId) return;

    const requestId = ++activeRequestRef.current;
    setLoading(true);
    setError(null);
    setLiveData(null); // Prevent stale client data from lingering during fetch
    setProjectsList([]);

    const analyticsParams = { clientId: selectedClientId };
    if (selectedProjectId) analyticsParams.projectId = selectedProjectId;
    if (selectedExamTypeId) analyticsParams.examTypeId = selectedExamTypeId;
    if (selectedExamId) analyticsParams.examId = selectedExamId;

    const projectsParams = { clientId: selectedClientId, limit: 10 };
    if (selectedProjectId) projectsParams.projectId = selectedProjectId;
    if (selectedExamTypeId) projectsParams.examTypeId = selectedExamTypeId;

    try {
      const [analyticsRes, projectsRes] = await Promise.allSettled([
        apiClient.get(ENDPOINTS.ADMIN.ANALYTICS, { params: analyticsParams }),
        apiClient.get(ENDPOINTS.ADMIN.PROJECTS, { params: projectsParams }),
      ]);

      // If another request was dispatched in the meantime, discard stale responses
      if (requestId !== activeRequestRef.current) return;

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.success) {
        setLiveData(analyticsRes.value.data);
      } else {
        const errorMsg =
          analyticsRes.status === 'rejected'
            ? analyticsRes.reason?.message
            : analyticsRes.value?.message || 'Failed to fetch executive analytics';
        throw new Error(errorMsg);
      }

      if (projectsRes.status === 'fulfilled' && projectsRes.value?.success && Array.isArray(projectsRes.value.data)) {
        setProjectsList(projectsRes.value.data);
      } else {
        setProjectsList([]);
      }
    } catch (err) {
      if (requestId !== activeRequestRef.current) return;
      console.error('Failed to load live dashboard data for client:', err);
      setLiveData(null);
      setProjectsList([]);
      setError(err.message || 'Unable to connect to backend API server');
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
      }
    }
  }, [selectedClientId, selectedProjectId, selectedExamTypeId, selectedExamId]);

  useEffect(() => {
    if (selectedClientId) {
      fetchDashboardData();
    }
  }, [selectedClientId, selectedProjectId, selectedExamTypeId, selectedExamId, fetchDashboardData]);

  // Aggregate values directly from MySQL response - ZERO fake fallbacks
  const totalCentresCount = liveData?.kpis?.totalCentres?.value ?? 0;
  const activeCentresCount = liveData?.kpis?.totalCentres?.active ?? 0;
  const activeProjectsCount = liveData?.kpis?.activeProjects?.value ?? 0;
  const totalProjectsCount = liveData?.kpis?.activeProjects?.total ?? 0;
  const totalCandidatesCount = liveData?.kpis?.candidates?.total ?? 0;
  const activeUsersCount = liveData?.kpis?.activeUsers?.value ?? 0;
  const totalUsersCount = liveData?.kpis?.activeUsers?.total ?? 0;
  const openExceptionsCount = liveData?.kpis?.openExceptions?.value ?? 0;
  const pendingApprovalsCount = liveData?.kpis?.pendingApprovals?.value ?? 0;

  const projectChartData = Array.isArray(liveData?.charts?.projectStatusData) ? liveData.charts.projectStatusData : [];
  const centreChartData = Array.isArray(liveData?.charts?.centreStatusData) ? liveData.charts.centreStatusData : [];
  const recentActivityData = Array.isArray(liveData?.recentActivity) ? liveData.recentActivity : [];
  const safeProjectsList = Array.isArray(projectsList) ? projectsList : [];

  const slaColors = {
    OnTrack: 'var(--color-success, #16a34a)',
    AtRisk:  'var(--color-warning, #d97706)',
    Delayed: 'var(--color-danger, #dc2626)',
    Completed: 'var(--text-muted, #94a3b8)',
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">Executive Overview</h1>
            <p className="page-header__subtitle">
              Enterprise operations health &amp; live database aggregates ·{' '}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 600,
                  color: 'var(--color-primary, #2563eb)',
                  background: 'rgba(37, 99, 235, 0.08)',
                  padding: '1px 8px',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                }}
              >
                Client: {selectedClient?.name || 'Eduquity'}
              </span>
            </p>
          </div>
          <div className="page-header__actions">
            {/* 1. Enterprise Client Dropdown */}
            <ClientDropdown
              clients={clients}
              selectedClientId={selectedClientId}
              onSelect={setSelectedClientId}
              loading={loadingClients}
            />

            {/* 2. Refresh Button */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchDashboardData}
              disabled={loading}
              title={`Refresh Data for ${selectedClient?.name || 'Selected Client'}`}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* 3. Last Updated Timestamp */}
            <LastUpdated />

            {/* 4. Centre Master */}
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/centres')}>
              <Building2 size={13} /> Centre Master
            </button>

            {/* 5. New Project */}
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/projects')}>
              <Plus size={13} /> New Project
            </button>
          </div>
        </div>
      </div>

      {/* Cascading Hierarchy Filter Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border-default, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '12px 18px',
        marginBottom: 20,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
            <Filter size={15} color="var(--color-primary, #2563eb)" />
            <span>Hierarchy Scope:</span>
          </div>

          {/* Project Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={loadingProjects || safeAvailableProjects.length === 0}
              style={{
                fontSize: '0.8125rem',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-default, #cbd5e1)',
                background: '#ffffff',
                color: 'var(--text-primary, #0f172a)',
                outline: 'none',
                cursor: safeAvailableProjects.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: selectedProjectId ? 600 : 400,
              }}
            >
              <option value="">All Projects ({safeAvailableProjects.length})</option>
              {safeAvailableProjects.map((p) => (
                <option key={p?.id} value={p?.id}>
                  {p?.projectCode} – {p?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type Selector */}
          {selectedProjectId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronRight size={14} color="#94a3b8" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>Exam Type:</span>
              <select
                value={selectedExamTypeId}
                onChange={(e) => setSelectedExamTypeId(e.target.value)}
                disabled={loadingExamTypes || safeAvailableExamTypes.length === 0}
                style={{
                  fontSize: '0.8125rem',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-default, #cbd5e1)',
                  background: '#ffffff',
                  color: 'var(--text-primary, #0f172a)',
                  outline: 'none',
                  cursor: safeAvailableExamTypes.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: selectedExamTypeId ? 600 : 400,
                }}
              >
                <option value="">All Exam Types ({safeAvailableExamTypes.length})</option>
                {safeAvailableExamTypes.map((et) => (
                  <option key={et?.id} value={et?.id}>
                    {et?.examCode} – {et?.examTypeName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Exam Instance Selector */}
          {selectedExamTypeId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronRight size={14} color="#94a3b8" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>Exam:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                disabled={loadingExams || safeAvailableExams.length === 0}
                style={{
                  fontSize: '0.8125rem',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-default, #cbd5e1)',
                  background: '#ffffff',
                  color: 'var(--text-primary, #0f172a)',
                  outline: 'none',
                  cursor: safeAvailableExams.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: selectedExamId ? 600 : 400,
                }}
              >
                <option value="">All Exams ({safeAvailableExams.length})</option>
                {safeAvailableExams.map((ex) => (
                  <option key={ex?.id} value={ex?.id}>
                    {ex?.examName} ({ex?.examCode})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Clear Filters button & Active Filter Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(selectedProjectId || selectedExamTypeId || selectedExamId) && (
            <button
              onClick={() => {
                setSelectedProjectId('');
                setSelectedExamTypeId('');
                setSelectedExamId('');
              }}
              className="btn btn-sm"
              style={{
                fontSize: '0.75rem',
                padding: '4px 8px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Reset Project and Exam filters"
            >
              <X size={13} /> Reset Scope
            </button>
          )}
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--color-primary, #2563eb)',
            background: 'rgba(37, 99, 235, 0.08)',
            padding: '3px 8px',
            borderRadius: '4px',
            fontWeight: 600,
          }}>
            {selectedExamId
              ? safeAvailableExams.find(e => e?.id === selectedExamId)?.examName || 'Filtered Exam'
              : selectedExamTypeId
              ? safeAvailableExamTypes.find(et => et?.id === selectedExamTypeId)?.examTypeName || 'Filtered Type'
              : selectedProjectId
              ? safeAvailableProjects.find(p => p?.id === selectedProjectId)?.name || 'Filtered Project'
              : `${selectedClient?.name || 'Eduquity'} (Full Portfolio)`}
          </span>
        </div>
      </div>

      {/* Error Banner with Retry */}
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
              <strong>Database Connection Error:</strong> {error}
            </div>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={fetchDashboardData}
            style={{ background: '#fff', borderColor: '#f87171', color: '#991b1b' }}
          >
            Retry Query
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard
          label="Active Projects"
          value={loading ? '...' : activeProjectsCount}
          sub={`${totalProjectsCount} total · ${totalCandidatesCount > 0 ? `${Number(totalCandidatesCount).toLocaleString('en-IN')} candidates` : '0 candidates'}`}
          icon="Briefcase"
          variant="blue"
          iconBg="rgba(37, 99, 235, 0.12)"
          iconColor="#1d4ed8"
          onClick={() => navigate('/admin/projects')}
        />
        <KpiCard
          label="Total Centres"
          value={loading ? '...' : totalCentresCount}
          sub={`${activeCentresCount} active / verified`}
          icon="Building2"
          variant="teal"
          iconBg="rgba(13, 148, 136, 0.12)"
          iconColor="#0d9488"
          onClick={() => navigate('/admin/centres')}
        />
        <KpiCard
          label="Active Users"
          value={loading ? '...' : activeUsersCount}
          sub={`${totalUsersCount} accounts in DB`}
          icon="Users"
          variant="purple"
          iconBg="rgba(124, 58, 237, 0.10)"
          iconColor="#7c3aed"
          onClick={() => navigate('/admin/users')}
        />
        <KpiCard
          label="Open Exceptions"
          value={loading ? '...' : openExceptionsCount}
          sub={`${openExceptionsCount} active blacklists`}
          icon="AlertTriangle"
          variant="red"
          iconBg="rgba(220, 38, 38, 0.10)"
          iconColor="#dc2626"
          onClick={() => navigate('/admin/eligibility')}
        />
        <KpiCard
          label="Pending Approvals"
          value={loading ? '...' : pendingApprovalsCount}
          sub="Centres awaiting review"
          icon="CheckCircle"
          variant="orange"
          iconBg="rgba(217, 119, 6, 0.10)"
          iconColor="#d97706"
          onClick={() => navigate('/admin/centres')}
        />
        <KpiCard
          label="Security & Audit"
          value="Audit Trail"
          sub="Live immutable log"
          icon="ShieldCheck"
          variant="indigo"
          iconBg="rgba(37, 99, 235, 0.10)"
          iconColor="#2563eb"
          onClick={() => navigate('/admin/config')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid-cols-chart" style={{ marginBottom: 24 }}>

        {/* Project Status */}
        <div className="card card--chart-blue" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Project Stage Distribution</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {selectedClient?.name || 'Eduquity'} Active Workflows
            </span>
          </div>
          <div style={{ flex: 1, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {projectChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={projectChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={RENDERL}
                  >
                    {projectChartData.map((e, i) => (
                      <Cell key={`cell-${i}`} fill={e?.color || '#2563eb'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(v) => <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartPlaceholder
                title="No Active Projects"
                message={`No active projects registered for ${selectedClient?.name || 'this client'} yet.`}
              />
            )}
          </div>
        </div>

        {/* Centre Status */}
        <div className="card card--chart-teal" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Centre Readiness Status</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Infrastructure Verification</span>
          </div>
          <div style={{ flex: 1, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {centreChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={centreChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={RENDERL}
                  >
                    {centreChartData.map((e, i) => (
                      <Cell key={`cell-${i}`} fill={e?.color || '#16a34a'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(v) => <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartPlaceholder
                title="No Centres Allocated"
                message={`No examination centres currently booked or audited for ${selectedClient?.name || 'this client'}.`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity & System Status */}
      <div className="grid-cols-chart" style={{ marginBottom: 24 }}>
        <div className="card card--chart-activity" style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
          <div className="card-header">
            <span className="card-title">Recent Audit Log &amp; Activity</span>
            <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => navigate('/admin/config')}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ padding: '4px 0', flex: 1 }}>
            {recentActivityData.length > 0 ? (
              recentActivityData.map((a, idx) => {
                if (!a) return null;
                const timeStr = a.time && !isNaN(new Date(a.time).getTime())
                  ? new Date(a.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : 'Recent';
                return (
                  <div key={a.id || idx} style={{
                    padding: '10px 20px',
                    borderBottom: '1px solid var(--glass-border-subtle, #f1f5f9)',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: 'var(--color-primary-light, #3b82f6)',
                      marginTop: 5,
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {a.user || 'System'}
                        <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> — {a.action || 'Activity'}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {a.entity || 'Record'} {a.entityId ? `· Ref: ${a.entityId}` : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {timeStr}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No recent activity recorded in database audit log.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Projects — Master Registry</span>
          <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => navigate('/admin/projects')}>
            Manage Projects <ArrowRight size={12} />
          </button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Stage</th>
                <th>Centres Target</th>
                <th>Candidates</th>
                <th>Exam Date</th>
                <th>SLA Health</th>
              </tr>
            </thead>
            <tbody>
              {safeProjectsList.length > 0 ? (
                safeProjectsList.map((p, idx) => {
                  if (!p) return null;
                  const dateStr = p.examDate && !isNaN(new Date(p.examDate).getTime())
                    ? new Date(p.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'TBD';
                  return (
                    <tr key={p.id || idx}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.name || 'Unnamed Project'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.projectCode || '—'}</div>
                      </td>
                      <td>{p.client?.name || p.clientId || '—'}</td>
                      <td><StatusBadge status={p.stage || 'Setup'} /></td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{p.centreTarget || 0}</span>
                        <span style={{ color: 'var(--text-muted)' }}> target</span>
                      </td>
                      <td>{Number(p.candidateTarget || 0).toLocaleString('en-IN')}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{dateStr}</td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: slaColors[p.slaHealth] || 'var(--text-muted)',
                        }}>
                          {p.slaHealth === 'OnTrack' ? '✓ On Track' :
                           p.slaHealth === 'AtRisk'  ? '⚠ At Risk' :
                           p.slaHealth === 'Delayed' ? '✗ Delayed' : '● ' + (p.slaHealth || 'Active')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                    No projects found for current scope in MySQL database. Click &quot;New Project&quot; to initialize one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
