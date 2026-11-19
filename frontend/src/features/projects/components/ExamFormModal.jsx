import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Loader2,
  Check,
  Upload,
  Download,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Users,
  Plus,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { UniversalExcelEngine } from '@/utils/excelEngine';
import { generateRequirementSample } from '@/utils/excelRequirementHelper';

const TOLERANCE_OPTIONS = [
  '1.00', '2.00', '3.00', '4.00', '5.00',
  '6.00', '7.00', '8.00', '9.00', '10.00'
];

const ALL_MANPOWER_CATEGORIES = [
  { key: 'invigilators', label: 'Invigilators (per nodes)', type: 'ratio', defaultA: '1', defaultB: '20' },
  { key: 'centreManager', label: 'Centre Manager (per venue)', type: 'fixed', defaultVal: '1' },
  { key: 'networkAdmin', label: 'Network Admin / IT Support (per venue)', type: 'fixed', defaultVal: '1' },
  { key: 'bodycamOperator', label: 'Bodycam Operator (per venue)', type: 'fixed', defaultVal: '' },
  { key: 'biometricOperator', label: 'Biometric Operator (per nodes)', type: 'ratio', defaultA: '', defaultB: '' },
  { key: 'securityMale', label: 'Security Male (per nodes)', type: 'ratio', defaultA: '', defaultB: '' },
  { key: 'securityFemale', label: 'Security Female (per nodes)', type: 'ratio', defaultA: '', defaultB: '' },
  { key: 'supportStaff', label: 'Support Staff (per venue)', type: 'fixed', defaultVal: '' },
  { key: 'electrician', label: 'Electrician (per venue)', type: 'fixed', defaultVal: '' },
  { key: 'cctvOperator', label: 'CCTV Operator (per venue)', type: 'fixed', defaultVal: '' },
  { key: 'serverManager', label: 'Server Manager (per nodes)', type: 'ratio', defaultA: '', defaultB: '' },
  { key: 'seniorCentreManager', label: 'Senior Centre Manager (per venue)', type: 'fixed', defaultVal: '' },
  { key: 'registrationDeskManager', label: 'Registration Desk Manager (per nodes)', type: 'ratio', defaultA: '', defaultB: '' },
  { key: 'cleaningStaff', label: 'Cleaning / Sanitation Staff (per venue)', type: 'fixed', defaultVal: '' },
];

export function ExamFormModal({
  isOpen,
  onClose,
  editingExam,
  projects = [],
  examTypes = [],
  onSubmit,
  submitting,
}) {
  // ── 1. Unconditional React Hooks at top level (Rules of Hooks compliant) ──
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [examName, setExamName] = useState('');
  const [status, setStatus] = useState('Scheduled');
  const [registrationDesk, setRegistrationDesk] = useState('5.00');
  const [bufferNodes, setBufferNodes] = useState('3.00');
  const [notes, setNotes] = useState('');

  // Manpower State
  const [manpowerExpanded, setManpowerExpanded] = useState(false);
  const [manpowerTouched, setManpowerTouched] = useState(false);
  const [ratios, setRatios] = useState({
    invigilatorsA: '1',
    invigilatorsB: '20',
    biometricOperatorA: '',
    biometricOperatorB: '',
    securityMaleA: '',
    securityMaleB: '',
    securityFemaleA: '',
    securityFemaleB: '',
    serverManagerA: '',
    serverManagerB: '',
    registrationDeskManagerA: '',
    registrationDeskManagerB: '',
  });

  const [fixedCounts, setFixedCounts] = useState({
    centreManager: '1',
    networkAdmin: '1',
    bodycamOperator: '',
    supportStaff: '',
    electrician: '',
    cctvOperator: '',
    seniorCentreManager: '',
    cleaningStaff: '',
  });

  // Excel Requirement Sheet Upload & Dynamic Preview State
  const [parsingSheet, setParsingSheet] = useState(false);
  const [uploadedFileMeta, setUploadedFileMeta] = useState(null);
  const [parsedPreview, setParsedPreview] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [formValidationErrors, setFormValidationErrors] = useState([]);
  const fileInputRef = useRef(null);

  // Synchronize state when editingExam changes or modal opens
  useEffect(() => {
    if (editingExam) {
      let meta = {};
      if (editingExam.description) {
        try {
          meta = JSON.parse(editingExam.description);
          if (typeof meta !== 'object' || meta === null) meta = {};
        } catch {
          meta = {};
        }
      }

      const et = examTypes.find(t => t.id === editingExam.examTypeId);
      setSelectedProjectId(et?.projectId || editingExam.examType?.projectId || projects[0]?.id || '');
      setExamName(editingExam.examName || '');
      setStatus(editingExam.status || 'Scheduled');
      setRegistrationDesk(meta.registrationDesk !== undefined ? Number(meta.registrationDesk).toFixed(2) : '5.00');
      setBufferNodes(meta.bufferNodes !== undefined ? Number(meta.bufferNodes).toFixed(2) : '3.00');
      setNotes(meta.notes || meta.text || '');

      // Load saved manpower
      const mp = meta.manpower || {};
      const parseRatio = (r) => {
        if (!r || typeof r !== 'string') return ['', ''];
        const parts = r.split(':');
        return [parts[0]?.trim() || '', parts[1]?.trim() || ''];
      };

      const [invA, invB] = parseRatio(mp.invigilatorsRatio || '1:20');
      const [bioA, bioB] = parseRatio(mp.biometricOperatorRatio);
      const [secMA, secMB] = parseRatio(mp.securityMaleRatio);
      const [secFA, secFB] = parseRatio(mp.securityFemaleRatio);
      const [srvA, srvB] = parseRatio(mp.serverManagerRatio);
      const [rdmA, rdmB] = parseRatio(mp.registrationDeskManagerRatio);

      setRatios({
        invigilatorsA: invA || '1',
        invigilatorsB: invB || '20',
        biometricOperatorA: bioA,
        biometricOperatorB: bioB,
        securityMaleA: secMA,
        securityMaleB: secMB,
        securityFemaleA: secFA,
        securityFemaleB: secFB,
        serverManagerA: srvA,
        serverManagerB: srvB,
        registrationDeskManagerA: rdmA,
        registrationDeskManagerB: rdmB,
      });

      setFixedCounts({
        centreManager: mp.centreManager || '1',
        networkAdmin: mp.networkAdmin || '1',
        bodycamOperator: mp.bodycamOperator || '',
        supportStaff: mp.supportStaff || '',
        electrician: mp.electrician || '',
        cctvOperator: mp.cctvOperator || '',
        seniorCentreManager: mp.seniorCentreManager || '',
        cleaningStaff: mp.cleaningStaff || '',
      });

      if (meta.manpower && Object.keys(meta.manpower).length > 0) {
        setManpowerTouched(true);
      } else {
        setManpowerTouched(false);
      }
      setManpowerExpanded(false);

      // Existing uploaded sheet preview if available
      if (meta.requirementSheet) {
        setUploadedFileMeta({
          fileName: meta.requirementSheet.fileName,
          fileSize: meta.requirementSheet.fileSize,
          isExisting: true,
        });
        setParsedPreview({
          totalDates: meta.requirementSheet.datesCount || editingExam.dates?.length || 0,
          totalShifts: meta.requirementSheet.shiftsCount || editingExam.dates?.reduce((acc, d) => acc + (d.shifts?.length || 0), 0) || 0,
          totalCandidates: meta.requirementSheet.totalCandidates || meta.candidateRequiredCount || 0,
          totalCities: meta.requirementSheet.totalCities || meta.coverage || 0,
          dateGroups: (editingExam.dates || []).map(d => ({
            dateIso: d.examDate.substring(0, 10),
            displayDate: new Date(d.examDate).toLocaleDateString('en-GB'),
            shifts: (d.shifts || []).map(s => ({
              shiftName: s.shiftName,
              shiftNumber: s.shiftNumber,
            })),
          })),
          blockingErrors: [],
          warnings: [],
        });
      } else if (editingExam.dates?.length > 0) {
        setParsedPreview({
          totalDates: editingExam.dates.length,
          totalShifts: editingExam.dates.reduce((acc, d) => acc + (d.shifts?.length || 0), 0),
          totalCandidates: meta.candidateRequiredCount || 0,
          totalCities: meta.coverage || 0,
          dateGroups: editingExam.dates.map(d => ({
            dateIso: d.examDate.substring(0, 10),
            displayDate: new Date(d.examDate).toLocaleDateString('en-GB'),
            shifts: (d.shifts || []).map(s => ({
              shiftName: s.shiftName,
              shiftNumber: s.shiftNumber,
            })),
          })),
          blockingErrors: [],
          warnings: [],
        });
      } else {
        setUploadedFileMeta(null);
        setParsedPreview(null);
      }
    } else {
      // Default creation state
      setSelectedProjectId(projects[0]?.id || '');
      setExamName('');
      setStatus('Scheduled');
      setRegistrationDesk('5.00');
      setBufferNodes('3.00');
      setNotes('');
      setManpowerExpanded(false);
      setManpowerTouched(false);
      setRatios({
        invigilatorsA: '1',
        invigilatorsB: '20',
        biometricOperatorA: '',
        biometricOperatorB: '',
        securityMaleA: '',
        securityMaleB: '',
        securityFemaleA: '',
        securityFemaleB: '',
        serverManagerA: '',
        serverManagerB: '',
        registrationDeskManagerA: '',
        registrationDeskManagerB: '',
      });
      setFixedCounts({
        centreManager: '1',
        networkAdmin: '1',
        bodycamOperator: '',
        supportStaff: '',
        electrician: '',
        cctvOperator: '',
        seniorCentreManager: '',
        cleaningStaff: '',
      });
      setUploadedFileMeta(null);
      setParsedPreview(null);
      setUploadError(null);
      setFormValidationErrors([]);
    }
  }, [editingExam, isOpen, projects, examTypes]);

  // Check if manpower is completed & valid
  const manpowerValidation = useMemo(() => {
    const errors = [];
    const ratioFieldErrors = {};

    // Check ratios for all ratio-based categories
    for (const cat of ALL_MANPOWER_CATEGORIES.filter(c => c.type === 'ratio')) {
      const a = ratios[`${cat.key}A`];
      const b = ratios[`${cat.key}B`];

      const aFilled = a !== undefined && a !== null && String(a).trim() !== '';
      const bFilled = b !== undefined && b !== null && String(b).trim() !== '';

      if (aFilled || bFilled) {
        if (!aFilled || !bFilled) {
          const err = `Please enter both ratio parts for "${cat.label}" (e.g. 1 : 20).`;
          errors.push(err);
          ratioFieldErrors[cat.key] = err;
        } else {
          const numA = Number(a);
          const numB = Number(b);
          if (isNaN(numA) || numA <= 0 || isNaN(numB) || numB <= 0) {
            const err = `Ratio values for "${cat.label}" must be numbers greater than zero.`;
            errors.push(err);
            ratioFieldErrors[cat.key] = err;
          }
        }
      }
    }

    // Must have at least invigilators ratio or at least one configured staff
    const hasAnyConfig =
      (ratios.invigilatorsA && ratios.invigilatorsB) ||
      Object.values(fixedCounts).some(v => v !== '' && v !== 'none' && v !== null);

    if (!hasAnyConfig) {
      errors.push('Manpower Requirement section is mandatory. Please click "+ Add Manpower" to configure staffing.');
    }

    return {
      isValid: errors.length === 0,
      isConfigured: hasAnyConfig,
      errors,
      ratioFieldErrors,
    };
  }, [ratios, fixedCounts]);

  // Handle Excel Sheet Selection & Parsing
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingSheet(true);
    setUploadError(null);

    try {
      // 1. Parse workbook dynamically using UniversalExcelEngine
      const preview = await UniversalExcelEngine.parse(file);

      // 2. Read base64 buffer for persistence
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result;
          if (typeof res === 'string') {
            const base64 = res.split(',')[1] || res;
            resolve(base64);
          } else {
            resolve('');
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadedFileMeta({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileBufferBase64: base64Data,
      });

      setParsedPreview(preview);
    } catch (err) {
      console.error('Failed to parse uploaded requirement sheet:', err);
      setUploadError(err.message || 'Failed to read or parse examination workbook.');
      setParsedPreview(null);
      setUploadedFileMeta(null);
    } finally {
      setParsingSheet(false);
    }
  };

  const handleClearUploadedFile = () => {
    setUploadedFileMeta(null);
    setParsedPreview(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form Submission Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = [];

    if (!selectedProjectId) {
      errors.push('Please select an Associated Examination Project.');
    }

    if (!examName.trim()) {
      errors.push('Examination Name is required.');
    }

    // Validate manpower (mandatory)
    if (!manpowerTouched && !editingExam) {
      errors.push('Manpower Requirement section is mandatory. Please click "+ Add Manpower" to configure staffing.');
      setManpowerExpanded(true);
    } else if (!manpowerValidation.isValid) {
      errors.push(...manpowerValidation.errors);
      setManpowerExpanded(true); // Automatically expand if error
    }

    // Validate requirement sheet (must have dates & shifts)
    if (!parsedPreview || parsedPreview.totalDates === 0) {
      errors.push('Examination Requirement Sheet with valid dates and shifts is required.');
    } else if (parsedPreview.blockingErrors && parsedPreview.blockingErrors.length > 0) {
      errors.push('Please resolve all blocking errors in the requirement sheet before submitting.');
    }

    if (errors.length > 0) {
      setFormValidationErrors(errors);
      return;
    }

    setFormValidationErrors([]);

    // Auto-map underlying project's examType ID for database schema integrity
    const matchedEt = examTypes.find(et => et.projectId === selectedProjectId);
    const targetExamTypeId = matchedEt ? matchedEt.id : (examTypes[0]?.id || selectedProjectId);

    // Auto-format examCode (EXAM_NAME_YEAR format)
    const normalizedCode = examName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');

    // Extract year from exam name if present, else current year
    const yearMatch = examName.match(/20\d\d/);
    const examYear = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();

    // Assemble manpower payload
    const manpowerPayload = {
      invigilatorsRatio: ratios.invigilatorsA && ratios.invigilatorsB ? `${ratios.invigilatorsA}:${ratios.invigilatorsB}` : null,
      biometricOperatorRatio: ratios.biometricOperatorA && ratios.biometricOperatorB ? `${ratios.biometricOperatorA}:${ratios.biometricOperatorB}` : null,
      securityMaleRatio: ratios.securityMaleA && ratios.securityMaleB ? `${ratios.securityMaleA}:${ratios.securityMaleB}` : null,
      securityFemaleRatio: ratios.securityFemaleA && ratios.securityFemaleB ? `${ratios.securityFemaleA}:${ratios.securityFemaleB}` : null,
      serverManagerRatio: ratios.serverManagerA && ratios.serverManagerB ? `${ratios.serverManagerA}:${ratios.serverManagerB}` : null,
      registrationDeskManagerRatio: ratios.registrationDeskManagerA && ratios.registrationDeskManagerB ? `${ratios.registrationDeskManagerA}:${ratios.registrationDeskManagerB}` : null,
      centreManager: fixedCounts.centreManager && fixedCounts.centreManager !== 'none' ? fixedCounts.centreManager : null,
      networkAdmin: fixedCounts.networkAdmin && fixedCounts.networkAdmin !== 'none' ? fixedCounts.networkAdmin : null,
      bodycamOperator: fixedCounts.bodycamOperator && fixedCounts.bodycamOperator !== 'none' ? fixedCounts.bodycamOperator : null,
      supportStaff: fixedCounts.supportStaff && fixedCounts.supportStaff !== 'none' ? fixedCounts.supportStaff : null,
      electrician: fixedCounts.electrician && fixedCounts.electrician !== 'none' ? fixedCounts.electrician : null,
      cctvOperator: fixedCounts.cctvOperator && fixedCounts.cctvOperator !== 'none' ? fixedCounts.cctvOperator : null,
      seniorCentreManager: fixedCounts.seniorCentreManager && fixedCounts.seniorCentreManager !== 'none' ? fixedCounts.seniorCentreManager : null,
      cleaningStaff: fixedCounts.cleaningStaff && fixedCounts.cleaningStaff !== 'none' ? fixedCounts.cleaningStaff : null,
    };

    // Assemble dates payload
    const datesPayload = (parsedPreview?.dateGroups || []).map(dg => ({
      examDate: dg.dateIso,
      displayDate: dg.displayDate,
      shifts: (dg.shifts || []).map(s => ({
        shiftName: s.shiftName,
        shiftNumber: s.shiftNumber,
        startTime: s.startTime,
        endTime: s.endTime,
        reportingTime: s.reportingTime,
      })),
    }));

    // Assemble requirementSheet payload
    const requirementSheetPayload = uploadedFileMeta ? {
      fileName: uploadedFileMeta.fileName,
      fileSize: uploadedFileMeta.fileSize,
      mimeType: uploadedFileMeta.mimeType,
      fileBufferBase64: uploadedFileMeta.fileBufferBase64,
      totalRows: parsedPreview?.totalRows || 0,
      totalCandidates: parsedPreview?.totalCandidates || 0,
      totalCities: parsedPreview?.totalCities || 0,
      dates: datesPayload,
      rows: parsedPreview?.allRows || [],
    } : undefined;

    const payload = {
      examTypeId: targetExamTypeId,
      examCode: editingExam?.examCode || normalizedCode,
      examName: examName.trim(),
      examYear,
      status,
      registrationDesk: parseFloat(registrationDesk),
      bufferNodes: parseFloat(bufferNodes),
      notes: notes.trim(),
      manpower: manpowerPayload,
      dates: datesPayload,
      ...(requirementSheetPayload ? { requirementSheet: requirementSheetPayload } : {}),
    };

    onSubmit(payload);
  };

  // ── 2. Guard Return: Checked AFTER all hooks are initialized ──
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {editingExam ? `Edit Examination: ${examName || editingExam.examName}` : 'Configure New Examination'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Dynamic Excel Dates &amp; Shifts, Global Calendar Synchronization, Mandatory Manpower
            </p>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4 }} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            
            {/* Top Validation Alert Banner if any */}
            {formValidationErrors.length > 0 && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: 6,
                  color: '#991b1b',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
                  <AlertCircle size={15} /> Submission Blocked:
                </div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {formValidationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 1. Associated Parent Project (Mandatory) */}
            <div className="form-group">
              <label className="form-label">Parent Examination Project *</label>
              <select
                className="form-control"
                required
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
              >
                <option value="">Select parent project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.client?.name ? `${p.client.name} → ` : ''}{p.projectCode} ({p.name})
                  </option>
                ))}
              </select>
            </div>

            {/* 2 & 3. Examination Name & Lifecycle Stage */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Examination Name (EXAM_NAME_YEAR) *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. SSC_GD_2027 or NEET_UG_2027"
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lifecycle Stage / Status *</label>
                <select
                  className="form-control"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* 4 & 5. Tolerances: Registration Desk (1%-10%) & Buffer Nodes (1%-10%) */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Registration Desk Tolerance (1% – 10%) *</label>
                <select
                  className="form-control"
                  value={registrationDesk}
                  onChange={e => setRegistrationDesk(e.target.value)}
                >
                  {TOLERANCE_OPTIONS.map(opt => (
                    <option key={`reg-${opt}`} value={opt}>
                      {opt}%
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Booking tolerance ratio for registration terminals
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Buffer Nodes Tolerance (1% – 10%) *</label>
                <select
                  className="form-control"
                  value={bufferNodes}
                  onChange={e => setBufferNodes(e.target.value)}
                >
                  {TOLERANCE_OPTIONS.map(opt => (
                    <option key={`buf-${opt}`} value={opt}>
                      {opt}%
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Contingency reserve ratio for test node capacity
                </span>
              </div>
            </div>

            {/* 6. MANDATORY MANPOWER REQUIREMENT SECTION */}
            <div
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--bg-surface)',
              }}
            >
              {/* Header card with Mandatory badge and Expand/Collapse toggle (+ Add Manpower) */}
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderBottom: manpowerExpanded ? '1px solid var(--border-default)' : 'none',
                }}
                onClick={() => {
                  setManpowerExpanded(v => !v);
                  setManpowerTouched(true);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Users size={16} color="var(--color-primary)" />
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Manpower Requirement
                    </span>
                    <span
                      className="badge badge-purple"
                      style={{ marginLeft: 8, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}
                    >
                      Mandatory
                    </span>
                    {manpowerValidation.isConfigured && (
                      <span className="badge badge-success" style={{ marginLeft: 6, fontSize: '0.6875rem' }}>
                        Configured
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className={manpowerExpanded ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                  onClick={e => {
                    e.stopPropagation();
                    setManpowerExpanded(v => !v);
                    setManpowerTouched(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600 }}
                >
                  {manpowerExpanded ? (
                    <>
                      <span>Collapse</span> <ChevronUp size={14} />
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> <span>Add Manpower</span>
                    </>
                  )}
                </button>
              </div>

              {/* Expandable 14 Manpower Categories Form in Exact Sequence */}
              {manpowerExpanded && (
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Configure node-based staffing ratios (e.g. 1 : 20) and venue-based fixed headcounts (1–10).
                  </div>

                  <div className="grid-2" style={{ gap: 12 }}>
                    {ALL_MANPOWER_CATEGORIES.map((cat, idx) => {
                      if (cat.type === 'ratio') {
                        const valA = ratios[`${cat.key}A`];
                        const valB = ratios[`${cat.key}B`];
                        const hasError = manpowerValidation.ratioFieldErrors?.[cat.key];

                        return (
                          <div key={cat.key} className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {idx + 1}. {cat.label}
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input
                                type="number"
                                min={1}
                                className="form-control"
                                placeholder="1"
                                style={{
                                  width: 65,
                                  textAlign: 'center',
                                  fontSize: '0.8125rem',
                                  borderColor: hasError ? '#ef4444' : undefined,
                                }}
                                value={valA || ''}
                                onChange={e => {
                                  setRatios({ ...ratios, [`${cat.key}A`]: e.target.value });
                                  setManpowerTouched(true);
                                }}
                              />
                              <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>:</span>
                              <input
                                type="number"
                                min={1}
                                className="form-control"
                                placeholder={cat.defaultB || '20'}
                                style={{
                                  flex: 1,
                                  fontSize: '0.8125rem',
                                  borderColor: hasError ? '#ef4444' : undefined,
                                }}
                                value={valB || ''}
                                onChange={e => {
                                  setRatios({ ...ratios, [`${cat.key}B`]: e.target.value });
                                  setManpowerTouched(true);
                                }}
                              />
                            </div>
                            {hasError && (
                              <span style={{ fontSize: '0.6875rem', color: '#ef4444', marginTop: 3, display: 'block' }}>
                                {hasError}
                              </span>
                            )}
                          </div>
                        );
                      } else {
                        // Fixed count
                        const val = fixedCounts[cat.key];
                        return (
                          <div key={cat.key} className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {idx + 1}. {cat.label}
                            </label>
                            <select
                              className="form-control"
                              style={{ fontSize: '0.8125rem' }}
                              value={val || ''}
                              onChange={e => {
                                setFixedCounts({ ...fixedCounts, [cat.key]: e.target.value });
                                setManpowerTouched(true);
                              }}
                            >
                              <option value="">None (NULL)</option>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                <option key={n} value={String(n)}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 7 & 8. EXAMINATION REQUIREMENT SHEET & IMPORT WORKFLOW */}
            <div
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                background: 'var(--bg-subtle, #f8fafc)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileSpreadsheet size={16} color="var(--color-primary)" />
                    Examination Requirement Sheet (Excel / CSV) *
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    Source of truth for examination dates, dynamic shifts, cities, and candidate allocations
                  </p>
                </div>

                {/* Sample Template Download */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={generateRequirementSample}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', gap: 6 }}
                  title="Download standard XLS/XLSX sample template"
                >
                  <Download size={13} /> Download Sample Template
                </button>
              </div>

              {/* Upload Input & Dropzone */}
              <div
                style={{
                  border: '2px dashed var(--border-strong, #cbd5e1)',
                  borderRadius: 8,
                  padding: 16,
                  textAlign: 'center',
                  background: '#fff',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                
                {parsingSheet ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--color-primary)' }}>
                    <RefreshCw size={24} className="animate-spin" />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                      Parsing workbook dates, dynamic shifts, and allocations...
                    </span>
                  </div>
                ) : uploadedFileMeta ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                      <FileSpreadsheet size={24} color="#16a34a" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                          {uploadedFileMeta.fileName}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {uploadedFileMeta.fileSize ? `${(uploadedFileMeta.fileSize / 1024).toFixed(1)} KB` : 'Active Schedule'} · Validated
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleClearUploadedFile();
                      }}
                      style={{ fontSize: '0.75rem', color: '#ef4444' }}
                    >
                      Change Sheet
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} style={{ margin: '0 auto 6px', color: 'var(--color-primary)' }} />
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Click to upload Examination Requirement Sheet (.xlsx, .xls, .csv)
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Dates and Shift-1, Shift-2, Shift-3, Shift-N columns will be detected dynamically
                    </div>
                  </div>
                )}
              </div>

              {/* Parsing Error if any */}
              {uploadError && (
                <div style={{ marginTop: 10, padding: 8, background: '#fee2e2', borderRadius: 4, color: '#991b1b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} /> {uploadError}
                </div>
              )}

              {/* Parsed Preview Metrics Card */}
              {parsedPreview && (
                <div style={{ marginTop: 12, padding: 12, background: '#fff', border: '1px solid var(--border-default)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Import Preview Summary
                    </span>
                    <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                      <Check size={11} /> Ready to Synchronize
                    </span>
                  </div>

                  <div className="grid-2" style={{ gap: 8, marginBottom: 10 }}>
                    <div style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Detected Dates &amp; Shifts</div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                        {parsedPreview.totalDates} Dates · {parsedPreview.totalShifts} Shifts
                      </div>
                    </div>
                    <div style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Total Candidate Target</div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#16a34a' }}>
                        {Number(parsedPreview.totalCandidates).toLocaleString()} Candidates
                      </div>
                    </div>
                    <div style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>City Coverage</div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {parsedPreview.totalCities} Cities
                      </div>
                    </div>
                    <div style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Calendar Integration</div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                        Global Sync Active
                      </div>
                    </div>
                  </div>

                  {/* Dates & Shifts Breakdown */}
                  {parsedPreview.dateGroups && parsedPreview.dateGroups.length > 0 && (
                    <div style={{ marginTop: 6, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                        Detected Schedule Breakdown:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {parsedPreview.dateGroups.map((dg, idx) => (
                          <div
                            key={dg.dateIso || idx}
                            style={{
                              padding: '3px 8px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: 4,
                              fontSize: '0.6875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Calendar size={12} color="var(--color-primary)" />
                            <strong>{dg.displayDate || dg.dateIso}</strong>:
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {(dg.shifts || []).map(s => s.shiftName).join(', ')} ({dg.shifts?.length || 0} shifts)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings if any */}
                  {parsedPreview.warnings && parsedPreview.warnings.length > 0 && (
                    <div style={{ marginTop: 8, padding: 6, background: '#fffbeb', borderRadius: 4, border: '1px solid #fef3c7', fontSize: '0.6875rem', color: '#b45309' }}>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <AlertTriangle size={12} /> Notice:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {parsedPreview.warnings.slice(0, 3).map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Blocking Errors if any */}
                  {parsedPreview.blockingErrors && parsedPreview.blockingErrors.length > 0 && (
                    <div style={{ marginTop: 8, padding: 6, background: '#fee2e2', borderRadius: 4, border: '1px solid #fecaca', fontSize: '0.6875rem', color: '#b91c1c' }}>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <AlertCircle size={12} /> Blocking Validation Errors:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {parsedPreview.blockingErrors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 9. Notes / Examination Scope */}
            <div className="form-group">
              <label className="form-label">Notes / Examination Scope (Optional)</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Session operational guidelines, observer deployment instructions, notifications..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-default)', padding: '12px 20px', background: 'var(--bg-surface)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || (parsedPreview?.blockingErrors && parsedPreview.blockingErrors.length > 0)}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Synchronizing Examination...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>{editingExam ? 'Save & Sync Examination' : 'Create & Sync Examination'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
