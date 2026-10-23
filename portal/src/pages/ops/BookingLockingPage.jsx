import { useState } from 'react';
import {
  Lock, Unlock, Plus, Search, Filter, AlertTriangle, CheckCircle2,
  Calendar, Users, Building2, RefreshCw, X, Check, ArrowRight, ShieldAlert,
  Send, Repeat, Clock, AlertCircle
} from 'lucide-react';
import {
  BookingStore, ProjectStore, CentreStore, EligibilityStore, appendAuditLog
} from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common';

export default function BookingLockingPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(() => BookingStore.getAll());
  const [projects] = useState(() => ProjectStore.getAll());
  const [centres] = useState(() => CentreStore.getAll());
  const [selectedProject, setSelectedProject] = useState('p001');
  const [cityFilter, setCityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedBookingForAction, setSelectedBookingForAction] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Invite Form
  const initialInvite = {
    centre_id: centres[0]?.id || 'cn001',
    requested_nodes: 40,
    buffer_nodes: 4,
    shifts: 2,
    rate_per_node: 180,
  };
  const [inviteForm, setInviteForm] = useState(initialInvite);

  // Replace Form
  const [replacementCentreId, setReplacementCentreId] = useState(centres[1]?.id || 'cn002');
  const [replacementReason, setReplacementReason] = useState('Capacity adjustment requested by centre.');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadData = () => setBookings(BookingStore.getAll());

  const currentProject = projects.find(p => p.id === selectedProject) || projects[0];

  const filteredBookings = bookings.filter(b => {
    if (selectedProject !== 'All' && b.project_id !== selectedProject) return false;
    if (cityFilter !== 'All' && b.city !== cityFilter) return false;
    if (statusFilter !== 'All' && b.status !== statusFilter) return false;
    return true;
  });

  const conflictBookings = filteredBookings.filter(b => b.conflict_detected);
  const lockedCount = filteredBookings.filter(b => b.status === 'Locked').length;
  const invitedCount = filteredBookings.filter(b => b.status === 'Invited' || b.status === 'Consent Accepted').length;
  const discussCount = filteredBookings.filter(b => b.status === 'Discussing').length;

  const totalBookedNodes = filteredBookings
    .filter(b => b.status === 'Locked' || b.status === 'Consent Accepted')
    .reduce((acc, b) => acc + (b.requested_nodes || 0), 0);

  const handleLockBooking = (booking) => {
    BookingStore.update(booking.id, {
      status: 'Locked',
      is_locked: true,
      locked_at: new Date().toISOString(),
    });

    appendAuditLog({
      user: user?.name || 'Ops Executive',
      role: user?.role || 'operations_executive',
      action: 'BOOKING_LOCKED',
      entity: `Booking: ${booking.booking_code}`,
      details: `Capacity (${booking.requested_nodes} nodes) locked for ${booking.centre_name} on project ${booking.project_name}`,
    });

    reloadData();
    showToast(`Booking ${booking.booking_code} locked successfully!`);
  };

  const handleUnlockBooking = (booking) => {
    if (confirm(`Unlock booking for ${booking.centre_name}? This allows capacity modifications.`)) {
      BookingStore.update(booking.id, {
        status: 'Invited',
        is_locked: false,
        locked_at: '',
      });

      appendAuditLog({
        user: user?.name || 'Admin',
        role: user?.role || 'admin',
        action: 'BOOKING_UNLOCKED',
        entity: `Booking: ${booking.booking_code}`,
        details: `Allocation unlocked for modifications.`,
      });

      reloadData();
      showToast(`Booking ${booking.booking_code} unlocked.`);
    }
  };

  const handleCreateInvite = (e) => {
    e.preventDefault();
    const chosenCentre = centres.find(c => c.id === inviteForm.centre_id);
    if (!chosenCentre) return;

    // Check for conflict
    const isConflict = bookings.some(b =>
      b.centre_id === chosenCentre.id &&
      b.exam_date === currentProject.exam_date &&
      b.project_id !== currentProject.id
    );

    const newBooking = {
      booking_code: `BK-2026-${String(bookings.length + 1).padStart(3, '0')}`,
      project_id: currentProject.id,
      project_name: currentProject.name,
      centre_id: chosenCentre.id,
      centre_name: chosenCentre.centre_name,
      city: chosenCentre.centre_address ? 'New Delhi' : 'Mumbai',
      exam_date: currentProject.exam_date || '2026-11-15',
      shifts: Number(inviteForm.shifts),
      requested_nodes: Number(inviteForm.requested_nodes),
      buffer_nodes: Number(inviteForm.buffer_nodes),
      rate_per_node: Number(inviteForm.rate_per_node),
      status: 'Invited',
      is_locked: false,
      locked_at: '',
      conflict_detected: isConflict,
      conflict_details: isConflict ? `Centre booked on concurrent date ${currentProject.exam_date}` : '',
    };

    BookingStore.create(newBooking);

    appendAuditLog({
      user: user?.name || 'Ops Executive',
      role: user?.role || 'operations_executive',
      action: 'BOOKING_INVITE_SENT',
      entity: `Booking: ${newBooking.booking_code}`,
      details: `Invited ${chosenCentre.centre_name} for ${newBooking.requested_nodes} nodes on ${newBooking.exam_date}`,
    });

    reloadData();
    setShowInviteModal(false);
    showToast(`Booking invitation dispatched to "${chosenCentre.centre_name}"!`);
  };

  const handleReplaceCentre = (e) => {
    e.preventDefault();
    if (!selectedBookingForAction) return;
    const replacementCentre = centres.find(c => c.id === replacementCentreId);
    if (!replacementCentre) return;

    BookingStore.update(selectedBookingForAction.id, {
      centre_id: replacementCentre.id,
      centre_name: replacementCentre.centre_name,
      status: 'Invited',
      is_locked: false,
      conflict_detected: false,
      conflict_details: '',
    });

    appendAuditLog({
      user: user?.name || 'Ops Executive',
      role: user?.role || 'operations_executive',
      action: 'CENTRE_REPLACED_IN_BOOKING',
      entity: `Booking: ${selectedBookingForAction.booking_code}`,
      details: `Replaced with ${replacementCentre.centre_name}. Reason: ${replacementReason}`,
    });

    reloadData();
    setShowReplaceModal(false);
    setSelectedBookingForAction(null);
    showToast(`Centre replaced with "${replacementCentre.centre_name}". New invitation dispatched!`);
  };

  const citiesList = ['All', ...Array.from(new Set(bookings.map(b => b.city).filter(Boolean)))];

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
              <span>Operations</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Booking &amp; Locking Pipeline</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>Venue Booking &amp; Allocation Locking</h1>
            <p className="page-header__subtitle">
              Module 3B — Dispatch centre booking requests, resolve concurrent date conflicts, lock node allocation, and handle replacements
            </p>
          </div>
          <div className="page-header__actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                BookingStore.reset();
                reloadData();
                showToast('Reset booking store to default');
              }}
            >
              <RefreshCw size={14} /> Reset Bookings
            </button>
            <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
              <Plus size={14} /> Dispatch Booking Invite
            </button>
          </div>
        </div>
      </div>

      {/* Project Selector & Overview Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, background: '#f8fafc', border: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Project Selection:
            </span>
            <select
              className="form-control"
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              style={{ width: 300, fontSize: '0.8125rem', fontWeight: 600 }}
            >
              <option value="All">All Examination Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.project_code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div>Target Venues: <strong>{currentProject?.centre_target || 120}</strong></div>
            <div>Booked &amp; Locked: <strong style={{ color: 'var(--color-success)' }}>{totalBookedNodes} Nodes</strong></div>
            <div>Exam Date: <strong>{currentProject?.exam_date || 'Upcoming'}</strong></div>
          </div>
        </div>
      </div>

      {/* Conflict Alert Banner if any conflicts exist */}
      {conflictBookings.length > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Concurrent Booking Conflict Detected ({conflictBookings.length} Venues):</strong>
            <div style={{ fontSize: '0.75rem', marginTop: 3 }}>
              {conflictBookings.map(cb => (
                <span key={cb.id} style={{ display: 'inline-block', marginRight: 12 }}>
                  • <strong>{cb.centre_name}</strong>: {cb.conflict_details}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Locked &amp; Confirmed</span>
            <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
              <Lock size={16} color="#16a34a" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-success)' }}>{lockedCount}</div>
          <div className="kpi-card__sub">Frozen node allocation</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Invited / Consent Inbound</span>
            <div className="kpi-card__icon" style={{ background: '#eff6ff' }}>
              <Send size={16} color="#1e40af" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-primary)' }}>{invitedCount}</div>
          <div className="kpi-card__sub">Awaiting digital signoff</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Under Discussion</span>
            <div className="kpi-card__icon" style={{ background: '#fffbeb' }}>
              <Clock size={16} color="#d97706" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-warning)' }}>{discussCount}</div>
          <div className="kpi-card__sub">Capacity or rate negotiation</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Date Conflicts</span>
            <div className="kpi-card__icon" style={{ background: '#fef2f2' }}>
              <AlertTriangle size={16} color="#dc2626" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: conflictBookings.length > 0 ? 'var(--color-danger)' : 'var(--text-muted)' }}>
            {conflictBookings.length}
          </div>
          <div className="kpi-card__sub">Immediate replacement required</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Booking Records ({filteredBookings.length})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <select
              className="form-control"
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              style={{ width: 140, fontSize: '0.75rem' }}
            >
              <option value="All">All Cities</option>
              {citiesList.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              className="form-control"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: 160, fontSize: '0.75rem' }}
            >
              <option value="All">All Booking Statuses</option>
              <option value="Locked">Locked</option>
              <option value="Consent Accepted">Consent Accepted</option>
              <option value="Invited">Invited</option>
              <option value="Discussing">Discussing</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Booking Code</th>
                <th>Centre &amp; Location</th>
                <th>Exam Project</th>
                <th>Exam Date</th>
                <th>Nodes &amp; Buffer</th>
                <th>Shifts</th>
                <th>Rate (₹/Node)</th>
                <th>Booking Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No bookings recorded matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => (
                  <tr key={b.id} style={{ background: b.conflict_detected ? '#fef2f225' : 'transparent' }}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {b.booking_code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.centre_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.city}</div>
                      {b.conflict_detected && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                          ⚠️ Overlap conflict
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{b.project_name}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem' }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        <span>{b.exam_date}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{b.requested_nodes}</span> nodes
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> (+{b.buffer_nodes} buf)</span>
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>{b.shifts} Shifts</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>₹{b.rate_per_node}</span>
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {b.is_locked ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Unlock booking"
                            onClick={() => handleUnlockBooking(b)}
                          >
                            <Unlock size={13} /> Unlock
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            title="Lock node allocation"
                            onClick={() => handleLockBooking(b)}
                          >
                            <Lock size={13} /> Lock
                          </button>
                        )}

                        <button
                          className="btn btn-secondary btn-sm"
                          title="Replace centre with alternate venue"
                          onClick={() => {
                            setSelectedBookingForAction(b);
                            setShowReplaceModal(true);
                          }}
                        >
                          <Repeat size={13} /> Replace
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-backdrop" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">Dispatch Booking Invitation</h3>
              <button className="btn-ghost" onClick={() => setShowInviteModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateInvite}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Project:</div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                    {currentProject.name} ({currentProject.project_code})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Exam Date: <strong>{currentProject.exam_date || '2026-11-15'}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Eligible Centre *</label>
                  <select
                    className="form-control"
                    value={inviteForm.centre_id}
                    onChange={e => setInviteForm({ ...inviteForm, centre_id: e.target.value })}
                  >
                    {centres.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.centre_name} ({c.centre_id}) — {c.pincode}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Requested Exam Nodes *</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      value={inviteForm.requested_nodes}
                      onChange={e => setInviteForm({ ...inviteForm, requested_nodes: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Buffer Systems *</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      value={inviteForm.buffer_nodes}
                      onChange={e => setInviteForm({ ...inviteForm, buffer_nodes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Number of Shifts *</label>
                    <select
                      className="form-control"
                      value={inviteForm.shifts}
                      onChange={e => setInviteForm({ ...inviteForm, shifts: e.target.value })}
                    >
                      <option value={1}>1 Shift (Morning)</option>
                      <option value={2}>2 Shifts (Morning + Afternoon)</option>
                      <option value={3}>3 Shifts (Full Day)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Offered Rate (₹ / node) *</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      value={inviteForm.rate_per_node}
                      onChange={e => setInviteForm({ ...inviteForm, rate_per_node: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={14} /> Send Booking Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replace Centre Modal */}
      {showReplaceModal && selectedBookingForAction && (
        <div className="modal-backdrop" onClick={() => setShowReplaceModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Repeat size={18} color="var(--color-primary)" />
                <h3 className="modal-title">Replace Centre ({selectedBookingForAction.booking_code})</h3>
              </div>
              <button className="btn-ghost" onClick={() => setShowReplaceModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReplaceCentre}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.8125rem', color: '#92400e' }}>
                  Replacing <strong>{selectedBookingForAction.centre_name}</strong> for {selectedBookingForAction.requested_nodes} target nodes on {selectedBookingForAction.exam_date}.
                </div>

                <div className="form-group">
                  <label className="form-label">Substitute Alternate Centre *</label>
                  <select
                    className="form-control"
                    value={replacementCentreId}
                    onChange={e => setReplacementCentreId(e.target.value)}
                  >
                    {centres.filter(c => c.id !== selectedBookingForAction.centre_id).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.centre_name} ({c.centre_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Replacement Reason / Justification *</label>
                  <textarea
                    className="form-control"
                    required
                    rows={2}
                    value={replacementReason}
                    onChange={e => setReplacementReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReplaceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={14} /> Confirm Replacement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
