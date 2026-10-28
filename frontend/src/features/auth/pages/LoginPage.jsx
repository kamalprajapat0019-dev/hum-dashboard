/**
 * LoginPage — Operations & Examination Management Portal
 * Visual target: reference.png in operations_exam_login_kit/
 * Auth: existing AuthContext (login, DEMO_USERS, ROLE_LABELS, ROLE_COLORS)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserRound, LockKeyhole, Eye, EyeOff, ArrowRight, ShieldCheck,
  ClipboardList, Building2, FileText, Database,
  ChartNoAxesColumnIncreasing, Crown, BriefcaseBusiness, Settings2,
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '@/context/AuthContext';

/* ── Role root map ────────────────────────────────────────────────── */
const ROLE_ROOTS = {
  admin:                '/admin',
  project_manager:      '/pm',
  auditor_it:           '/auditor',
  operations_executive: '/ops',
  accounts_finance:     '/finance',
  centre_user:          '/centre',
};

/* ── Static data ──────────────────────────────────────────────────── */
const FEATURES = [
  { label: 'Projects',  Icon: ClipboardList },
  { label: 'Centres',   Icon: Building2 },
  { label: 'Audits',    Icon: ShieldCheck },
  { label: 'Documents', Icon: FileText },
  { label: 'Finance',   Icon: Database },
  { label: 'Reports',   Icon: ChartNoAxesColumnIncreasing },
];

const ROLE_BADGES = [
  { label: 'Admin',      role: 'admin',                Icon: Crown,             color: '#f5b942' },
  { label: 'PM',         role: 'project_manager',      Icon: BriefcaseBusiness, color: '#60dcf5' },
  { label: 'Auditor',    role: 'auditor_it',           Icon: ShieldCheck,        color: '#c8e055' },
  { label: 'Operations', role: 'operations_executive', Icon: Settings2,           color: '#60dcf5' },
  { label: 'Finance',    role: 'accounts_finance',     Icon: Database,            color: '#f5a038' },
  { label: 'Centre',     role: 'centre_user',          Icon: Building2,           color: '#60dcf5' },
];

/* ── Portal Logo SVG ─────────────────────────────────────────────── */
function PortalLogo({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ filter: 'drop-shadow(0 4px 10px rgba(2, 132, 199, 0.22))' }}>
      <path d="M32 4 56 18v28L32 60 8 46V18L32 4Z" fill="#ffffff" stroke="#bae6fd" strokeWidth="1.5" />
      <path d="M32 10 50 20.5 32 31 14 20.5 32 10Z" fill="#0284c7" />
      <path d="M14 26 32 36.5 50 26v9L32 45.5 14 35v-9Z" fill="#0369a1" />
      <path d="M14 40 32 50.5 50 40v6L32 56.5 14 46v-6Z" fill="#1e40af" />
      <path d="M32 10 50 20.5v18L32 49 14 38.5v-18Z" fill="none" stroke="#e0f2fe" strokeWidth="1.4" />
    </svg>
  );
}

/* ── India Network Map ───────────────────────────────────────────────
   Production-ready, scalable vector India network map asset
   Location: /images/india-network-map.svg
   Geographically accurate boundary (Survey of India / Composite),
   fill: #024BA0, outline: #008CFF, dot matrix & nodes: #00DFFF,
   with interconnected exam operational routes.
────────────────────────────────────────────────────────────────────── */
function IndiaNetworkMap() {
  return (
    <div className="lp-map-box" aria-hidden="true">
      <img
        src="/images/india-network-map.svg"
        alt="Operations Network Map"
        className="lp-map-img"
        draggable="false"
      />
      {/* Precision hub radar pulse rings calibrated to 1000x1080 SVG viewBox */}
      <svg
        viewBox="0 0 1000 1080"
        className="lp-map-overlay"
        aria-hidden="true"
      >
        {/* Srinagar */}
        <circle cx="248.6" cy="148.2" r="14" className="lp-radar-ring" />
        {/* Delhi */}
        <circle cx="324.5" cy="334.6" r="16" className="lp-radar-ring lp-r-d1" />
        {/* Mumbai */}
        <circle cx="188.1" cy="659.6" r="16" className="lp-radar-ring lp-r-d2" />
        {/* Bengaluru */}
        <circle cx="336.6" cy="867.6" r="16" className="lp-radar-ring lp-r-d3" />
        {/* Kolkata */}
        <circle cx="675.7" cy="540.4" r="16" className="lp-radar-ring lp-r-d4" />
        {/* Guwahati */}
        <circle cx="781.8" cy="418.7" r="14" className="lp-radar-ring lp-r-d2" />
      </svg>
    </div>
  );
}



/* ── Wave lines (bottom decoration) ─────────────────────────────── */
function WaveLines() {
  const strokes = [
    { d: 'M-20,30  C 180,-40  400,110  640, 40  S 1100,-30  1460, 50', op: 0.35, w: 1.4 },
    { d: 'M-20,55  C 200,-20  420,130  660, 60  S 1120,-10  1460, 72', op: 0.28, w: 1.1 },
    { d: 'M-20,78  C 160,  5  380,148  620, 80  S 1080, 10  1460, 94', op: 0.24, w: 0.9 },
    { d: 'M-20,100 C 220, 25  440,165  680,100  S 1140, 30  1460,115', op: 0.20, w: 0.8 },
    { d: 'M-20,120 C 240, 48  460,182  700,118  S 1160, 50  1460,134', op: 0.15, w: 0.7 },
    { d: 'M-20,138 C 260, 68  480,198  720,136  S 1180, 68  1460,152', op: 0.12, w: 0.6 },
    { d: 'M-20,  8  C 140,-58  360, 92  600, 22  S 1060,-50  1460, 28', op: 0.30, w: 1.2 },
    { d: 'M-20,-12  C 120,-78  340, 72  580,  2  S 1040,-70  1460,  8', op: 0.20, w: 0.8 },
  ];

  return (
    <svg
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="wv-glow" x="-5%" y="-100%" width="110%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {strokes.map((s, i) => (
        <path
          key={i}
          d={s.d}
          fill="none"
          stroke="#0284c7"
          strokeWidth={s.w}
          opacity={s.op}
          filter="url(#wv-glow)"
        />
      ))}
    </svg>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [rememberMe,  setRememberMe]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  function handleQuickRoleSelect(roleKey) {
    const match = DEMO_USERS.find(u => u.role === roleKey);
    if (match) {
      setEmail(match.email);
      setPassword(match.password);
      setError('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your username or email.'); return; }
    if (!password)     { setError('Please enter your password.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
      return;
    }
    const roleKey = result.user?.role || 'admin';
    navigate(ROLE_ROOTS[roleKey] || '/admin', { replace: true });
  }

  return (
    <div className="lp-page">
      {/* ── Background corner glows ── */}
      <div className="lp-glow lp-glow-tr" aria-hidden="true" />
      <div className="lp-glow lp-glow-bl" aria-hidden="true" />

      {/* ── Decorative wave lines — bottom ── */}
      <div className="lp-waves" aria-hidden="true">
        <WaveLines />
      </div>

      {/* ════════════════════════════════════
          TWO-COLUMN LAYOUT
          Left 58% | Right 42%
      ════════════════════════════════════ */}
      <div className="lp-cols">

        {/* ═══ LEFT PANEL ═══ */}
        <div className="lp-left">

          {/* Brand — top-left */}
          <div className="lp-brand">
            <img
              src="/horizontal%20logo.png"
              alt="Assessinfra Technology"
              className="lp-brand-logo"
            />
          </div>

          {/* Content area: text & tiles on left, map on right */}
          <div className="lp-hero-area">

            {/* Left stack: Headline, subtitle, and feature tiles */}
            <div className="lp-hero-content">
              <h1 className="lp-h1">
                Operations &amp; Examination<br />
                <span className="lp-cyan">Management Portal</span>
              </h1>
              <p className="lp-desc">
                A unified platform to manage projects, centres,<br />
                bookings, audits, operations and financial workflows<br />
                for examination operations.
              </p>

              {/* Feature tiles — grouped directly below text */}
              <div className="lp-tiles" aria-label="Portal modules">
                {FEATURES.map(({ label, Icon }) => (
                  <div key={label} className="lp-tile">
                    <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* India map — cleanly positioned in the right half of left hero */}
            <div className="lp-map-col" aria-hidden="true">
              <IndiaNetworkMap />
            </div>
          </div>

          {/* Bottom balance spacer */}
          <div className="lp-left-footer-spacer" aria-hidden="true" />
        </div>

        {/* ═══ RIGHT PANEL — Login card ═══ */}
        <div className="lp-right">
          <div className="lp-card" role="main" aria-label="Sign in">

            {/* 1. Logo */}
            <div className="lp-card-logo">
              <img
                src="/vertical%20logo.png"
                alt="Assessinfra Technology"
                className="lp-card-logo-img"
              />
            </div>

            {/* 2. Portal name */}
            <p className="lp-card-name">
              Operations &amp; Examination<br />Management Portal
            </p>

            {/* 3. Welcome heading */}
            <h2 className="lp-card-h2">Welcome Back</h2>

            {/* 4. Subtitle */}
            <p className="lp-card-sub">Sign in to your account to continue</p>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} noValidate>

              {/* 5. Email */}
              <div className="lp-field">
                <UserRound size={18} className="lp-field-icon" aria-hidden="true" />
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="Username or Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  aria-label="Username or Email"
                  required
                />
              </div>

              {/* 6. Password */}
              <div className="lp-field">
                <LockKeyhole size={18} className="lp-field-icon" aria-hidden="true" />
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  aria-label="Password"
                  required
                />
                <button
                  type="button"
                  className="lp-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* 7. Remember me + Forgot password */}
              <div className="lp-options">
                <label className="lp-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    aria-label="Remember me"
                  />
                  <span>Remember me</span>
                </label>
                {/* TODO: wire to /reset-password when backend is ready */}
                <button type="button" className="lp-forgot">Forgot Password?</button>
              </div>

              {/* Error message */}
              {error && (
                <div className="lp-error" role="alert">{error}</div>
              )}

              {/* 8. Sign In button */}
              <button
                type="submit"
                className="lp-submit"
                disabled={loading}
              >
                <span>{loading ? 'Signing In…' : 'Sign In'}</span>
                <ArrowRight size={20} aria-hidden="true" />
              </button>
            </form>

            {/* 9. Divider */}
            <div className="lp-divider" aria-hidden="true">
              <span className="lp-divider-line" />
              <span className="lp-divider-text">
                <ShieldCheck size={13} aria-hidden="true" />
                Secure &amp; Role-Based Access
              </span>
              <span className="lp-divider-line" />
            </div>

            {/* 10. Role badges */}
            <div className="lp-roles" aria-label="Supported access roles">
              {ROLE_BADGES.map(({ label, role: rKey, Icon, color }) => {
                const targetUser = DEMO_USERS.find(u => u.role === rKey);
                const isActive = email && targetUser && targetUser.email.toLowerCase() === email.toLowerCase();
                return (
                  <button
                    key={label}
                    type="button"
                    className={`lp-role ${isActive ? 'lp-role--active' : ''}`}
                    style={{ '--badge-color': color }}
                    onClick={() => handleQuickRoleSelect(rKey)}
                    title={`Click to fill ${label} credentials (${targetUser?.email || ''})`}
                  >
                    <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

          </div>{/* /lp-card */}
        </div>{/* /lp-right */}

      </div>{/* /lp-cols */}

      {/* ── Scoped CSS ── */}
      <style>{`
        /* ─── Reset / base ─── */
        .lp-page *, .lp-page *::before, .lp-page *::after { box-sizing: border-box; }

        /* ─── Page root (Light Enterprise Theme) ─── */
        .lp-page {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          overflow-x: hidden;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          font-family: Inter, "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          color: #0f172a;
          background-color: #f8fafc;
          background-image:
            radial-gradient(ellipse 65% 50% at 85% 18%, rgba(14, 165, 233, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 55% 45% at 20% 75%, rgba(99, 102, 241, 0.10) 0%, transparent 60%),
            radial-gradient(ellipse 45% 40% at  8% 12%, rgba(56, 189, 248, 0.14) 0%, transparent 50%),
            radial-gradient(ellipse 60% 55% at 50% 98%, rgba(14, 165, 233, 0.12) 0%, transparent 55%),
            linear-gradient(155deg, #ffffff 0%, #f8fafc 40%, #f1f5f9 70%, #e2e8f0 100%);
        }

        /* ─── Background corner glows ─── */
        .lp-glow {
          position: absolute; pointer-events: none;
          border-radius: 50%; filter: blur(90px); z-index: 0;
        }
        .lp-glow-tr {
          width: 560px; height: 420px;
          top: -120px; right: -80px;
          background: radial-gradient(ellipse, rgba(14, 165, 233, 0.18), transparent 70%);
        }
        .lp-glow-bl {
          width: 560px; height: 380px;
          bottom: -120px; left: -80px;
          background: radial-gradient(ellipse, rgba(59, 130, 246, 0.12), transparent 70%);
        }

        /* ─── Wave lines ─── */
        .lp-waves {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 32%;
          z-index: 1;
          pointer-events: none;
        }

        /* ─── Two-column layout ─── */
        .lp-cols {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 480px;
          min-height: 100vh;
          width: 100%;
          max-width: 1460px;
          margin: 0 auto;
          padding: 0 48px;
          align-items: center;
          gap: 32px;
          box-sizing: border-box;
        }

        /* ─── LEFT PANEL ─── */
        .lp-left {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 100vh;
          padding: 44px 0 36px;
          position: relative;
        }

        /* Brand — top-left */
        .lp-brand {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .lp-brand-logo {
          height: 58px;
          width: auto;
          max-width: 312px;
          object-fit: contain;
          display: block;
        }

        /* Hero area: Content left, Map right */
        .lp-hero-area {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin: auto 0;
          position: relative;
          width: 100%;
        }

        .lp-hero-content {
          max-width: 480px;
          flex-shrink: 0;
          z-index: 2;
        }

        .lp-h1 {
          font-size: 38px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.8px;
          color: #0f172a;
          margin: 0 0 16px;
          white-space: nowrap;
        }
        .lp-cyan {
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .lp-desc {
          font-size: 14.5px;
          color: #475569;
          line-height: 1.62;
          margin: 0 0 28px;
          max-width: 460px;
        }

        /* Feature tiles */
        .lp-tiles {
          display: flex;
          gap: 10px;
          flex-wrap: nowrap;
          max-width: 480px;
        }
        .lp-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex: 1 1 0;
          min-width: 66px;
          height: 76px;
          padding: 10px 4px 8px;
          border-radius: 14px;
          border: 1px solid rgba(226, 232, 240, 0.95);
          background: rgba(255, 255, 255, 0.75);
          color: #0284c7;
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          box-shadow: 
            0 4px 16px -2px rgba(15, 23, 42, 0.05),
            inset 0 1px 0 #ffffff;
          transition: border-color 0.2s, transform 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .lp-tile:hover {
          border-color: rgba(14, 165, 233, 0.60);
          background: rgba(255, 255, 255, 0.96);
          transform: translateY(-3px);
          box-shadow: 
            0 10px 24px -2px rgba(14, 165, 233, 0.22),
            inset 0 1px 0 #ffffff;
        }
        .lp-tile span {
          font-size: 11px;
          font-weight: 600;
          color: #334155;
          text-align: center;
          white-space: nowrap;
        }

        /* India Map Column */
        .lp-map-col {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          min-width: 0;
        }
        .lp-map-box {
          position: relative;
          width: clamp(320px, 24vw, 440px);
          aspect-ratio: 1000 / 1080;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: -160px;
          margin-left: -50px;
          margin-right: auto;
          background: radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.08) 0%, rgba(37, 99, 235, 0.02) 65%, transparent 100%);
          border-radius: 40px;
        }
        .lp-map-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          user-select: none;
          pointer-events: none;
          filter: drop-shadow(0 18px 36px rgba(2, 43, 97, 0.28)) drop-shadow(0 0 16px rgba(0, 223, 255, 0.25));
          animation: mapFloatGlow 7s ease-in-out infinite alternate;
        }
        .lp-map-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .lp-radar-ring {
          fill: none;
          stroke: #00DFFF;
          stroke-width: 1.8;
          opacity: 0;
          animation: radarPing 3.4s cubic-bezier(0, 0.2, 0.8, 1) infinite;
        }
        .lp-r-d1 { animation-delay: 0.9s; }
        .lp-r-d2 { animation-delay: 1.8s; }
        .lp-r-d3 { animation-delay: 2.7s; }
        .lp-r-d4 { animation-delay: 1.4s; }

        @keyframes radarPing {
          0% { r: 6px; opacity: 0.9; stroke-width: 2.2px; stroke: #ffffff; }
          65% { r: 28px; opacity: 0.2; stroke-width: 0.9px; stroke: #00DFFF; }
          100% { r: 34px; opacity: 0; }
        }

        @keyframes mapFloatGlow {
          0% { filter: drop-shadow(0 14px 28px rgba(2, 43, 97, 0.24)) drop-shadow(0 0 12px rgba(0, 223, 255, 0.20)); }
          100% { filter: drop-shadow(0 22px 42px rgba(2, 43, 97, 0.34)) drop-shadow(0 0 22px rgba(0, 223, 255, 0.35)); }
        }

        .lp-left-footer-spacer {
          height: 20px;
          flex-shrink: 0;
        }

        /* ─── RIGHT PANEL ─── */
        .lp-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 0;
          min-height: 100vh;
        }

        /* ─── LOGIN CARD (Premium 3D Glassmorphism) ─── */
        .lp-card {
          width: 100%;
          max-width: 480px;
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.95);
          background: linear-gradient(168deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 251, 255, 0.88) 45%, rgba(240, 247, 255, 0.82) 100%);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          box-shadow:
            0 2px 4px rgba(15, 23, 42, 0.03),
            0 14px 32px -4px rgba(15, 23, 42, 0.08),
            0 32px 68px -12px rgba(2, 43, 97, 0.16),
            0 0 40px -4px rgba(14, 165, 233, 0.14),
            0 0 0 1px rgba(226, 232, 240, 0.70),
            inset 0 1.5px 1.5px 0 #ffffff,
            inset 1px 0 1px 0 rgba(255, 255, 255, 0.80),
            inset -1px -1px 2px 0 rgba(14, 165, 233, 0.04);
          padding: 32px 36px 26px;
          position: relative;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lp-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 2px 4px rgba(15, 23, 42, 0.04),
            0 18px 40px -4px rgba(15, 23, 42, 0.10),
            0 38px 76px -12px rgba(2, 43, 97, 0.20),
            0 0 48px -4px rgba(14, 165, 233, 0.18),
            0 0 0 1px rgba(186, 230, 253, 0.85),
            inset 0 1.5px 1.5px 0 #ffffff;
        }
        .lp-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1.5px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.95) 20%, rgba(56, 189, 248, 0.80) 50%, rgba(255, 255, 255, 0.95) 80%, transparent 100%);
          z-index: 10;
          pointer-events: none;
        }

        /* 1. Logo */
        .lp-card-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
          position: relative;
        }
        .lp-card-logo::after {
          content: '';
          position: absolute;
          width: 90px;
          height: 75px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .lp-card-logo-img {
          height: 72px;
          width: auto;
          max-width: 120px;
          object-fit: contain;
          display: block;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 4px 12px rgba(2, 75, 160, 0.16));
        }

        /* 2. Portal name */
        .lp-card-name {
          text-align: center;
          font-size: 13.5px;
          font-weight: 600;
          color: #64748b;
          line-height: 1.45;
          margin: 0 0 22px;
        }

        /* 3. Welcome heading */
        .lp-card-h2 {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.7px;
          color: #0f172a;
          margin: 0 0 6px;
          line-height: 1.15;
          text-align: left;
        }

        /* 4. Subtitle */
        .lp-card-sub {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 22px;
          text-align: left;
        }

        /* ─── Form fields (Recessed 3D treatment) ─── */
        .lp-field {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 52px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid rgba(203, 213, 225, 0.85);
          background: linear-gradient(180deg, rgba(241, 245, 249, 0.70) 0%, rgba(248, 250, 252, 0.90) 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          margin-bottom: 13px;
          box-shadow:
            inset 0 2px 4px rgba(15, 23, 42, 0.05),
            inset 0 1px 2px rgba(15, 23, 42, 0.03),
            0 1px 0 rgba(255, 255, 255, 0.90);
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .lp-field:focus-within {
          border-color: #0284c7;
          background: #ffffff;
          box-shadow:
            0 0 0 3px rgba(14, 165, 233, 0.20),
            0 2px 8px rgba(2, 132, 199, 0.10),
            inset 0 1px 1px #ffffff;
        }
        .lp-field-icon { color: #64748b; flex-shrink: 0; }
        .lp-field input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          font: inherit;
          font-size: 14.5px;
          color: #0f172a;
        }
        .lp-field input::placeholder { color: #94a3b8; }
        .lp-field input:disabled { opacity: 0.6; }

        /* 6. Password toggle */
        .lp-pw-toggle {
          display: inline-flex;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 3px;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .lp-pw-toggle:hover { color: #0f172a; }

        /* 7. Options row */
        .lp-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 8px 0 18px;
          font-size: 13.5px;
        }
        .lp-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #475569;
          user-select: none;
        }
        .lp-remember input[type="checkbox"] {
          appearance: none;
          width: 17px;
          height: 17px;
          border: 2px solid #0284c7;
          border-radius: 4px;
          background: transparent;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .lp-remember input[type="checkbox"]:checked {
          background: #0284c7;
          box-shadow: inset 0 0 0 3px #ffffff;
        }
        .lp-forgot {
          background: none;
          border: none;
          cursor: pointer;
          color: #0284c7;
          font: inherit;
          font-size: 13.5px;
          font-weight: 600;
          padding: 0;
        }
        .lp-forgot:hover { color: #0369a1; text-decoration: underline; }

        /* Error */
        .lp-error {
          font-size: 13px;
          color: #dc2626;
          margin: -6px 0 12px;
          padding: 8px 12px;
          background: rgba(254, 242, 242, 0.95);
          border: 1px solid rgba(248, 113, 113, 0.40);
          border-radius: 8px;
        }

        /* 8. Sign In button (Raised 3D elevation) */
        .lp-submit {
          width: 100%;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: none;
          border-radius: 9999px;
          background: linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%);
          color: #ffffff;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          letter-spacing: 0.15px;
          box-shadow: 
            0 6px 20px -2px rgba(2, 132, 199, 0.42), 
            0 2px 6px rgba(29, 78, 216, 0.25),
            inset 0 1.5px 1px rgba(255, 255, 255, 0.40),
            inset 0 -1.5px 2px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s, box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lp-submit:hover:not(:disabled) {
          transform: translateY(-1.5px);
          filter: brightness(1.05);
          box-shadow: 
            0 10px 26px -2px rgba(2, 132, 199, 0.50), 
            0 4px 10px rgba(29, 78, 216, 0.30),
            inset 0 1.5px 1px rgba(255, 255, 255, 0.50);
        }
        .lp-submit:active:not(:disabled) {
          transform: translateY(0.5px);
          box-shadow: 
            0 2px 8px rgba(2, 132, 199, 0.35), 
            inset 0 1.5px 3px rgba(0, 0, 0, 0.20);
        }
        .lp-submit:disabled { opacity: 0.65; cursor: wait; }

        /* 9. Divider */
        .lp-divider {
          display: flex;
          align-items: center;
          gap: 11px;
          margin: 22px 0 16px;
        }
        .lp-divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(203, 213, 225, 0.85), transparent);
        }
        .lp-divider-text {
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
        }

        /* 10. Role badges (Dimensional micro-tiles) */
        .lp-roles {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 7px;
        }
        .lp-role {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 10px 4px 8px;
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.95);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(248, 250, 252, 0.85) 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: var(--badge-color, #0284c7);
          box-shadow:
            0 2px 6px -1px rgba(15, 23, 42, 0.05),
            0 1px 2px rgba(15, 23, 42, 0.03),
            inset 0 1px 0 #ffffff;
          cursor: pointer;
          font-family: inherit;
          transition: border-color 0.2s, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s, background 0.2s;
        }
        .lp-role:hover {
          transform: translateY(-2px);
          border-color: rgba(14, 165, 233, 0.60);
          background: #ffffff;
          box-shadow:
            0 6px 14px -2px rgba(14, 165, 233, 0.20),
            0 2px 4px rgba(15, 23, 42, 0.04),
            inset 0 1px 0 #ffffff;
        }
        .lp-role--active {
          border-color: #0284c7 !important;
          background: rgba(238, 248, 255, 0.96) !important;
          box-shadow:
            0 0 0 2px rgba(2, 132, 199, 0.25),
            0 4px 12px -2px rgba(2, 132, 199, 0.22),
            inset 0 1px 0 #ffffff !important;
          transform: translateY(-1px);
        }
        .lp-role span {
          font-size: 10px;
          font-weight: 600;
          color: #334155;
          white-space: nowrap;
        }

        /* ─── Responsive: Tablet ─── */
        @media (max-width: 1200px) {
          .lp-cols {
            grid-template-columns: minmax(0, 1.25fr) minmax(360px, 420px);
            padding: 0 28px;
            gap: 16px;
          }
          .lp-card { max-width: 420px; padding: 28px 28px 24px; }
          .lp-h1 { font-size: 28px; }
          .lp-map-box { width: clamp(180px, 18vw, 260px); }
          .lp-tile { min-width: 58px; height: 74px; }
        }

        /* ─── Responsive: Small tablet / stacked layout ─── */
        @media (max-width: 960px) {
          .lp-page {
            height: auto;
            min-height: 100vh;
            overflow-y: auto;
          }
          .lp-cols {
            grid-template-columns: 1fr;
            padding: 28px 24px 60px;
            min-height: auto;
            gap: 24px;
          }
          .lp-left {
            min-height: auto;
            padding: 0;
            gap: 16px;
          }
          .lp-hero-area {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .lp-map-col {
            display: none;
          }
          .lp-right {
            min-height: auto;
            justify-content: center;
            padding: 0;
          }
          .lp-card { max-width: 480px; margin: 0 auto; }
          .lp-tiles { flex-wrap: wrap; }
          .lp-tile { flex: 1 1 calc(33.33% - 10px); height: 72px; }
          .lp-waves { height: 20%; }
        }

        /* ─── Responsive: Mobile ─── */
        @media (max-width: 600px) {
          .lp-cols { padding: 20px 16px 60px; gap: 20px; }
          .lp-map-col { display: none; }
          .lp-h1 { font-size: 24px; letter-spacing: -0.6px; white-space: normal; }
          .lp-desc { font-size: 13px; line-height: 1.55; }
          .lp-card { padding: 24px 18px 20px; border-radius: 20px; }
          .lp-card-h2 { font-size: 22px; }
          .lp-submit { font-size: 15px; height: 48px; }
          .lp-roles { grid-template-columns: repeat(3, 1fr); }
          .lp-tile { flex: 1 1 calc(50% - 6px); height: 70px; }
        }

        /* ─── Responsive: Extra-small mobile (320px - 360px) ─── */
        @media (max-width: 360px) {
          .lp-cols { padding: 16px 10px 48px; gap: 14px; }
          .lp-card { padding: 18px 12px 16px; border-radius: 16px; }
          .lp-card-h2 { font-size: 20px; }
          .lp-roles { gap: 4px; }
          .lp-role { padding: 8px 2px 6px; }
          .lp-role span { font-size: 9px; }
          .lp-tile { min-width: 0; }
        }

        /* ─── Focus states (accessibility) ─── */
        .lp-field input:focus-visible,
        .lp-pw-toggle:focus-visible,
        .lp-submit:focus-visible,
        .lp-forgot:focus-visible,
        .lp-remember input[type="checkbox"]:focus-visible {
          outline: 2px solid #0284c7;
          outline-offset: 2px;
        }

        /* ─── Reduced motion ─── */
        @media (prefers-reduced-motion: reduce) {
          .lp-page *, .lp-page *::before, .lp-page *::after {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
