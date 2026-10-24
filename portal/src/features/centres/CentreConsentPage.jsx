import { useState } from 'react';
import {
  UserCheck, ShieldCheck, CheckCircle2, Clock, XCircle, AlertTriangle,
  FileText, Check, X, Send, AlertOctagon, RefreshCw, PenTool, Award
} from 'lucide-react';
import { ConsentStore, BookingStore, appendAuditLog } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/common';

export default function CentreConsentPage() {
  const { user } = useAuth();
  const [consents, setConsents] = useState(() =>
    ConsentStore.getAll().filter(c => c.centre_id === 'cn001')
  );

  // Active invitation for Centre ABC (cn001)
  const activeConsent = consents[0] || {
    id: 'cs001',
    centre_id: 'cn001',
    centre_name: 'Lotus Computer Education',
    project_name: 'NEET UG 2026 – Season 1',
    exam_date: '2026-11-15',
    proposed_nodes: 40,
    proposed_shifts: 2,
    proposed_rate: '₹180 per candidate/node',
    terms: 'National Testing Agency Standard Examination Security Undertaking (CBT-2026/SOP)',
    status: 'Accepted',
    consent_sign_name: 'Ramesh Gupta (Centre Head / Owner)',
    consent_signed_at: '2026-10-14T11:20:00Z',
  };

  // Modals
  const [showSignModal, setShowSignModal] = useState(false);
  const [showDiscussModal, setShowDiscussModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [signatoryName, setSignatoryName] = useState(user?.name || 'Ramesh Gupta');
  const [signatoryDesignation, setSignatoryDesignation] = useState('Centre Head / Venue Chief Superintendent');
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [discussText, setDiscussText] = useState('');
  const [rejectReason, setRejectReason] = useState('Local venue prior academic commitment on exam date.');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadData = () => {
    setConsents(ConsentStore.getAll().filter(c => c.centre_id === 'cn001'));
  };

  const handleSignConsent = (e) => {
    e.preventDefault();
    if (!agreeChecked || !signatoryName) return;

    ConsentStore.update(activeConsent.id, {
      status: 'Accepted',
      consent_sign_name: `${signatoryName} (${signatoryDesignation})`,
      consent_signed_at: new Date().toISOString(),
      discuss_remark: '',
      reject_reason: '',
    });

    appendAuditLog({
      user: signatoryName,
      role: 'centre_user',
      action: 'CONSENT_DIGITALLY_SIGNED',
      entity: `Project: ${activeConsent.project_name}`,
      details: `Digitally accepted delivery terms for ${activeConsent.proposed_nodes} nodes on ${activeConsent.exam_date}`,
    });

    reloadData();
    setShowSignModal(false);
    showToast('Digital Consent signed & transmitted to Operations Team!');
  };

  const handleDiscussSubmit = (e) => {
    e.preventDefault();
    if (!discussText) return;

    ConsentStore.update(activeConsent.id, {
      status: 'Discuss',
      discuss_remark: discussText,
    });

    appendAuditLog({
      user: user?.name || 'Centre Rep',
      role: 'centre_user',
      action: 'CONSENT_COUNTER_OFFER',
      entity: `Project: ${activeConsent.project_name}`,
      details: `Submitted discussion note: ${discussText}`,
    });

    reloadData();
    setShowDiscussModal(false);
    showToast('Discussion note submitted to Project Manager.');
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    ConsentStore.update(activeConsent.id, {
      status: 'Rejected',
      reject_reason: rejectReason,
    });

    appendAuditLog({
      user: user?.name || 'Centre Rep',
      role: 'centre_user',
      action: 'CONSENT_DECLINED',
      entity: `Project: ${activeConsent.project_name}`,
      details: `Declined booking invitation. Reason: ${rejectReason}`,
    });

    reloadData();
    setShowRejectModal(false);
    showToast('Booking invitation declined.');
  };

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
              <span>Centre</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Digital Consent Undertaking</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>Examination Delivery Digital Consent</h1>
            <p className="page-header__subtitle">
              Review examination terms, allocate computer nodes, and digitally authorize delivery undertaking
            </p>
          </div>
          <div className="page-header__actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                ConsentStore.reset();
                reloadData();
                showToast('Reset consent record to default');
              }}
            >
              <RefreshCw size={14} /> Reset State
            </button>
          </div>
        </div>
      </div>

      {/* Main Consent Letter & Terms Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={20} color="var(--color-primary)" />
            <div>
              <span className="card-title">Booking Invitation &amp; Formal Undertaking</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Issued by Testing Operations Management Directorate
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Consent Status:</span>
            <StatusBadge status={activeConsent.status} />
          </div>
        </div>

        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Key Invitation Parameters */}
          <div className="grid-4" style={{ background: 'var(--bg-subtle)', padding: 16, borderRadius: 'var(--radius-lg)' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Target Examination</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 2 }}>{activeConsent.project_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Scheduled Date</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{activeConsent.exam_date}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Required Systems</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-success)', marginTop: 2 }}>
                {activeConsent.proposed_nodes} Nodes ({activeConsent.proposed_shifts} Shifts)
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Commercial Payout Rate</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-purple)', marginTop: 2 }}>{activeConsent.proposed_rate}</div>
            </div>
          </div>

          {/* Legal Terms of Service & Security Undertaking */}
          <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="var(--color-primary)" />
              CBT Centre Delivery Undertaking &amp; Security Protocol Agreement
            </h4>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p>
                1. <strong>Capacity Guarantee:</strong> The test center agrees to dedicate {activeConsent.proposed_nodes} high-performance CBT nodes plus minimum 10% standby buffer nodes exclusively for {activeConsent.project_name} on {activeConsent.exam_date}.
              </p>
              <p>
                2. <strong>Power &amp; Network Continuity:</strong> Full uninterrupted dual-source power supply (DG set + online UPS) and isolated Gigabit Local Area Network (LAN) will be reserved during the entire examination window.
              </p>
              <p>
                3. <strong>Proctoring &amp; Surveillance Integrity:</strong> 100% CCTV camera coverage in exam labs, server room, and registration desks must remain operational with tamper-evident video recording retained for 90 days.
              </p>
              <p>
                4. <strong>Confidentiality:</strong> No unauthorized personnel or electronic recording devices shall be permitted within the security perimeter during mock dry-runs and exam shifts.
              </p>
            </div>
          </div>

          {/* Current Consent State Banner */}
          {activeConsent.status === 'Accepted' && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={22} color="#16a34a" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#166534' }}>
                    Digital Consent Successfully Signed &amp; Recorded
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: 2 }}>
                    Authorized by: <strong>{activeConsent.consent_sign_name}</strong> • Timestamp: {new Date(activeConsent.consent_signed_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowSignModal(true)}>
                Re-sign / Update Signatory
              </button>
            </div>
          )}

          {activeConsent.status === 'Discuss' && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#b45309' }}>
                Counter-Offer / Discussion Note Submitted
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#92400e', marginTop: 4 }}>
                &ldquo;{activeConsent.discuss_remark}&rdquo;
              </div>
              <div style={{ fontSize: '0.75rem', color: '#78350f', marginTop: 8 }}>
                The Project Manager has been notified and will review your adjustment request.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border-default)', paddingTop: 16 }}>
            <button
              className="btn btn-ghost"
              style={{ color: 'var(--color-danger)' }}
              onClick={() => setShowRejectModal(true)}
            >
              <XCircle size={14} /> Decline Invitation
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowDiscussModal(true)}
            >
              <PenTool size={14} /> Request Discussion / Counter-Offer
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setShowSignModal(true)}
            >
              <Check size={16} /> Accept &amp; Digitally Sign Consent
            </button>
          </div>
        </div>
      </div>

      {/* Digital Sign Modal */}
      {showSignModal && (
        <div className="modal-backdrop" onClick={() => setShowSignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color="var(--color-primary)" />
                <h3 className="modal-title">Authorize Digital Examination Consent</h3>
              </div>
              <button className="btn-ghost" onClick={() => setShowSignModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSignConsent}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Full Name of Authorized Signatory *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={signatoryName}
                    onChange={e => setSignatoryName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Official Designation *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={signatoryDesignation}
                    onChange={e => setSignatoryDesignation(e.target.value)}
                  />
                </div>

                <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 12, background: 'var(--bg-subtle)' }}>
                  <label style={{ display: 'flex', gap: 10, cursor: 'pointer', fontSize: '0.8125rem' }}>
                    <input
                      type="checkbox"
                      required
                      checked={agreeChecked}
                      onChange={e => setAgreeChecked(e.target.checked)}
                      style={{ marginTop: 3 }}
                    />
                    <span>
                      I hereby certify that I am legally authorized to represent <strong>{activeConsent.centre_name}</strong> and accept all delivery obligations, node availability guarantees, and security compliance protocols for <strong>{activeConsent.project_name}</strong>.
                    </span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!agreeChecked}>
                  <Check size={14} /> Transmit Digital Signature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discussion Modal */}
      {showDiscussModal && (
        <div className="modal-backdrop" onClick={() => setShowDiscussModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">Request Capacity or Terms Discussion</h3>
              <button className="btn-ghost" onClick={() => setShowDiscussModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleDiscussSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Specify Desired Adjustments *</label>
                  <textarea
                    className="form-control"
                    required
                    rows={4}
                    placeholder="e.g. Can provide 35 systems instead of 40; or request ₹190 per candidate rate due to generator diesel expenses..."
                    value={discussText}
                    onChange={e => setDiscussText(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDiscussModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={14} /> Submit to PM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-backdrop" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--color-danger)' }}>Decline Examination Invitation</h3>
              <button className="btn-ghost" onClick={() => setShowRejectModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Select Primary Decline Reason *</label>
                  <select
                    className="form-control"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  >
                    <option value="Local venue prior academic commitment on exam date.">Local venue prior academic commitment on exam date</option>
                    <option value="Server / network infrastructure under maintenance.">Server / network infrastructure under maintenance</option>
                    <option value="Commercial payout terms not viable.">Commercial payout terms not viable</option>
                    <option value="Staff unavailability on scheduled weekend.">Staff unavailability on scheduled weekend</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  <XCircle size={14} /> Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
