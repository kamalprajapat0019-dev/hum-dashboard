import React from 'react';
import { Building2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export function ClientKpiCards({
  summary = { totalClients: 0, activeClients: 0, inactiveClients: 0 },
  summaryLoading = false,
  summaryError = null,
  onRetry,
}) {
  return (
    <>
      {summaryError && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#991b1b',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} color="#ef4444" />
            <span>Summary Metrics Error: {summaryError}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn btn-secondary"
              style={{ padding: '4px 12px', fontSize: '0.75rem', height: 'auto', background: '#fee2e2', borderColor: '#fca5a5', color: '#991b1b' }}
            >
              Retry Counts
            </button>
          )}
        </div>
      )}

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {/* Card 1: Total Clients */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">TOTAL CLIENTS</span>
            <div className="kpi-card__icon" style={{ background: '#eff6ff' }}>
              <Building2 size={16} color="#1e40af" />
            </div>
          </div>
          <div className="kpi-card__value">
            {summaryLoading ? '...' : (summary.totalClients ?? 0)}
          </div>
          <div className="kpi-card__sub">
            Registered examination commission authorities
          </div>
        </div>

        {/* Card 2: Active Clients */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">ACTIVE CLIENTS</span>
            <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
              <CheckCircle2 size={16} color="#16a34a" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-success, #16a34a)' }}>
            {summaryLoading ? '...' : (summary.activeClients ?? 0)}
          </div>
          <div className="kpi-card__sub">
            Currently active testing partners
          </div>
        </div>

        {/* Card 3: Inactive Clients */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">INACTIVE CLIENTS</span>
            <div className="kpi-card__icon" style={{ background: '#fef2f2' }}>
              <Clock size={16} color="#dc2626" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-danger, #dc2626)' }}>
            {summaryLoading ? '...' : (summary.inactiveClients ?? 0)}
          </div>
          <div className="kpi-card__sub">
            Dormant or archived client accounts
          </div>
        </div>
      </div>
    </>
  );
}
