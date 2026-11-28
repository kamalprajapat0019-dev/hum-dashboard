import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle, Copy, Send, Phone, Mail, Building2, Clock, Check } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';

export function SendSignUpLinkModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) {
  const [centreName, setCentreName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const prevOpenRef = useRef(false);

  // Re-seed inputs ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setCentreName(initialData?.centreName || initialData?.name || '');
      setEmail(initialData?.email || initialData?.officialEmail || '');
      setWhatsappNumber(initialData?.whatsappNumber || initialData?.phone || initialData?.contactNumber || '');
      setError('');
      setInviteResult(null);
      setCopied(false);
      setLoading(false);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = whatsappNumber.replace(/\D/g, '');
    const cleanName = centreName.trim();

    if (!cleanName) {
      setError('Centre Name / Representative Name is required.');
      return;
    }
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError('A valid Centre Official Email is required.');
      return;
    }
    if (!cleanMobile || cleanMobile.length !== 10) {
      setError('A valid 10-digit Centre WhatsApp Mobile Number is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post(ENDPOINTS.CENTRE_PORTAL.INVITE_USER, {
        name: cleanName,
        email: cleanEmail,
        whatsappNumber: cleanMobile,
        phone: cleanMobile,
        centreId: initialData?.centreId || initialData?.id || undefined,
        role: 'CENTRE',
      });

      if (res && res.success && res.data) {
        setInviteResult(res.data);
        if (onSuccess) onSuccess(res.data);
      } else {
        setError(res?.message || 'Failed to generate sign-up link.');
      }
    } catch (err) {
      setError(err.data?.error?.message || err.message || 'Error dispatching sign-up link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!inviteResult) return;
    const url = inviteResult.registrationUrl || inviteResult.activationUrl || '';
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 1200 }}
      onClick={onClose}
    >
      <div
        className="modal"
        style={{ maxWidth: 520, borderRadius: 12, pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Send size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                Send Sign-Up Link (FRD Sec. 4.1)
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Generates a secure 72-hour registration link for Centre Users
              </span>
            </div>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {inviteResult ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CheckCircle size={32} color="#16a34a" />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Sign-Up Link Generated!
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
              72-hour registration link generated for <strong>{centreName || initialData?.centreName || 'Centre User'}</strong>.
            </p>

            {/* Per-Channel Dispatch Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, textAlign: 'left' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 6,
                background: inviteResult.emailDispatched || inviteResult.dispatch?.email?.sent ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${inviteResult.emailDispatched || inviteResult.dispatch?.email?.sent ? '#bbf7d0' : '#fde68a'}`,
                fontSize: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={15} color={inviteResult.emailDispatched || inviteResult.dispatch?.email?.sent ? '#16a34a' : '#d97706'} />
                  <span><strong>Email:</strong> {email}</span>
                </div>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  background: inviteResult.emailDispatched || inviteResult.dispatch?.email?.sent ? '#dcfce7' : '#fef3c7',
                  color: inviteResult.emailDispatched || inviteResult.dispatch?.email?.sent ? '#15803d' : '#b45309'
                }}>
                  {inviteResult.emailDispatched || inviteResult.dispatch?.email?.sent ? 'Dispatched' : 'Simulated (SMTP env pending)'}
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 6,
                background: inviteResult.whatsappDispatched || inviteResult.dispatch?.whatsapp?.sent ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${inviteResult.whatsappDispatched || inviteResult.dispatch?.whatsapp?.sent ? '#bbf7d0' : '#fde68a'}`,
                fontSize: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={15} color={inviteResult.whatsappDispatched || inviteResult.dispatch?.whatsapp?.sent ? '#16a34a' : '#d97706'} />
                  <span><strong>WhatsApp:</strong> +91 {whatsappNumber}</span>
                </div>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  background: inviteResult.whatsappDispatched || inviteResult.dispatch?.whatsapp?.sent ? '#dcfce7' : '#fef3c7',
                  color: inviteResult.whatsappDispatched || inviteResult.dispatch?.whatsapp?.sent ? '#15803d' : '#b45309'
                }}>
                  {inviteResult.whatsappDispatched || inviteResult.dispatch?.whatsapp?.sent ? 'Dispatched' : 'Simulated (WhatsApp API env pending)'}
                </span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px', display: 'flex', alignItems: 'center', gap: 8, wordBreak: 'break-all', marginBottom: 12 }}>
              <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: '#1e40af', flex: 1, textAlign: 'left' }}>
                {inviteResult.registrationUrl?.startsWith('http')
                  ? inviteResult.registrationUrl
                  : `${window.location.origin}${inviteResult.registrationUrl}`}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleCopy}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.75rem', color: '#b45309', background: '#fef3c7', padding: '6px 12px', borderRadius: 6, marginBottom: 20 }}>
              <Clock size={14} />
              <span>Link expires automatically after <strong>72 hours</strong>. Single-use only.</span>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '10px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ pointerEvents: 'auto' }}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px' }}>
              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: '0.8125rem' }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="invite-centre-name" className="form-label" style={{ fontWeight: 600 }}>
                  Centre Name / Representative Name <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="invite-centre-name"
                    name="centreName"
                    type="text"
                    className="form-control"
                    style={{ paddingRight: 36 }}
                    value={centreName}
                    onChange={(e) => setCentreName(e.target.value)}
                    placeholder="e.g. Cambridge Institute of Technology"
                    autoComplete="off"
                    required
                  />
                  <Building2 size={15} color="#94a3b8" style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }} />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="invite-centre-email" className="form-label" style={{ fontWeight: 600 }}>
                  Centre Official Email <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="invite-centre-email"
                    name="email"
                    type="email"
                    className="form-control"
                    style={{ paddingRight: 36 }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="official@institution.edu.in"
                    autoComplete="off"
                    required
                  />
                  <Mail size={15} color="#94a3b8" style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                  Sign-up invitation and email verification link will be dispatched to this address.
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="invite-centre-phone" className="form-label" style={{ fontWeight: 600 }}>
                  Centre WhatsApp Mobile Number <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="invite-centre-phone"
                    name="whatsappNumber"
                    type="tel"
                    maxLength={10}
                    className="form-control"
                    style={{ paddingRight: 36 }}
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit primary mobile number"
                    autoComplete="off"
                    required
                  />
                  <Phone size={15} color="#94a3b8" style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                  72-hour invite link and registration verification OTP will be sent via WhatsApp.
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                <span>
                  Per <strong>FRD Section 4.1</strong>, the generated sign-up link expires after <strong>72 hours</strong> and blocks duplicate or unauthorized re-use.
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Send size={14} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Generating 72h Link...' : 'Send Sign-Up Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SendSignUpLinkModal;
