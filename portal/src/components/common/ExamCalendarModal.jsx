import { useState } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, X,
  Clock, MapPin, Users, Building2, Award, Filter, CheckCircle2,
  CalendarDays, Sparkles
} from 'lucide-react';
import { ProjectStore } from '../../services/dataService';

// Default / Comprehensive Master Exam Calendar Data (merged with ProjectStore)
const MASTER_EXAMS = [
  { id: 'ex01', name: 'NEET UG 2026 – Season 1', date: '2026-11-15', client: 'NTA', candidates: '54,000', centres: 180, cities: 24, type: 'CBT Exam', status: 'Execution', color: '#1e40af' },
  { id: 'ex02', name: 'CUET PG 2026 – Phase 1', date: '2026-12-10', client: 'UGC', candidates: '22,000', centres: 80, cities: 12, type: 'CBT Exam', status: 'Doc Verification', color: '#7c3aed' },
  { id: 'ex03', name: 'AIAPGET 2026', date: '2026-12-28', client: 'AICTE', candidates: '9,000', centres: 45, cities: 8, type: 'CBT Exam', status: 'Booking', color: '#0ea5e9' },
  { id: 'ex04', name: 'UGC NET Dec 2026', date: '2026-12-18', client: 'UGC', candidates: '48,000', centres: 160, cities: 20, type: 'CBT Exam', status: 'Planned', color: '#7c3aed' },
  { id: 'ex05', name: 'CSIR NET 2026', date: '2026-11-05', client: 'CSIR', candidates: '18,500', centres: 65, cities: 14, type: 'CBT Exam', status: 'Audit Ready', color: '#16a34a' },
  { id: 'ex06', name: 'JEE Mains 2027 – Session 1', date: '2027-01-22', client: 'NTA', candidates: '36,000', centres: 120, cities: 18, type: 'CBT Exam', status: 'Audit', color: '#1e40af' },
  { id: 'ex07', name: 'GATE 2027 – Engineering Drive', date: '2027-02-06', client: 'IIT/GATE', candidates: '65,000', centres: 210, cities: 32, type: 'CBT Exam', status: 'Pipeline', color: '#d97706' },
  { id: 'ex08', name: 'NEET PG 2025', date: '2025-06-11', client: 'NTA', candidates: '72,000', centres: 220, cities: 30, type: 'CBT Exam', status: 'Closed', color: '#64748b' },
  { id: 'ex09', name: 'JEE Advanced Mock 2026', date: '2026-05-18', client: 'NTA', candidates: '28,000', centres: 95, cities: 16, type: 'CBT Exam', status: 'Completed', color: '#64748b' },
  { id: 'ex10', name: 'CUET UG 2026', date: '2026-06-25', client: 'UGC', candidates: '85,000', centres: 240, cities: 35, type: 'CBT Exam', status: 'Completed', color: '#64748b' },
  { id: 'ex11', name: 'ICAR AIEEA 2026', date: '2026-07-14', client: 'ICAR', candidates: '14,000', centres: 50, cities: 10, type: 'CBT Exam', status: 'Completed', color: '#64748b' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ExamCalendarModal({ onClose }) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [viewMode, setViewMode] = useState('year'); // 'year' | 'month'
  const [selectedMonth, setSelectedMonth] = useState(10); // 0-indexed (10 = November)
  const [clientFilter, setClientFilter] = useState('All');
  const [selectedExam, setSelectedExam] = useState(null);

  // Merge live projects from ProjectStore with Master Exams
  const liveProjects = ProjectStore.getAll();
  const allExams = [...MASTER_EXAMS];

  // If liveProjects has extra projects with exam dates, merge them
  liveProjects.forEach(p => {
    if (p.exam_date && !allExams.some(e => e.name === p.name || e.date === p.exam_date)) {
      allExams.push({
        id: p.id || `prj_${Date.now()}`,
        name: p.name,
        date: p.exam_date,
        client: p.client_name || 'NTA',
        candidates: Number(p.candidate_target || 0).toLocaleString(),
        centres: p.centre_target || 0,
        cities: p.cities || 0,
        type: p.exam_type || 'CBT Exam',
        status: p.stage || p.status || 'Active',
        color: '#1e40af',
      });
    }
  });

  // Filter by year & client
  const yearExams = allExams.filter(ex => {
    if (!ex.date) return false;
    const y = parseInt(ex.date.split('-')[0], 10);
    if (y !== selectedYear) return false;
    if (clientFilter !== 'All' && ex.client !== clientFilter) return false;
    return true;
  });

  // Sort upcoming chronologically
  const sortedExams = [...yearExams].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Client list for filter
  const clientOptions = ['All', ...Array.from(new Set(allExams.map(e => e.client).filter(Boolean)))];

  // Helper: check if a specific day has an exam
  const getExamsForDate = (year, month, day) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allExams.filter(e => e.date === formatted);
  };

  // Helper: generate month calendar grid
  const renderMonthGrid = (year, monthIdx) => {
    const firstDay = new Date(year, monthIdx, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, monthIdx + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }

    const monthExams = yearExams.filter(ex => {
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
          transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
        }}
        onClick={() => {
          setSelectedMonth(monthIdx);
          setViewMode('month');
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 6
        }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            {MONTH_NAMES[monthIdx]}
          </span>
          {monthExams.length > 0 && (
            <span className="badge badge-purple" style={{ fontSize: '0.625rem' }}>
              {monthExams.length} {monthExams.length > 1 ? 'Exams' : 'Exam'}
            </span>
          )}
        </div>

        {/* Days of week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center', fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
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
                  background: hasExam ? (dayExams[0].color || '#1e40af') : 'transparent',
                  color: hasExam ? '#fff' : 'var(--text-primary)',
                  position: 'relative',
                  boxShadow: hasExam ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                }}
                title={hasExam ? `${day} ${MONTH_NAMES[monthIdx]}: ${dayExams.map(e => e.name).join(', ')}` : ''}
                onClick={(e) => {
                  if (hasExam) {
                    e.stopPropagation();
                    setSelectedExam(dayExams[0]);
                  }
                }}
              >
                {day}
              </div>
            );
          })}
        </div>

        {/* Exam Preview List in Month */}
        {monthExams.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {monthExams.map(ex => (
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
                  textOverflow: 'ellipsis'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedExam(ex);
                }}
              >
                {ex.date.split('-')[2]}th: {ex.name}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 1100,
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)'
        }}
      >
        {/* Modal Top Header */}
        <div className="modal-header" style={{ padding: '16px 24px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(30, 64, 175, 0.25)'
            }}>
              <CalendarDays size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 className="modal-title" style={{ fontSize: '1.125rem' }}>Annual Examination Calendar</h3>
                <span className="badge badge-purple">{yearExams.length} Exams in {selectedYear}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Comprehensive multi-agency examination schedule, candidate counts, and venue timelines
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Year Switcher */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-full)',
              padding: '3px 8px',
              background: 'var(--bg-subtle)'
            }}>
              <button
                className="btn-ghost"
                style={{ padding: 4, borderRadius: '50%' }}
                onClick={() => setSelectedYear(y => y - 1)}
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
                onClick={() => setSelectedYear(y => y + 1)}
                title="Next Year"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div style={{ display: 'inline-flex', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('year')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  background: viewMode === 'year' ? 'var(--color-primary)' : 'var(--bg-surface)',
                  color: viewMode === 'year' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
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
                  cursor: 'pointer'
                }}
              >
                Month View
              </button>
            </div>

            <button className="btn-ghost" onClick={onClose} style={{ padding: 6, borderRadius: '50%' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{
          padding: '10px 24px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Filter Agency:
            </span>
            {clientOptions.map(cl => (
              <button
                key={cl}
                onClick={() => setClientFilter(cl)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: clientFilter === cl ? 'var(--color-primary)' : 'var(--border-default)',
                  background: clientFilter === cl ? '#eff6ff' : 'var(--bg-surface)',
                  color: clientFilter === cl ? 'var(--color-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {cl}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Showing <strong>{yearExams.length}</strong> scheduled exam drives for {selectedYear}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left: Full Calendar Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {viewMode === 'year' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14
              }}>
                {MONTH_NAMES.map((_, idx) => renderMonthGrid(selectedYear, idx))}
              </div>
            )}

            {viewMode === 'month' && (
              <div>
                {/* Month Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedMonth(m => (m === 0 ? 11 : m - 1))}
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                      {MONTH_NAMES[selectedMonth]} {selectedYear}
                    </h2>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedMonth(m => (m === 11 ? 0 : m + 1))}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>

                  <button className="btn btn-secondary btn-sm" onClick={() => setViewMode('year')}>
                    ‹ Back to Full Year View
                  </button>
                </div>

                {/* Big Month Day Grid */}
                <div style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  background: 'var(--bg-surface)'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    background: 'var(--bg-subtle)',
                    borderBottom: '1px solid var(--border-default)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    padding: '8px 0'
                  }}>
                    <div>Sunday</div>
                    <div>Monday</div>
                    <div>Tuesday</div>
                    <div>Wednesday</div>
                    <div>Thursday</div>
                    <div>Friday</div>
                    <div>Saturday</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {(() => {
                      const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
                      const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                      const cells = [];
                      for (let i = 0; i < firstDay; i++) {
                        cells.push(<div key={`empty_${i}`} style={{ minHeight: 90, background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }} />);
                      }
                      for (let d = 1; d <= totalDays; d++) {
                        const examsOnDay = getExamsForDate(selectedYear, selectedMonth, d);
                        cells.push(
                          <div
                            key={`day_${d}`}
                            style={{
                              minHeight: 90,
                              padding: 8,
                              borderBottom: '1px solid var(--border-subtle)',
                              borderRight: '1px solid var(--border-subtle)',
                              background: examsOnDay.length > 0 ? '#eff6ff30' : 'var(--bg-surface)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4
                            }}
                          >
                            <span style={{
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              color: examsOnDay.length > 0 ? 'var(--color-primary)' : 'var(--text-secondary)'
                            }}>
                              {d}
                            </span>
                            {examsOnDay.map(ex => (
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
                                  boxShadow: 'var(--shadow-sm)'
                                }}
                                onClick={() => setSelectedExam(ex)}
                              >
                                <div className="truncate">{ex.name}</div>
                                <div style={{ opacity: 0.85, fontSize: '0.625rem' }}>{ex.client} • {ex.centres} centres</div>
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

          {/* Right: Selected Exam Details & Timeline */}
          <div style={{
            width: 340,
            borderLeft: '1px solid var(--border-default)',
            background: 'var(--bg-subtle)',
            padding: 18,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            {/* Selected Exam Card */}
            {selectedExam ? (
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
                boxShadow: 'var(--shadow-md)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>{selectedExam.client}</span>
                  <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>{selectedExam.status}</span>
                </div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: 8, color: 'var(--text-primary)' }}>
                  {selectedExam.name}
                </h4>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  marginTop: 6
                }}>
                  <CalendarIcon size={14} />
                  <span>Exam Date: {selectedExam.date}</span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginTop: 14,
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 12,
                  fontSize: '0.75rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Candidates</span>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {selectedExam.candidates}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Target Centres</span>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary)' }}>
                      {selectedExam.centres}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Total Cities</span>
                    <div style={{ fontWeight: 600 }}>{selectedExam.cities} Cities</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Exam Mode</span>
                    <div style={{ fontWeight: 600 }}>{selectedExam.type}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px dashed var(--border-strong)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <Sparkles size={24} style={{ margin: '0 auto 6px', color: 'var(--color-primary-light)' }} />
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Exam Inspection
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: 2 }}>
                  Click any highlighted date or card in the calendar to view full examination details.
                </div>
              </div>
            )}

            {/* Chronological Schedule List */}
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="var(--color-primary)" />
                <span>{selectedYear} Schedule Timeline</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sortedExams.map(ex => {
                  const parts = ex.date.split('-');
                  const monthName = MONTH_NAMES[parseInt(parts[1], 10) - 1]?.slice(0, 3);
                  const dayNum = parts[2];
                  const isSelected = selectedExam?.id === ex.id;

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
                        transition: 'all var(--transition-fast)'
                      }}
                      onClick={() => setSelectedExam(ex)}
                    >
                      {/* Date Badge */}
                      <div style={{
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
                        lineHeight: 1.1
                      }}>
                        <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.85 }}>{monthName}</span>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 800 }}>{dayNum}</span>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-primary)' }} className="truncate">
                          {ex.name}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'flex', gap: 6, marginTop: 2 }}>
                          <span>{ex.client}</span>
                          <span>•</span>
                          <span>{ex.candidates} cands</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
