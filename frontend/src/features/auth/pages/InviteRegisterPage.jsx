import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight,
  ShieldCheck, Loader2, Phone, Mail, CheckSquare, RefreshCw, KeyRound
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { ROUTES } from '@/constants/routes';

export default function InviteRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  // Step 1 = Form, Step 2 = OTP Verification, Step 3 = Success
  const [step, setStep] = useState(1);

  // Validation & token state
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [invitationData, setInvitationData] = useState(null);

  // Form Fields per FRD Sec. 4
  const [centreName, setCentreName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Fields
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [resendingOtp, setResendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Request new sign-up link state
  const [requestEmail, setRequestEmail] = useState('');
  const [requestingNew, setRequestingNew] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');
  const [requestError, setRequestError] = useState('');

  const handleRequestNewLink = async (e) => {
    e.preventDefault();
    setRequestError('');
    setRequestSuccess('');
    if (!requestEmail.trim()) {
      setRequestError('Please enter your Centre Official Email.');
      return;
    }
    setRequestingNew(true);
    try {
      const res = await apiClient.post(ENDPOINTS.AUTH.REQUEST_NEW_INVITE, {
        email: requestEmail.trim().toLowerCase(),
      });
      if (res && res.success) {
        setRequestSuccess(
          res.data?.message ||
            'A fresh 72-hour sign-up link has been generated and dispatched to your email and WhatsApp mobile number.'
        );
      } else {
        setRequestError(res?.message || 'Failed to request new sign-up link.');
      }
    } catch (err) {
      setRequestError(err.data?.error?.message || err.message || 'Unable to request sign-up link.');
    } finally {
      setRequestingNew(false);
    }
  };

  // 1. Validate 72-hour invite link on mount
  useEffect(() => {
    if (!token) {
      setValidatingToken(false);
      setTokenValid(false);
      setTokenError('Invitation token is missing from the link. Please use the complete link sent to your email/WhatsApp.');
      return;
    }

    apiClient
      .get(ENDPOINTS.AUTH.VALIDATE_INVITE(token))
      .then((res) => {
        if (res && res.success && res.data?.valid) {
          setTokenValid(true);
          setInvitationData(res.data);
          if (res.data.email) setEmail(res.data.email);
          if (res.data.mobileNumber || res.data.whatsappMobile) {
            setMobileNumber(res.data.mobileNumber || res.data.whatsappMobile);
          }
        } else {
          setTokenValid(false);
          setTokenError(res?.message || 'This invitation link is invalid or has expired (72-hour limit).');
        }
      })
      .catch((err) => {
        setTokenValid(false);
        setTokenError(err.data?.error?.message || err.message || 'Invitation link is invalid or expired.');
      })
      .finally(() => {
        setValidatingToken(false);
      });
  }, [token]);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Step 1: Submit Registration Form
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!centreName.trim()) {
      setFormError('Centre Name (As per Document) is required.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.length !== 10) {
      setFormError('Valid 10-digit WhatsApp Mobile Number is required.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setFormError('Valid official Centre Email ID is required.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setFormError('You must accept the OECM Terms and Conditions to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post(ENDPOINTS.AUTH.REGISTER_FROM_INVITE, {
        token,
        centreName: centreName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        termsAccepted,
      });

      if (res && res.success) {
        if (res.data?.requiresOtp) {
          setStep(2);
          setCountdown(60);
          setSuccessMessage('Registration initiated! Please enter the 6-digit OTP sent to your WhatsApp mobile.');
        } else {
          setStep(3);
        }
      } else {
        setFormError(res?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setFormError(err.data?.error?.message || err.message || 'Failed to submit centre registration.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!mobileOtp.trim() || mobileOtp.length !== 6) {
      setFormError('Please enter the valid 6-digit WhatsApp Mobile OTP.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post(ENDPOINTS.AUTH.VERIFY_INVITE_OTP, {
        token,
        otpType: 'MOBILE',
        otpCode: mobileOtp.trim(),
      });

      if (res && res.success) {
        setStep(3);
      } else {
        setFormError(res?.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err) {
      setFormError(err.data?.error?.message || err.message || 'OTP verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || resendingOtp) return;
    setResendingOtp(true);
    setFormError('');

    try {
      const res = await apiClient.post(ENDPOINTS.AUTH.RESEND_INVITE_OTP, {
        token,
        otpType: 'MOBILE',
      });
      if (res && res.success) {
        setCountdown(60);
        setSuccessMessage('New OTP sent to your WhatsApp number.');
      } else {
        setFormError(res?.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setFormError(err.data?.error?.message || err.message || 'Unable to resend OTP.');
    } finally {
      setResendingOtp(false);
    }
  };

  // ── Render Token Validating State ──
  if (validatingToken) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 14 }}>
        <Loader2 size={36} className="animate-spin" color="var(--color-primary, #2563eb)" />
        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
          Validating 72-hour Centre Invitation Token...
        </div>
      </div>
    );
  }

  // ── Render Token Invalid / Expired State ──
  if (!tokenValid) {
    return (
      <div className="card" style={{ maxWidth: 540, margin: '60px auto', padding: 32, textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--color-danger, #dc2626)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 10px', color: 'var(--text-primary)' }}>
          Sign-Up Link Expired or Invalid (FRD Sec. 4.1)
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px' }}>
          {tokenError}
        </p>

        {/* Request New Sign-Up Link Section */}
        <div
          style={{
            marginTop: 10,
            marginBottom: 24,
            padding: 20,
            borderRadius: 8,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#1e40af' }}>
            <RefreshCw size={16} />
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>
              Request Fresh 72-Hour Sign-Up Link
            </h4>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
            Per FRD Section 4.1, registration links expire after 72 hours. Enter your official centre email below to dispatch a fresh sign-up link.
          </p>

          {requestError && (
            <div style={{ padding: '8px 12px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: '0.8125rem', marginBottom: 12 }}>
              {requestError}
            </div>
          )}
          {requestSuccess && (
            <div style={{ padding: '8px 12px', borderRadius: 6, background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', fontSize: '0.8125rem', marginBottom: 12 }}>
              {requestSuccess}
            </div>
          )}

          {!requestSuccess ? (
            <form onSubmit={handleRequestNewLink} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email"
                className="form-control"
                placeholder="official@institution.edu.in"
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={requestingNew}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {requestingNew ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {requestingNew ? 'Dispatching New Link...' : 'Request New Sign-Up Link'}
              </button>
            </form>
          ) : (
            <div style={{ fontSize: '0.8125rem', color: '#15803d' }}>
              ✓ Link dispatched to your email and WhatsApp mobile. Please check your inbox.
            </div>
          )}
        </div>

        <Link to={ROUTES.LOGIN} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Return to Login
        </Link>
      </div>
    );
  }

  // ── Render Step 3: Success Screen ──
  if (step === 3) {
    return (
      <div className="card" style={{ maxWidth: 520, margin: '60px auto', padding: 36, textAlign: 'center' }}>
        <CheckCircle2 size={52} color="var(--color-success, #16a34a)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 10px', color: 'var(--text-primary)' }}>
          Centre Account Verified & Activated!
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px' }}>
          Your centre user account has been successfully verified. You can now log in using your registered credentials to complete your <strong>My Centre Profile</strong> dossier.
        </p>
        <Link
          to={ROUTES.LOGIN}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px' }}
        >
          Proceed to Login <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '40px auto', padding: '0 16px' }}>
      <div className="card" style={{ padding: 32 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--color-primary-bg, #eff6ff)',
              color: 'var(--color-primary, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            {step === 1 ? <Building2 size={26} /> : <KeyRound size={26} />}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            {step === 1 ? 'Centre User Registration' : 'Verify Mobile OTP'}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
            {step === 1
              ? 'Enter your legal centre credentials to activate your venue portal.'
              : `Enter the 6-digit verification code sent via WhatsApp to ${mobileNumber}.`}
          </p>
        </div>

        {/* Error Alert */}
        {formError && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md, 6px)',
              background: 'var(--color-danger-bg, #fef2f2)',
              border: '1px solid var(--color-danger-border, #fca5a5)',
              color: 'var(--color-danger, #b91c1c)',
              fontSize: '0.8125rem',
              marginBottom: 18,
            }}
          >
            {formError}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md, 6px)',
              background: 'var(--color-success-bg, #f0fdf4)',
              border: '1px solid var(--color-success-border, #86efac)',
              color: 'var(--color-success, #15803d)',
              fontSize: '0.8125rem',
              marginBottom: 18,
            }}
          >
            {successMessage}
          </div>
        )}

        {/* ── STEP 1: Registration Form (FRD Sec. 4) ── */}
        {step === 1 && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="centreName">
                Centre Name (As per Document) <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="centreName"
                type="text"
                className="form-control"
                value={centreName}
                onChange={(e) => setCentreName(e.target.value)}
                placeholder="e.g. Cambridge Institute of Technology"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="mobileNumber">
                Centre Mobile Number <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="mobileNumber"
                  type="text"
                  maxLength={10}
                  className="form-control"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit Indian mobile number"
                  required
                />
                <Phone size={15} color="var(--text-muted)" style={{ position: 'absolute', right: 12, top: 12 }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                Valid Indian mobile format + WhatsApp OTP verification.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Centre Email ID <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="official.centre@institution.ac.in"
                  required
                />
                <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', right: 12, top: 12 }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: 10,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: 10,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 4 }}>
              <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                Terms and Conditions Acceptance <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: 3 }}
                  required
                />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  I agree to the <strong style={{ color: 'var(--text-primary)' }}>Terms and Conditions</strong> and accept to abide by the examination venue code of conduct, confidential operational guidelines, and portal security compliance standards.
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 10,
                padding: '11px',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Registering...
                </>
              ) : (
                <>
                  Continue to Verification <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ── STEP 2: Mobile OTP Verification ── */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="mobileOtp">
                Enter 6-Digit WhatsApp OTP
              </label>
              <input
                id="mobileOtp"
                type="text"
                maxLength={6}
                className="form-control"
                value={mobileOtp}
                onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit OTP"
                style={{ textAlign: 'center', letterSpacing: 8, fontSize: '1.25rem', fontWeight: 700 }}
                autoFocus
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Didn&apos;t receive code?</span>
              {countdown > 0 ? (
                <span style={{ color: 'var(--text-muted)' }}>Resend in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-link btn-xs"
                  onClick={handleResendOtp}
                  disabled={resendingOtp}
                  style={{ textDecoration: 'none', fontWeight: 600 }}
                >
                  {resendingOtp ? 'Resending...' : 'Resend WhatsApp OTP'}
                </button>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 6,
                padding: '11px',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Verifying OTP...
                </>
              ) : (
                <>
                  Verify OTP & Activate Account <ShieldCheck size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
