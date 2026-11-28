import React, { useState, useEffect, useCallback } from 'react';
import {
  X, RefreshCw, Send, Phone, Mail, Clock, AlertCircle, CheckCircle,
  Copy, Check, Search, MessageSquare, ExternalLink, Loader2
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';

export function SignUpInvitesModal({ isOpen, onClose }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionLoading, setActionLoading] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);

  // Follow-up notes modal state
  const [activeFollowUpInv, setActiveFollowUpInv] = useState(null);
  const [followUpAction, setFollowUpAction] = useState('call');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(ENDPOINTS.CENTRE_PORTAL.INVITATIONS, {
        params: {
          status: statusFilter !== 'All' ? statusFilter : undefined,
          search: search.trim() || undefined,
          limit: 50,
        },
      });
      if (res && res.success && Array.isArray(res.data)) {
        setInvitations(res.data);
      } else {
        setInvitations([]);
      }
    } catch (err) {
      setError(err.data?.error?.message || err.message || 'Failed to retrieve sign-up invitations');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    if (isOpen) {
      loadInvitations();
    }
  }, [isOpen, loadInvitations]);

  if (!isOpen) return null;

  // Single-click Resend / Renew Link
  const handleResend = async (inv) => {
    setActionLoading(`resend-${inv.id}`);
    setError('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post(ENDPOINTS.CENTRE_PORTAL.INVITATION_RESEND(inv.id));
      if (res && res.success) {
        setSuccessMsg(`Fresh 72-hour sign-up link generated & dispatched for ${inv.email}!`);
        loadInvitations();
      } else {
        setError(res?.message || 'Failed to resend sign-up link');
      }
    } catch (err) {
      setError(err.data?.error?.message || err.message || 'Unable to renew link.');
    } finally {
      setActionLoading(null);
    }
  };

  // Submit Follow-Up Action
  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    if (!activeFollowUpInv) return;
    setActionLoading(`followup-${activeFollowUpInv.id}`);
    try {
      const res = await apiClient.post(
        ENDPOINTS.CENTRE_PORTAL.INVITATION_FOLLOW_UP(activeFollowUpInv.id),
        {
          action: followUpAction,
          notes: followUpNotes.trim(),
        }
      );
      if (res && res.success) {
        setSuccessMsg(`Follow-up (${followUpAction.toUpperCase()}) logged for ${activeFollowUpInv.email}`);
        setActiveFollowUpInv(null);
        setFollowUpNotes('');
        loadInvitations();
      }
    } catch (err) {
      setError(err.data?.error?.message || err.message || 'Failed to record follow-up');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyLink = (token) => {
    const fullUrl = `${window.location.origin}/invite/register?token=${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const pendingCount = invitations.filter((i) => i.status === 'Pending' && !i.isExpired).length;
  const expiredCount = invitations.filter((i) => i.isExpired || i.status === 'Expired').length;
  const acceptedCount = invitations.filter((i) => i.status === 'Accepted').length;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 860, width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 12 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Clock size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                Centre Sign-Up Links & Follow-Up (FRD Sec. 4.1)
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Track 72-hour registration links, dispatch fresh links, and record Operations follow-up calls/emails.
              </span>
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ margin: '14px 24px 0', padding: '10px 14px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: '0.8125rem' }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ margin: '14px 24px 0', padding: '10px 14px', borderRadius: 6, background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', fontSize: '0.8125rem' }}>
            {successMsg}
          </div>
        )}

        {/* Summary Metric Pills */}
        <div style={{ display: 'flex', gap: 12, padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 12px', fontSize: '0.8125rem' }}>
            Total Invitations: <strong>{invitations.length}</strong>
          </div>
          <div style={{ background: '#fff', border: '1px solid #93c5fd', borderRadius: 6, padding: '6px 12px', fontSize: '0.8125rem', color: '#1e40af' }}>
            Active Pending: <strong>{pendingCount}</strong>
          </div>
          <div style={{ background: '#fff', border: '1px solid #fca5a5', borderRadius: 6, padding: '6px 12px', fontSize: '0.8125rem', color: '#dc2626' }}>
            Expired (72h elapsed): <strong>{expiredCount}</strong>
          </div>
          <div style={{ background: '#fff', border: '1px solid #86efac', borderRadius: 6, padding: '6px 12px', fontSize: '0.8125rem', color: '#16a34a' }}>
            Registered / Accepted: <strong>{acceptedCount}</strong>
          </div>
        </div>

        {/* Filters Bar */}
        <div style={{ padding: '12px 24px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by centre name, email, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32, height: 36, fontSize: '0.8125rem' }}
            />
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 11 }} />
          </div>

          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 140, height: 36, fontSize: '0.8125rem' }}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Active Pending</option>
            <option value="Expired">Expired</option>
            <option value="Accepted">Accepted</option>
          </select>

          <button
            className="btn btn-secondary btn-sm"
            onClick={loadInvitations}
            disabled={loading}
            style={{ height: 36, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Modal Body / Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              Loading sign-up links from database...
            </div>
          ) : invitations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <Clock size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <div style={{ fontWeight: 600 }}>No Invitations Found</div>
              <div style={{ fontSize: '0.8125rem', marginTop: 4 }}>
                Send new sign-up links to examination centres to track them here.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {invitations.map((inv) => {
                const isExpired = inv.isExpired || (inv.status === 'Pending' && new Date(inv.expiresAt) < new Date());
                const hoursLeft = Math.max(0, Math.round((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)));

                return (
                  <div
                    key={inv.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '14px 16px',
                      background: isExpired ? '#fffbfa' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
                          {inv.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4, fontSize: '0.8125rem', color: '#475569', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={13} color="#2563eb" /> {inv.email}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={13} color="#16a34a" /> +91 {inv.whatsappNumber || inv.phone || '—'}
                          </span>
                          <span>Invited by: <strong>{inv.inviter?.name || 'Project Manager'}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {inv.status === 'Accepted' ? (
                          <span className="badge badge-success" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
                            Registered & Verified
                          </span>
                        ) : isExpired ? (
                          <span className="badge badge-danger" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 600 }}>
                            Expired (72h window)
                          </span>
                        ) : (
                          <span className="badge badge-primary" style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>
                            Active ({hoursLeft}h left)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Follow-up Status & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, pt: 8, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {inv.lastFollowUpAt ? (
                          <span>
                            Last Follow-up: <strong>{inv.followUpAction || 'CONTACT'}</strong> on {new Date(inv.lastFollowUpAt).toLocaleDateString()}
                            {inv.followUpNotes && ` ("${inv.followUpNotes}")`}
                          </span>
                        ) : (
                          <span>No follow-up action recorded yet</span>
                        )}
                        {inv.resendCount > 0 && ` • Dispatched ${inv.resendCount + 1} times`}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-xs btn-secondary"
                          onClick={() => handleCopyLink(inv.token)}
                          title="Copy Sign-Up URL"
                        >
                          {copiedToken === inv.token ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                          {copiedToken === inv.token ? 'Copied' : 'Copy Link'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-xs btn-secondary"
                          onClick={() => {
                            setActiveFollowUpInv(inv);
                            setFollowUpAction('call');
                            setFollowUpNotes('');
                          }}
                          title="Record Follow-up Call / Email"
                        >
                          <Phone size={12} /> Call / Email
                        </button>

                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                          disabled={actionLoading === `resend-${inv.id}`}
                          onClick={() => handleResend(inv)}
                          title="Generate fresh 72h token and dispatch"
                        >
                          <Send size={12} className={actionLoading === `resend-${inv.id}` ? 'animate-spin' : ''} />
                          {isExpired ? 'Request / Renew Link' : 'Resend Link'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Follow-up Note Sub-Modal */}
        {activeFollowUpInv && (
          <div className="modal-backdrop" style={{ zIndex: 1300 }} onClick={() => setActiveFollowUpInv(null)}>
            <div className="modal" style={{ maxWidth: 440, padding: 20, borderRadius: 10 }} onClick={(e) => e.stopPropagation()}>
              <h4 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 700 }}>
                Record Operations Follow-up
              </h4>
              <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', color: '#64748b' }}>
                Follow up with <strong>{activeFollowUpInv.name}</strong> ({activeFollowUpInv.email}) for incomplete sign-up.
              </p>

              <form onSubmit={handleFollowUpSubmit}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Action Taken *</label>
                  <select
                    className="form-control"
                    value={followUpAction}
                    onChange={(e) => setFollowUpAction(e.target.value)}
                    required
                  >
                    <option value="call">Phone Call to WhatsApp Mobile (+91 {activeFollowUpInv.whatsappNumber || activeFollowUpInv.phone})</option>
                    <option value="email">Official Reminder Email to ({activeFollowUpInv.email})</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Follow-up Outcome / Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g. Spoke to Centre Superintendent; agreed to complete 6-field registration today."
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveFollowUpInv(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={actionLoading === `followup-${activeFollowUpInv.id}`}>
                    Save Follow-up
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="modal-footer" style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignUpInvitesModal;
