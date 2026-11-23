import React from 'react';
import { X, Loader2, Calendar, Plus, Trash2 } from 'lucide-react';

const STAGES = [
  'Setup',
  'Scheduling',
  'Centre Allocation',
  'Capacity Planning',
  'In Execution',
  'Post Examination',
  'Closed',
];

export function ProjectFormModal({
  isOpen,
  onClose,
  editingProject,
  projectForm,
  setProjectForm,
  clients = [],
  onSubmit,
  submitting,
  onAddDateRow,
  onRemoveDateRow,
  onDateRowChange,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 680, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {editingProject ? `Edit Project (${projectForm.projectCode})` : 'Setup Examination Project'}
          </h3>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4 }} title="Close">
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="modal-form"
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          <div
            className="modal-body"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              overflowY: 'auto',
              maxHeight: 'calc(92vh - 130px)',
              padding: '16px 20px',
            }}
          >
            {/* Row 1: Project Code & Associated Client */}
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Project Code <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  readOnly
                  placeholder="Auto-generated"
                  value={projectForm.projectCode || ''}
                  style={{
                    background: 'var(--bg-subtle, #f8fafc)',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--color-primary, #1e40af)',
                    cursor: 'not-allowed',
                  }}
                  title="Project Code is automatically generated and read-only"
                />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  Auto-generated sequential code (e.g. PRJ-0001)
                </span>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Associated Client <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>
                </label>
                <select
                  className="form-control"
                  required
                  value={projectForm.clientId || ''}
                  onChange={e => setProjectForm({ ...projectForm, clientId: e.target.value })}
                >
                  <option value="">Select an active client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.fullName ? `(${c.fullName})` : ''} {c.status === 'Inactive' ? '[Inactive]' : ''}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  Mandatory institutional client
                </span>
              </div>
            </div>

            {/* Row 2: Project Title / Name */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Project Title / Name <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Staff Selection Commission GD 2027"
                value={projectForm.name || ''}
                onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
              />
            </div>

            {/* Row 3: Description */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Description (Scope, Objectives, Mandate)</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Scope, objectives, mandate, operational notes..."
                value={projectForm.description || ''}
                onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
              />
            </div>

            {/* Row 4: Financial Year & Primary Exam Type */}
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Financial Year <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>
                </label>
                <select
                  className="form-control"
                  required
                  value={projectForm.financialYear || '2026-2027'}
                  onChange={e => setProjectForm({ ...projectForm, financialYear: e.target.value })}
                >
                  <option value="2027-2028">2027-2028</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Primary Exam Type <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. CBT Examination"
                  value={projectForm.examType || 'CBT Examination'}
                  onChange={e => setProjectForm({ ...projectForm, examType: e.target.value })}
                />
              </div>
            </div>

            {/* Row 5: Examination Schedule & Dates */}
            <div
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                background: 'var(--bg-subtle, #f8fafc)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={16} color="var(--color-primary)" />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Examination Schedule &amp; Dates
                  </span>
                  <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>
                    {projectForm.examDates?.length || 0}{' '}
                    {(projectForm.examDates?.length || 0) === 1 ? 'Date' : 'Dates'} Configured
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onAddDateRow}
                  style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Plus size={13} /> Add Exam Date
                </button>
              </div>

              {!projectForm.examDates || projectForm.examDates.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    background: 'var(--bg-surface, #ffffff)',
                    border: '1px dashed var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                    fontSize: '0.8125rem',
                  }}
                >
                  No examination dates scheduled yet. Click <strong>&quot;Add Exam Date&quot;</strong> above to schedule
                  multiple dates and shifts for this project.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {projectForm.examDates.map((row, idx) => (
                    <div
                      key={row.id || idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.4fr 1.2fr 1fr 1fr auto',
                        gap: 8,
                        alignItems: 'center',
                        background: 'var(--bg-surface, #ffffff)',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      <div>
                        <label
                          style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}
                        >
                          Exam Date *
                        </label>
                        <input
                          type="date"
                          required
                          className="form-control"
                          style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                          value={row.examDate}
                          onChange={e => onDateRowChange(idx, 'examDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <label
                          style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}
                        >
                          Shift *
                        </label>
                        <select
                          className="form-control"
                          style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                          value={row.shift || 'Shift 1'}
                          onChange={e => onDateRowChange(idx, 'shift', e.target.value)}
                        >
                          <option value="Shift 1">Shift 1 (Morning)</option>
                          <option value="Shift 2">Shift 2 (Afternoon)</option>
                          <option value="Shift 3">Shift 3 (Evening)</option>
                          <option value="Single Shift">Single Shift</option>
                          <option value="Shift 4">Shift 4 (Night)</option>
                        </select>
                      </div>
                      <div>
                        <label
                          style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}
                        >
                          Start Time
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="09:00 AM"
                          style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                          value={row.startTime || ''}
                          onChange={e => onDateRowChange(idx, 'startTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <label
                          style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}
                        >
                          End Time
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="12:00 PM"
                          style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                          value={row.endTime || ''}
                          onChange={e => onDateRowChange(idx, 'endTime', e.target.value)}
                        />
                      </div>
                      <div style={{ paddingTop: 14 }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => onRemoveDateRow(idx)}
                          title="Remove exam date"
                          style={{ padding: '4px', color: 'var(--color-danger, #ef4444)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Row 6: Target Metrics (Grid-3) */}
            <div className="grid-3" style={{ gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Candidate Target</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  placeholder="0"
                  value={projectForm.candidateTarget ?? ''}
                  onChange={e => setProjectForm({ ...projectForm, candidateTarget: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Centre Target</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  placeholder="0"
                  value={projectForm.centreTarget ?? ''}
                  onChange={e => setProjectForm({ ...projectForm, centreTarget: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Total Cities / Coverage</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  placeholder="0"
                  value={projectForm.citiesCount ?? ''}
                  onChange={e => setProjectForm({ ...projectForm, citiesCount: e.target.value })}
                />
              </div>
            </div>

            {/* Row 7: Lifecycle Stage & Project Status (Grid-2) */}
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Lifecycle Stage</label>
                <select
                  className="form-control"
                  value={projectForm.stage || 'Setup'}
                  onChange={e => setProjectForm({ ...projectForm, stage: e.target.value })}
                >
                  {STAGES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Project Status</label>
                <select
                  className="form-control"
                  value={projectForm.status || 'Active'}
                  onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="OnHold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Closed">Closed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div
            className="modal-footer"
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={14} style={{ marginRight: 6 }} />
                  Saving...
                </>
              ) : editingProject ? (
                'Save Changes'
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
