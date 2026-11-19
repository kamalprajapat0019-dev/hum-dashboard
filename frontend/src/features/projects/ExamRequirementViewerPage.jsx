import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, Download, RefreshCw, FileSpreadsheet, Calendar,
  Users, Building2, AlertCircle, Loader2, Search, X, Check,
  CheckCircle2, Clock, MapPin, Database, Layers, Info, ChevronDown, ChevronUp, ShieldCheck
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { StatusBadge } from '@/components/common';
import { safeFormatNumber } from '@/utils/excelRequirementHelper';

function parseExamMeta(exam) {
  if (!exam) return {};
  let meta = {};
  if (typeof exam.description === 'string' && exam.description.trim().startsWith('{')) {
    try {
      meta = JSON.parse(exam.description);
    } catch {
      meta = {};
    }
  } else if (exam.description && typeof exam.description === 'object') {
    meta = exam.description;
  }
  return {
    text: meta.text || exam.description || '',
    lifecycleStage: meta.lifecycleStage || exam.status || 'Scheduled',
    candidateRequiredCount: meta.candidateRequiredCount ?? exam.examType?.project?.candidateTarget ?? 0,
    coverage: meta.coverage ?? exam.examType?.project?.citiesCount ?? 0,
    registrationDesk: meta.registrationDesk || '5.00',
    bufferNodes: meta.bufferNodes || '3.00',
    noOfShifts: meta.noOfShifts || 2,
    manpower: meta.manpower || null,
  };
}

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function ExamRequirementViewerPage({ examId, exam: initialExam, onBack }) {
  const [exam, setExam] = useState(initialExam || null);
  const [sheetData, setSheetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [activeSheetTab, setActiveSheetTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLineage, setShowLineage] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.EXAM_REQUIREMENT_SHEET(examId));
      if (res?.success && res.data) {
        setSheetData(res.data);
        if (res.data.exam) {
          setExam(prev => ({ ...(prev || {}), ...res.data.exam }));
        }
      } else if (res?.data) {
        setSheetData(res.data);
      } else {
        setSheetData({
          hasFile: false,
          message: 'No original Excel requirement sheet is available for this examination.'
        });
      }
    } catch (err) {
      console.error('Failed to load requirement sheet data:', err);
      setError(err.message || 'Failed to retrieve examination requirement sheet from server');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownload = async () => {
    if (!examId) return;
    setDownloading(true);
    try {
      const fileName = sheetData?.metadata?.fileName || `${exam?.examName || 'Examination'}_Requirements.xlsx`;
      await apiClient.downloadBlob(
        ENDPOINTS.ADMIN.EXAM_REQUIREMENT_SHEET_DOWNLOAD(examId),
        fileName
      );
      showToast('Original Excel sheet downloaded successfully!', 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to download Excel file: ' + (err.message || 'File not available on storage'), 'error');
    } finally {
      setDownloading(false);
    }
  };

  const meta = useMemo(() => parseExamMeta(exam), [exam]);
  const summary = sheetData?.summary || null;
  const candidateTarget = summary?.candidateTarget ?? Number(meta.candidateRequiredCount || sheetData?.exam?.candidateTarget || 0);
  const coverageCount = summary?.coverageCount ?? (meta.coverage || sheetData?.exam?.coverage || 0);
  const coverageUnit = summary?.coverageUnit || 'Cities';
  const datesCount = summary?.examinationDateCount ?? (exam?.dates?.length || sheetData?.exam?.datesCount || 0);
  const shiftsCount = summary?.shiftCount ?? (exam?.dates?.reduce((acc, d) => acc + (d.shifts?.length || 0), 0) || sheetData?.exam?.shiftsCount || 0);
  const registrationDeskTolerance = summary?.registrationDeskTolerance ?? parseFloat(meta.registrationDesk || 5);
  const bufferNodesTolerance = summary?.bufferNodesTolerance ?? parseFloat(meta.bufferNodes || 3);
  const bookedCentres = summary?.centresBooked ?? (exam?.bookings?.length || exam?._count?.bookings || 0);

  const activeSheet = useMemo(() => {
    if (!sheetData?.sheets || sheetData.sheets.length === 0) return null;
    return sheetData.sheets[activeSheetTab] || sheetData.sheets[0];
  }, [sheetData, activeSheetTab]);

  // Compute 2-tier header structure and filter data rows
  const { headerTier, row0Structure, row1Structure, dataRows } = useMemo(() => {
    if (!activeSheet || !activeSheet.rawGrid || activeSheet.rawGrid.length === 0) {
      return { headerTier: 1, row0Structure: [], row1Structure: [], dataRows: [] };
    }

    const grid = activeSheet.rawGrid;
    const merges = activeSheet.merges || [];
    const row0 = grid[0] || [];
    const row1 = grid[1] || [];

    // Check if row 0 + row 1 form a 2-tier header (date groups in row 0, shifts in row 1)
    const hasRow0Merges = merges.some(m => m.s && m.s.r === 0 && m.e && m.e.c > m.s.c);
    const hasDatesInRow0 = row0.some(cell => {
      if (!cell) return false;
      const str = String(cell).trim();
      return /\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/.test(str) || /20\d\d/.test(str);
    });

    const isTwoTier = hasRow0Merges || (hasDatesInRow0 && row1.length > 0);

    if (!isTwoTier) {
      // 1-tier header: row 0 is header, row 1+ is data
      const headers = row0.map((col, idx) => ({
        index: idx,
        label: col !== '' && col !== null && col !== undefined ? String(col) : `Col ${idx + 1}`,
      }));

      const rawData = grid.slice(1);
      const filtered = searchQuery.trim()
        ? rawData.filter(r => (Array.isArray(r) ? r : []).some(cell => String(cell || '').toLowerCase().includes(searchQuery.toLowerCase())))
        : rawData;

      return {
        headerTier: 1,
        row0Structure: headers,
        row1Structure: [],
        dataRows: filtered,
      };
    }

    // 2-tier header:
    // Build merge map for row 0
    const mergeMap = {};
    for (const m of merges) {
      if (m.s && m.s.r === 0) {
        mergeMap[m.s.c] = { colSpan: m.e.c - m.s.c + 1, endCol: m.e.c };
      }
    }

    // Fallback: If no explicit merges, detect contiguous dates
    if (Object.keys(mergeMap).length === 0) {
      let currentStart = null;
      for (let c = 0; c < row0.length; c++) {
        const val = String(row0[c] || '').trim();
        if (/\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/.test(val) || /20\d\d/.test(val)) {
          if (currentStart !== null) {
            mergeMap[currentStart.col] = { colSpan: c - currentStart.col, endCol: c - 1 };
          }
          currentStart = { col: c };
        }
      }
      if (currentStart !== null) {
        mergeMap[currentStart.col] = { colSpan: row0.length - currentStart.col, endCol: row0.length - 1 };
      }
    }

    // Build row0 and row1 cells
    const maxCols = Math.max(row0.length, row1.length);
    const r0Cells = [];
    const r1Cells = [];
    let skipUntil = -1;

    for (let c = 0; c < maxCols; c++) {
      if (c <= skipUntil) continue;

      if (mergeMap[c]) {
        const info = mergeMap[c];
        r0Cells.push({
          type: 'dateGroup',
          colIndex: c,
          colSpan: info.colSpan,
          label: row0[c] !== '' && row0[c] !== null && row0[c] !== undefined ? String(row0[c]) : 'Examination Date',
        });
        skipUntil = info.endCol;

        // Collect corresponding shift cells for row 1
        for (let sc = c; sc <= info.endCol; sc++) {
          r1Cells.push({
            colIndex: sc,
            label: row1[sc] !== '' && row1[sc] !== null && row1[sc] !== undefined ? String(row1[sc]) : `Shift ${sc - c + 1}`,
          });
        }
      } else {
        // Fixed column spanning 2 rows
        const colLabel = row1[c] || row0[c] || `Col ${c + 1}`;
        r0Cells.push({
          type: 'fixed',
          colIndex: c,
          rowSpan: 2,
          label: String(colLabel),
        });
      }
    }

    const rawData = grid.slice(2);
    const filtered = searchQuery.trim()
      ? rawData.filter(r => (Array.isArray(r) ? r : []).some(cell => String(cell || '').toLowerCase().includes(searchQuery.toLowerCase())))
      : rawData;

    return {
      headerTier: 2,
      row0Structure: r0Cells,
      row1Structure: r1Cells,
      dataRows: filtered,
    };
  }, [activeSheet, searchQuery]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      minHeight: '100%',
      paddingBottom: 24,
    }}>
      {/* Toast Alert */}
      {toast && (
        <div className={`toast toast-${toast.type}`} style={{ zIndex: 9999 }}>
          {toast.message}
        </div>
      )}

      {/* ── SECTION A: TOP NAVIGATION & EXAMINATION HEADER ───────────────────── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* Navigation Breadcrumb & Back Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: '1px solid #f1f5f9',
        }}>
          <button
            onClick={onBack}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8125rem',
              fontWeight: 600,
              padding: '6px 14px',
            }}
          >
            <ArrowLeft size={16} /> Back to Examinations
          </button>

          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>Project Management</span>
            <span>/</span>
            <span>Examinations</span>
            <span>/</span>
            <strong style={{ color: 'var(--text-primary)' }}>{exam?.examName || 'Examination Details'}</strong>
          </div>
        </div>

        {/* Examination Identity Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#eff6ff',
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FileSpreadsheet size={24} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}>
                  {exam?.examName || 'Examination Profile'}
                </h1>
                <StatusBadge status={meta.lifecycleStage || exam?.status || 'Scheduled'} />
              </div>

              <div style={{
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 14,
              }}>
                <span>
                  Code: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{exam?.examCode || '—'}</strong>
                </span>
                <span>•</span>
                <span>
                  Parent Project: <strong style={{ color: 'var(--text-primary)' }}>{exam?.examType?.project?.name || sheetData?.exam?.project || '—'}</strong>
                </span>
                <span>•</span>
                <span>
                  Client: <strong style={{ color: 'var(--text-primary)' }}>{exam?.examType?.project?.client?.name || sheetData?.exam?.client || '—'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh examination requirement workbook and summary metrics"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: 8,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#991b1b',
          fontSize: '0.875rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadData}
            style={{ background: '#fff', borderColor: '#f87171', color: '#991b1b' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── SECTION B: EXAMINATION SUMMARY CARDS (SINGLE SOURCE OF TRUTH) ───── */}
      <div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
        }}>
          {/* Card 1: Candidate Target */}
          <div style={{
            background: '#ffffff',
            padding: '14px 18px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Candidate Target
              </div>
              {summary?.calculationModel && (
                <span style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: 4, background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                  {summary.calculationModel === 'MODEL_A_LOCATION_LEVEL' || summary.calculationModel === 'MODEL_D_MIXED_WITH_WARNINGS' ? 'Location Target' : 'Shift Sum'}
                </span>
              )}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.375rem', marginTop: 4, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {safeFormatNumber(candidateTarget)}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>

            </div>
          </div>

          {/* Card 2: Coverage */}
          <div style={{
            background: '#ffffff',
            padding: '14px 18px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Coverage
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.375rem', marginTop: 4, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {coverageCount} {coverageUnit}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
              distinct delivery locations
            </div>
          </div>

          {/* Card 3: Schedule Overview */}
          <div style={{
            background: '#ffffff',
            padding: '14px 18px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Schedule Overview
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.375rem', marginTop: 4, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {datesCount} {datesCount === 1 ? 'Date' : 'Dates'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {shiftsCount} active configured shifts
            </div>
          </div>

          {/* Card 4: Registration Desk Tolerance */}
          <div style={{
            background: '#ffffff',
            padding: '14px 18px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Registration Desk
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.375rem', marginTop: 4, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {registrationDeskTolerance}%
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
              desk tolerance ratio
            </div>
          </div>

          {/* Card 5: Buffer Nodes Tolerance */}
          <div style={{
            background: '#ffffff',
            padding: '14px 18px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Buffer Nodes
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.375rem', marginTop: 4, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {bufferNodesTolerance}%
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
              hardware buffer ratio
            </div>
          </div>

          {/* Card 6: Centres Booked */}
          <div style={{
            background: '#ffffff',
            padding: '14px 18px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Centres Booked
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.375rem', marginTop: 4, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {bookedCentres}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
              venues booked &amp; locked
            </div>
          </div>
        </div>

        {/* Audit / Lineage Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 10 }}>
          {summary?.validationWarnings && summary.validationWarnings.length > 0 ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: '0.75rem',
              color: '#92400e',
            }}>
              <AlertCircle size={14} />
              <span>
                <strong>Audit Notice:</strong> {summary.validationWarnings[0]}
              </span>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#059669',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              <CheckCircle2 size={14} />
              <span>Authoritative Aggregation Engine Verified ({summary?.calculationModel || 'Active'})</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowLineage(prev => !prev)}
            className="btn btn-secondary btn-sm"
            style={{
              fontSize: '0.6875rem',
              padding: '3px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              color: 'var(--text-muted)',
            }}
          >
            <Info size={12} />
            <span>Calculation Lineage &amp; Schedule</span>
            {showLineage ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Expandable Lineage Details */}
        {showLineage && summary && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: '0.75rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
            marginTop: 6,
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Calculation Model:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                {summary.calculationModel} (v{summary.ruleVersion})
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginTop: 2 }}>
                {summary.candidateTargetLineage?.definition}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Target Aggregation:</span>
              <div style={{ color: 'var(--text-primary)', marginTop: 2 }}>
                Method: <strong>{summary.candidateTargetLineage?.aggregationMethod}</strong>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginTop: 1 }}>
                Source: {summary.candidateTargetLineage?.sourceField} ({summary.candidateTargetLineage?.recordsIncluded} records included)
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Schedule Breakdown:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {(summary.scheduleBreakdown || []).map(sb => (
                  <span
                    key={sb.examDate}
                    style={{
                      background: '#e0f2fe',
                      color: '#0369a1',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                    }}
                  >
                    {sb.displayDate || sb.examDate}: {sb.shiftsCount} shifts ({sb.shifts.join(', ')})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION C: FULL-PAGE SPREADSHEET PREVIEW WITH COMPACT TOOLBAR ───────── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flex: 1,
        minHeight: 520,
      }}>
        {/* Header & Controls Toolbar (Integrated Metadata + Worksheets + Search + Single Download) */}
        <div style={{
          padding: '10px 18px',
          background: '#f8fafc',
          borderBottom: '1px solid #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          {/* Left: Workbook Info & Worksheets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {sheetData?.hasFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '3px 8px',
                }}>
                  <FileSpreadsheet size={15} color="#059669" />
                  <span>{sheetData.metadata?.fileName || 'Requirement_Sheet.xlsx'}</span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {formatFileSize(sheetData.metadata?.fileSize)}
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Uploaded {formatDateTime(sheetData.metadata?.uploadedAt)}
                </span>
              </div>
            )}

            {/* Worksheet Tabs (if multiple sheets exist) */}
            {Array.isArray(sheetData?.sheets) && sheetData.sheets.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Sheets:
                </span>
                {sheetData.sheets.map((s, idx) => (
                  <button
                    key={s.sheetName || idx}
                    onClick={() => { setActiveSheetTab(idx); setSearchQuery(''); }}
                    className={`btn btn-sm ${activeSheetTab === idx ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.75rem',
                      padding: '3px 10px',
                      fontWeight: activeSheetTab === idx ? 700 : 500,
                      borderRadius: 6,
                    }}
                  >
                    <span>{s.sheetName}</span>
                    <span style={{ opacity: 0.8, fontSize: '0.6875rem', marginLeft: 4 }}>
                      ({s.totalRows} rows)
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Row Count, Search Box & ONE Download Original Excel Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {activeSheet && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Showing <strong>{dataRows.length}</strong> of <strong>{Math.max(0, (activeSheet.totalRows || 0) - (headerTier === 2 ? 2 : 1))}</strong> rows
              </span>
            )}

            <div style={{ position: 'relative', width: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search in sheet..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  fontSize: '0.75rem',
                  paddingLeft: 28,
                  height: 30,
                  borderRadius: 6,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {sheetData?.hasFile && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '5px 14px',
                  borderRadius: 6,
                }}
              >
                {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                Download Original Excel (.xlsx)
              </button>
            )}
          </div>
        </div>

        {/* Main Spreadsheet Grid Body */}
        <div style={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          minHeight: 440,
          maxHeight: 'calc(100vh - 350px)',
          background: '#ffffff',
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)',
              gap: 12,
            }}>
              <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Loading examination requirement workbook...
              </div>
              <div style={{ fontSize: '0.75rem' }}>
                Fetching authentic worksheet structure and cell data from secure storage
              </div>
            </div>
          ) : !sheetData || sheetData.hasFile === false ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 24px',
              textAlign: 'center',
              gap: 12,
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
              }}>
                <FileSpreadsheet size={28} />
              </div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                No original Excel requirement sheet is available for this examination.
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: 460 }}>
                This examination was configured manually or created prior to workbook archiving. Examination parameters and scheduled dates are displayed in the summary cards above.
              </div>
            </div>
          ) : !activeSheet || dataRows.length === 0 && !searchQuery ? (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
            }}>
              This worksheet contains no readable data rows.
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.8125rem',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {/* ── TABLE HEAD WITH HIGH CONTRAST (#E8EEF7 BACKGROUND, #172554 TEXT) ── */}
              <thead>
                {headerTier === 2 ? (
                  <>
                    {/* Row 0: Date Group Banners & Fixed Column Headers */}
                    <tr style={{ height: 44 }}>
                      {/* Top-Left Corner Cell: Sticky in both X and Y */}
                      <th
                        rowSpan={2}
                        style={{
                          position: 'sticky',
                          top: 0,
                          left: 0,
                          zIndex: 30,
                          width: 52,
                          minWidth: 52,
                          background: '#DCE7F6',
                          color: '#172554',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          textAlign: 'center',
                          borderRight: '2px solid #CBD5E1',
                          borderBottom: '2px solid #CBD5E1',
                          padding: '8px 4px',
                          userSelect: 'none',
                        }}
                      >
                        #
                      </th>

                      {row0Structure.map((cell, idx) => {
                        if (cell.type === 'dateGroup') {
                          return (
                            <th
                              key={`r0-${idx}`}
                              colSpan={cell.colSpan}
                              style={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                                background: '#DCE7F6',
                                color: '#172554',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                textAlign: 'center',
                                borderRight: '1px solid #CBD5E1',
                                borderBottom: '1px solid #CBD5E1',
                                padding: '10px 14px',
                                whiteSpace: 'nowrap',
                                letterSpacing: '0.02em',
                              }}
                            >
                              📅 {cell.label}
                            </th>
                          );
                        }

                        // Fixed column spanning row 0 and row 1
                        return (
                          <th
                            key={`r0-${idx}`}
                            rowSpan={cell.rowSpan}
                            style={{
                              position: 'sticky',
                              top: 0,
                              zIndex: 10,
                              background: '#E8EEF7',
                              color: '#172554',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              textAlign: 'left',
                              borderRight: '1px solid #CBD5E1',
                              borderBottom: '2px solid #CBD5E1',
                              padding: '10px 14px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {cell.label}
                          </th>
                        );
                      })}
                    </tr>

                    {/* Row 1: Shift Sub-headers under each Date Group */}
                    <tr style={{ height: 40 }}>
                      {row1Structure.map((shiftCell, idx) => (
                        <th
                          key={`r1-${idx}`}
                          style={{
                            position: 'sticky',
                            top: 44,
                            zIndex: 10,
                            background: '#E8EEF7',
                            color: '#172554',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            borderRight: '1px solid #CBD5E1',
                            borderBottom: '2px solid #CBD5E1',
                            padding: '8px 12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {shiftCell.label}
                        </th>
                      ))}
                    </tr>
                  </>
                ) : (
                  // 1-Tier Header: Single header row
                  <tr style={{ height: 44 }}>
                    <th
                      style={{
                        position: 'sticky',
                        top: 0,
                        left: 0,
                        zIndex: 30,
                        width: 52,
                        minWidth: 52,
                        background: '#DCE7F6',
                        color: '#172554',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textAlign: 'center',
                        borderRight: '2px solid #CBD5E1',
                        borderBottom: '2px solid #CBD5E1',
                        padding: '8px 4px',
                        userSelect: 'none',
                      }}
                    >
                      #
                    </th>
                    {row0Structure.map((h, idx) => (
                      <th
                        key={idx}
                        style={{
                          position: 'sticky',
                          top: 0,
                          zIndex: 10,
                          background: '#E8EEF7',
                          color: '#172554',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          textAlign: 'left',
                          borderRight: '1px solid #CBD5E1',
                          borderBottom: '2px solid #CBD5E1',
                          padding: '10px 14px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                )}
              </thead>

              {/* ── TABLE BODY WITH VISIBLE CELL BORDERS & CONTRAST ── */}
              <tbody>
                {dataRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeSheet.totalCols + 1}
                      style={{
                        padding: '36px 16px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                      }}
                    >
                      No records match your search filter &quot;{searchQuery}&quot;.
                    </td>
                  </tr>
                ) : (
                  dataRows.map((row, rIdx) => {
                    const isEven = rIdx % 2 === 0;
                    return (
                      <tr
                        key={rIdx}
                        style={{
                          background: isEven ? '#ffffff' : '#f8fafc',
                          transition: 'background 0.15s ease',
                          height: 38,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isEven ? '#ffffff' : '#f8fafc'; }}
                      >
                        {/* Sticky Row Number Column on the Left */}
                        <td
                          style={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 5,
                            background: isEven ? '#f8fafc' : '#f1f5f9',
                            color: '#475569',
                            fontWeight: 600,
                            fontSize: '0.6875rem',
                            textAlign: 'center',
                            borderRight: '2px solid #cbd5e1',
                            borderBottom: '1px solid #e2e8f0',
                            userSelect: 'none',
                            padding: '8px 4px',
                          }}
                        >
                          {rIdx + 1}
                        </td>

                        {/* Cell Values with Natural Width and Clear Alignment */}
                        {(Array.isArray(row) ? row : []).map((cell, cIdx) => {
                          const isNumeric = cell !== '' && cell !== null && cell !== undefined && !isNaN(Number(cell));
                          return (
                            <td
                              key={cIdx}
                              style={{
                                padding: '8px 14px',
                                borderRight: '1px solid #e2e8f0',
                                borderBottom: '1px solid #e2e8f0',
                                whiteSpace: 'nowrap',
                                color: '#0f172a',
                                fontWeight: cIdx === 3 ? 600 : 400, // City column bold for easy scanning
                                textAlign: isNumeric ? 'right' : 'left',
                              }}
                            >
                              {cell !== null && cell !== undefined ? String(cell) : ''}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Spreadsheet Footer Status Bar */}
        <div style={{
          padding: '10px 18px',
          background: '#f8fafc',
          borderTop: '1px solid #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}>
          <div>
            Format: <strong>OpenXML Spreadsheet (.xlsx)</strong> · Preserving authentic dates, shifts, and cities
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span>
              Rows: <strong>{dataRows.length}</strong>
            </span>
            <span>•</span>
            <span>
              Columns: <strong>{activeSheet?.totalCols || 0}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
