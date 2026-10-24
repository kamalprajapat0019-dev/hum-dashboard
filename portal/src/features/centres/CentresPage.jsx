import { useState } from 'react';
import {
  Building2, Plus, Search, Filter, Edit, Trash2, Eye, MapPin,
  Mail, Phone, ShieldCheck, UserCheck, CheckCircle2, AlertTriangle,
  X, Check, ExternalLink, RefreshCw, Users, FileText, Cpu, Download
} from 'lucide-react';
import {
  CentreStore, ContactStore, DocStore, AssignmentStore,
  REGIONS, STATES, CITIES, ORG_TYPES, VENUE_STATUS_OPTS, CENTRE_STATUSES,
  CONTACT_TYPES, DOC_TYPES, appendAuditLog
} from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/common';

export default function CentresPage() {
  const { user } = useAuth();
  const [centres, setCentres] = useState(() => CentreStore.getAll());
  const [contacts, setContacts] = useState(() => ContactStore.getAll());
  const [docs, setDocs] = useState(() => DocStore.getAll());
  const [assignments, setAssignments] = useState(() => AssignmentStore.getAll());

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [venueFilter, setVenueFilter] = useState('');

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCentre, setEditingCentre] = useState(null);
  const [activeCentreDrawer, setActiveCentreDrawer] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview'); // overview | contacts | capacity | docs
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State for Centre
  const initialForm = {
    centre_id: `CN-${String(centres.length + 1).padStart(3, '0')}`,
    region_id: 'r1',
    state_id: 'st1',
    city_id: 'c1',
    edu_code: '',
    tc_code: '',
    centre_name: '',
    centre_address: '',
    pincode: '',
    actual_state_id: '',
    actual_city_id: '',
    actual_node: '',
    venue_status: 'New',
    previous_edu_exam: '',
    official_email: '',
    google_map_link: '',
    organization_type: 'Individual',
    centre_status: 'Draft',
    remarks: '',
  };
  const [formData, setFormData] = useState(initialForm);

  // Form State for Contact
  const initialContact = {
    person_type: 'Owner',
    full_name: '',
    contact_number: '',
    email: '',
    aadhaar_number: '',
    father_name: '',
    mother_name: '',
    permanent_address: '',
    current_address: '',
    is_primary: true,
  };
  const [contactForm, setContactForm] = useState(initialContact);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadData = () => {
    setCentres(CentreStore.getAll());
    setContacts(ContactStore.getAll());
    setDocs(DocStore.getAll());
    setAssignments(AssignmentStore.getAll());
  };

  // Filtered centres
  const filteredCentres = centres.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      const match = c.centre_name?.toLowerCase().includes(q) ||
                    c.centre_id?.toLowerCase().includes(q) ||
                    c.tc_code?.toLowerCase().includes(q) ||
                    c.edu_code?.toLowerCase().includes(q) ||
                    c.official_email?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (regionFilter && c.region_id !== regionFilter) return false;
    if (statusFilter && c.centre_status !== statusFilter) return false;
    if (venueFilter && c.venue_status !== venueFilter) return false;
    return true;
  });

  // Dynamic state/city helpers
  const availableStates = STATES.filter(s => !formData.region_id || s.regionId === formData.region_id);
  const availableCities = CITIES.filter(c => !formData.state_id || c.stateId === formData.state_id);

  const handleOpenAdd = () => {
    setEditingCentre(null);
    setFormData({
      ...initialForm,
      centre_id: `CN-${String(centres.length + 1).padStart(3, '0')}`
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCentre(c);
    setFormData({ ...c });
    setShowAddModal(true);
  };

  const handleSaveCentre = (e) => {
    e.preventDefault();
    if (!formData.centre_name) return;

    if (editingCentre) {
      CentreStore.update(editingCentre.id, formData);
      appendAuditLog({
        user: user?.name || 'Admin',
        role: user?.role || 'admin',
        action: 'UPDATE_CENTRE',
        entity: `Centre: ${formData.centre_name} (${formData.centre_id})`,
        details: `Updated details and status to ${formData.centre_status}`,
      });
      showToast(`Centre "${formData.centre_name}" updated successfully!`);
    } else {
      CentreStore.create(formData);
      appendAuditLog({
        user: user?.name || 'Admin',
        role: user?.role || 'admin',
        action: 'CREATE_CENTRE',
        entity: `Centre: ${formData.centre_name} (${formData.centre_id})`,
        details: `Created new centre record in ${formData.centre_status} status`,
      });
      showToast(`Centre "${formData.centre_name}" created successfully!`);
    }

    reloadData();
    setShowAddModal(false);
  };

  const handleDeleteCentre = (c) => {
    if (confirm(`Are you sure you want to delete centre "${c.centre_name}" (${c.centre_id})?`)) {
      CentreStore.delete(c.id);
      appendAuditLog({
        user: user?.name || 'Admin',
        role: user?.role || 'admin',
        action: 'DELETE_CENTRE',
        entity: `Centre: ${c.centre_name} (${c.centre_id})`,
        details: 'Centre permanently removed from active registry',
      });
      reloadData();
      if (activeCentreDrawer?.id === c.id) setActiveCentreDrawer(null);
      showToast(`Centre "${c.centre_name}" deleted.`);
    }
  };

  const handleSaveContact = (e) => {
    e.preventDefault();
    if (!activeCentreDrawer) return;

    ContactStore.create({
      ...contactForm,
      centre_id: activeCentreDrawer.id,
      is_active: true,
    });

    appendAuditLog({
      user: user?.name || 'Admin',
      role: user?.role || 'admin',
      action: 'ADD_CONTACT',
      entity: `Centre: ${activeCentreDrawer.centre_name}`,
      details: `Added ${contactForm.person_type} contact: ${contactForm.full_name}`,
    });

    reloadData();
    setShowAddContactModal(false);
    setContactForm(initialContact);
    showToast(`Added ${contactForm.person_type} contact!`);
  };

  // Helper labels
  const getRegionLabel = (rid) => REGIONS.find(r => r.id === rid)?.label || rid;
  const getStateLabel = (sid) => STATES.find(s => s.id === sid)?.label || sid;
  const getCityLabel = (cid) => CITIES.find(c => c.id === cid)?.label || cid;

  const currentContacts = activeCentreDrawer ? contacts.filter(c => c.centre_id === activeCentreDrawer.id) : [];
  const currentDocs = activeCentreDrawer ? docs.filter(d => d.centre_id === activeCentreDrawer.id) : [];
  const currentAssignment = activeCentreDrawer ? assignments.find(a => a.centre_id === activeCentreDrawer.id) : null;

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

      {/* Header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <div className="breadcrumb">
              <span>Admin</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Centre Master</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>Centre Master Registry</h1>
            <p className="page-header__subtitle">
              Comprehensive registry of testing venues, capacity parameters, legal compliance, and multi-tier contacts
            </p>
          </div>
          <div className="page-header__actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                CentreStore.reset();
                ContactStore.reset();
                reloadData();
                showToast('Reset to original master seed dataset');
              }}
            >
              <RefreshCw size={14} /> Reset Data
            </button>
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={14} /> Add New Centre
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Total Centres</span>
            <div className="kpi-card__icon" style={{ background: '#eff6ff' }}>
              <Building2 size={16} color="#1e40af" />
            </div>
          </div>
          <div className="kpi-card__value">{centres.length}</div>
          <div className="kpi-card__sub">Across all regions & states</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Approved & Active</span>
            <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
              <ShieldCheck size={16} color="#16a34a" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-success)' }}>
            {centres.filter(c => c.centre_status === 'Approved' || c.centre_status === 'Active').length}
          </div>
          <div className="kpi-card__sub">Audit & document verified</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Draft / Under Review</span>
            <div className="kpi-card__icon" style={{ background: '#fffbeb' }}>
              <AlertTriangle size={16} color="#d97706" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-warning)' }}>
            {centres.filter(c => c.centre_status === 'Draft').length}
          </div>
          <div className="kpi-card__sub">Onboarding in progress</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Rejected / Inactive</span>
            <div className="kpi-card__icon" style={{ background: '#fef2f2' }}>
              <Building2 size={16} color="#dc2626" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-danger)' }}>
            {centres.filter(c => c.centre_status === 'Rejected' || c.centre_status === 'Inactive').length}
          </div>
          <div className="kpi-card__sub">Non-compliant / blacklisted</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        {/* Filters bar */}
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, ID, TC Code, Edu Code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 32, fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <select
              className="form-control"
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
              style={{ width: 130, fontSize: '0.75rem' }}
            >
              <option value="">All Regions</option>
              {REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>

            <select
              className="form-control"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: 130, fontSize: '0.75rem' }}
            >
              <option value="">All Statuses</option>
              {CENTRE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              className="form-control"
              value={venueFilter}
              onChange={e => setVenueFilter(e.target.value)}
              style={{ width: 120, fontSize: '0.75rem' }}
            >
              <option value="">Venue (All)</option>
              <option value="Old">Old Venue</option>
              <option value="New">New Venue</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Centre ID</th>
                <th>Centre Name & Details</th>
                <th>Region / State / City</th>
                <th>Codes (Edu / TC)</th>
                <th>Org Type</th>
                <th>Venue Type</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCentres.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No centres found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCentres.map(centre => (
                  <tr key={centre.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {centre.centre_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{centre.centre_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 280 }} className="truncate" title={centre.centre_address}>
                        {centre.centre_address}
                      </div>
                      {centre.official_email && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-primary-light)', marginTop: 2 }}>
                          {centre.official_email}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{getCityLabel(centre.city_id)}, {getStateLabel(centre.state_id)}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        Region: {getRegionLabel(centre.region_id)} • Pin: {centre.pincode}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Edu:</span> {centre.edu_code || '—'}
                      </div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        <span style={{ color: 'var(--text-muted)' }}>TC:</span> {centre.tc_code || '—'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                        {centre.organization_type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${centre.venue_status === 'Old' ? 'badge-info' : 'badge-neutral'}`} style={{ fontSize: '0.6875rem' }}>
                        {centre.venue_status}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={centre.centre_status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Manage Centre Details, Contacts, Capacity & Docs"
                          onClick={() => {
                            setActiveCentreDrawer(centre);
                            setDrawerTab('overview');
                          }}
                        >
                          <Eye size={13} /> Manage
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Edit Centre"
                          onClick={() => handleOpenEdit(centre)}
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Delete Centre"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => handleDeleteCentre(centre)}
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

      {/* Centre Detail / Manage Drawer */}
      {activeCentreDrawer && (
        <div className="modal-backdrop" onClick={() => setActiveCentreDrawer(null)}>
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 840, maxHeight: '90vh' }}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} color="var(--color-primary)" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 className="modal-title">{activeCentreDrawer.centre_name}</h3>
                    <StatusBadge status={activeCentreDrawer.centre_status} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ID: <code style={{ color: 'var(--color-primary)' }}>{activeCentreDrawer.centre_id}</code> • TC Code: {activeCentreDrawer.tc_code} • Edu Code: {activeCentreDrawer.edu_code}
                  </div>
                </div>
              </div>
              <button className="btn-ghost" onClick={() => setActiveCentreDrawer(null)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ padding: '0 24px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)' }}>
              <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
                <button
                  className={`tab-btn ${drawerTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('overview')}
                >
                  Overview & Details
                </button>
                <button
                  className={`tab-btn ${drawerTab === 'contacts' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('contacts')}
                >
                  Contacts ({currentContacts.length})
                </button>
                <button
                  className={`tab-btn ${drawerTab === 'capacity' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('capacity')}
                >
                  Capacity & Assignment
                </button>
                <button
                  className={`tab-btn ${drawerTab === 'docs' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('docs')}
                >
                  Compliance Documents ({currentDocs.length})
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {drawerTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="grid-2">
                    <div style={{ background: 'var(--bg-subtle)', padding: 14, borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Location Profile</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 4 }}>
                        {getCityLabel(activeCentreDrawer.city_id)}, {getStateLabel(activeCentreDrawer.state_id)}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        {activeCentreDrawer.centre_address}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Pincode: {activeCentreDrawer.pincode} • Region: {getRegionLabel(activeCentreDrawer.region_id)}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-subtle)', padding: 14, borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Organization Details</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 4 }}>
                        {activeCentreDrawer.organization_type} Organization
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Venue Status: <strong>{activeCentreDrawer.venue_status}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Previous Exam: {activeCentreDrawer.previous_edu_exam || 'None recorded'}
                      </div>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official Email</div>
                      <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{activeCentreDrawer.official_email || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Google Map Link</div>
                      {activeCentreDrawer.google_map_link ? (
                        <a href={activeCentreDrawer.google_map_link} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary-light)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} /> View on Google Maps <ExternalLink size={11} />
                        </a>
                      ) : <span style={{ color: 'var(--text-muted)' }}>No link provided</span>}
                    </div>
                  </div>

                  {activeCentreDrawer.remarks && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#b45309', textTransform: 'uppercase' }}>Remarks & Audit Notes</div>
                      <div style={{ fontSize: '0.8125rem', color: '#92400e', marginTop: 2 }}>{activeCentreDrawer.remarks}</div>
                    </div>
                  )}

                  {/* Quick Status Update */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: 14 }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Update Status:</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['Active', 'Approved', 'Draft', 'Rejected'].map(st => (
                        <button
                          key={st}
                          className={`btn ${activeCentreDrawer.centre_status === st ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          onClick={() => {
                            CentreStore.update(activeCentreDrawer.id, { centre_status: st });
                            setActiveCentreDrawer(prev => ({ ...prev, centre_status: st }));
                            reloadData();
                            showToast(`Updated status to ${st}`);
                          }}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'contacts' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Registered Key Personnel</div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddContactModal(true)}>
                      <Plus size={13} /> Add Contact
                    </button>
                  </div>

                  {currentContacts.length === 0 ? (
                    <div className="empty-state">
                      <Users size={32} />
                      <div className="empty-state__title">No contacts registered yet</div>
                      <div className="empty-state__desc">Add key contacts like Owner, TCA, IT Person, or Electrician.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {currentContacts.map(ct => (
                        <div key={ct.id} style={{
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ct.full_name}</span>
                              <span className="badge badge-purple" style={{ fontSize: '0.625rem' }}>{ct.person_type}</span>
                              {ct.is_primary && <span className="badge badge-success" style={{ fontSize: '0.625rem' }}>Primary</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 14, marginTop: 4 }}>
                              <span><Phone size={12} style={{ verticalAlign: 'middle' }} /> {ct.contact_number}</span>
                              {ct.email && <span><Mail size={12} style={{ verticalAlign: 'middle' }} /> {ct.email}</span>}
                              {ct.aadhaar_number && <span>Aadhaar: {ct.aadhaar_number}</span>}
                            </div>
                          </div>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => {
                              ContactStore.delete(ct.id);
                              reloadData();
                              showToast(`Removed contact ${ct.full_name}`);
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {drawerTab === 'capacity' && (
                <div>
                  <div className="grid-3" style={{ marginBottom: 16 }}>
                    <div style={{ background: 'var(--bg-subtle)', padding: 14, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Systems Available</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
                        {currentAssignment?.total_systems_available || 45}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-subtle)', padding: 14, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Exam Nodes</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-success)', marginTop: 4 }}>
                        {currentAssignment?.exam_nodes || 40}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-subtle)', padding: 14, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Buffer Percentage</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: 4 }}>
                        {currentAssignment?.buffer_percentage || 10}%
                      </div>
                    </div>
                  </div>

                  <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 10 }}>Current Project Assignment Parameters</div>
                    <div className="grid-2" style={{ fontSize: '0.8125rem', gap: 10 }}>
                      <div>Buffer Node Count: <strong>{currentAssignment?.buffer_count || 4} nodes</strong></div>
                      <div>Registration Desks: <strong>{currentAssignment?.registration_desk_count || 2} desks</strong></div>
                      <div>Total Nodes (incl. buffer): <strong>{currentAssignment?.total_nodes_including_buffer || 44} nodes</strong></div>
                      <div>Verified Working Systems: <strong>{currentAssignment?.working_count || 43} nodes</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'docs' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                      Compliance Records ({currentDocs.length} uploaded)
                    </div>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Document Type</th>
                          <th>Status</th>
                          <th>File</th>
                          <th>Uploaded</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDocs.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                              No documents uploaded for this centre yet.
                            </td>
                          </tr>
                        ) : (
                          currentDocs.map(d => (
                            <tr key={d.id}>
                              <td style={{ fontWeight: 600 }}>{d.doc_type}</td>
                              <td><StatusBadge status={d.status} /></td>
                              <td>{d.file_name || '—'}</td>
                              <td>{d.uploaded_at || '—'}</td>
                              <td>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    const nextStatus = d.status === 'Approved' ? 'Rejected' : 'Approved';
                                    DocStore.update(d.id, { status: nextStatus });
                                    reloadData();
                                    showToast(`Doc marked as ${nextStatus}`);
                                  }}
                                >
                                  Toggle Status
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveCentreDrawer(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => {
                handleOpenEdit(activeCentreDrawer);
                setActiveCentreDrawer(null);
              }}>
                <Edit size={13} /> Edit Full Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Centre Modal (Full 20+ Fields Form) */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 760, maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCentre ? `Edit Centre (${formData.centre_id})` : 'Register New Centre'}</h3>
              <button className="btn-ghost" onClick={() => setShowAddModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCentre}>
              <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 1. Basic Identifiers */}
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-default)', paddingBottom: 6 }}>
                  1. Identification & Nomenclature
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Centre ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={formData.centre_id}
                      onChange={e => setFormData({ ...formData, centre_id: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Edu Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. EDU-DL-2041"
                      value={formData.edu_code}
                      onChange={e => setFormData({ ...formData, edu_code: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">TC Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. TC-DL-1082"
                      value={formData.tc_code}
                      onChange={e => setFormData({ ...formData, tc_code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Centre Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Apex Institute of Information Technology"
                    value={formData.centre_name}
                    onChange={e => setFormData({ ...formData, centre_name: e.target.value })}
                  />
                </div>

                {/* 2. Location & Address */}
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-default)', paddingBottom: 6, marginTop: 8 }}>
                  2. Geographic Location & Jurisdiction
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Region *</label>
                    <select
                      className="form-control"
                      value={formData.region_id}
                      onChange={e => setFormData({ ...formData, region_id: e.target.value })}
                    >
                      {REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <select
                      className="form-control"
                      value={formData.state_id}
                      onChange={e => setFormData({ ...formData, state_id: e.target.value })}
                    >
                      {availableStates.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <select
                      className="form-control"
                      value={formData.city_id}
                      onChange={e => setFormData({ ...formData, city_id: e.target.value })}
                    >
                      {availableCities.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Address *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Plot, Street, Landmark"
                      value={formData.centre_address}
                      onChange={e => setFormData({ ...formData, centre_address: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="6 digits PIN"
                      value={formData.pincode}
                      onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    />
                  </div>
                </div>

                {/* 3. Operational Details */}
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-default)', paddingBottom: 6, marginTop: 8 }}>
                  3. Operational & Organizational Parameters
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Organization Type</label>
                    <select
                      className="form-control"
                      value={formData.organization_type}
                      onChange={e => setFormData({ ...formData, organization_type: e.target.value })}
                    >
                      {ORG_TYPES.map(ot => <option key={ot} value={ot}>{ot}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Venue Status</label>
                    <select
                      className="form-control"
                      value={formData.venue_status}
                      onChange={e => setFormData({ ...formData, venue_status: e.target.value })}
                    >
                      {VENUE_STATUS_OPTS.map(vs => <option key={vs} value={vs}>{vs}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Centre Status</label>
                    <select
                      className="form-control"
                      value={formData.centre_status}
                      onChange={e => setFormData({ ...formData, centre_status: e.target.value })}
                    >
                      {CENTRE_STATUSES.map(cs => <option key={cs} value={cs}>{cs}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Official Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="centre@org.in"
                      value={formData.official_email}
                      onChange={e => setFormData({ ...formData, official_email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Google Map URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://maps.google.com/..."
                      value={formData.google_map_link}
                      onChange={e => setFormData({ ...formData, google_map_link: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Previous Edu Exam Conducted</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. NEET PG 2025, JEE Mains 2024"
                    value={formData.previous_edu_exam}
                    onChange={e => setFormData({ ...formData, previous_edu_exam: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks / History Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Audit findings, operational constraints, special instructions..."
                    value={formData.remarks}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} /> {editingCentre ? 'Update Centre Record' : 'Save Centre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="modal-backdrop" onClick={() => setShowAddContactModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Key Contact Person</h3>
              <button className="btn-ghost" onClick={() => setShowAddContactModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveContact}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Person Type *</label>
                    <select
                      className="form-control"
                      value={contactForm.person_type}
                      onChange={e => setContactForm({ ...contactForm, person_type: e.target.value })}
                    >
                      {CONTACT_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={contactForm.full_name}
                      onChange={e => setContactForm({ ...contactForm, full_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Contact Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      required
                      placeholder="10-digit mobile"
                      value={contactForm.contact_number}
                      onChange={e => setContactForm({ ...contactForm, contact_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="contact@domain.com"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Aadhaar Number (12 Digits)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="XXXX-XXXX-XXXX"
                    value={contactForm.aadhaar_number}
                    onChange={e => setContactForm({ ...contactForm, aadhaar_number: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Father&apos;s Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={contactForm.father_name}
                      onChange={e => setContactForm({ ...contactForm, father_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mother&apos;s Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={contactForm.mother_name}
                      onChange={e => setContactForm({ ...contactForm, mother_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Permanent Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Permanent residential address"
                    value={contactForm.permanent_address}
                    onChange={e => setContactForm({ ...contactForm, permanent_address: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddContactModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} /> Add Contact Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
