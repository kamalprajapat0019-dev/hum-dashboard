import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Building2, Search, Filter, Eye, MapPin, RefreshCw, Download,
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, X, Check,
  AlertCircle, Loader2, ChevronLeft, ChevronRight, UserCheck, Ban, Edit
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { useAuth } from '@/context/AuthContext';
import { useClient } from '@/context/ClientContext';
import { StatusBadge } from '@/components/common';
import CentreProfileModal from './components/CentreProfileModal';

const STATUS_OPTIONS = [
  'All',
  'Draft',
  'Registered',
  'Ready to Book',
  'Invited',
  'Booked',
  'Auditor Assigned',
  'Audited',
  'Allocated',
  'Rejected',
  'Blacklisted',
];

const REGION_OPTIONS = ['All', 'North', 'South', 'East', 'West', 'Central', 'North-East'];

export default function CentresPage() {
  const { user } = useAuth();
  const { selectedClientId, setSelectedClientId, clients, selectedClient } = useClient();

  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Search & Filter state (5 OEMP filters: Client, Region, State, City, Status)
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('');
  const [debouncedState, setDebouncedState] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [debouncedCity, setDebouncedCity] = useState('');

  // Status Summary Cards (PDF Section 1.1)
  const [summary, setSummary] = useState({
    card1: { all: 0, readyForBooking: 0 },
    card2: { invited: 0, booked: 0 },
    card3: { auditorAssigned: 0, audited: 0 },
    card4: { rejected: 0, blacklisted: 0 },
  });
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Centre Profile Modal
  const [selectedCentreProfile, setSelectedCentreProfile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Debounce search, state and city inputs
  const searchTimerRef = useRef(null);
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setDebouncedState(stateFilter);
      setDebouncedCity(cityFilter);
      setPage(1); // Reset to page 1 on new search/filter
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search, stateFilter, cityFilter]);

  // Load Status Summary Cards
  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.CENTRES_SUMMARY, {
        params: { clientId: selectedClientId || undefined },
      });
      if (res && res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch centre status summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  }, [selectedClientId]);

  // Load Centre Master Listing Table
  const loadCentres = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.CENTRES, {
        params: {
          page,
          limit,
          search: debouncedSearch.trim() || undefined,
          regionId: regionFilter !== 'All' ? regionFilter : undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          stateId: debouncedState.trim() || undefined,
          cityId: debouncedCity.trim() || undefined,
          clientId: selectedClientId || undefined,
        },
      });

      if (res && res.success) {
        setCentres(Array.isArray(res.data) ? res.data : []);
        if (res.meta) {
          setTotalRecords(res.meta.total || 0);
          setTotalPages(res.meta.totalPages || 1);
        }
      } else {
        setCentres([]);
      }
    } catch (err) {
      console.error('Failed to query centre master:', err);
      setError(err.message || 'Unable to connect to centre database');
      setCentres([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, regionFilter, statusFilter, debouncedState, debouncedCity, selectedClientId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadCentres();
  }, [loadCentres]);

  // Open Full Centre Profile Modal (View or Edit)
  const handleViewProfile = async (centreId, isEdit = false) => {
    setIsEditMode(isEdit);
    setLoadingProfile(true);
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.CENTRE_PROFILE(centreId));
      if (res && res.success && res.data) {
        setSelectedCentreProfile(res.data);
      } else {
        const found = centres.find((c) => c.id === centreId);
        setSelectedCentreProfile(found);
      }
    } catch (err) {
      console.error('Failed to load full centre profile:', err);
      const found = centres.find((c) => c.id === centreId);
      setSelectedCentreProfile(found);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Export to CSV
  const handleExport = () => {
    if (centres.length === 0) return;
    const headers = ['S. No.', 'Centre ID', 'Centre Name', 'Region', 'State', 'City', 'Total Nodes', 'Status'];
    const rows = centres.map((c, idx) => [
      ((page - 1) * limit) + idx + 1,
      `"${c.centreCode || c.centre_id || ''}"`,
      `"${c.centreName || c.centre_name || ''}"`,
      `"${c.regionId || 'North'}"`,
      `"${c.stateName || ''}"`,
      `"${c.cityName || ''}"`,
      c.capacity?.examNodes || c.totalNodes || 0,
      `"${c.centreStatus || c.centre_status || 'Draft'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OEMP_Centre_Master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header__top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="page-header__title">Centre Master — Examination Venues</h1>
              {selectedClient && (
                <span className="badge badge-subtle" style={{ background: '#eff6ff', color: '#1e40af', fontWeight: 600 }}>
                  Client: {selectedClient.name}
                </span>
              )}
            </div>
            <p className="page-header__subtitle">
              Review, verify, audit, and approve registered examination centres across India.
            </p>
          </div>
          <div className="page-header__actions" style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                loadSummary();
                loadCentres();
              }}
              disabled={loading}
              title="Refresh Records"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExport}
              disabled={centres.length === 0}
              title="Export Listing to CSV"
            >
              <Download size={13} /> Export
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 1.1: Centre Status Summary Cards (OEMP PDF Specification) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Card 1: All & Ready-for-Booking */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            background: 'var(--color-bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ONBOARDING & BOOKING
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
            <div>
              <div style={{ fontSize: '0.8125rem', color: '#475569' }}>All Centres</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {loadingSummary ? '...' : summary.card1.all}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8125rem', color: '#166534', fontWeight: 500 }}>Ready-for-Booking</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16a34a', lineHeight: 1.2 }}>
                {loadingSummary ? '...' : summary.card1.readyForBooking}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Invited & Booked */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            background: 'var(--color-bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            DEMAND PIPELINE
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
            <div>
              <div style={{ fontSize: '0.8125rem', color: '#475569' }}>Invited</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0284c7', lineHeight: 1.2 }}>
                {loadingSummary ? '...' : summary.card2.invited}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8125rem', color: '#1e40af', fontWeight: 500 }}>Booked</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2563eb', lineHeight: 1.2 }}>
                {loadingSummary ? '...' : summary.card2.booked}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Auditor Assigned & Audited */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            background: 'var(--color-bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            VERIFICATION & AUDIT
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
            <div>
              <div style={{ fontSize: '0.8125rem', color: '#d97706' }}>Auditor Assigned</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706', lineHeight: 1.2 }}>
                {loadingSummary ? '...' : summary.card3.auditorAssigned}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8125rem', color: '#7c3aed', fontWeight: 500 }}>Audited</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#7c3aed', lineHeight: 1.2 }}>
                {loadingSummary ? '...' : summary.card3.audited}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Rejected & Blacklisted */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            background: 'var(--color-bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            EXCEPTIONS & RISK
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
            <div>
              <div style={{ fontSize: '0.8125rem', color: '#dc2626' }}>Rejected</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', lineHeight: 1.2 }}>
                {loadingSummary ? '...' : summary.card4.rejected}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8125rem', color: '#991b1b', fontWeight: 500 }}>Blacklisted</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#991b1b', lineHeight: 1.2 }}>
                {loadingSummary ? '...' : summary.card4.blacklisted}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filters Bar (Phase 2.C) ── */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          background: 'var(--color-bg-card, #ffffff)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {/* Search by Centre ID, Centre Name, City */}
          <div style={{ flex: '1 1 200px', minWidth: 180, position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #94a3b8)',
              }}
            />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: 36, height: 38 }}
              placeholder="Search ID, Name, City..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Client Filter */}
          <div style={{ minWidth: 140 }}>
            <select
              className="form-control"
              style={{ height: 38 }}
              value={selectedClientId || ''}
              onChange={(e) => {
                if (setSelectedClientId) setSelectedClientId(e.target.value || null);
                setPage(1);
              }}
            >
              <option value="">All Clients</option>
              {clients?.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Region Filter */}
          <div style={{ minWidth: 120 }}>
            <select
              className="form-control"
              style={{ height: 38 }}
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Regions</option>
              {REGION_OPTIONS.filter((r) => r !== 'All').map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div style={{ minWidth: 120 }}>
            <input
              type="text"
              className="form-control"
              style={{ height: 38 }}
              placeholder="Filter State..."
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            />
          </div>

          {/* City Filter */}
          <div style={{ minWidth: 120 }}>
            <input
              type="text"
              className="form-control"
              style={{ height: 38 }}
              placeholder="Filter City..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>

          {/* Workflow Status Filter */}
          <div style={{ minWidth: 140 }}>
            <select
              className="form-control"
              style={{ height: 38 }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.filter((s) => s !== 'All').map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(search || selectedClientId || regionFilter !== 'All' || statusFilter !== 'All' || stateFilter || cityFilter) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
                if (setSelectedClientId) setSelectedClientId(null);
                setRegionFilter('All');
                setStatusFilter('All');
                setStateFilter('');
                setDebouncedState('');
                setCityFilter('');
                setDebouncedCity('');
                setPage(1);
              }}
              style={{ color: '#64748b' }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#991b1b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} />
            <div>
              <strong>Database Connection Error:</strong> {error}
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

      {/* ── Section 1.2: Centre Master Overview Listing Table ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>S. No.</th>
                <th>Centre ID</th>
                <th>Centre Name</th>
                <th>Region</th>
                <th>State</th>
                <th>City</th>
                <th style={{ textAlign: 'right' }}>Total Nodes</th>
                <th>Status</th>
                <th style={{ textAlign: 'center', width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                    Loading centre records from MySQL database...
                  </td>
                </tr>
              ) : centres.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                    <Building2 size={36} style={{ margin: '0 auto 12px', opacity: 0.4, display: 'block' }} />
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: '#334155' }}>No Centre Records Found</div>
                    <div style={{ fontSize: '0.875rem', marginTop: 4 }}>
                      {debouncedSearch || statusFilter !== 'All'
                        ? 'Try clearing search filters to see all examination centres.'
                        : 'New centres will appear here once submitted by Centre Users through the Centre Portal.'}
                    </div>
                  </td>
                </tr>
              ) : (
                centres.map((c, idx) => {
                  const serialNumber = (page - 1) * limit + idx + 1;
                  const totalNodes = c.capacity?.examNodes || c.totalNodes || 0;

                  return (
                    <tr key={c.id || idx} style={{ transition: 'background 0.15s ease' }}>
                      <td style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{serialNumber}</td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#1e40af',
                            background: '#eff6ff',
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}
                        >
                          {c.centreCode || c.centre_id || '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.centreName || c.centre_name}</div>
                        {c.centreAddress && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.centreAddress}
                          </div>
                        )}
                      </td>
                      <td>{c.regionId || 'North'}</td>
                      <td>{c.stateName || '—'}</td>
                      <td>{c.cityName || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {Number(totalNodes).toLocaleString()}
                      </td>
                      <td>
                        <StatusBadge status={c.centreStatus || c.centre_status || 'Draft'} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleViewProfile(c.id, false)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', padding: '4px 8px' }}
                            title="View Complete Centre Profile"
                          >
                            <Eye size={13} /> View
                          </button>
                          {(user?.role === 'ADMIN' || user?.role === 'OPERATIONS') && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleViewProfile(c.id, true)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', padding: '4px 8px', color: '#2563eb' }}
                              title="Edit Centre Details"
                            >
                              <Edit size={13} /> Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer & Continuous Server-Side Pagination (Section 1.5) ── */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-bg-subtle, #f8fafc)',
            fontSize: '0.8125rem',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>
              Showing {centres.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
              {Math.min(page * limit, totalRecords)} of {totalRecords} centres
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Show:</span>
              <select
                className="form-control"
                style={{ width: 80, height: 30, padding: '2px 8px', fontSize: '0.8125rem' }}
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || loading}
              style={{ padding: '4px 8px' }}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <span style={{ padding: '0 8px', fontWeight: 600 }}>
              Page {page} of {totalPages || 1}
            </span>

            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || loading}
              style={{ padding: '4px 8px' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Centre Full Profile Modal (8-Tab Admin Review) ── */}
      {selectedCentreProfile && (
        <CentreProfileModal
          centre={selectedCentreProfile}
          initialEditMode={isEditMode}
          onClose={() => {
            setSelectedCentreProfile(null);
            setIsEditMode(false);
          }}
          onRefresh={() => {
            loadSummary();
            loadCentres();
            if (selectedCentreProfile) {
              handleViewProfile(selectedCentreProfile.id, isEditMode);
            }
          }}
          currentUserRole={user?.role || 'ADMIN'}
        />
      )}
    </div>
  );
}
