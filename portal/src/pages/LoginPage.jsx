import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader } from 'lucide-react';
import { useAuth, DEMO_USERS, ROLE_LABELS, ROLE_COLORS } from '../context/AuthContext';

const ROLE_ROOTS = {
  admin:               '/admin',
  project_manager:     '/pm',
  auditor_it:          '/auditor',
  operations_executive:'/ops',
  accounts_finance:    '/finance',
  centre_user:         '/centre',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password)     { setError('Password is required'); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // Simulate network
    const result = login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    // Get role to redirect
    const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    navigate(ROLE_ROOTS[user?.role] || '/admin', { replace: true });
  };

  const fillDemo = (user) => {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo">OEM</div>
          <h1 className="login-brand-title">Operations &amp; Examination Management Portal</h1>
          <p className="login-brand-sub">
            A unified platform for project management, centre operations, audit compliance,
            and financial governance — purpose-built for large-scale examination delivery.
          </p>
        </div>

        <div className="login-stats">
          {[
            { label: 'Active Projects', value: '4' },
            { label: 'Managed Centres', value: '346' },
            { label: 'Candidates Served', value: '1.2L+' },
          ].map(s => (
            <div key={s.label} className="login-stat">
              <div className="login-stat-value">{s.value}</div>
              <div className="login-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          {/* Header */}
          <div className="login-card__header">
            <div className="login-logo-sm">OEM</div>
            <h2 className="login-card__title">Sign In</h2>
            <p className="login-card__sub">Enter your credentials to access the portal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {error && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={15} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="password">Password</label>
                <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '0', fontSize: '0.75rem', height: 'auto' }}>
                  Forgot password?
                </button>
              </div>
              <div className="input-icon-wrapper">
                <Lock size={15} className="input-icon" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                />
                <button
                  type="button"
                  className="input-eye-btn"
                  onClick={() => setShowPw(s => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 4 }} disabled={loading}>
              {loading ? <><Loader size={14} className="spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Accounts</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {DEMO_USERS.map(u => (
                <button
                  key={u.id}
                  type="button"
                  className="demo-btn"
                  onClick={() => fillDemo(u)}
                  style={{ '--role-color': ROLE_COLORS[u.role] }}
                >
                  <div className="demo-btn__avatar" style={{ background: ROLE_COLORS[u.role] }}>
                    {u.avatar}
                  </div>
                  <div className="demo-btn__info">
                    <span className="demo-btn__name">{ROLE_LABELS[u.role]}</span>
                    <span className="demo-btn__email">{u.email}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }

        .login-page {
          min-height: 100vh;
          display: flex;
        }

        .login-left {
          flex: 1;
          background: var(--sidebar-bg);
          background-image: radial-gradient(ellipse at 20% 80%, #1e3a8a22 0%, transparent 60%),
                            radial-gradient(ellipse at 80% 20%, #0ea5e922 0%, transparent 60%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          position: relative;
          overflow: hidden;
        }

        .login-brand { max-width: 420px; }
        .login-logo {
          width: 52px; height: 52px;
          background: var(--color-primary);
          border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.875rem; font-weight: 800; color: #fff;
          letter-spacing: 0.05em; margin-bottom: 24px;
        }
        .login-brand-title {
          font-size: 1.5rem; font-weight: 700;
          color: #f1f5f9; line-height: 1.3; margin-bottom: 16px;
        }
        .login-brand-sub {
          font-size: 0.9375rem; color: #94a3b8; line-height: 1.6;
        }

        .login-stats {
          display: flex; gap: 32px;
        }
        .login-stat-value {
          font-size: 1.75rem; font-weight: 800; color: #f1f5f9;
        }
        .login-stat-label {
          font-size: 0.75rem; color: #64748b; margin-top: 2px;
        }

        .login-right {
          width: 460px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          padding: 32px 40px;
          background: var(--bg-base);
        }

        .login-card { width: 100%; max-width: 380px; }
        .login-card__header { text-align: center; margin-bottom: 28px; }
        .login-logo-sm {
          width: 40px; height: 40px;
          background: var(--color-primary);
          border-radius: var(--radius-md);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 800; color: #fff;
          margin-bottom: 12px;
        }
        .login-card__title { font-size: 1.375rem; font-weight: 700; color: var(--text-primary); }
        .login-card__sub   { font-size: 0.8125rem; color: var(--text-muted); margin-top: 4px; }

        .login-form { display: flex; flex-direction: column; gap: 16px; }

        .input-icon-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon {
          position: absolute; left: 10px;
          color: var(--text-muted); pointer-events: none;
        }
        .input-eye-btn {
          position: absolute; right: 10px;
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); display: flex; align-items: center;
          padding: 4px;
        }
        .input-eye-btn:hover { color: var(--text-primary); }

        .demo-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }
        .demo-btn:hover {
          border-color: var(--role-color, var(--color-primary));
          background: var(--bg-subtle);
        }
        .demo-btn__avatar {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.6rem; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .demo-btn__info { display: flex; flex-direction: column; min-width: 0; }
        .demo-btn__name {
          font-size: 0.6875rem; font-weight: 600;
          color: var(--text-primary); white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .demo-btn__email {
          font-size: 0.625rem; color: var(--text-muted);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        @media (max-width: 768px) {
          .login-page { flex-direction: column; }
          .login-left { padding: 32px 24px; min-height: auto; }
          .login-stats { gap: 24px; }
          .login-right { width: 100%; padding: 24px 20px; }
        }
      `}</style>
    </div>
  );
}
