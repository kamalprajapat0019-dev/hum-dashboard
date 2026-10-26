import React, { useState } from "react";
import { UserRound, LockKeyhole, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import BrandLogo from "./BrandLogo";
import FeatureTile from "./FeatureTile";
import RoleBadge from "./RoleBadge";
import IndiaNetworkMap from "./IndiaNetworkMap";
import "../index.css";

const features = ["Projects", "Centres", "Audits", "Documents", "Finance", "Reports"];
const roles = ["Admin", "PM", "Auditor", "Operations", "Finance", "Centre"];

export default function PortalLoginPage({ onLogin, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your username/email and password to continue.");
      return;
    }
    if (typeof onLogin !== "function") {
      setError("Connect this form to your existing authentication handler.");
      return;
    }
    try {
      setLoading(true);
      await onLogin({ identifier: email.trim(), password, rememberMe });
    } catch (err) {
      setError(err?.message || "Unable to sign in. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="portal-login">
      <div className="portal-login__ambient portal-login__ambient--top" />
      <div className="portal-login__ambient portal-login__ambient--right" />
      <div className="portal-login__content">
        <section className="portal-intro" aria-label="Portal overview">
          <BrandLogo />
          <div className="portal-intro__copy">
            <h1>Operations &amp; Examination<br /><span>Management Portal</span></h1>
            <p>A unified platform to manage projects, centres,<br className="desktop-break" /> bookings, audits, operations and financial workflows<br className="desktop-break" /> for examination operations.</p>
          </div>
          <IndiaNetworkMap />
          <div className="portal-features" aria-label="Portal modules">
            {features.map((feature) => <FeatureTile key={feature} label={feature} />)}
          </div>
        </section>

        <section className="login-card" aria-label="Sign in">
          <div className="login-card__brand"><BrandLogo compact /></div>
          <h2>Welcome Back</h2>
          <p className="login-card__subtitle">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="login-field">
              <UserRound size={23} aria-hidden="true" />
              <span className="sr-only">Username or Email</span>
              <input
                type="text"
                autoComplete="username"
                placeholder="Username or Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="login-field">
              <LockKeyhole size={23} aria-hidden="true" />
              <span className="sr-only">Password</span>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
              </button>
            </label>

            <div className="login-options">
              <label className="remember-option">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Remember me</span>
              </label>
              <button className="text-link" type="button" onClick={onForgotPassword}>Forgot Password?</button>
            </div>

            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="sign-in-button" type="submit" disabled={loading}>
              <span>{loading ? "Signing In..." : "Sign In"}</span><ArrowRight size={24} aria-hidden="true" />
            </button>
          </form>

          <div className="secure-divider"><span /><p><ShieldCheck size={16} /> Secure &amp; Role-Based Access</p><span /></div>
          <div className="role-list" aria-label="Supported access roles">
            {roles.map((role) => <RoleBadge key={role} role={role} />)}
          </div>
        </section>
      </div>
      <div className="portal-waves" aria-hidden="true">
        <svg viewBox="0 0 1600 260" preserveAspectRatio="none">
          {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M-50 ${90 + i * 7} C 210 ${-30 + i * 8}, 380 ${220 + i * 4}, 700 ${110 + i * 6} S 1180 ${-20 + i * 8}, 1660 ${130 + i * 5}`} />)}
        </svg>
      </div>
    </main>
  );
}
