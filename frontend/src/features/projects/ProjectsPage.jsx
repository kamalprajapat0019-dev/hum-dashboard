import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FolderOpen, Plus, Search, Calendar, Users, Building2, CheckCircle2,
  Clock, Edit, Eye, Trash2, X, Check, RefreshCw, Award,
  AlertCircle, Loader2, Layers, BookOpen, ToggleLeft, ToggleRight,
  CalendarDays
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { StatusBadge } from '@/components/common';
import ExamCalendarModal from '@/components/common/ExamCalendarModal';

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

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'exam-types' | 'exams'
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
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [projectPage, setProjectPage] = useState(1);
  const [projectLimit, setProjectLimit] = useState(10);

  // Exam Types tab filters
  const [etClientFilter, setEtClientFilter] = useState('');
  const [etProjectFilter, setEtProjectFilter] = useState('');

  // Exams tab filters
  const [exClientFilter, setExClientFilter] = useState('');
  const [exProjectFilter, setExProjectFilter] = useState('');
  const [exExamTypeFilter, setExExamTypeFilter] = useState('');

  // ── Modals & Drawers ─────────────────────────────────────────────────────
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showViewProjectModal, setShowViewProjectModal] = useState(false);
  const [viewingProject, setViewingProject] = useState(null);

  const [showExamTypeModal, setShowExamTypeModal] = useState(false);
  const [editingExamType, setEditingExamType] = useState(null);

  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const [managingExamShifts, setManagingExamShifts] = useState(null); // Exam instance object for Dates & Shifts modal
  const [examDates, setExamDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // ── Forms Initial State ──────────────────────────────────────────────────
  const initialProjectForm = {
    projectCode: '',
    name: '',
    clientId: '',
    examType: 'CBT Exam',
    description: '',
    stage: 'Setup',
    status: 'Active',
    examDate: '',
    examDates: [],
    citiesCount: 1,
    candidateTarget: 5000,
    centreTarget: 10,
    slaHealth: 'OnTrack',
  };
  const [projectForm, setProjectForm] = useState(initialProjectForm);

  const initialExamTypeForm = {
    projectId: '',
    examCode: '',
    examTypeName: '',
    description: '',
    isActive: true,
  };
  const [examTypeForm, setExamTypeForm] = useState(initialExamTypeForm);

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

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

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
          search: debouncedSearch || undefined,
          stage: stageFilter || undefined,
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
  }, [debouncedSearch, stageFilter, statusFilter, clientFilter]);

  const loadData = useCallback(async () => {
    await Promise.all([loadProjects(), loadReferenceData()]);
  }, [loadProjects, loadReferenceData]);

  // Load static reference datasets on mount
  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  // Trigger search & filtered queries with debouncing
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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

  // ── Project Handlers ─────────────────────────────────────────────────────
  const handleAddDateRow = () => {
    const today = new Date().toISOString().split('T')[0];
    setProjectForm((prev) => ({
      ...prev,
      examDates: [
        ...(prev.examDates || []),
        {
          id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          examDate: today,
          shift: 'Shift 1',
          startTime: '09:00 AM',
          endTime: '12:00 PM',
        },
      ],
    }));
  };

  const handleRemoveDateRow = (index) => {
    setProjectForm((prev) => ({
      ...prev,
      examDates: (prev.examDates || []).filter((_, i) => i !== index),
    }));
  };

  const handleDateRowChange = (index, field, value) => {
    setProjectForm((prev) => {
      const updated = [...(prev.examDates || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, examDates: updated };
    });
  };

  const handleOpenAddProject = () => {
    setEditingProject(null);
    const nextCode = `PRJ-${String(projects.length + 1).padStart(3, '0')}`;
    setProjectForm({
      ...initialProjectForm,
      projectCode: nextCode,
      clientId: clientFilter || clients[0]?.id || '',
      examDates: [],
    });
    setShowProjectModal(true);
  };

  const handleOpenEditProject = (p) => {
    setEditingProject(p);
    let initialDates = [];
    if (p.examDates && Array.isArray(p.examDates) && p.examDates.length > 0) {
      initialDates = p.examDates.map((ed) => ({
        id: ed.id,
        examDate: ed.examDate ? new Date(ed.examDate).toISOString().split('T')[0] : '',
        shift: ed.shift || 'Shift 1',
        startTime: ed.startTime || '09:00 AM',
        endTime: ed.endTime || '12:00 PM',
      }));
    } else if (p.examDate) {
      initialDates = [
        {
          id: 'legacy-date',
          examDate: new Date(p.examDate).toISOString().split('T')[0],
          shift: 'Shift 1',
          startTime: '09:00 AM',
          endTime: '12:00 PM',
        },
      ];
    }

    setProjectForm({
      projectCode: p.projectCode || '',
      name: p.name || '',
      clientId: p.clientId || clients[0]?.id || '',
      examType: p.examType || 'CBT Exam',
      description: p.description || '',
      stage: p.stage || 'Setup',
      status: p.status || 'Active',
      examDate: p.examDate ? new Date(p.examDate).toISOString().split('T')[0] : '',
      examDates: initialDates,
      citiesCount: p.citiesCount || 1,
      candidateTarget: p.candidateTarget || 0,
      centreTarget: p.centreTarget || 0,
      slaHealth: p.slaHealth || 'OnTrack',
    });
    setShowProjectModal(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name?.trim() || !projectForm.projectCode?.trim() || !projectForm.clientId) {
      showToast('Please complete required fields: Project Code, Name, and Client Agency', 'error');
      return;
    }

    // Validate duplicate dates / shifts within project
    if (projectForm.examDates && projectForm.examDates.length > 0) {
      const seen = new Set();
      for (const row of projectForm.examDates) {
        if (!row.examDate) {
          showToast('All examination dates must have a valid date selected', 'error');
          return;
        }
        const key = `${row.examDate}_${row.shift || 'Shift 1'}`;
        if (seen.has(key)) {
          showToast(`Duplicate schedule detected: ${row.examDate} with ${row.shift || 'Shift 1'}. Please specify different dates or shifts.`, 'error');
          return;
        }
        seen.add(key);
      }
    }

    setSubmitting(true);
    try {
      const formattedDates =
        projectForm.examDates && projectForm.examDates.length > 0
          ? projectForm.examDates.map((d) => ({
              examDate: new Date(d.examDate).toISOString(),
              shift: d.shift || 'Shift 1',
              startTime: d.startTime || '09:00 AM',
              endTime: d.endTime || '12:00 PM',
            }))
          : undefined;

      const primaryDate =
        formattedDates && formattedDates.length > 0
          ? formattedDates[0].examDate
          : projectForm.examDate
          ? new Date(projectForm.examDate).toISOString()
          : undefined;

      const payload = {
        projectCode: projectForm.projectCode.trim(),
        name: projectForm.name.trim(),
        clientId: projectForm.clientId,
        examType: projectForm.examType.trim(),
        description: projectForm.description || undefined,
        stage: projectForm.stage,
        status: projectForm.status,
        examDate: primaryDate,
        examDates: formattedDates,
        citiesCount: Number(projectForm.citiesCount) || 0,
        candidateTarget: Number(projectForm.candidateTarget) || 0,
        centreTarget: Number(projectForm.centreTarget) || 0,
        slaHealth: projectForm.slaHealth || 'OnTrack',
      };

      if (editingProject) {
        const res = await apiClient.put(ENDPOINTS.ADMIN.PROJECT_DETAIL(editingProject.id), payload);
        if (res && res.success) {
          showToast(`Project "${projectForm.name}" updated successfully!`, 'success');
          setShowProjectModal(false);
          await loadData();
        }
      } else {
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

  // ── Exam Type Handlers ───────────────────────────────────────────────────
  const handleOpenAddExamType = () => {
    setEditingExamType(null);
    setExamTypeForm({
      ...initialExamTypeForm,
      projectId: etProjectFilter || projects[0]?.id || '',
    });
    setShowExamTypeModal(true);
  };

  const handleOpenEditExamType = (et) => {
    setEditingExamType(et);
    setExamTypeForm({
      projectId: et.projectId,
      examCode: et.examCode,
      examTypeName: et.examTypeName,
      description: et.description || '',
      isActive: et.isActive ?? true,
    });
    setShowExamTypeModal(true);
  };

  const handleSaveExamType = async (e) => {
    e.preventDefault();
    if (!examTypeForm.projectId || !examTypeForm.examCode?.trim() || !examTypeForm.examTypeName?.trim()) {
      showToast('Please select Project, and enter Exam Code and Name', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        projectId: examTypeForm.projectId,
        examCode: examTypeForm.examCode.trim(),
        examTypeName: examTypeForm.examTypeName.trim(),
        description: examTypeForm.description || undefined,
        isActive: examTypeForm.isActive,
      };

      if (editingExamType) {
        const res = await apiClient.put(ENDPOINTS.ADMIN.EXAM_TYPE_DETAIL(editingExamType.id), payload);
        if (res?.success) {
          showToast(`Exam Type "${examTypeForm.examTypeName}" updated!`, 'success');
          setShowExamTypeModal(false);
          await loadData();
        }
      } else {
        const res = await apiClient.post(ENDPOINTS.ADMIN.EXAM_TYPES, payload);
        if (res?.success) {
          showToast(`Exam Type "${examTypeForm.examTypeName}" created!`, 'success');
          setShowExamTypeModal(false);
          await loadData();
        }
      }
    } catch (err) {
      showToast(err.data?.error?.message || err.message || 'Failed to save exam type', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleExamTypeStatus = async (et) => {
    try {
      const res = await apiClient.patch(ENDPOINTS.ADMIN.EXAM_TYPE_STATUS(et.id), {
        isActive: !et.isActive,
      });
      if (res?.success) {
        showToast(`Exam Type "${et.examTypeName}" status updated`, 'success');
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update exam type status', 'error');
    }
  };

  const handleDeleteExamType = async (et) => {
    if (!window.confirm(`Delete Exam Type "${et.examTypeName}"? This will remove child exams and shifts.`)) return;
    try {
      const res = await apiClient.delete(ENDPOINTS.ADMIN.EXAM_TYPE_DETAIL(et.id));
      if (res?.success) {
        showToast(`Exam Type "${et.examTypeName}" deleted`, 'success');
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete exam type', 'error');
    }
  };

  // ── Exam Instance Handlers ───────────────────────────────────────────────
  const handleOpenAddExam = () => {
    setEditingExam(null);
    setExamForm({
      ...initialExamForm,
      examTypeId: exExamTypeFilter || examTypes[0]?.id || '',
      examYear: new Date().getFullYear(),
    });
    setShowExamModal(true);
  };

  const handleOpenEditExam = (ex) => {
    setEditingExam(ex);
    setExamForm({
      examTypeId: ex.examTypeId,
      examCode: ex.examCode,
      examName: ex.examName,
      examYear: ex.examYear || new Date().getFullYear(),
      description: ex.description || '',
      status: ex.status || 'Scheduled',
    });
    setShowExamModal(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!examForm.examTypeId || !examForm.examCode?.trim() || !examForm.examName?.trim()) {
      showToast('Please select Exam Type, and provide Exam Code and Name', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        examTypeId: examForm.examTypeId,
        examCode: examForm.examCode.trim(),
        examName: examForm.examName.trim(),
        examYear: Number(examForm.examYear) || new Date().getFullYear(),
        description: examForm.description || undefined,
        status: examForm.status,
      };

      if (editingExam) {
        const res = await apiClient.put(ENDPOINTS.ADMIN.EXAM_DETAIL(editingExam.id), payload);
        if (res?.success) {
          showToast(`Exam "${examForm.examName}" updated successfully!`, 'success');
          setShowExamModal(false);
          await loadData();
        }
      } else {
        const res = await apiClient.post(ENDPOINTS.ADMIN.EXAMS, payload);
        if (res?.success) {
          showToast(`Exam "${examForm.examName}" created successfully!`, 'success');
          setShowExamModal(false);
          await loadData();
        }
      }
    } catch (err) {
      showToast(err.data?.error?.message || err.message || 'Failed to save exam instance', 'error');
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

  // ── Filtered Collections ─────────────────────────────────────────────────
  const filteredProjects = projects.filter(p => {
    if (clientFilter && p.clientId !== clientFilter) return false;
    if (stageFilter && p.stage !== stageFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  const totalProjectPages = Math.ceil(filteredProjects.length / projectLimit) || 1;
  const paginatedProjects = filteredProjects.slice((projectPage - 1) * projectLimit, projectPage * projectLimit);

  const filteredExamTypes = examTypes.filter(et => {
    if (etClientFilter && et.project?.clientId !== etClientFilter) return false;
    if (etProjectFilter && et.projectId !== etProjectFilter) return false;
    return true;
  });

  const filteredExams = exams.filter(ex => {
    if (exClientFilter && ex.examType?.project?.clientId !== exClientFilter) return false;
    if (exProjectFilter && ex.examType?.projectId !== exProjectFilter) return false;
    if (exExamTypeFilter && ex.examTypeId !== exExamTypeFilter) return false;
    return true;
  });

  const totalCandidates = projects.reduce((acc, p) => acc + (Number(p.candidateTarget) || 0), 0);
  const totalCentresTarget = projects.reduce((acc, p) => acc + (Number(p.centreTarget) || 0), 0);
  const activeProjectsCount = projects.filter(p => p.status === 'Active').length;

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
              Manage examination projects, target candidates, venue capacity, exam types and examination shifts
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
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCalendarModal(true)}
                  title="Open Annual Examination Calendar"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <CalendarDays size={14} /> Annual Exam Calendar
                </button>
                <button className="btn btn-primary" onClick={handleOpenAddProject}>
                  <Plus size={14} /> Setup New Project
                </button>
              </>
            )}
            {activeTab === 'exam-types' && (
              <button className="btn btn-primary" onClick={handleOpenAddExamType}>
                <Plus size={14} /> Add Exam Type
              </button>
            )}
            {activeTab === 'exams' && (
              <button className="btn btn-primary" onClick={handleOpenAddExam}>
                <Plus size={14} /> New Exam Instance
              </button>
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

      {/* 3-Tier Project Governance Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <FolderOpen size={15} style={{ marginRight: 6, display: 'inline-block', verticalAlign: '-2px' }} />
          1. Projects ({projects.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'exam-types' ? 'active' : ''}`}
          onClick={() => setActiveTab('exam-types')}
        >
          <Layers size={15} style={{ marginRight: 6, display: 'inline-block', verticalAlign: '-2px' }} />
          2. Exam Types ({examTypes.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
          onClick={() => setActiveTab('exams')}
        >
          <BookOpen size={15} style={{ marginRight: 6, display: 'inline-block', verticalAlign: '-2px' }} />
          3. Examinations &amp; Shifts ({exams.length})
        </button>
      </div>

      {/* ── TAB 1: PROJECTS ────────────────────────────────────────────────── */}
      {activeTab === 'projects' && (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Active Projects</span>
                <div className="kpi-card__icon" style={{ background: '#eff6ff' }}>
                  <FolderOpen size={16} color="#1e40af" />
                </div>
              </div>
              <div className="kpi-card__value">{loading ? '...' : activeProjectsCount}</div>
              <div className="kpi-card__sub">Out of {projects.length} total projects</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Candidate Targets</span>
                <div className="kpi-card__icon" style={{ background: '#f0fdf4' }}>
                  <Users size={16} color="#16a34a" />
                </div>
              </div>
              <div className="kpi-card__value" style={{ color: 'var(--color-success, #16a34a)' }}>
                {loading ? '...' : totalCandidates.toLocaleString('en-IN')}
              </div>
              <div className="kpi-card__sub">Cumulative all active exams</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Centres Required</span>
                <div className="kpi-card__icon" style={{ background: '#faf5ff' }}>
                  <Building2 size={16} color="#7c3aed" />
                </div>
              </div>
              <div className="kpi-card__value" style={{ color: 'var(--color-purple, #7c3aed)' }}>
                {loading ? '...' : totalCentresTarget}
              </div>
              <div className="kpi-card__sub">Target venue capacity needed</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__label">Testing Clients</span>
                <div className="kpi-card__icon" style={{ background: '#fffbeb' }}>
                  <Award size={16} color="#d97706" />
                </div>
              </div>
              <div className="kpi-card__value" style={{ color: 'var(--color-warning, #d97706)' }}>
                {loading ? '...' : clients.length}
              </div>
              <div className="kpi-card__sub">Institutional clients in DB</div>
            </div>
          </div>

          {/* Table Card */}
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div style={{ position: 'relative', width: 'min(100%, 240px)' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search project name, code..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setProjectPage(1);
                  }}
                  style={{ paddingLeft: 30, fontSize: '0.8125rem' }}
                />
              </div>

              {/* Client Filter */}
              <select
                className="form-control"
                value={clientFilter}
                onChange={e => {
                  setClientFilter(e.target.value);
                  setProjectPage(1);
                }}
                style={{ width: 170, fontSize: '0.75rem' }}
              >
                <option value="">All Clients</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Stage Filter */}
              <select
                className="form-control"
                value={stageFilter}
                onChange={e => {
                  setStageFilter(e.target.value);
                  setProjectPage(1);
                }}
                style={{ width: 150, fontSize: '0.75rem' }}
              >
                <option value="">All Stages</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Status Filter */}
              <select
                className="form-control"
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setProjectPage(1);
                }}
                style={{ width: 130, fontSize: '0.75rem' }}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="OnHold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {(search || clientFilter || stageFilter || statusFilter) && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSearch('');
                    setClientFilter('');
                    setStageFilter('');
                    setStatusFilter('');
                    setProjectPage(1);
                  }}
                  style={{ fontSize: '0.75rem' }}
                >
                  Reset
                </button>
              )}

              <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Showing <strong>{paginatedProjects.length}</strong> of <strong>{filteredProjects.length}</strong> projects
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: 'center' }}>S. NO.</th>
                    <th style={{ width: 130 }}>PROJECT CODE</th>
                    <th style={{ minWidth: 170 }}>PROJECT NAME</th>
                    <th style={{ minWidth: 140 }}>ASSOCIATED CLIENT</th>
                    <th style={{ width: 110, textAlign: 'center' }}>EXAM TYPES</th>
                    <th style={{ width: 140 }}>CANDIDATE TARGETS</th>
                    <th style={{ minWidth: 150 }}>EXAMINATION DATES</th>
                    <th style={{ minWidth: 140 }}>COVERAGE</th>
                    <th style={{ width: 130 }}>LIFECYCLE STAGE</th>
                    <th style={{ width: 110 }}>STATUS</th>
                    <th style={{ width: 120, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                        Querying projects from MySQL database...
                      </td>
                    </tr>
                  ) : paginatedProjects.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No examination projects found matching current filters. Click &quot;Setup New Project&quot; to initialize one.
                      </td>
                    </tr>
                  ) : (
                    paginatedProjects.map((p, idx) => {
                      const serialNumber = (projectPage - 1) * projectLimit + idx + 1;
                      return (
                        <tr key={p.id}>
                          {/* 1. S. No. */}
                          <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                            {serialNumber}
                          </td>

                          {/* 2. Project Code */}
                          <td>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: 'var(--color-primary)',
                                background: 'rgba(30, 64, 175, 0.08)',
                                padding: '3px 6px',
                                borderRadius: 4,
                                cursor: 'pointer'
                              }}
                              title="Double-click to copy Project Code"
                              onDoubleClick={() => {
                                navigator.clipboard.writeText(p.projectCode);
                                showToast('Project Code copied to clipboard', 'success');
                              }}
                            >
                              {p.projectCode}
                            </span>
                          </td>

                          {/* 3. Project Name */}
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                            {p.description && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.description}
                              </div>
                            )}
                          </td>

                          {/* 4. Associated Client */}
                          <td>
                            <span className="badge badge-purple" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {p.client?.name || 'Client'}
                            </span>
                          </td>

                          {/* 5. Exam Types */}
                          <td style={{ textAlign: 'center' }}>
                            <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                              {p._count?.examTypes ?? examTypes.filter(et => et.projectId === p.id).length} Types
                            </span>
                          </td>

                          {/* 6. Candidate Targets */}
                          <td>
                            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                              {Number(p.candidateTarget || 0).toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* 7. Examination Dates */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.8125rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Calendar size={13} color="var(--text-muted)" />
                                <span>{p.examDate ? new Date(p.examDate).toLocaleDateString('en-IN') : 'TBD'}</span>
                              </div>
                              {p.examDates && p.examDates.length > 1 && (
                                <span className="badge badge-purple" style={{ fontSize: '0.625rem', width: 'fit-content' }}>
                                  +{p.examDates.length - 1} more ({p.examDates.length} shifts)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 8. Coverage */}
                          <td>
                            <div style={{ fontSize: '0.8125rem' }}>
                              <strong>{p.citiesCount || 0}</strong> cities • <strong>{p.centreTarget || 0}</strong> centres
                            </div>
                          </td>

                          {/* 9. Lifecycle Stage */}
                          <td>
                            <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                              {p.stage}
                            </span>
                          </td>

                          {/* 10. Status */}
                          <td>
                            <button
                              onClick={() => handleToggleProjectStatus(p)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              title="Click to toggle status"
                            >
                              <StatusBadge status={p.status} />
                            </button>
                          </td>

                          {/* 11. Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenViewProject(p)}
                                title="View Project Details"
                                style={{ padding: '5px 8px' }}
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenEditProject(p)}
                                title="Edit project parameters"
                                style={{ padding: '5px 8px' }}
                              >
                                <Edit size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="card-footer" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              padding: '12px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                <span>Rows per page:</span>
                <select
                  value={projectLimit}
                  onChange={(e) => {
                    setProjectLimit(Number(e.target.value));
                    setProjectPage(1);
                  }}
                  className="form-control"
                  style={{ width: 70, height: 32, padding: '2px 8px', fontSize: '0.8125rem' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>
                  Page <strong>{projectPage}</strong> of <strong>{totalProjectPages}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={projectPage <= 1 || loading}
                  onClick={() => setProjectPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalProjectPages) }, (_, i) => {
                  let pNum = i + 1;
                  if (totalProjectPages > 5 && projectPage > 3) {
                    pNum = projectPage - 2 + i;
                    if (pNum > totalProjectPages) pNum = totalProjectPages - (4 - i);
                  }
                  return (
                    <button
                      key={pNum}
                      className={`btn btn-sm ${projectPage === pNum ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setProjectPage(pNum)}
                      style={{ minWidth: 32, padding: '4px 8px' }}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={projectPage >= totalProjectPages || loading}
                  onClick={() => setProjectPage(p => Math.min(totalProjectPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TAB 3: EXAM TYPES ──────────────────────────────────────────────── */}
      {activeTab === 'exam-types' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 className="card-title">Examination Types Master</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Tier 3: Modular examination profiles defined under parent projects (e.g. SSC GD, SSC CHSL, MHCET)
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              {/* Client filter */}
              <select
                className="form-control"
                value={etClientFilter}
                onChange={e => {
                  setEtClientFilter(e.target.value);
                  setEtProjectFilter('');
                }}
                style={{ width: 160, fontSize: '0.75rem' }}
              >
                <option value="">All Clients</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              {/* Project filter */}
              <select
                className="form-control"
                value={etProjectFilter}
                onChange={e => setEtProjectFilter(e.target.value)}
                style={{ width: 200, fontSize: '0.75rem' }}
              >
                <option value="">All Projects</option>
                {projects
                  .filter(p => !etClientFilter || p.clientId === etClientFilter)
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.projectCode} – {p.name}</option>
                  ))}
              </select>

              <button className="btn btn-primary btn-sm" onClick={handleOpenAddExamType}>
                <Plus size={13} /> Add Exam Type
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Exam Code</th>
                  <th>Exam Type Name</th>
                  <th>Parent Project</th>
                  <th>Client</th>
                  <th>Exams Count</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Loading exam types from database...
                    </td>
                  </tr>
                ) : filteredExamTypes.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No examination types found. Click &quot;Add Exam Type&quot; to create one under a project.
                    </td>
                  </tr>
                ) : (
                  filteredExamTypes.map(et => (
                    <tr key={et.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {et.examCode}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{et.examTypeName}</div>
                        {et.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {et.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{et.project?.name || 'Project'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{et.project?.projectCode}</div>
                      </td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: '0.625rem' }}>
                          {et.project?.client?.name || 'Client'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: '0.6875rem' }}>
                          {et._count?.exams ?? 0} Instances
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleExamTypeStatus(et)}
                          className={`badge ${et.isActive ? 'badge-success' : 'badge-danger'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="Click to toggle active state"
                        >
                          {et.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditExamType(et)}
                            title="Edit Exam Type"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDeleteExamType(et)}
                            title="Delete Exam Type"
                            style={{ color: '#dc2626' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: EXAMINATIONS & SHIFTS ──────────────────────────────────── */}
      {activeTab === 'exams' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 className="card-title">Examinations &amp; Shifts Management</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Tier 4, 5 &amp; 6: Specific annual exam drives, testing dates, and examination shift schedules
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              {/* Client filter */}
              <select
                className="form-control"
                value={exClientFilter}
                onChange={e => {
                  setExClientFilter(e.target.value);
                  setExProjectFilter('');
                  setExExamTypeFilter('');
                }}
                style={{ width: 150, fontSize: '0.75rem' }}
              >
                <option value="">All Clients</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              {/* Project filter */}
              <select
                className="form-control"
                value={exProjectFilter}
                onChange={e => {
                  setExProjectFilter(e.target.value);
                  setExExamTypeFilter('');
                }}
                style={{ width: 180, fontSize: '0.75rem' }}
              >
                <option value="">All Projects</option>
                {projects
                  .filter(p => !exClientFilter || p.clientId === exClientFilter)
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.projectCode} – {p.name}</option>
                  ))}
              </select>

              {/* Exam Type filter */}
              <select
                className="form-control"
                value={exExamTypeFilter}
                onChange={e => setExExamTypeFilter(e.target.value)}
                style={{ width: 170, fontSize: '0.75rem' }}
              >
                <option value="">All Exam Types</option>
                {examTypes
                  .filter(et => !exProjectFilter || et.projectId === exProjectFilter)
                  .map(et => (
                    <option key={et.id} value={et.id}>{et.examCode} – {et.examTypeName}</option>
                  ))}
              </select>

              <button className="btn btn-primary btn-sm" onClick={handleOpenAddExam}>
                <Plus size={13} /> New Exam Instance
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Exam Code</th>
                  <th>Examination Instance</th>
                  <th>Exam Type</th>
                  <th>Project &amp; Client</th>
                  <th>Dates &amp; Shifts</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Loading examination instances from database...
                    </td>
                  </tr>
                ) : filteredExams.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No examination instances found. Click &quot;New Exam Instance&quot; to initialize an exam drive.
                    </td>
                  </tr>
                ) : (
                  filteredExams.map(ex => {
                    const datesCount = ex.dates?.length || 0;
                    const shiftsCount = ex.dates?.reduce((acc, d) => acc + (d.shifts?.length || 0), 0) || 0;
                    return (
                      <tr key={ex.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {ex.examCode}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{ex.examName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Year: {ex.examYear}</div>
                        </td>
                        <td>
                          <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>
                            {ex.examType?.examTypeName || ex.examType?.examCode || 'Type'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{ex.examType?.project?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {ex.examType?.project?.client?.name}
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleOpenDatesAndShifts(ex)}
                            style={{ fontSize: '0.75rem', padding: '3px 8px', gap: 6 }}
                          >
                            <Calendar size={13} />
                            <span>{datesCount} Dates · {shiftsCount} Shifts</span>
                          </button>
                        </td>
                        <td>
                          <StatusBadge status={ex.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleOpenDatesAndShifts(ex)}
                              title="Manage Dates & Shifts"
                            >
                              <Clock size={13} /> Manage Shifts
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEditExam(ex)}
                              title="Edit Exam"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDeleteExam(ex)}
                              title="Delete Exam"
                              style={{ color: '#dc2626' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL 1: PROJECT MODAL ─────────────────────────────────────────── */}
      {showProjectModal && (
        <div className="modal-backdrop" onClick={() => setShowProjectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingProject ? `Edit Project (${projectForm.projectCode})` : 'Setup Examination Project'}</h3>
              <button className="btn-ghost" onClick={() => setShowProjectModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProject} className="modal-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Project Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. PRJ-001"
                      value={projectForm.projectCode}
                      onChange={e => setProjectForm({ ...projectForm, projectCode: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Associated Client *</label>
                    <select
                      className="form-control"
                      required
                      value={projectForm.clientId}
                      onChange={e => setProjectForm({ ...projectForm, clientId: e.target.value })}
                    >
                      <option value="">Select an active client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.fullName ? `(${c.fullName})` : ''} {c.status === 'Inactive' ? '[Inactive]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Project Title / Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. SSC Project / MHCET Project"
                    value={projectForm.name}
                    onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Scope, objectives, mandate..."
                    value={projectForm.description}
                    onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Exam Type *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. CBT Examination"
                    value={projectForm.examType}
                    onChange={e => setProjectForm({ ...projectForm, examType: e.target.value })}
                  />
                </div>

                {/* Multiple Examination Dates Configuration */}
                <div style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={16} color="var(--color-primary)" />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        Examination Schedule & Dates
                      </span>
                      <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>
                        {projectForm.examDates?.length || 0} {(projectForm.examDates?.length || 0) === 1 ? 'Date' : 'Dates'} Configured
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddDateRow}
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Plus size={13} /> Add Exam Date
                    </button>
                  </div>

                  {(!projectForm.examDates || projectForm.examDates.length === 0) ? (
                    <div style={{
                      padding: '16px',
                      textAlign: 'center',
                      background: 'var(--bg-surface, #ffffff)',
                      border: '1px dashed var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                      fontSize: '0.8125rem'
                    }}>
                      No examination dates scheduled yet. Click <strong>"Add Exam Date"</strong> above to schedule multiple dates and shifts for this project.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                      {projectForm.examDates.map((row, idx) => (
                        <div
                          key={row.id || idx}
                          className="exam-date-row"
                        >
                          <div className="exam-date-col-full">
                            <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                              Exam Date *
                            </label>
                            <input
                              type="date"
                              required
                              className="form-control"
                              style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                              value={row.examDate}
                              onChange={e => handleDateRowChange(idx, 'examDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                              Shift *
                            </label>
                            <select
                              className="form-control"
                              style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                              value={row.shift}
                              onChange={e => handleDateRowChange(idx, 'shift', e.target.value)}
                            >
                              <option value="Shift 1">Shift 1 (Morning)</option>
                              <option value="Shift 2">Shift 2 (Afternoon)</option>
                              <option value="Shift 3">Shift 3 (Evening)</option>
                              <option value="Single Shift">Single Shift</option>
                              <option value="Shift 4">Shift 4 (Night)</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                              Start Time
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="09:00 AM"
                              style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                              value={row.startTime || ''}
                              onChange={e => handleDateRowChange(idx, 'startTime', e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                              End Time
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="12:00 PM"
                              style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                              value={row.endTime || ''}
                              onChange={e => handleDateRowChange(idx, 'endTime', e.target.value)}
                            />
                          </div>
                          <div className="exam-date-col-actions" style={{ paddingTop: 16 }}>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => handleRemoveDateRow(idx)}
                              title="Remove exam date"
                              style={{ padding: '6px', color: 'var(--color-danger, #ef4444)' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Candidate Target</label>
                    <input
                      type="number"
                      className="form-control"
                      value={projectForm.candidateTarget}
                      onChange={e => setProjectForm({ ...projectForm, candidateTarget: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Centre Target</label>
                    <input
                      type="number"
                      className="form-control"
                      value={projectForm.centreTarget}
                      onChange={e => setProjectForm({ ...projectForm, centreTarget: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Cities</label>
                    <input
                      type="number"
                      className="form-control"
                      value={projectForm.citiesCount}
                      onChange={e => setProjectForm({ ...projectForm, citiesCount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Lifecycle Stage</label>
                    <select
                      className="form-control"
                      value={projectForm.stage}
                      onChange={e => setProjectForm({ ...projectForm, stage: e.target.value })}
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project Status</label>
                    <select
                      className="form-control"
                      value={projectForm.status}
                      onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="OnHold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingProject ? 'Save Project' : 'Launch Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW PROJECT MODAL ──────────────────────────────────────────────── */}
      {showViewProjectModal && viewingProject && (
        <div className="modal-backdrop" onClick={() => setShowViewProjectModal(false)}>
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
                onClick={() => setShowViewProjectModal(false)}
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Primary Exam Type</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{viewingProject.examType || 'CBT'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Candidates</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginTop: 2 }}>
                    {Number(viewingProject.candidateTarget || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Coverage Target</div>
                  <div style={{ marginTop: 2, fontSize: '0.8125rem' }}>
                    <strong>{viewingProject.citiesCount || 0}</strong> Cities • <strong>{viewingProject.centreTarget || 0}</strong> Centres
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scheduled Exam Date</div>
                  <div style={{ marginTop: 2, fontSize: '0.8125rem' }}>
                    {viewingProject.examDate ? new Date(viewingProject.examDate).toLocaleDateString('en-IN') : 'TBD'}
                  </div>
                </div>
              </div>

              {viewingProject.description && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Scope & Objectives</div>
                  <div style={{ fontSize: '0.8125rem', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                    {viewingProject.description}
                  </div>
                </div>
              )}

              {/* Exam Shifts */}
              {viewingProject.examDates && viewingProject.examDates.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Configured Examination Shifts</div>
                  <div className="table-wrapper" style={{ maxHeight: 180, overflowY: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Shift</th>
                          <th>Timings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingProject.examDates.map((ed, idx) => (
                          <tr key={ed.id || idx}>
                            <td>{ed.examDate ? new Date(ed.examDate).toLocaleDateString('en-IN') : '—'}</td>
                            <td><span className="badge badge-purple">{ed.shift}</span></td>
                            <td>{ed.startTime || '09:00 AM'} – {ed.endTime || '12:00 PM'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowViewProjectModal(false);
                  handleOpenEditProject(viewingProject);
                }}
              >
                <Edit size={13} /> Edit Project
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowViewProjectModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: EXAM TYPE MODAL ───────────────────────────────────────── */}
      {showExamTypeModal && (
        <div className="modal-backdrop" onClick={() => setShowExamTypeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingExamType ? `Edit Exam Type: ${examTypeForm.examCode}` : 'Create Examination Type'}</h3>
              <button className="btn-ghost" onClick={() => setShowExamTypeModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveExamType}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Parent Project *</label>
                  <select
                    className="form-control"
                    required
                    value={examTypeForm.projectId}
                    onChange={e => setExamTypeForm({ ...examTypeForm, projectId: e.target.value })}
                  >
                    <option value="">Select project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.client?.name} — {p.projectCode} ({p.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Exam Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. SSC-GD, MHCET, EDCIL"
                      value={examTypeForm.examCode}
                      onChange={e => setExamTypeForm({ ...examTypeForm, examCode: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Exam Type Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. SSC GD (General Duty)"
                      value={examTypeForm.examTypeName}
                      onChange={e => setExamTypeForm({ ...examTypeForm, examTypeName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Syllabus, qualification, exam scheme..."
                    value={examTypeForm.description}
                    onChange={e => setExamTypeForm({ ...examTypeForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="etIsActive"
                    checked={examTypeForm.isActive}
                    onChange={e => setExamTypeForm({ ...examTypeForm, isActive: e.target.checked })}
                  />
                  <label htmlFor="etIsActive" style={{ fontSize: '0.8125rem', cursor: 'pointer', userSelect: 'none' }}>
                    Active for candidate registrations and bookings
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExamTypeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingExamType ? 'Update Exam Type' : 'Create Exam Type'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: EXAM INSTANCE MODAL ───────────────────────────────────── */}
      {showExamModal && (
        <div className="modal-backdrop" onClick={() => setShowExamModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingExam ? `Edit Exam: ${examForm.examName}` : 'Initialize Examination Drive'}</h3>
              <button className="btn-ghost" onClick={() => setShowExamModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveExam}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Examination Type *</label>
                  <select
                    className="form-control"
                    required
                    value={examForm.examTypeId}
                    onChange={e => setExamForm({ ...examForm, examTypeId: e.target.value })}
                  >
                    <option value="">Select exam type...</option>
                    {examTypes.map(et => (
                      <option key={et.id} value={et.id}>
                        {et.project?.client?.name} → {et.examCode} ({et.examTypeName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Exam Instance Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. SSC-GD-2027"
                      value={examForm.examCode}
                      onChange={e => setExamForm({ ...examForm, examCode: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Exam Year *</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      min={2020}
                      max={2040}
                      value={examForm.examYear}
                      onChange={e => setExamForm({ ...examForm, examYear: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Examination Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. SSC GD Constable Examination 2027"
                    value={examForm.examName}
                    onChange={e => setExamForm({ ...examForm, examName: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-control"
                      value={examForm.status}
                      onChange={e => setExamForm({ ...examForm, status: e.target.value })}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="InProgress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Notification number, batch..."
                      value={examForm.description}
                      onChange={e => setExamForm({ ...examForm, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExamModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingExam ? 'Save Exam' : 'Create Exam'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 5: DATES & SHIFTS MANAGER ───────────────────────────────── */}
      {managingExamShifts && (
        <div className="modal-backdrop" onClick={() => setManagingExamShifts(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 780, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Exam Dates &amp; Shifts Management</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {managingExamShifts.examName} ({managingExamShifts.examCode})
                </p>
              </div>
              <button className="btn-ghost" onClick={() => setManagingExamShifts(null)} style={{ padding: 4 }}>
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
                onClick={() => setManagingExamShifts(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Annual Examination Calendar Modal */}
      {showCalendarModal && (
        <ExamCalendarModal onClose={() => setShowCalendarModal(false)} />
      )}
    </div>
  );
}
