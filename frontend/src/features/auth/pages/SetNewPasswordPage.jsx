import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LockKeyhole, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight,
  ShieldCheck, Loader2, Sparkles, Building2
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { ROUTES } from '@/constants/routes';

export default function SetNewPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const token = searchParams.get('token') || '';
  const isActivation = location.pathname.includes('activate');

  // Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Status & Validation State
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [tokenError, setTokenError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verify Token on Mount
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError('Missing secure token in URL. Please use the complete link provided to you.');
      return;
    }

    const endpoint = isActivation
      ? ENDPOINTS.AUTH.VERIFY_INVITATION(token)
      : ENDPOINTS.AUTH.VERIFY_RESET_TOKEN(token);

    apiClient.get(endpoint)
      .then(res => {
        if (res && res.success && res.data?.valid) {
          setTokenValid(true);
          setUserInfo(res.data.user || res.data.invitation || null);
        } else {
          setTokenValid(false);
          setTokenError(res?.message || 'Link is invalid or has expired.');
        }
      })
      .catch(err => {
        setTokenValid(false);
        setTokenError(err.data?.error?.message || err.message || 'Link is invalid or has expired.');
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token, isActivation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = isActivation
        ? ENDPOINTS.AUTH.ACTIVATE_ACCOUNT
        : ENDPOINTS.AUTH.RESET_PASSWORD;

      const res = await apiClient.post(endpoint, {
        token,
        password,
        confirmPassword,
      });

      if (res && res.success) {
        setSuccess(true);
      } else {
        setSubmitError(res?.message || 'Failed to update password. Please try again.');
      }
    } catch (err) {
      setSubmitError(err.data?.error?.message || err.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: 20
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0',
        width: '100%',
        maxWidth: 460,
        overflow: 'hidden'
      }}>
        {/* Top Brand Bar */}
        <div style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: 8,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={26} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#fff' }}>
              {isActivation ? 'Activate Your OEMP Account' : 'Set New Password'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#e0f2fe' }}>
              Operations & Examination Management Portal
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '28px' }}>
          {verifying ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
              <Loader2 size={32} className="animate-spin" color="#0284c7" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600 }}>Verifying secure token...</div>
            </div>
          ) : !tokenValid ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                background: '#fef2f2',
                color: '#dc2626',
                width: 52,
                height: 52,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <AlertCircle size={28} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
                Invalid or Expired Link
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
                {tokenError || 'This link is no longer valid. It may have expired or already been used.'}
              </p>
              <Link to={ROUTES.LOGIN} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Return to Login
              </Link>
            </div>
          ) : success ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                background: '#f0fdf4',
                color: '#16a34a',
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>
                {isActivation ? 'Account Activated Successfully!' : 'Password Updated Successfully!'}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5, marginBottom: 24 }}>
                Your password has been securely saved. You can now access your OECM Portal dashboard.
              </p>
              <Link
                to={ROUTES.LOGIN}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  fontSize: '0.875rem',
                  fontWeight: 700
                }}
              >
                <span>Proceed to Sign In</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Context Info */}
              {userInfo && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Account Identity
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
                    {userInfo.name}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {userInfo.email}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {submitError && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#991b1b',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <AlertCircle size={16} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* New Password */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>New Password</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Min. 8 characters</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Enter your new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ paddingRight: 38 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ paddingRight: 38 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(v => !v)}
                    style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{
                  height: 44,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 6
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving Password...</span>
                  </>
                ) : (
                  <>
                    <span>{isActivation ? 'Activate Account & Set Password' : 'Save New Password'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

