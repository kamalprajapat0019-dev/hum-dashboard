import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FolderOpen, Plus, RefreshCw, CheckCircle2,
  AlertCircle, BookOpen, CalendarDays
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import ExamCalendarModal from '@/components/common/ExamCalendarModal';
import ExamRequirementViewerPage from './ExamRequirementViewerPage';
import {
  ProjectKpiCards,
  ExamKpiCards,
  ProjectsTable,
  ExamsTable,
  ProjectFormModal,
  ProjectViewModal,
  ExamFormModal,
  ManpowerModal,
  DatesShiftsModal
} from './components';

const STAGES = [
  'Setup',
  'Booking',
  'Document Verification',
  'Audit & Compliance',
  'Allocation',
  'Readiness & Mock',
  'Execution',
  'Closed',
];

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
  return meta;
}

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'exams'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Data Collections ──────────────────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [exams, setExams] = useState([]);

  // ── Filters & Pagination ──────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [projectPage, setProjectPage] = useState(1);
  const [projectLimit, setProjectLimit] = useState(10);

  // Exams tab filters
  const [exProjectFilter, setExProjectFilter] = useState('');
  const [exStatusFilter, setExStatusFilter] = useState('');

  // ── Modals & Drawers ─────────────────────────────────────────────────────
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showViewProjectModal, setShowViewProjectModal] = useState(false);
  const [viewingProject, setViewingProject] = useState(null);
  const [viewingProjectLoading, setViewingProjectLoading] = useState(false);

  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const [managingExamShifts, setManagingExamShifts] = useState(null);
  const [examDates, setExamDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Manpower & Requirement Viewer states
  const [viewingManpowerExam, setViewingManpowerExam] = useState(null);
  const [viewingExamRequirement, setViewingExamRequirement] = useState(null);

  // ── Examination Summary Cards State ───────────────────────────────────────
  const [examSummary, setExamSummary] = useState({
    totalExams: 0,
    activeScheduledExams: 0,
    totalCandidateTarget: 0,
    totalCoverage: 0,
  });
  const [examSummaryLoading, setExamSummaryLoading] = useState(false);
  const [examSummaryError, setExamSummaryError] = useState(null);

  // ── Forms Initial State ──────────────────────────────────────────────────
  const initialProjectForm = {
    projectCode: '',
    name: '',
    clientId: '',
    financialYear: '2026-2027',
    description: '',
    examType: 'CBT Examination',
    stage: 'Setup',
    status: 'Active',
    candidateTarget: '',
    centreTarget: '',
    citiesCount: '',
    examDates: [],
  };
  const [projectForm, setProjectForm] = useState(initialProjectForm);

  const initialExamForm = {
    examTypeId: '',
    examCode: '',
    examName: '',
    examYear: new Date().getFullYear(),
    description: '',
    status: 'Scheduled',
  };
  const [examForm, setExamForm] = useState(initialExamForm);

  const [newDateForm, setNewDateForm] = useState({ examDate: '', reportingTime: '08:00 AM', status: 'Scheduled' });
  const [newShiftForm, setNewShiftForm] = useState({
    examDateId: '',
    shiftName: 'Shift 1',
    shiftNumber: 1,
    startTime: '09:00 AM',
    endTime: '12:00 PM',
    reportingTime: '08:00 AM',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Data Fetching: Isolated Reference Data & Projects Queries ────────────
  const loadReferenceData = useCallback(async () => {
    try {
      const [clientRes, etRes, examsRes] = await Promise.allSettled([
        apiClient.get(ENDPOINTS.ADMIN.CLIENTS, { params: { limit: 100 } }),
        apiClient.get(ENDPOINTS.ADMIN.EXAM_TYPES, { params: { limit: 100 } }),
        apiClient.get(ENDPOINTS.ADMIN.EXAMS, { params: { limit: 100 } }),
      ]);

      if (clientRes.status === 'fulfilled' && clientRes.value?.success) {
        const clientList = Array.isArray(clientRes.value.data)
          ? clientRes.value.data
          : Array.isArray(clientRes.value.data?.data)
          ? clientRes.value.data.data
          : [];
        setClients(clientList);
      }
      if (etRes.status === 'fulfilled' && etRes.value?.success && Array.isArray(etRes.value.data)) {
        setExamTypes(etRes.value.data);
      }
      if (examsRes.status === 'fulfilled' && examsRes.value?.success && Array.isArray(examsRes.value.data)) {
        setExams(examsRes.value.data);
      }
    } catch (err) {
      console.warn('Failed to load reference metadata:', err);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projRes = await apiClient.get(ENDPOINTS.ADMIN.PROJECTS, {
        params: {
          status: statusFilter || undefined,
          clientId: clientFilter || undefined,
          limit: 100,
        },
      });

      if (projRes?.success && Array.isArray(projRes.data)) {
        setProjects(projRes.data);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('Failed to load project records:', err);
      setError(err.message || 'Unable to retrieve project database');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, clientFilter]);

  const deriveExamSummaryFromExams = useCallback((examList = exams) => {
    const list = examList || [];
    let activeScheduled = 0;
    let candidates = 0;
    let coverage = 0;
    const citiesSet = new Set();

    list.forEach(ex => {
      if (['Active', 'Scheduled'].includes(ex.status)) activeScheduled++;
      const meta = parseExamMeta(ex);
      const cTarget = Number(meta.candidateRequiredCount) || Number(meta.summary?.candidateTarget) || Number(meta.requirementSheet?.totalCandidates) || 0;
      const cov = Number(meta.coverage) || Number(meta.summary?.coverageCount) || Number(meta.requirementSheet?.totalCities) || 0;
      candidates += cTarget;
      coverage += cov;
      if (Array.isArray(meta.requirementSheet?.cityWiseTotals)) {
        meta.requirementSheet.cityWiseTotals.forEach(c => {
          if (c.city && typeof c.city === 'string') citiesSet.add(c.city.trim().toLowerCase());
        });
      }
    });

    setExamSummary({
      totalExams: list.length,
      activeScheduledExams: activeScheduled,
      totalCandidateTarget: candidates,
      totalCoverage: citiesSet.size > 0 ? citiesSet.size : coverage,
    });
  }, [exams]);

  const loadExamSummary = useCallback(async () => {
    setExamSummaryLoading(true);
    setExamSummaryError(null);
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.EXAMS_SUMMARY, {
        params: {
          clientId: clientFilter || undefined,
          projectId: exProjectFilter || undefined,
          status: exStatusFilter || undefined,
        },
      });
      if (res?.success && res.data) {
        setExamSummary(res.data);
      } else {
        deriveExamSummaryFromExams();
      }
    } catch {
      deriveExamSummaryFromExams();
    } finally {
      setExamSummaryLoading(false);
    }
  }, [clientFilter, exProjectFilter, exStatusFilter, deriveExamSummaryFromExams]);

  const loadData = useCallback(async () => {
    await Promise.all([loadProjects(), loadReferenceData(), loadExamSummary()]);
  }, [loadProjects, loadReferenceData, loadExamSummary]);

  // Load static reference datasets on mount
  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  // Trigger search & filtered queries with debouncing
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Reload exam summary when switching to exams tab or updating exam filters
  useEffect(() => {
    if (activeTab === 'exams') {
      loadExamSummary();
    }
  }, [activeTab, loadExamSummary]);

  // Load Exam Dates & Shifts for selected exam instance
  const loadExamDatesAndShifts = async (examId) => {
    if (!examId) return;
    setLoadingDates(true);
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.EXAM_DATES(examId));
      if (res?.success && Array.isArray(res.data)) {
        setExamDates(res.data);
      } else {
        setExamDates([]);
      }
    } catch (err) {
      console.error('Failed to load exam dates:', err);
      showToast(err.message || 'Failed to load exam dates', 'error');
    } finally {
      setLoadingDates(false);
    }
  };

  const handleOpenDatesAndShifts = (exam) => {
    setManagingExamShifts(exam);
    loadExamDatesAndShifts(exam.id);
  };

  const handleOpenManpower = (exam) => {
    setViewingManpowerExam(exam);
  };

  const handleOpenViewExam = (exam) => {
    setViewingExamRequirement(exam);
  };

  // ── Project Handlers ─────────────────────────────────────────────────────
  const handleAddDateRow = () => {
    setProjectForm(prev => ({
      ...prev,
      examDates: [
        ...(prev.examDates || []),
        { examDate: '', shift: 'Shift 1', startTime: '09:00 AM', endTime: '12:00 PM' }
      ]
    }));
  };

  const handleRemoveDateRow = (index) => {
    setProjectForm(prev => ({
      ...prev,
      examDates: (prev.examDates || []).filter((_, i) => i !== index)
    }));
  };

  const handleDateRowChange = (index, field, value) => {
    setProjectForm(prev => ({
      ...prev,
      examDates: (prev.examDates || []).map((row, i) => i === index ? { ...row, [field]: value } : row)
    }));
  };

  const handleOpenAddProject = async () => {
    setEditingProject(null);
    let nextCode = `PRJ-${String(projects.length + 1).padStart(4, '0')}`;
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.PROJECTS_NEXT_CODE);
      if (res?.success && res.data?.projectCode) {
        nextCode = res.data.projectCode;
      }
    } catch {
      // Fallback sequential code
    }
    setProjectForm({
      ...initialProjectForm,
      projectCode: nextCode,
      clientId: clientFilter || clients[0]?.id || '',
      examDates: [],
    });
    setShowProjectModal(true);
  };

  const handleOpenEditProject = async (p) => {
    setEditingProject(p);
    let meta = {};
    if (p.description) {
      try {
        meta = JSON.parse(p.description);
        if (typeof meta !== 'object' || meta === null) meta = { text: p.description };
      } catch {
        meta = { text: p.description };
      }
    }

    let existingDates = [];
    try {
      const detailRes = await apiClient.get(ENDPOINTS.ADMIN.PROJECT_DETAIL(p.id));
      if (detailRes?.success && detailRes.data?.examDates) {
        existingDates = detailRes.data.examDates.map(d => ({
          id: d.id,
          examDate: d.examDate ? new Date(d.examDate).toISOString().split('T')[0] : '',
          shift: d.shift || 'Shift 1',
          startTime: d.startTime || '',
          endTime: d.endTime || '',
        }));
      }
    } catch {
      // fallback
    }

    setProjectForm({
      id: p.id,
      projectCode: p.projectCode || '',
      name: p.name || '',
      clientId: p.clientId || clients[0]?.id || '',
      financialYear: meta.financialYear || p.financialYear || getFinancialYear(p) || '2026-2027',
      description: meta.text || p.description || '',
      examType: p.examType || 'CBT Examination',
      stage: p.stage || 'Setup',
      status: p.status || 'Active',
      candidateTarget: p.candidateTarget !== undefined && p.candidateTarget !== null ? p.candidateTarget : '',
      centreTarget: p.centreTarget !== undefined && p.centreTarget !== null ? p.centreTarget : '',
      citiesCount: p.citiesCount !== undefined && p.citiesCount !== null ? p.citiesCount : '',
      examDates: existingDates,
    });
    setShowProjectModal(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name?.trim() || !projectForm.clientId || !projectForm.financialYear?.trim()) {
      showToast('Please complete required fields: Project Name, Associated Client, and Financial Year', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: projectForm.name.trim(),
        clientId: projectForm.clientId,
        financialYear: projectForm.financialYear.trim(),
        description: projectForm.description?.trim() || '',
        examType: projectForm.examType || 'CBT Examination',
        stage: projectForm.stage || 'Setup',
        status: projectForm.status || 'Active',
        candidateTarget: Number(projectForm.candidateTarget) || 0,
        centreTarget: Number(projectForm.centreTarget) || 0,
        citiesCount: Number(projectForm.citiesCount) || 0,
        examDates: (projectForm.examDates || []).filter(d => d.examDate),
      };

      if (editingProject) {
        const res = await apiClient.put(ENDPOINTS.ADMIN.PROJECT_DETAIL(editingProject.id), payload);
        if (res && res.success) {
          showToast(`Project "${projectForm.name}" updated successfully!`, 'success');
          setShowProjectModal(false);
          await loadData();
        }
      } else {
        payload.projectCode = projectForm.projectCode;
        const res = await apiClient.post(ENDPOINTS.ADMIN.PROJECTS, payload);
        if (res && res.success) {
          showToast(`Project "${projectForm.name}" created successfully!`, 'success');
          setShowProjectModal(false);
          await loadData();
        }
      }
    } catch (err) {
      const msg = err.data?.error?.message || err.message || 'Failed to save project';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleProjectStatus = async (project) => {
    const nextStatus = project.status === 'Active' ? 'OnHold' : 'Active';
    try {
      const res = await apiClient.patch(ENDPOINTS.ADMIN.PROJECT_STATUS(project.id), { status: nextStatus });
      if (res?.success) {
        showToast(`Project status updated to ${nextStatus}`, 'success');
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update project status', 'error');
    }
  };

  const handleOpenViewProject = (p) => {
    setViewingProject(p);
    setShowViewProjectModal(true);
  };

  // ── Exam Instance Handlers ───────────────────────────────────────────────
  const handleOpenAddExam = () => {
    setEditingExam(null);
    setShowExamModal(true);
  };

  const handleOpenEditExam = (ex) => {
    setEditingExam(ex);
    setShowExamModal(true);
  };

  const handleSaveExam = async (payload) => {
    setSubmitting(true);
    try {
      const { requirementSheet, ...restPayload } = payload;

      const meta = {
        registrationDesk: payload.registrationDesk,
        bufferNodes: payload.bufferNodes,
        manpower: payload.manpower,
        notes: payload.notes,
      };

      const examData = {
        ...restPayload,
        description: JSON.stringify(meta),
      };

      let targetExamId = null;

      if (editingExam) {
        targetExamId = editingExam.id;
        const res = await apiClient.put(ENDPOINTS.ADMIN.EXAM_DETAIL(editingExam.id), examData);
        if (!res?.success) {
          throw new Error(res?.error?.message || 'Failed to update examination');
        }
      } else {
        const res = await apiClient.post(ENDPOINTS.ADMIN.EXAMS, examData);
        if (!res?.success) {
          throw new Error(res?.error?.message || 'Failed to create examination');
        }
        targetExamId = res.data?.id;
      }

      // If requirement sheet workbook was attached/updated, synchronize it
      if (requirementSheet?.fileBufferBase64 && targetExamId) {
        await apiClient.post(ENDPOINTS.ADMIN.EXAM_REQUIREMENT_SHEET(targetExamId), requirementSheet);
      }

      showToast(`Examination "${payload.examName}" saved & synchronized with Global Calendar!`, 'success');
      setShowExamModal(false);
      setEditingExam(null);
      await loadData();
    } catch (err) {
      showToast(err.data?.error?.message || err.message || 'Failed to save examination drive', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async (ex) => {
    if (!window.confirm(`Delete Exam "${ex.examName}"? This will delete all dates and shifts for this exam.`)) return;
    try {
      const res = await apiClient.delete(ENDPOINTS.ADMIN.EXAM_DETAIL(ex.id));
      if (res?.success) {
        showToast(`Exam "${ex.examName}" deleted`, 'success');
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete exam', 'error');
    }
  };

  // ── Exam Dates & Shifts Handlers ─────────────────────────────────────────
  const handleAddExamDate = async (e) => {
    e.preventDefault();
    if (!newDateForm.examDate) {
      showToast('Please pick a date for the examination', 'error');
      return;
    }
    try {
      const res = await apiClient.post(ENDPOINTS.ADMIN.EXAM_DATES(managingExamShifts.id), {
        examDate: new Date(newDateForm.examDate).toISOString(),
        reportingTime: newDateForm.reportingTime || undefined,
        status: newDateForm.status || 'Scheduled',
      });
      if (res?.success) {
        showToast('Exam date added successfully!', 'success');
        setNewDateForm({ examDate: '', reportingTime: '08:00 AM', status: 'Scheduled' });
        await loadExamDatesAndShifts(managingExamShifts.id);
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to add exam date', 'error');
    }
  };

  const handleDeleteExamDate = async (dateId) => {
    if (!window.confirm('Delete this exam date and its shifts?')) return;
    try {
      const res = await apiClient.delete(ENDPOINTS.ADMIN.EXAM_DATE_DETAIL(dateId));
      if (res?.success) {
        showToast('Exam date deleted', 'success');
        await loadExamDatesAndShifts(managingExamShifts.id);
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete exam date', 'error');
    }
  };

  const handleAddShift = async (dateId) => {
    if (!newShiftForm.shiftName?.trim() || !newShiftForm.startTime || !newShiftForm.endTime) {
      showToast('Please enter shift name, start and end times', 'error');
      return;
    }
    try {
      const res = await apiClient.post(ENDPOINTS.ADMIN.EXAM_SHIFTS(dateId), {
        shiftName: newShiftForm.shiftName.trim(),
        shiftNumber: Number(newShiftForm.shiftNumber) || 1,
        startTime: newShiftForm.startTime.trim(),
        endTime: newShiftForm.endTime.trim(),
        reportingTime: newShiftForm.reportingTime?.trim() || undefined,
      });
      if (res?.success) {
        showToast('Shift added to exam date!', 'success');
        setNewShiftForm({
          examDateId: '',
          shiftName: 'Shift 1',
          shiftNumber: 1,
          startTime: '09:00 AM',
          endTime: '12:00 PM',
          reportingTime: '08:00 AM',
        });
        await loadExamDatesAndShifts(managingExamShifts.id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to add shift', 'error');
    }
  };

  const handleDeleteShift = async (shiftId) => {
    try {
      const res = await apiClient.delete(ENDPOINTS.ADMIN.EXAM_SHIFT_DETAIL(shiftId));
      if (res?.success) {
        showToast('Exam shift removed', 'success');
        await loadExamDatesAndShifts(managingExamShifts.id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete shift', 'error');
    }
  };

  // ── Project Helpers: Candidate Target & Financial Year ───────────────────
  const getProjectCandidateTarget = useCallback((p) => {
    const projectExams = exams.filter(e => (e.examType?.projectId === p.id || e.projectId === p.id));
    if (projectExams.length > 0) {
      const examSum = projectExams.reduce((sum, e) => {
        const meta = parseExamMeta(e);
        const reqCount = Number(meta.candidateRequiredCount || meta.summary?.candidateTarget || meta.requirementSheet?.totalCandidates || 0);
        return sum + reqCount;
      }, 0);
      if (examSum > 0) return examSum;
    }
    return Number(p.candidateTarget) || 0;
  }, [exams]);

  const getFinancialYear = useCallback((p) => {
    if (p.financialYear) return p.financialYear;
    const refDate = p.examDate || p.startDate || p.createdAt;
    if (refDate) {
      const d = new Date(refDate);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const startYear = m >= 4 ? y : y - 1;
      return `${startYear}-${startYear + 1}`;
    }
    return '2026-2027';
  }, []);

  const availableFinancialYears = Array.from(
    new Set([
      '2027-2028',
      '2026-2027',
      '2025-2026',
      '2024-2025',
      ...projects.map(p => getFinancialYear(p)).filter(Boolean)
    ])
  ).sort().reverse();

  // ── Filtered Collections ─────────────────────────────────────────────────
  const filteredProjects = projects.filter(p => {
    if (clientFilter && p.clientId !== clientFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (yearFilter && getFinancialYear(p) !== yearFilter && p.financialYear !== yearFilter) return false;
    return true;
  });

  const totalProjectPages = Math.ceil(filteredProjects.length / projectLimit) || 1;
  const paginatedProjects = filteredProjects.slice((projectPage - 1) * projectLimit, projectPage * projectLimit);

  const filteredExams = exams.filter(ex => {
    if (exProjectFilter && (ex.examType?.projectId !== exProjectFilter && ex.projectId !== exProjectFilter)) return false;
    if (exStatusFilter && ex.status !== exStatusFilter) return false;
    return true;
  });

  // Dynamic KPI Card Metrics for Project Management tab
  const activeProjectsCount = filteredProjects.filter(p => p.status === 'Active').length;
  const totalProjectsCount = filteredProjects.length;
  const candidateTentativeCount = filteredProjects.reduce((sum, p) => sum + getProjectCandidateTarget(p), 0);

  // If viewing an examination's full Excel workbook, render the dedicated spreadsheet viewer
  if (viewingExamRequirement) {
    return (
      <ExamRequirementViewerPage
        examId={viewingExamRequirement.id}
        exam={viewingExamRequirement}
        onBack={() => setViewingExamRequirement(null)}
      />
    );
  }

  return (
    <div>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: toast.type === 'error' ? '#b91c1c' : 'var(--color-primary-dark, #1e3a8a)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600,
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} color="#4ade80" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <div className="breadcrumb">
              <span>Admin</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Project Management</span>
            </div>
            <h1 className="page-header__title" style={{ marginTop: 6 }}>
              Project Management
            </h1>
            <p className="page-header__subtitle">
              Manage examination projects, target candidates, venue capacity and examination schedules
            </p>
          </div>
          <div className="page-header__actions">
            <button
              className="btn btn-secondary"
              onClick={loadData}
              disabled={loading}
              title="Refresh from Database"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            {activeTab === 'projects' && (
              <button className="btn btn-primary" onClick={handleOpenAddProject}>
                <Plus size={14} /> Setup New Project
              </button>
            )}
            {activeTab === 'exams' && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCalendarModal(true)}
                  title="Open Annual Examination Calendar"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <CalendarDays size={14} /> Annual Exam Calendar
                </button>
                <button className="btn btn-primary" onClick={handleOpenAddExam}>
                  <Plus size={14} /> New Examination
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#991b1b',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} />
            <div>
              <strong>Failed to query hierarchy records:</strong> {error}
            </div>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={loadData}
            style={{ background: '#fff', borderColor: '#f87171', color: '#991b1b' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* 2-Tier Project & Examination Governance Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <FolderOpen size={15} style={{ marginRight: 6, display: 'inline-block', verticalAlign: '-2px' }} />
          1. Projects ({projects.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
          onClick={() => setActiveTab('exams')}
        >
          <BookOpen size={15} style={{ marginRight: 6, display: 'inline-block', verticalAlign: '-2px' }} />
          2. Examinations
        </button>
      </div>

      {/* ── TAB 1: PROJECTS ────────────────────────────────────────────────── */}
      {activeTab === 'projects' && (
        <>
          <ProjectKpiCards
            loading={loading}
            activeProjectsCount={activeProjectsCount}
            totalProjectsCount={totalProjectsCount}
            candidateTentativeCount={candidateTentativeCount}
          />

          <ProjectsTable
            loading={loading}
            paginatedProjects={paginatedProjects}
            filteredProjects={filteredProjects}
            clients={clients}
            clientFilter={clientFilter}
            setClientFilter={setClientFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            availableFinancialYears={availableFinancialYears}
            projectPage={projectPage}
            setProjectPage={setProjectPage}
            projectLimit={projectLimit}
            setProjectLimit={setProjectLimit}
            totalProjectPages={totalProjectPages}
            handleToggleProjectStatus={handleToggleProjectStatus}
            handleOpenViewProject={handleOpenViewProject}
            handleOpenEditProject={handleOpenEditProject}
            showToast={showToast}
            getProjectCandidateTarget={getProjectCandidateTarget}
            getFinancialYear={getFinancialYear}
          />
        </>
      )}

      {/* ── TAB 2: EXAMINATIONS ──────────────────────────────────── */}
      {activeTab === 'exams' && (
        <>
          <ExamKpiCards
            summary={examSummary}
            loading={examSummaryLoading}
            error={examSummaryError}
            onRetry={loadExamSummary}
          />

          <ExamsTable
            loading={loading}
            filteredExams={filteredExams}
            projects={projects}
            exProjectFilter={exProjectFilter}
            setExProjectFilter={setExProjectFilter}
            exStatusFilter={exStatusFilter}
            setExStatusFilter={setExStatusFilter}
            handleOpenManpower={handleOpenManpower}
            handleOpenViewExam={handleOpenViewExam}
            handleOpenEditExam={handleOpenEditExam}
            handleManageShifts={handleOpenDatesAndShifts}
            handleDeleteExam={handleDeleteExam}
          />
        </>
      )}

      {/* ── Modals & Drawers ───────────────────────────────────────────────── */}
      <ProjectFormModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        editingProject={editingProject}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        clients={clients}
        onSubmit={handleSaveProject}
        submitting={submitting}
        onAddDateRow={handleAddDateRow}
        onRemoveDateRow={handleRemoveDateRow}
        onDateRowChange={handleDateRowChange}
      />

      <ProjectViewModal
        isOpen={showViewProjectModal}
        onClose={() => setShowViewProjectModal(false)}
        viewingProject={viewingProject}
        viewingProjectLoading={viewingProjectLoading}
      />

      <ExamFormModal
        isOpen={showExamModal}
        onClose={() => {
          setShowExamModal(false);
          setEditingExam(null);
        }}
        editingExam={editingExam}
        projects={projects}
        examTypes={examTypes}
        onSubmit={handleSaveExam}
        submitting={submitting}
      />

      <ManpowerModal
        isOpen={!!viewingManpowerExam}
        onClose={() => setViewingManpowerExam(null)}
        viewingManpowerExam={viewingManpowerExam}
        onOpenEditExam={(exam) => {
          setViewingManpowerExam(null);
          handleOpenEditExam(exam);
        }}
        parseExamMeta={parseExamMeta}
      />

      <DatesShiftsModal
        isOpen={!!managingExamShifts}
        onClose={() => setManagingExamShifts(null)}
        managingExamShifts={managingExamShifts}
        examDates={examDates}
        loadingDates={loadingDates}
        newDateForm={newDateForm}
        setNewDateForm={setNewDateForm}
        handleAddExamDate={handleAddExamDate}
        handleDeleteExamDate={handleDeleteExamDate}
        newShiftForm={newShiftForm}
        setNewShiftForm={setNewShiftForm}
        handleAddShift={handleAddShift}
        handleDeleteShift={handleDeleteShift}
      />

      {/* Annual Examination Calendar Modal */}
      {showCalendarModal && (
        <ExamCalendarModal onClose={() => setShowCalendarModal(false)} />
      )}
    </div>
  );
}
