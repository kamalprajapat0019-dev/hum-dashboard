import React from 'react';
import { X, Calendar, Building2, Layers, Clock, Users, CheckCircle2, AlertCircle, FolderOpen } from 'lucide-react';
import { StatusBadge } from '@/components/common';

export function ProjectViewModal({
  isOpen,
  onClose,
  viewingProject,
  viewingProjectLoading,
}) {
  if (!isOpen || !viewingProject) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderOpen size={22} color="var(--color-primary)" />
            <div>
              <h3 className="modal-title">{viewingProject.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  background: 'rgba(30, 64, 175, 0.1)',
                  color: 'var(--color-primary)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontWeight: 700
                }}>
                  {viewingProject.projectCode}
                </span>
                <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>
                  {viewingProject.client?.name || 'Associated Client'}
                </span>
                <StatusBadge status={viewingProject.status} />
              </div>
            </div>
          </div>
          <button
            className="btn-ghost"
            onClick={onClose}
            style={{ padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Parameters Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Associated Client</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{viewingProject.client?.fullName || viewingProject.client?.name || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lifecycle Stage</div>
              <div style={{ marginTop: 2 }}>
                <span className="badge badge-info">{viewingProject.stage}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivery Mode</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{viewingProject.examType || 'CBT'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Candidates</div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginTop: 2 }}>
                {Number(viewingProject.candidateTarget || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Coverage Scope</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>
                {viewingProject.citiesCount || 0} cities • {viewingProject.centreTarget || 0} centres
              </div>
            </div>
          </div>

          {/* Description */}
          {viewingProject.description && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Description & Mandate</div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {viewingProject.description}
              </p>
            </div>
          )}

          {/* Multiple Examination Dates View */}
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Configured Examination Dates & Shifts ({viewingProject.examDates?.length || 0})
            </div>
            {(!viewingProject.examDates || viewingProject.examDates.length === 0) ? (
              <div style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 6,
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                textAlign: 'center',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)'
              }}>
                No multi-date shift schedule configured.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                {viewingProject.examDates.map((ed, idx) => (
                  <div
                    key={ed.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 6,
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Calendar size={13} color="var(--color-primary)" />
                      <strong>{new Date(ed.examDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>{ed.shift || 'Shift 1'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ⏱ {ed.startTime || '09:00 AM'} – {ed.endTime || '12:00 PM'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}
