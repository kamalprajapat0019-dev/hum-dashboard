import React from 'react';
import { X, Plus, Calendar, Trash2, Loader2 } from 'lucide-react';

export function DatesShiftsModal({
  isOpen,
  onClose,
  managingExamShifts,
  examDates,
  loadingDates,
  newDateForm,
  setNewDateForm,
  handleAddExamDate,
  handleDeleteExamDate,
  newShiftForm,
  setNewShiftForm,
  handleAddShift,
  handleDeleteShift,
}) {
  if (!isOpen || !managingExamShifts) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 780, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Exam Dates &amp; Shifts Management</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {managingExamShifts.examName} ({managingExamShifts.examCode})
            </p>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Add Date Box */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px',
          }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
              + Schedule New Examination Date
            </div>
            <form onSubmit={handleAddExamDate} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date *</label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={newDateForm.examDate}
                  onChange={e => setNewDateForm({ ...newDateForm, examDate: e.target.value })}
                />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Reporting Time</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 08:00 AM"
                  value={newDateForm.reportingTime}
                  onChange={e => setNewDateForm({ ...newDateForm, reportingTime: e.target.value })}
                />
              </div>
              <div style={{ flex: '1 1 120px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Status</label>
                <select
                  className="form-control"
                  value={newDateForm.status}
                  onChange={e => setNewDateForm({ ...newDateForm, status: e.target.value })}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Postponed">Postponed</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ height: 38 }}>
                <Plus size={13} /> Add Date
              </button>
            </form>
          </div>

          {/* Dates & Shifts List */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 12 }}>
              Scheduled Dates &amp; Daily Shifts ({examDates.length})
            </h4>

            {loadingDates ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 6px', display: 'block' }} />
                Loading dates and shift schedule...
              </div>
            ) : examDates.length === 0 ? (
              <div style={{
                padding: '28px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                border: '1px dashed #cbd5e1',
              }}>
                No examination dates scheduled yet. Use the form above to add test dates.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {examDates.map((dateObj, idx) => (
                  <div
                    key={dateObj.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: '#ffffff',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Date Header */}
                    <div style={{
                      padding: '10px 14px',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #e2e8f0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Calendar size={15} color="var(--color-primary)" />
                        <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          Day {idx + 1}: {new Date(dateObj.examDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </strong>
                        {dateObj.reportingTime && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            (Gate: {dateObj.reportingTime})
                          </span>
                        )}
                        <span className="badge badge-info" style={{ fontSize: '0.625rem' }}>
                          {dateObj.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteExamDate(dateObj.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#dc2626', padding: '2px 6px' }}
                        title="Delete this date"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Shifts for this Date */}
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        {dateObj.shifts && dateObj.shifts.length > 0 ? (
                          dateObj.shifts.map((shift) => (
                            <div
                              key={shift.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                background: '#f8fafc',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                flexWrap: 'wrap',
                                gap: 8,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: 'var(--color-primary-light, #eff6ff)',
                                  color: 'var(--color-primary, #2563eb)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                }}>
                                  Shift {shift.shiftNumber}
                                </span>
                                <strong style={{ fontSize: '0.8125rem' }}>{shift.shiftName}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  ⏱ {shift.startTime} – {shift.endTime}
                                </span>
                                {shift.reportingTime && (
                                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                    (Report: {shift.reportingTime})
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteShift(shift.id)}
                                className="btn btn-ghost btn-sm"
                                style={{ color: '#dc2626', padding: '2px 6px' }}
                                title="Delete Shift"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No shifts configured for this date yet.
                          </span>
                        )}
                      </div>

                      {/* Quick Add Shift Form */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        alignItems: 'center',
                        paddingTop: 8,
                        borderTop: '1px dashed #e2e8f0',
                      }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Shift Name (e.g. Morning Shift)"
                          style={{ flex: '1 1 140px', fontSize: '0.75rem', padding: '4px 8px' }}
                          value={newShiftForm.examDateId === dateObj.id ? newShiftForm.shiftName : ''}
                          onChange={e => setNewShiftForm({
                            ...newShiftForm,
                            examDateId: dateObj.id,
                            shiftName: e.target.value,
                          })}
                        />
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Shift #"
                          min={1}
                          style={{ width: 64, fontSize: '0.75rem', padding: '4px 8px' }}
                          value={newShiftForm.examDateId === dateObj.id ? newShiftForm.shiftNumber : 1}
                          onChange={e => setNewShiftForm({
                            ...newShiftForm,
                            examDateId: dateObj.id,
                            shiftNumber: e.target.value,
                          })}
                        />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Start: 09:00 AM"
                          style={{ width: 110, fontSize: '0.75rem', padding: '4px 8px' }}
                          value={newShiftForm.examDateId === dateObj.id ? newShiftForm.startTime : '09:00 AM'}
                          onChange={e => setNewShiftForm({
                            ...newShiftForm,
                            examDateId: dateObj.id,
                            startTime: e.target.value,
                          })}
                        />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="End: 12:00 PM"
                          style={{ width: 110, fontSize: '0.75rem', padding: '4px 8px' }}
                          value={newShiftForm.examDateId === dateObj.id ? newShiftForm.endTime : '12:00 PM'}
                          onChange={e => setNewShiftForm({
                            ...newShiftForm,
                            examDateId: dateObj.id,
                            endTime: e.target.value,
                          })}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setNewShiftForm(prev => ({ ...prev, examDateId: dateObj.id }));
                            handleAddShift(dateObj.id);
                          }}
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          <Plus size={12} /> Add Shift
                        </button>
                      </div>
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
            className="btn btn-primary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
