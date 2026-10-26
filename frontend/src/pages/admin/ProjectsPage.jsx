import { useState } from 'react';
import {
  FolderOpen, Plus, Search, Calendar, Users, Building2, CheckCircle2,
  Clock, Edit, Trash2, X, Check, RefreshCw, Briefcase, ChevronRight,
  TrendingUp, Award, Layers
} from 'lucide-react';
import { ProjectStore, ClientStore, appendAuditLog } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common';

const STAGES = [
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
  const [projects, setProjects] = useState(() => ProjectStore.getAll());
  const [clients, setClients] = useState(() => ClientStore.getAll());
  const [activeTab, setActiveTab] = useState('projects'); // projects | clients
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const initialProjectForm = {
    project_code: `PRJ-${String(projects.length + 1).padStart(3, '0')}`,
    name: '',
    client_id: clients[0]?.id || 'cl001',
    client_name: clients[0]?.name || 'NTA',
    exam_type: 'CBT Exam',
    stage: 'Booking',
    status: 'Active',
    exam_date: '',
    cities: 10,
    candidate_target: 25000,
    centre_target: 75,
  };
  const [projectForm, setProjectForm] = useState(initialProjectForm);

  const initialClientForm = {
    name: '',
    full_name: '',
    contact: '',
    status: 'Active',
  };
  const [clientForm, setClientForm] = useState(initialClientForm);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadData = () => {
    setProjects(ProjectStore.getAll());
    setClients(ClientStore.getAll());
  };

  const filteredProjects = projects.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      const match = p.name?.toLowerCase().includes(q) ||
                    p.project_code?.toLowerCase().includes(q) ||
                    p.client_name?.toLowerCase().includes(q) ||
                    p.exam_type?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (stageFilter && p.stage !== stageFilter) return false;
    return true;
  });

  const handleOpenAddProject = () => {
    setEditingProject(null);
    setProjectForm({
      ...initialProjectForm,
      project_code: `PRJ-${String(projects.length + 1).padStart(3, '0')}`,
      client_id: clients[0]?.id || 'cl001',
      client_name: clients[0]?.name || 'NTA',
    });
    setShowProjectModal(true);
  };

  const handleOpenEditProject = (p) => {
    setEditingProject(p);
    setProjectForm({ ...p });
    setShowProjectModal(true);
  };

  const handleSaveProject = (e) => {
    e.preventDefault();
    if (!projectForm.name) return;

    const selectedClient = clients.find(c => c.id === projectForm.client_id);
    const dataToSave = {
      ...projectForm,
      client_name: selectedClient ? selectedClient.name : projectForm.client_name,
    };

    if (editingProject) {
      ProjectStore.update(editingProject.id, dataToSave);
      appendAuditLog({
        user: user?.name || 'Admin',
        role: user?.role || 'admin',
        action: 'UPDATE_PROJECT',
        entity: `Project: ${dataToSave.name} (${dataToSave.project_code})`,
        details: `Updated stage to ${dataToSave.stage}`,
      });
      showToast(`Project "${dataToSave.name}" updated!`);
    } else {
      ProjectStore.create(dataToSave);
      appendAuditLog({
        user: user?.name || 'Admin',
        role: user?.role || 'admin',
        action: 'CREATE_PROJECT',
        entity: `Project: ${dataToSave.name} (${dataToSave.project_code})`,
        details: `Created new project under client ${dataToSave.client_name}`,
      });
      showToast(`Project "${dataToSave.name}" created!`);
    }

    reloadData();
    setShowProjectModal(false);
  };

  const handleDeleteProject = (p) => {
    if (confirm(`Are you sure you want to delete project "${p.name}"?`)) {
      ProjectStore.delete(p.id);
      appendAuditLog({
        user: user?.name || 'Admin',
        role: user?.role || 'admin',
        action: 'DELETE_PROJECT',
        entity: `Project: ${p.name}`,
        details: 'Project archived/deleted from active pipeline',
      });
      reloadData();
      showToast(`Project "${p.name}" deleted.`);
    }
  };

  const handleSaveClient = (e) => {
    e.preventDefault();
    if (!clientForm.name) return;

    ClientStore.create(clientForm);
    appendAuditLog({
      user: user?.name || 'Admin',
      role: 'admin',
      action: 'CREATE_CLIENT',
      entity: `Client: ${clientForm.name}`,
      details: `Added new testing client organization ${clientForm.full_name}`,
    });
    reloadData();
    setShowClientModal(false);
    setClientForm(initialClientForm);
    showToast(`Client "${clientForm.name}" created!`);
  };

  const totalCandidates = projects.reduce((acc, p) => acc + (Number(p.candidate_target) || 0), 0);
  const totalCentresTarget = projects.reduce((acc, p) => acc + (Number(p.centre_target) || 0), 0);
  const activeProjectsCount = projects.filter(p => p.status === 'Active').length;

  return (
    <div>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: 'var(--color-primary-dark)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <div className="breadcrumb">
              <span>Admin</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Client & Project Management</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>Client & Examination Projects</h1>
            <p className="page-header__subtitle">
              Manage client organizations, examination timelines, candidate targets, and stage progression
            </p>
          </div>
          <div className="page-header__actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                ProjectStore.reset();
                ClientStore.reset();
                reloadData();
                showToast('Reset projects and clients to default seed data');
              }}
            >
              <RefreshCw size={14} /> Reset Data
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
              <div className="kpi-card__value">{activeProjectsCount}</div>
              <div className="kpi-card__sub">Out of {projects.length} total projects</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Candidate Targets</span>
                <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
                  <Users size={16} color="#16a34a" />
                </div>
              </div>
              <div className="kpi-card__value" style={{ color: 'var(--color-success)' }}>
                {totalCandidates.toLocaleString()}
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
              <div className="kpi-card__value" style={{ color: 'var(--color-purple)' }}>
                {totalCentresTarget}
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
              <div className="kpi-card__value" style={{ color: 'var(--color-warning)' }}>
                {clients.length}
              </div>
              <div className="kpi-card__sub">Government & premier boards</div>
            </div>
          </div>

          {/* Table Card */}
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div style={{ position: 'relative', width: 280 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search project name, code, client..."
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
                    <th>Project Name & Client</th>
                    <th>Exam Type</th>
                    <th>Exam Date</th>
                    <th>Coverage (Cities / Centres)</th>
                    <th>Candidates</th>
                    <th>Lifecycle Stage</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No projects found.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map(p => (
                      <tr key={p.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {p.project_code}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="badge badge-purple" style={{ fontSize: '0.625rem' }}>{p.client_name}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{p.exam_type}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem' }}>
                            <Calendar size={13} color="var(--text-muted)" />
                            <span>{p.exam_date || 'TBD'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8125rem' }}>
                            <strong>{p.cities || 0}</strong> cities • <strong>{p.centre_target || 0}</strong> centres
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                            {Number(p.candidate_target || 0).toLocaleString()}
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
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEditProject(p)}
                              title="Edit project parameters"
                            >
                              <Edit size={13} /> Edit
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--color-danger)' }}
                              onClick={() => handleDeleteProject(p)}
                              title="Delete project"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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
                  <th>Active Projects</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => {
                  const associatedProjects = projects.filter(p => p.client_id === c.id || p.client_name === c.name);
                  return (
                    <tr key={c.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.id}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9375rem' }}>{c.name}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.full_name}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{c.contact}</span>
                      </td>
                      <td>
                        <span className="badge badge-purple">{associatedProjects.length} Projects</span>
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                    </tr>
                  );
                })}
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
              <h3 className="modal-title">{editingProject ? `Edit Project (${projectForm.project_code})` : 'Setup Examination Project'}</h3>
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
                      value={projectForm.project_code}
                      onChange={e => setProjectForm({ ...projectForm, project_code: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Client Agency *</label>
                    <select
                      className="form-control"
                      value={projectForm.client_id}
                      onChange={e => setProjectForm({ ...projectForm, client_id: e.target.value })}
                    >
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.full_name}</option>)}
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
                      value={projectForm.exam_type}
                      onChange={e => setProjectForm({ ...projectForm, exam_type: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Exam Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={projectForm.exam_date}
                      onChange={e => setProjectForm({ ...projectForm, exam_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Candidate Target</label>
                    <input
                      type="number"
                      className="form-control"
                      value={projectForm.candidate_target}
                      onChange={e => setProjectForm({ ...projectForm, candidate_target: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Centre Target</label>
                    <input
                      type="number"
                      className="form-control"
                      value={projectForm.centre_target}
                      onChange={e => setProjectForm({ ...projectForm, centre_target: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Cities</label>
                    <input
                      type="number"
                      className="form-control"
                      value={projectForm.cities}
                      onChange={e => setProjectForm({ ...projectForm, cities: e.target.value })}
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
                      <option value="On Hold">On Hold</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} /> {editingProject ? 'Save Project' : 'Launch Project'}
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
                    value={clientForm.full_name}
                    onChange={e => setClientForm({ ...clientForm, full_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Official Contact / Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="official@agency.gov.in"
                    value={clientForm.contact}
                    onChange={e => setClientForm({ ...clientForm, contact: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowClientModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} /> Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
