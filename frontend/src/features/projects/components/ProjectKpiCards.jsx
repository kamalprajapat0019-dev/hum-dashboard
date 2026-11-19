import React from 'react';
import { FolderOpen, Users } from 'lucide-react';

export function ProjectKpiCards({
  loading,
  activeProjectsCount = 0,
  totalProjectsCount = 0,
  candidateTentativeCount = 0,
  // Backward compatibility aliases
  totalCandidates,
}) {
  const displayCandidateCount = candidateTentativeCount || totalCandidates || 0;

  return (
    <div
      className="kpi-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 20,
      }}
    >
      {/* 1. Active Projects */}
      <div className="kpi-card">
        <div className="kpi-card__header">
          <span className="kpi-card__label">Active Projects</span>
          <div className="kpi-card__icon" style={{ background: '#eff6ff' }}>
            <FolderOpen size={16} color="#1e40af" />
          </div>
        </div>
        <div className="kpi-card__value">
          {loading ? '...' : `${activeProjectsCount} / ${totalProjectsCount}`}
        </div>
        <div className="kpi-card__sub">
          {activeProjectsCount} of {totalProjectsCount} projects active
        </div>
      </div>

      {/* 2. Candidate Tentative Count */}
      <div className="kpi-card">
        <div className="kpi-card__header">
          <span className="kpi-card__label">Candidate Tentative Count</span>
          <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
            <Users size={16} color="#16a34a" />
          </div>
        </div>
        <div className="kpi-card__value" style={{ color: 'var(--color-success, #16a34a)' }}>
          {loading ? '...' : Number(displayCandidateCount).toLocaleString('en-IN')}
        </div>
        <div className="kpi-card__sub">Tentative candidate allocation</div>
      </div>
    </div>
  );
}
