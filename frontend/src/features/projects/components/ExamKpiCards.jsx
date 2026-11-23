import React from 'react';
import { BookOpen, CalendarCheck, Users, MapPin, AlertCircle } from 'lucide-react';

export function ExamKpiCards({
  summary = {
    totalExams: 0,
    activeScheduledExams: 0,
    totalCandidateTarget: 0,
    totalCoverage: 0,
  },
  loading = false,
  error = null,
  onRetry,
}) {
  return (
    <>
      {error && (
        <div
          style={{
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
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} color="#ef4444" />
            <span>Examination Metrics Error: {error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn btn-secondary"
              style={{
                padding: '4px 12px',
                fontSize: '0.75rem',
                height: 'auto',
                background: '#fee2e2',
                borderColor: '#fca5a5',
                color: '#991b1b',
              }}
            >
              Retry Counts
            </button>
          )}
        </div>
      )}

      <div
        className="kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Card 1: Total Examinations */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">TOTAL EXAMINATIONS</span>
            <div className="kpi-card__icon" style={{ background: '#eff6ff' }}>
              <BookOpen size={16} color="#1e40af" />
            </div>
          </div>
          <div className="kpi-card__value">
            {loading ? '...' : (summary.totalExams ?? 0)}
          </div>
          <div className="kpi-card__sub">
            Total examination records
          </div>
        </div>

        {/* Card 2: Active / Scheduled */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">ACTIVE / SCHEDULED</span>
            <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
              <CalendarCheck size={16} color="#16a34a" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-success, #16a34a)' }}>
            {loading ? '...' : (summary.activeScheduledExams ?? 0)}
          </div>
          <div className="kpi-card__sub">
            Currently active or scheduled
          </div>
        </div>

        {/* Card 3: Total Candidate Target */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">TOTAL CANDIDATE TARGET</span>
            <div className="kpi-card__icon" style={{ background: '#f5f3ff' }}>
              <Users size={16} color="#7c3aed" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: '#7c3aed' }}>
            {loading ? '...' : Number(summary.totalCandidateTarget || 0).toLocaleString('en-IN')}
          </div>
          <div className="kpi-card__sub">
            Cumulative candidate requirement
          </div>
        </div>

        {/* Card 4: Total Coverage */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">TOTAL COVERAGE</span>
            <div className="kpi-card__icon" style={{ background: '#fffbeb' }}>
              <MapPin size={16} color="#d97706" />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: 'var(--color-warning, #d97706)' }}>
            {loading ? '...' : `${Number(summary.totalCoverage || 0).toLocaleString('en-IN')} Cities`}
          </div>
          <div className="kpi-card__sub">
            Geographic city coverage
          </div>
        </div>
      </div>
    </>
  );
}
