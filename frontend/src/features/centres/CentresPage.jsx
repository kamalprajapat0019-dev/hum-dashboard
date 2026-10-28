import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, Filter, Edit, Trash2, Eye, MapPin,
  Mail, Phone, ShieldCheck, UserCheck, CheckCircle2, AlertTriangle,
  X, Check, ExternalLink, RefreshCw, Users, FileText, Cpu, Download,
  AlertCircle, Loader2
} from 'lucide-react';
import {
  REGIONS, STATES, CITIES, ORG_TYPES, VENUE_STATUS_OPTS, CENTRE_STATUSES,
  CONTACT_TYPES, DOC_TYPES
} from '@/services/dataService';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/common';

export default function CentresPage() {
  const { user } = useAuth();
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }

  // Form State for Centre
  const initialForm = {
    centreCode: '',
    regionId: 'r1',
    stateId: 'st1',
    cityId: 'c1',
    stateName: 'Delhi',
    cityName: 'Delhi',
    eduCode: '',
    tcCode: '',
    centreName: '',
    centreAddress: '',
    pincode: '',
    venueStatus: 'Old',
    previousEduExam: '',
    officialEmail: '',
    googleMapLink: '',
    organizationType: 'Trust',
    centreStatus: 'Draft',
    remarks: '',
  };
  const [formData, setFormData] = useState(initialForm);

  // Form State for Contact
  const initialContact = {
    personType: 'Owner',
    fullName: '',
    contactNumber: '',
    email: '',
    aadhaarNumber: '',
    fatherName: '',
    motherName: '',
    permanentAddress: '',
    isPrimary: true,
  };
  const [contactForm, setContactForm] = useState(initialContact);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCentres = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.CENTRES, {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          regionId: regionFilter || undefined,
          limit: 100,
        },
      });
      if (res && res.success && Array.isArray(res.data)) {
        setCentres(res.data);
      } else {
        setCentres([]);
      }
    } catch (err) {
      console.error('Failed to query centre master:', err);
      setError(err.message || 'Unable to connect to centre database');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, regionFilter]);

  useEffect(() => {
    loadCentres();
  }, [loadCentres]);

  // Dynamic state/city helpers
  const availableStates = STATES.filter(s => !formData.regionId || s.regionId === formData.regionId);
  const availableCities = CITIES.filter(c => !formData.stateId || c.stateId === formData.stateId);

  const handleOpenAdd = () => {
    setEditingCentre(null);
    const nextCode = `CN-${String(centres.length + 1).padStart(3, '0')}`;
    setFormData({
      ...initialForm,
      centreCode: nextCode,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCentre(c);
    setFormData({
      centreCode: c.centreCode || c.centre_id || '',
      regionId: c.regionId || c.region_id || 'r1',
      stateId: c.stateId || c.state_id || 'st1',
      cityId: c.cityId || c.city_id || 'c1',
      stateName: c.stateName || c.actual_state_id || 'Delhi',
      cityName: c.cityName || c.actual_city_id || 'Delhi',
      eduCode: c.eduCode || c.edu_code || '',
      tcCode: c.tcCode || c.tc_code || '',
      centreName: c.centreName || c.centre_name || '',
      centreAddress: c.centreAddress || c.centre_address || '',
      pincode: c.pincode || '',
      venueStatus: c.venueStatus || c.venue_status || 'Old',
      previousEduExam: c.previousEduExam || c.previous_edu_exam || '',
      officialEmail: c.officialEmail || c.official_email || '',
      googleMapLink: c.googleMapLink || c.google_map_link || '',
      organizationType: c.organizationType || c.organization_type || 'Trust',
      centreStatus: c.centreStatus || c.centre_status || 'Draft',
      remarks: c.remarks || '',
    });
    setShowAddModal(true);
  };

  const handleSaveCentre = async (e) => {
    e.preventDefault();
    if (!formData.centreName?.trim() || !formData.centreCode?.trim() || !formData.centreAddress?.trim()) {
      showToast('Please provide Centre Code, Name, and Address', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        centreCode: formData.centreCode.trim(),
        centreName: formData.centreName.trim(),
        centreAddress: formData.centreAddress.trim(),
        pincode: String(formData.pincode).trim(),
        regionId: formData.regionId,
        stateId: formData.stateId,
        cityId: formData.cityId,
        stateName: STATES.find(s => s.id === formData.stateId)?.label || formData.stateName,
        cityName: CITIES.find(c => c.id === formData.cityId)?.label || formData.cityName,
        eduCode: formData.eduCode?.trim() || undefined,
        tcCode: formData.tcCode?.trim() || undefined,
        venueStatus: formData.venueStatus || 'Old',
        previousEduExam: formData.previousEduExam?.trim() || undefined,
        officialEmail: formData.officialEmail?.trim() || undefined,
        googleMapLink: formData.googleMapLink?.trim() || undefined,
        organizationType: formData.organizationType || 'Trust',
        centreStatus: formData.centreStatus || 'Draft',
        remarks: formData.remarks?.trim() || undefined,
      };

      if (editingCentre) {
        const res = await apiClient.put(`${ENDPOINTS.ADMIN.CENTRES}/${editingCentre.id}`, payload);
        if (res && res.success) {
          showToast(`Centre "${formData.centreName}" updated successfully in database!`, 'success');
          setShowAddModal(false);
          await loadCentres();
        }
      } else {
        const res = await apiClient.post(ENDPOINTS.ADMIN.CENTRES, payload);
        if (res && res.success) {
          showToast(`Centre "${formData.centreName}" registered in database!`, 'success');
          setShowAddModal(false);
          await loadCentres();
        }
      }
    } catch (err) {
      const msg = err.data?.error?.message || err.message || 'Failed to save centre';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (centre, newStatus) => {
    try {
      const res = await apiClient.patch(ENDPOINTS.ADMIN.CENTRE_STATUS(centre.id), {
        status: newStatus,
        reason: `Status changed to ${newStatus} by Administrator`,
      });
      if (res && res.success) {
        showToast(`Centre status changed to ${newStatus}`, 'success');
        await loadCentres();
      }
    } catch (err) {
      const msg = err.data?.error?.message || err.message || 'Failed to update status';
      showToast(msg, 'error');
    }
  };

  // Helper labels
  const getRegionLabel = (rid) => REGIONS.find(r => r.id === rid)?.label || rid || '—';
  const getStateLabel = (sid) => STATES.find(s => s.id === sid)?.label || sid || '—';
  const getCityLabel = (cid) => CITIES.find(c => c.id === cid)?.label || cid || '—';

  const approvedCount = centres.filter(c => (c.centreStatus || c.centre_status) === 'Approved' || (c.centreStatus || c.centre_status) === 'Active').length;
  const draftCount = centres.filter(c => (c.centreStatus || c.centre_status) === 'Draft').length;
  const inactiveCount = centres.filter(c => (c.centreStatus || c.centre_status) === 'Rejected' || (c.centreStatus || c.centre_status) === 'Inactive').length;

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
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,0.1))',
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
              Live MySQL database: examination centres, venue capacity, and multi-tier contacts
            </p>
          </div>
          <div className="page-header__actions">
            <button
              className="btn btn-secondary"
              onClick={loadCentres}
              disabled={loading}
              title="Refresh from Database"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={14} /> Add New Centre
            </button>
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
              <strong>Failed to query centre records:</strong> {error}
            </div>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={loadCentres}
            style={{ background: '#fff', borderColor: '#f87171', color: '#991b1b' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Total Centres</span>
            <div className="kpi-card__icon" style={{ background: '#eff6ff' }}>
              <Building2 size={16} color="#1e40af" />
            </div>
          </div>
          <div className="kpi-card__value">{loading ? '...' : centres.length}</div>
          <div className="kpi-card__sub">Across all database records</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Approved &amp; Active</span>
            <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
              <ShieldCheck size={16} color="#16a34a" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-success, #16a34a)' }}>
            {loading ? '...' : approvedCount}
          </div>
          <div className="kpi-card__sub">Operational verified venues</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Draft / Pending Review</span>
            <div className="kpi-card__icon" style={{ background: '#fffbeb' }}>
              <AlertTriangle size={16} color="#d97706" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-warning, #d97706)' }}>
            {loading ? '...' : draftCount}
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
          <div className="kpi-card__value" style={{ color: 'var(--color-danger, #dc2626)' }}>
            {loading ? '...' : inactiveCount}
          </div>
          <div className="kpi-card__sub">Flagged or deactivated</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        {/* Filters bar */}
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 'min(100%, 220px)' }}>
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
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: 140, fontSize: '0.75rem' }}
            >
              <option value="">All Statuses</option>
              {CENTRE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Centre ID</th>
                <th>Centre Name &amp; Details</th>
                <th>Location / Jurisdiction</th>
                <th>Codes (Edu / TC)</th>
                <th>Org Type</th>
                <th>Venue Type</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                    Loading centres from database...
                  </td>
                </tr>
              ) : centres.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No centres found in MySQL database. Click &quot;Add New Centre&quot; to register your first centre.
                  </td>
                </tr>
              ) : (
                centres.map(centre => {
                  const code = centre.centreCode || centre.centre_id;
                  const name = centre.centreName || centre.centre_name;
                  const address = centre.centreAddress || centre.centre_address;
                  const email = centre.officialEmail || centre.official_email;
                  const city = centre.cityName || getCityLabel(centre.cityId || centre.city_id);
                  const state = centre.stateName || getStateLabel(centre.stateId || centre.state_id);
                  const status = centre.centreStatus || centre.centre_status || 'Draft';
                  const venue = centre.venueStatus || centre.venue_status || 'Old';
                  const orgType = centre.organizationType || centre.organization_type || 'Trust';

                  return (
                    <tr key={centre.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {code}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 280 }} className="truncate" title={address}>
                          {address}
                        </div>
                        {email && (
                          <div style={{ fontSize: '0.6875rem', color: 'var(--color-primary-light)', marginTop: 2 }}>
                            {email}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{city}, {state}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          Pin: {centre.pincode}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Edu:</span> {centre.eduCode || centre.edu_code || '—'}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                          <span style={{ color: 'var(--text-muted)' }}>TC:</span> {centre.tcCode || centre.tc_code || '—'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', background: 'var(--bg-subtle, #f1f5f9)', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                          {orgType}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${venue === 'Old' ? 'badge-info' : 'badge-neutral'}`} style={{ fontSize: '0.6875rem' }}>
                          {venue}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Manage Centre"
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
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {activeCentreDrawer && (
        <div className="modal-backdrop" onClick={() => setActiveCentreDrawer(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()} style={{ width: 'min(100vw, 560px)', background: '#fff', height: '100vh', position: 'fixed', right: 0, top: 0, overflowY: 'auto', boxShadow: 'var(--shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25))', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-primary">{activeCentreDrawer.centreCode || activeCentreDrawer.centre_id}</span>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: 4 }}>{activeCentreDrawer.centreName || activeCentreDrawer.centre_name}</h2>
              </div>
              <button className="btn-ghost" onClick={() => setActiveCentreDrawer(null)} style={{ padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Status</div>
                    <StatusBadge status={activeCentreDrawer.centreStatus || activeCentreDrawer.centre_status || 'Draft'} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(activeCentreDrawer.centreStatus || activeCentreDrawer.centre_status) !== 'Approved' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleToggleStatus(activeCentreDrawer, 'Approved')}
                      >
                        Approve
                      </button>
                    )}
                    {(activeCentreDrawer.centreStatus || activeCentreDrawer.centre_status) !== 'Inactive' && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleToggleStatus(activeCentreDrawer, 'Inactive')}
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Address &amp; Geographic Details</h4>
                  <p style={{ fontSize: '0.875rem', marginTop: 4 }}>{activeCentreDrawer.centreAddress || activeCentreDrawer.centre_address}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Pincode: {activeCentreDrawer.pincode} • State: {activeCentreDrawer.stateName || '—'}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Capacity &amp; Infrastructure</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 8 }}>
                    <div style={{ padding: 10, background: 'var(--bg-subtle, #f8fafc)', borderRadius: 6 }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Exam Nodes</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{activeCentreDrawer.capacity?.examNodes || 0}</div>
                    </div>
                    <div style={{ padding: 10, background: 'var(--bg-subtle, #f8fafc)', borderRadius: 6 }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Total Systems</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{activeCentreDrawer.capacity?.totalSystems || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Centre Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCentre ? `Edit Centre (${formData.centreCode})` : 'Register New Testing Centre'}</h3>
              <button className="btn-ghost" onClick={() => setShowAddModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCentre}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Centre Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. CN-001"
                      value={formData.centreCode}
                      onChange={e => setFormData({ ...formData, centreCode: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Edu Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. EDU-DL-2041"
                      value={formData.eduCode}
                      onChange={e => setFormData({ ...formData, eduCode: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">TC Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. TC-DL-1082"
                      value={formData.tcCode}
                      onChange={e => setFormData({ ...formData, tcCode: e.target.value })}
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
                    value={formData.centreName}
                    onChange={e => setFormData({ ...formData, centreName: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Address *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Plot, Street, Landmark"
                      value={formData.centreAddress}
                      onChange={e => setFormData({ ...formData, centreAddress: e.target.value })}
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

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Organization Type</label>
                    <select
                      className="form-control"
                      value={formData.organizationType}
                      onChange={e => setFormData({ ...formData, organizationType: e.target.value })}
                    >
                      {ORG_TYPES.map(ot => <option key={ot} value={ot}>{ot}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Venue Status</label>
                    <select
                      className="form-control"
                      value={formData.venueStatus}
                      onChange={e => setFormData({ ...formData, venueStatus: e.target.value })}
                    >
                      {VENUE_STATUS_OPTS.map(vs => <option key={vs} value={vs}>{vs}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Centre Status</label>
                    <select
                      className="form-control"
                      value={formData.centreStatus}
                      onChange={e => setFormData({ ...formData, centreStatus: e.target.value })}
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
                      value={formData.officialEmail}
                      onChange={e => setFormData({ ...formData, officialEmail: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Google Map URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://maps.google.com/..."
                      value={formData.googleMapLink}
                      onChange={e => setFormData({ ...formData, googleMapLink: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingCentre ? 'Update Centre' : 'Save Centre'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
