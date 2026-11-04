import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, X,
  Clock, Users, Building2, Award, CalendarDays, Sparkles,
  RefreshCw, AlertCircle, Layers, CheckCircle2
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { useClientFilter } from '../../context/ClientContext';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ExamCalendarModal({ onClose }) {
  const { selectedClientId, selectedClient } = useClientFilter();

  const [selectedYear, setSelectedYear] = useState(2027);
  const [viewMode, setViewMode] = useState('year'); // 'year' | 'month'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-indexed
  const [agencyFilter, setAgencyFilter] = useState('All');

  const [exams, setExams] = useState([]);
  const [summary, setSummary] = useState({ totalExams: 0, activeProjects: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inspection state: holds { date, exams: [] }
  const [selectedInspection, setSelectedInspection] = useState(null);

  // Prevent background scrolling and support Escape key
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Load Live Calendar Examinations from Database
  const loadCalendarData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        year: selectedYear,
        ...(selectedClientId ? { clientId: selectedClientId } : {}),
      };

      const res = await apiClient.get(ENDPOINTS.ADMIN.CALENDAR, { params });
      if (res && res.success && res.data) {
        const fetchedExams = res.data.exams || [];
        setExams(fetchedExams);
        setSummary(res.data.summary || {
          totalExams: fetchedExams.length,
          activeProjects: new Set(fetchedExams.map((e) => e.projectId)).size,
        });

        // If an inspection was selected, refresh it from new data
        if (selectedInspection?.date) {
          const updated = fetchedExams.filter((e) => e.date === selectedInspection.date);
          if (updated.length > 0) {
            setSelectedInspection({ date: selectedInspection.date, exams: updated });
          } else {
            setSelectedInspection(null);
          }
        }
      } else {
        setExams([]);
        setSummary({ totalExams: 0, activeProjects: 0 });
      }
    } catch (err) {
      console.error('Failed to load live examination calendar:', err);
      setError(err.data?.error?.message || err.message || 'Unable to synchronize examination calendar');
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedClientId, selectedInspection?.date]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // Filter exams by agency filter if applied
  const filteredExams = exams.filter((ex) => {
    if (agencyFilter !== 'All' && ex.client !== agencyFilter) return false;
    return true;
  });

  // Agency options derived dynamically from database records
  const agencyOptions = ['All', ...Array.from(new Set(exams.map((e) => e.client).filter(Boolean)))];

  // Helper: check if a specific day has exams
  const getExamsForDate = (year, monthIdx, day) => {
    const formatted = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredExams.filter((e) => e.date === formatted);
  };

  // Helper to trigger inspection for a day
  const handleInspectDay = (dateStr, dayExams) => {
    if (dayExams && dayExams.length > 0) {
      setSelectedInspection({ date: dateStr, exams: dayExams });
    }
  };

  // Render Month Grid for Year View
  const renderMonthGrid = (year, monthIdx) => {
    const firstDay = new Date(year, monthIdx, 1).getDay(); // 0 = Sunday
    const totalDays = new Date(year, monthIdx + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }

    const monthExams = filteredExams.filter((ex) => {
      const parts = ex.date.split('-');
      return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) - 1 === monthIdx;
    });

    return (
      <div
        key={monthIdx}
        style={{
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 12,
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-sm)',
          cursor: 'pointer',
          transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
        }}
        onClick={() => {
          setSelectedMonth(monthIdx);
          setViewMode('month');
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: 6,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            {MONTH_NAMES[monthIdx]}
          </span>
          {monthExams.length > 0 && (
            <span className="badge badge-purple" style={{ fontSize: '0.625rem' }}>
              {monthExams.length} {monthExams.length > 1 ? 'Sessions' : 'Session'}
            </span>
          )}
        </div>

        {/* Days of week header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 2,
            textAlign: 'center',
            fontSize: '0.625rem',
            color: 'var(--text-muted)',
            marginBottom: 4,
            fontWeight: 600,
          }}
        >
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dw, i) => (
            <div key={i}>{dw}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {days.map((day, idx) => {
            if (!day) return <div key={idx} style={{ height: 22 }} />;
            const dayExams = getExamsForDate(year, monthIdx, day);
            const hasExam = dayExams.length > 0;
            const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedInspection?.date === dateStr;

            return (
              <div
                key={idx}
                style={{
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6875rem',
                  fontWeight: hasExam ? 700 : 400,
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected
                    ? 'var(--color-primary, #1e40af)'
                    : hasExam
                    ? dayExams[0].color || '#1e40af'
                    : 'transparent',
                  color: hasExam || isSelected ? '#fff' : 'var(--text-primary)',
                  position: 'relative',
                  boxShadow: hasExam ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                  outline: isSelected ? '2px solid var(--color-primary-light, #3b82f6)' : 'none',
                }}
                title={
                  hasExam
                    ? `${day} ${MONTH_NAMES[monthIdx]}: ${dayExams.map((e) => `${e.name} (${e.shift})`).join(', ')}`
                    : ''
                }
                onClick={(e) => {
                  if (hasExam) {
                    e.stopPropagation();
                    handleInspectDay(dateStr, dayExams);
                  }
                }}
              >
                {day}
                {dayExams.length > 1 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#f59e0b',
                      border: '1px solid #fff',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Exam Preview List in Month */}
        {monthExams.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {monthExams.slice(0, 3).map((ex) => (
              <div
                key={ex.id}
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: ex.color || '#1e40af',
                  background: `${ex.color || '#1e40af'}15`,
                  padding: '2px 6px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleInspectDay(ex.date, getExamsForDate(year, monthIdx, parseInt(ex.date.split('-')[2], 10)));
                }}
              >
                <span className="truncate">
                  {ex.date.split('-')[2]}th: {ex.name}
                </span>
                <span style={{ fontSize: '0.625rem', opacity: 0.85, flexShrink: 0, marginLeft: 4 }}>
                  {ex.shift}
                </span>
              </div>
            ))}
            {monthExams.length > 3 && (
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                +{monthExams.length - 3} more sessions
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Sort upcoming chronologically for timeline
  const sortedExams = [...filteredExams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return createPortal(
    <div
      className="calendar-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
    >
      <div className="calendar-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className="calendar-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(30, 64, 175, 0.25)',
                flexShrink: 0,
              }}
            >
              <CalendarDays size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 id="calendar-modal-title" className="modal-title" style={{ fontSize: '1.125rem', margin: 0 }}>
                  Annual Examination Calendar
                </h3>
                <span className="badge badge-purple">
                  {filteredExams.length} Scheduled {filteredExams.length === 1 ? 'Date' : 'Dates'} in {selectedYear}
                </span>
                {selectedClient && (
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(30, 64, 175, 0.1)',
                      color: 'var(--color-primary)',
                      border: '1px solid rgba(30, 64, 175, 0.2)',
                    }}
                  >
                    Client: {selectedClient.name}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Database-synchronized multi-client examination schedule, shift details, and target venues
              </p>
            </div>
          </div>

          <div className="calendar-modal-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Year Switcher */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-full)',
                padding: '3px 8px',
                background: 'var(--bg-subtle)',
              }}
            >
              <button
                className="btn-ghost"
                style={{ padding: 4, borderRadius: '50%' }}
                onClick={() => setSelectedYear((y) => y - 1)}
                title="Previous Year"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', padding: '0 6px', color: 'var(--color-primary)' }}>
                {selectedYear}
              </span>
              <button
                className="btn-ghost"
                style={{ padding: 4, borderRadius: '50%' }}
                onClick={() => setSelectedYear((y) => y + 1)}
                title="Next Year"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div
              style={{
                display: 'inline-flex',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setViewMode('year')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  background: viewMode === 'year' ? 'var(--color-primary)' : 'var(--bg-surface)',
                  color: viewMode === 'year' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Full Year
              </button>
              <button
                onClick={() => setViewMode('month')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  background: viewMode === 'month' ? 'var(--color-primary)' : 'var(--bg-surface)',
                  color: viewMode === 'month' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Month View
              </button>
            </div>

            {/* Refresh Button */}
            <button
              className="btn-ghost"
              onClick={loadCalendarData}
              title="Refresh Calendar"
              style={{ padding: 6, borderRadius: '50%', cursor: 'pointer' }}
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              className="btn-ghost"
              onClick={onClose}
              aria-label="Close examination calendar"
              title="Close"
              style={{ padding: 6, borderRadius: '50%', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="calendar-modal-filterbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter Agency:</span>
            {agencyOptions.map((agency) => (
              <button
                key={agency}
                onClick={() => setAgencyFilter(agency)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: agencyFilter === agency ? 'var(--color-primary)' : 'var(--border-default)',
                  background: agencyFilter === agency ? '#eff6ff' : 'var(--bg-surface)',
                  color: agencyFilter === agency ? 'var(--color-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {agency}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: 12 }}>
            <span>
              Total Scheduled Dates: <strong>{filteredExams.length}</strong>
            </span>
            <span>•</span>
            <span>
              Active Projects: <strong>{summary.activeProjects}</strong>
            </span>
          </div>
        </div>

        {/* Error notification if any */}
        {error && (
          <div
            style={{
              padding: '10px 16px',
              background: '#fee2e2',
              borderBottom: '1px solid #ef4444',
              color: '#991b1b',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadCalendarData}>
              Retry
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="calendar-modal-body">
          {/* Left: Calendar Views */}
          <div className="calendar-modal-main">
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 320,
                  gap: 12,
                  color: 'var(--text-muted)',
                }}
              >
                <RefreshCw size={28} className="animate-spin text-primary" />
                <span style={{ fontSize: '0.875rem' }}>Synchronizing examination dates with database...</span>
              </div>
            ) : viewMode === 'year' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 14,
                }}
              >
                {MONTH_NAMES.map((_, idx) => renderMonthGrid(selectedYear, idx))}
              </div>
            ) : (
              <div>
                {/* Month Navigation */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedMonth((m) => (m === 0 ? 11 : m - 1))}
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                      {MONTH_NAMES[selectedMonth]} {selectedYear}
                    </h2>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedMonth((m) => (m === 11 ? 0 : m + 1))}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>

                  <button className="btn btn-secondary btn-sm" onClick={() => setViewMode('year')}>
                    ‹ Back to Full Year View
                  </button>
                </div>

                {/* Month Calendar Grid */}
                <div
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    background: 'var(--bg-surface)',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      background: 'var(--bg-subtle)',
                      borderBottom: '1px solid var(--border-default)',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      padding: '8px 0',
                    }}
                  >
                    <div><span className="cal-day-full">Sunday</span><span className="cal-day-short">Sun</span></div>
                    <div><span className="cal-day-full">Monday</span><span className="cal-day-short">Mon</span></div>
                    <div><span className="cal-day-full">Tuesday</span><span className="cal-day-short">Tue</span></div>
                    <div><span className="cal-day-full">Wednesday</span><span className="cal-day-short">Wed</span></div>
                    <div><span className="cal-day-full">Thursday</span><span className="cal-day-short">Thu</span></div>
                    <div><span className="cal-day-full">Friday</span><span className="cal-day-short">Fri</span></div>
                    <div><span className="cal-day-full">Saturday</span><span className="cal-day-short">Sat</span></div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {(() => {
                      const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
                      const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                      const cells = [];
                      for (let i = 0; i < firstDay; i++) {
                        cells.push(
                          <div
                            key={`empty_${i}`}
                            className="calendar-month-cell calendar-month-cell--empty"
                            style={{
                              background: 'var(--bg-subtle)',
                              borderBottom: '1px solid var(--border-subtle)',
                              borderRight: '1px solid var(--border-subtle)',
                            }}
                          />
                        );
                      }
                      for (let d = 1; d <= totalDays; d++) {
                        const examsOnDay = getExamsForDate(selectedYear, selectedMonth, d);
                        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const isSelectedDay = selectedInspection?.date === dateStr;

                        cells.push(
                          <div
                            key={`day_${d}`}
                            className="calendar-month-cell"
                            style={{
                              padding: 8,
                              borderBottom: '1px solid var(--border-subtle)',
                              borderRight: '1px solid var(--border-subtle)',
                              background: isSelectedDay
                                ? '#eff6ff80'
                                : examsOnDay.length > 0
                                ? '#f0fdf440'
                                : 'var(--bg-surface)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                              cursor: examsOnDay.length > 0 ? 'pointer' : 'default',
                              outline: isSelectedDay ? '2px solid var(--color-primary)' : 'none',
                            }}
                            onClick={() => {
                              if (examsOnDay.length > 0) {
                                handleInspectDay(dateStr, examsOnDay);
                              }
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: '0.8125rem',
                                  color: examsOnDay.length > 0 ? 'var(--color-primary)' : 'var(--text-secondary)',
                                }}
                              >
                                {d}
                              </span>
                              {examsOnDay.length > 1 && (
                                <span className="badge badge-purple" style={{ fontSize: '0.625rem' }}>
                                  {examsOnDay.length} Sessions
                                </span>
                              )}
                            </div>

                            {/* Render ALL examinations scheduled on this date without overwriting */}
                            {examsOnDay.map((ex) => (
                              <div
                                key={ex.id}
                                style={{
                                  background: ex.color || '#1e40af',
                                  color: '#fff',
                                  padding: '4px 6px',
                                  borderRadius: 4,
                                  fontSize: '0.6875rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  boxShadow: 'var(--shadow-sm)',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInspectDay(dateStr, examsOnDay);
                                }}
                              >
                                <div className="truncate">{ex.name}</div>
                                <div style={{ opacity: 0.88, fontSize: '0.625rem', display: 'flex', gap: 4, marginTop: 1 }}>
                                  <span>{ex.client}</span>
                                  <span>•</span>
                                  <span>{ex.shift}</span>
                                  <span>•</span>
                                  <span>{ex.candidates} cands</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Inspection Panel & Schedule Timeline */}
          <div className="calendar-modal-sidebar">
            {/* Inspection Panel */}
            {selectedInspection && selectedInspection.exams.length > 0 ? (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 16,
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Date Inspection
                    </span>
                    <h4 style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {new Date(selectedInspection.date + 'T00:00:00').toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </h4>
                  </div>
                  <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                    {selectedInspection.exams.length} {selectedInspection.exams.length === 1 ? 'Examination' : 'Examinations'}
                  </span>
                </div>

                {/* Loop through ALL examinations scheduled on this date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 380, overflowY: 'auto' }}>
                  {selectedInspection.exams.map((ex, idx) => (
                    <div
                      key={ex.id || idx}
                      style={{
                        padding: 12,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-subtle, #f8fafc)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                          {ex.projectCode}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span
                            className="badge"
                            style={{
                              background: `${ex.color || '#1e40af'}20`,
                              color: ex.color || '#1e40af',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                            }}
                          >
                            {ex.client}
                          </span>
                          <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                            {ex.stage || ex.status}
                          </span>
                        </div>
                      </div>

                      <h5 style={{ margin: '4px 0 8px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {ex.projectName}
                      </h5>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 8,
                          fontSize: '0.75rem',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: 8,
                        }}
                      >
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Examination Type</span>
                          <div style={{ fontWeight: 600 }}>{ex.examType}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Session / Shift</span>
                          <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{ex.shift}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Timing Window</span>
                          <div style={{ fontWeight: 600 }}>
                            {ex.startTime} – {ex.endTime}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>SLA Status</span>
                          <div style={{ fontWeight: 600 }}>{ex.slaHealth}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Candidate Target</span>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ex.candidates}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Centre Target</span>
                          <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{ex.centres} Centres</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <Sparkles size={26} style={{ margin: '0 auto 8px', color: 'var(--color-primary-light)' }} />
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Examination Date Inspector
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                  Click any highlighted date or session block in the calendar to view full project specifications, shift timings, candidate targets, and centre allocations.
                </div>
              </div>
            )}

            {/* Chronological Schedule List */}
            <div>
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Clock size={14} color="var(--color-primary)" />
                <span>{selectedYear} Chronological Schedule</span>
              </div>

              {sortedExams.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                  }}
                >
                  No examination dates scheduled for {selectedYear}
                  {selectedClient ? ` under ${selectedClient.name}` : ''}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {sortedExams.map((ex) => {
                    const parts = ex.date.split('-');
                    const monthName = MONTH_NAMES[parseInt(parts[1], 10) - 1]?.slice(0, 3);
                    const dayNum = parts[2];
                    const isSelected = selectedInspection?.date === ex.date;

                    return (
                      <div
                        key={ex.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? '#eff6ff' : 'var(--bg-surface)',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--color-primary-light)' : 'var(--border-default)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                        onClick={() => {
                          const examsOnThisDate = sortedExams.filter((e) => e.date === ex.date);
                          handleInspectDay(ex.date, examsOnThisDate);
                        }}
                      >
                        {/* Date Badge */}
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 'var(--radius-md)',
                            background: ex.color || '#1e40af',
                            color: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            lineHeight: 1.1,
                          }}
                        >
                          <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.85 }}>
                            {monthName}
                          </span>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 800 }}>{dayNum}</span>
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-primary)' }}
                            className="truncate"
                          >
                            {ex.name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.6875rem',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              gap: 6,
                              marginTop: 2,
                            }}
                          >
                            <span>{ex.client}</span>
                            <span>•</span>
                            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{ex.shift}</span>
                            <span>•</span>
                            <span>{ex.candidates} cands</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          .calendar-month-cell {
            min-height: 90px;
          }
          .cal-day-short {
            display: none;
          }
          @media (max-width: 640px) {
            .calendar-month-cell {
              min-height: 54px;
              padding: 4px !important;
            }
            .calendar-month-cell--empty {
              min-height: 54px;
            }
            .cal-day-full {
              display: none;
            }
            .cal-day-short {
              display: inline;
            }
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
}
