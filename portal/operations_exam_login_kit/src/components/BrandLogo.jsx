import React from "react";

export default function BrandLogo({ compact = false }) {
  return (
    <div className={`portal-brand ${compact ? "portal-brand--compact" : ""}`}>
      <span className="portal-brand__mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" role="img">
          <path d="M32 4 56 18v28L32 60 8 46V18L32 4Z" fill="#f8fdff" />
          <path d="M32 10 50 20.5 32 31 14 20.5 32 10Z" fill="#08c8ef" />
          <path d="M14 26 32 36.5 50 26v9L32 45.5 14 35v-9Z" fill="#087fc4" />
          <path d="M14 40 32 50.5 50 40v6L32 56.5 14 46v-6Z" fill="#07518a" />
          <path d="M32 10 50 20.5v18L32 49 14 38.5v-18L32 10Z" fill="none" stroke="#dffaff" strokeWidth="1.5" />
        </svg>
      </span>
      <span className="portal-brand__name">Operations &amp; Examination<br />Management Portal</span>
    </div>
  );
}
