import React from 'react';
import { Users, Shield, Building2, AlertCircle } from 'lucide-react';

export function UserKpiCards({ summary, summaryLoading, summaryError, loadSummary }) {
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
            <span>Summary Cards Error: {summaryError}</span>
          </div>
          <button
            onClick={() => loadSummary()}
            className="btn btn-secondary"
            style={{ padding: '4px 12px', fontSize: '0.75rem', height: 'auto', background: '#fee2e2', borderColor: '#fca5a5', color: '#991b1b' }}
          >
            Retry Counts
          </button>
        </div>
      )}

      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {/* Card 1: Total Users */}
        <div className="kpi-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px' }}>
          <div className="kpi-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="kpi-card__label" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Users
            </span>
            <div style={{ background: '#eff6ff', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#2563eb" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1e293b' }}>
            {summaryLoading ? '—' : summaryError ? '—' : summary.totalUsers}
          </div>
          <div className="kpi-card__sub" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            All existing OEMP accounts (including Admin accounts)
          </div>
        </div>

        {/* Card 2: Internal Users */}
        <div className="kpi-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px' }}>
          <div className="kpi-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="kpi-card__label" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Internal Users
            </span>
            <div style={{ background: '#f5f3ff', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#7c3aed" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ fontSize: '1.875rem', fontWeight: 800, color: '#7c3aed' }}>
            {summaryLoading ? '—' : summaryError ? '—' : summary.internalUsers}
          </div>
          <div className="kpi-card__sub" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            Project Manager, Operations, Auditor, and Accounts
          </div>
        </div>

        {/* Card 3: Centre Users */}
        <div className="kpi-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px' }}>
          <div className="kpi-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="kpi-card__label" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Centre Users
            </span>
            <div style={{ background: '#fffbeb', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} color="#d97706" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ fontSize: '1.875rem', fontWeight: 800, color: '#d97706' }}>
            {summaryLoading ? '—' : summaryError ? '—' : summary.centreUsers}
          </div>
          <div className="kpi-card__sub" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            External venue examination and onboarding accounts
          </div>
        </div>
      </div>
    </>
  );
}
