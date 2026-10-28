import { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen, Plus, Search, Calendar, Users, Building2, CheckCircle2,
  Clock, Edit, Trash2, X, Check, RefreshCw, Briefcase, Award,
  AlertCircle, Loader2
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/common';

const STAGES = [
  'Setup',
  'Booking',
  'Document Verification',
  'Audit & Compliance',
  'Allocation',
  'Readiness & Mock',
  'Execution',
  'Closed'
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('projects'); // projects | clients
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  // Modals & Action States
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }

  const initialProjectForm = {
    projectCode: '',
    name: '',
    clientId: '',
    examType: 'CBT Exam',
    stage: 'Setup',
    status: 'Active',
    examDate: '',
    citiesCount: 1,
    candidateTarget: 5000,
    centreTarget: 10,
    slaHealth: 'OnTrack',
  };
  const [projectForm, setProjectForm] = useState(initialProjectForm);

  const initialClientForm = {
    code: '',
    name: '',
    fullName: '',
    contactEmail: '',
    status: 'Active',
  };
  const [clientForm, setClientForm] = useState(initialClientForm);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, clientRes] = await Promise.allSettled([
        apiClient.get(ENDPOINTS.ADMIN.PROJECTS, {
          params: {
            search: search || undefined,
            stage: stageFilter || undefined,
            limit: 100,
          },
        }),
        apiClient.get(ENDPOINTS.ADMIN.CLIENTS, { params: { limit: 100 } }),
      ]);

      if (projRes.status === 'fulfilled' && projRes.value?.success && Array.isArray(projRes.value.data)) {
        setProjects(projRes.value.data);
      } else {
        setProjects([]);
      }

      if (clientRes.status === 'fulfilled' && clientRes.value?.success && Array.isArray(clientRes.value.data)) {
        setClients(clientRes.value.data);
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error('Failed to load project records:', err);
      setError(err.message || 'Unable to retrieve project database');
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddProject = () => {
    setEditingProject(null);
    const nextCode = `PRJ-${String(projects.length + 1).padStart(3, '0')}`;
    setProjectForm({
      ...initialProjectForm,
      projectCode: nextCode,
      clientId: clients[0]?.id || '',
    });
    setShowProjectModal(true);
  };

  const handleOpenEditProject = (p) => {
    setEditingProject(p);
    setProjectForm({
      projectCode: p.projectCode || '',
      name: p.name || '',
      clientId: p.clientId || clients[0]?.id || '',
      examType: p.examType || 'CBT Exam',
      stage: p.stage || 'Setup',
      status: p.status || 'Active',
      examDate: p.examDate ? new Date(p.examDate).toISOString().split('T')[0] : '',
      citiesCount: p.citiesCount || 1,
      candidateTarget: p.candidateTarget || 0,
      centreTarget: p.centreTarget || 0,
      slaHealth: p.slaHealth || 'OnTrack',
    });
    setShowProjectModal(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name?.trim() || !projectForm.projectCode?.trim() || !projectForm.clientId) {
      showToast('Please complete required fields: Project Code, Name, and Client Agency', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        projectCode: projectForm.projectCode.trim(),
        name: projectForm.name.trim(),
        clientId: projectForm.clientId,
        examType: projectForm.examType.trim(),
        stage: projectForm.stage,
        status: projectForm.status,
        examDate: projectForm.examDate ? new Date(projectForm.examDate).toISOString() : undefined,
        citiesCount: Number(projectForm.citiesCount) || 0,
        candidateTarget: Number(projectForm.candidateTarget) || 0,
        centreTarget: Number(projectForm.centreTarget) || 0,
        slaHealth: projectForm.slaHealth || 'OnTrack',
      };

      if (editingProject) {
        const res = await apiClient.put(`${ENDPOINTS.ADMIN.PROJECTS}/${editingProject.id}`, payload);
        if (res && res.success) {
          showToast(`Project "${projectForm.name}" updated successfully!`, 'success');
          setShowProjectModal(false);
          await loadData();
        }
      } else {
        const res = await apiClient.post(ENDPOINTS.ADMIN.PROJECTS, payload);
        if (res && res.success) {
          showToast(`Project "${projectForm.name}" created and persisted in database!`, 'success');
          setShowProjectModal(false);
          await loadData();
        }
      }
    } catch (err) {
      const msg = err.data?.error?.message || err.message || 'Failed to save project';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!clientForm.name?.trim() || !clientForm.fullName?.trim() || !clientForm.contactEmail?.trim()) {
      showToast('Please provide Client Code, Full Name, and Contact Email', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: clientForm.code?.trim() || clientForm.name.trim().toUpperCase(),
        name: clientForm.name.trim(),
        fullName: clientForm.fullName.trim(),
        contactEmail: clientForm.contactEmail.trim().toLowerCase(),
        status: clientForm.status || 'Active',
      };
      const res = await apiClient.post(ENDPOINTS.ADMIN.CLIENTS, payload);
      if (res && res.success) {
        showToast(`Client "${clientForm.name}" registered successfully!`, 'success');
        setShowClientModal(false);
        setClientForm(initialClientForm);
        await loadData();
      }
    } catch (err) {
      const msg = err.data?.error?.message || err.message || 'Failed to create client';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCandidates = projects.reduce((acc, p) => acc + (Number(p.candidateTarget) || 0), 0);
  const totalCentresTarget = projects.reduce((acc, p) => acc + (Number(p.centreTarget) || 0), 0);
  const activeProjectsCount = projects.filter(p => p.status === 'Active').length;

  return (
    <div>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: toast.type === 'error' ? '#b91c1c' : 'var(--color-primary-dark, #1e3a8a)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} color="#4ade80" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <div className="breadcrumb">
              <span>Admin</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Client &amp; Project Management</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>Client &amp; Examination Projects</h1>
            <p className="page-header__subtitle">
              Live database records: client organizations, examination timelines, and candidate targets
            </p>
          </div>
          <div className="page-header__actions">
            <button
              className="btn btn-secondary"
              onClick={loadData}
              disabled={loading}
              title="Refresh from Database"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            {activeTab === 'projects' ? (
              <button className="btn btn-primary" onClick={handleOpenAddProject}>
                <Plus size={14} /> Setup New Project
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowClientModal(true)}>
                <Plus size={14} /> Register New Client
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
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
              <strong>Failed to query project records:</strong> {error}
            </div>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={loadData}
            style={{ background: '#fff', borderColor: '#f87171', color: '#991b1b' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Examination Projects ({projects.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          Client Master ({clients.length})
        </button>
      </div>

      {activeTab === 'projects' && (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Active Projects</span>
                <div className="kpi-card__icon" style={{ background: '#eff6ff' }}>
                  <FolderOpen size={16} color="#1e40af" />
                </div>
              </div>
              <div className="kpi-card__value">{loading ? '...' : activeProjectsCount}</div>
              <div className="kpi-card__sub">Out of {projects.length} total projects</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Candidate Targets</span>
                <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
                  <Users size={16} color="#16a34a" />
                </div>
              </div>
              <div className="kpi-card__value" style={{ color: 'var(--color-success, #16a34a)' }}>
                {loading ? '...' : totalCandidates.toLocaleString('en-IN')}
              </div>
              <div className="kpi-card__sub">Cumulative all active exams</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Centres Required</span>
                <div className="kpi-card__icon" style={{ background: '#faf5ff' }}>
                  <Building2 size={16} color="#7c3aed" />
                </div>
              </div>
              <div className="kpi-card__value" style={{ color: 'var(--color-purple, #7c3aed)' }}>
                {loading ? '...' : totalCentresTarget}
              </div>
              <div className="kpi-card__sub">Target venue capacity needed</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Testing Clients</span>
                <div className="kpi-card__icon" style={{ background: '#fffbeb' }}>
                  <Award size={16} color="#d97706" />
                </div>
              </div>
              <div className="kpi-card__value" style={{ color: 'var(--color-warning, #d97706)' }}>
                {loading ? '...' : clients.length}
              </div>
              <div className="kpi-card__sub">Government &amp; institutional clients</div>
            </div>
          </div>

          {/* Table Card */}
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div style={{ position: 'relative', width: 'min(100%, 280px)' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search project name, code..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 30, fontSize: '0.8125rem' }}
                />
              </div>

              <select
                className="form-control"
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
                style={{ width: 180, fontSize: '0.75rem' }}
              >
                <option value="">All Stages</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Project Code</th>
                    <th>Project Name &amp; Client</th>
                    <th>Exam Type</th>
                    <th>Exam Date</th>
                    <th>Coverage</th>
                    <th>Candidates</th>
                    <th>Lifecycle Stage</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                        Querying projects from MySQL database...
                      </td>
                    </tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No examination projects found in database. Click &quot;Setup New Project&quot; to initialize one.
                      </td>
                    </tr>
                  ) : (
                    projects.map(p => (
                      <tr key={p.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {p.projectCode}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="badge badge-purple" style={{ fontSize: '0.625rem' }}>
                              {p.client?.name || p.clientId || 'Client'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{p.examType}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem' }}>
                            <Calendar size={13} color="var(--text-muted)" />
                            <span>{p.examDate ? new Date(p.examDate).toLocaleDateString('en-IN') : 'TBD'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8125rem' }}>
                            <strong>{p.citiesCount || 0}</strong> cities • <strong>{p.centreTarget || 0}</strong> centres
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                            {Number(p.candidateTarget || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                            {p.stage}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={p.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditProject(p)}
                            title="Edit project parameters"
                          >
                            <Edit size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Client Master Tab */}
      {activeTab === 'clients' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Registered Testing Agency Clients</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Institutional bodies assigning national and regional competitive examination drives
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowClientModal(true)}>
              <Plus size={13} /> Add Client
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Client Code</th>
                  <th>Short Code</th>
                  <th>Full Institutional Name</th>
                  <th>Official Contact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Loading clients from database...
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No clients found in database. Click &quot;Add Client&quot; to register one.
                    </td>
                  </tr>
                ) : (
                  clients.map(c => (
                    <tr key={c.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.code || c.id}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9375rem' }}>{c.name}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.fullName}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{c.contactEmail}</span>
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="modal-backdrop" onClick={() => setShowProjectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingProject ? `Edit Project (${projectForm.projectCode})` : 'Setup Examination Project'}</h3>
              <button className="btn-ghost" onClick={() => setShowProjectModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProject}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Project Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. PRJ-001"
                      value={projectForm.projectCode}
                      onChange={e => setProjectForm({ ...projectForm, projectCode: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Client Agency *</label>
                    <select
                      className="form-control"
                      required
                      value={projectForm.clientId}
                      onChange={e => setProjectForm({ ...projectForm, clientId: e.target.value })}
                    >
                      <option value="">Select a client agency...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.fullName}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Project Title / Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. NEET UG 2026 – Phase 1"
                    value={projectForm.name}
                    onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Exam Type *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. NEET UG, JEE Mains"
                      value={projectForm.examType}
                      onChange={e => setProjectForm({ ...projectForm, examType: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Exam Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={projectForm.examDate}
                      onChange={e => setProjectForm({ ...projectForm, examDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Candidate Target</label>
                    <input
                      type="number"
                      className="form-control"
                      value={projectForm.candidateTarget}
                      onChange={e => setProjectForm({ ...projectForm, candidateTarget: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Centre Target</label>
                    <input
                      type="number"
                      className="form-control"
                      value={projectForm.centreTarget}
                      onChange={e => setProjectForm({ ...projectForm, centreTarget: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Cities</label>
                    <input
                      type="number"
                      className="form-control"
                      value={projectForm.citiesCount}
                      onChange={e => setProjectForm({ ...projectForm, citiesCount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Lifecycle Stage</label>
                    <select
                      className="form-control"
                      value={projectForm.stage}
                      onChange={e => setProjectForm({ ...projectForm, stage: e.target.value })}
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project Status</label>
                    <select
                      className="form-control"
                      value={projectForm.status}
                      onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="OnHold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingProject ? 'Save Project' : 'Launch Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Modal */}
      {showClientModal && (
        <div className="modal-backdrop" onClick={() => setShowClientModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title">Register Client Testing Body</h3>
              <button className="btn-ghost" onClick={() => setShowClientModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveClient}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Short Acronym / Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. NTA, UPSC, UGC"
                    value={clientForm.name}
                    onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Organization Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. National Testing Agency"
                    value={clientForm.fullName}
                    onChange={e => setClientForm({ ...clientForm, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Official Contact Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    placeholder="official@agency.gov.in"
                    value={clientForm.contactEmail}
                    onChange={e => setClientForm({ ...clientForm, contactEmail: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowClientModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Save Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
