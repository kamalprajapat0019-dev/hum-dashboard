import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { AdminController } from './admin.controller.js';
import {
  analyticsQuerySchema,
  userQuerySchema,
  createUserSchema,
  updateUserSchema,
  inviteUserSchema,
  clientQuerySchema,
  createClientSchema,
  updateClientSchema,
  updateClientStatusSchema,
  projectQuerySchema,
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  calendarQuerySchema,
  examTypeQuerySchema,
  createExamTypeSchema,
  updateExamTypeSchema,
  updateExamTypeStatusSchema,
  examQuerySchema,
  createExamSchema,
  updateExamSchema,
  createExamDateSchema,
  createExamShiftSchema,
  importRequirementSheetSchema,
  centreQuerySchema,
  createCentreSchema,
  updateCentreSchema,
  updateCentreStatusSchema,
  blacklistCentreSchema,
  overrideEligibilitySchema,
  updateConfigSchema,
} from './admin.schemas.js';

const router = Router();

// Protect ALL admin routes with Authentication
router.use(authMiddleware);

// Executive Analytics (Admin only)
router.get('/analytics', requireRole(Role.ADMIN), validateRequest({ query: analyticsQuerySchema }), AdminController.getAnalytics);

// Client Management
router.get('/clients/summary', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.getClientsSummary);
router.get('/clients', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), validateRequest({ query: clientQuerySchema }), AdminController.listClients);
router.post('/clients', requireRole(Role.ADMIN), validateRequest({ body: createClientSchema }), AdminController.createClient);
router.get('/clients/:id', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.getClientById);
router.put('/clients/:id', requireRole(Role.ADMIN), validateRequest({ body: updateClientSchema }), AdminController.updateClient);
router.patch('/clients/:id/status', requireRole(Role.ADMIN), validateRequest({ body: updateClientStatusSchema }), AdminController.updateClientStatus);

// User Management (Admin only)
router.get('/users/summary', requireRole(Role.ADMIN), AdminController.getUserSummary);
router.get('/users', requireRole(Role.ADMIN), validateRequest({ query: userQuerySchema }), AdminController.listUsers);
router.post('/users', requireRole(Role.ADMIN), validateRequest({ body: createUserSchema }), AdminController.createUser);
router.get('/users/:id', requireRole(Role.ADMIN), AdminController.getUserById);
router.put('/users/:id', requireRole(Role.ADMIN), validateRequest({ body: updateUserSchema }), AdminController.updateUser);
router.patch('/users/:id', requireRole(Role.ADMIN), validateRequest({ body: updateUserSchema }), AdminController.updateUser);
router.delete('/users/:id', requireRole(Role.ADMIN), AdminController.deleteUser);
router.post('/users/:id/activate', requireRole(Role.ADMIN), AdminController.activateUser);
router.post('/users/:id/deactivate', requireRole(Role.ADMIN), AdminController.deactivateUser);
router.post('/users/:id/reset-password', requireRole(Role.ADMIN), AdminController.initiatePasswordReset);
router.post('/users/invite', requireRole(Role.ADMIN), validateRequest({ body: inviteUserSchema }), AdminController.inviteUser);
router.get('/allowed-domains', requireRole(Role.ADMIN), AdminController.getAllowedDomains);
router.post('/allowed-domains', requireRole(Role.ADMIN), AdminController.addAllowedDomain);

// Project Management
router.get('/projects/summary', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.getProjectSummary);
router.get('/projects/next-code', requireRole(Role.ADMIN, Role.PM), AdminController.getNextProjectCode);
router.get('/projects', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), validateRequest({ query: projectQuerySchema }), AdminController.listProjects);
router.post('/projects', requireRole(Role.ADMIN, Role.PM), validateRequest({ body: createProjectSchema }), AdminController.createProject);
router.get('/projects/:id', requireRole(Role.ADMIN, Role.PM), AdminController.getProjectById);
router.put('/projects/:id', requireRole(Role.ADMIN, Role.PM), validateRequest({ body: updateProjectSchema }), AdminController.updateProject);
router.patch('/projects/:id/status', requireRole(Role.ADMIN, Role.PM), validateRequest({ body: updateProjectStatusSchema }), AdminController.updateProjectStatus);

// Annual Examination Calendar Synchronization
router.get('/calendar', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), validateRequest({ query: calendarQuerySchema }), AdminController.getCalendarExams);
router.get('/calendar/exams', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), validateRequest({ query: calendarQuerySchema }), AdminController.getCalendarExams);

// Exam Types Management
router.get('/exam-types', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), validateRequest({ query: examTypeQuerySchema }), AdminController.listExamTypes);
router.post('/exam-types', requireRole(Role.ADMIN), validateRequest({ body: createExamTypeSchema }), AdminController.createExamType);
router.get('/exam-types/:id', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.getExamTypeById);
router.put('/exam-types/:id', requireRole(Role.ADMIN), validateRequest({ body: updateExamTypeSchema }), AdminController.updateExamType);
router.patch('/exam-types/:id/status', requireRole(Role.ADMIN), validateRequest({ body: updateExamTypeStatusSchema }), AdminController.updateExamTypeStatus);
router.delete('/exam-types/:id', requireRole(Role.ADMIN), AdminController.deleteExamType);

// Exam Instances Management
router.get('/exams/summary', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.getExamsSummary);
router.get('/exams', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), validateRequest({ query: examQuerySchema }), AdminController.listExams);
router.post('/exams', requireRole(Role.ADMIN, Role.PM), validateRequest({ body: createExamSchema }), AdminController.createExam);
router.get('/exams/:id', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.getExamById);
router.put('/exams/:id', requireRole(Role.ADMIN, Role.PM), validateRequest({ body: updateExamSchema }), AdminController.updateExam);
router.delete('/exams/:id', requireRole(Role.ADMIN), AdminController.deleteExam);
router.post('/exams/:id/requirement-sheet', requireRole(Role.ADMIN, Role.PM), validateRequest({ body: importRequirementSheetSchema }), AdminController.importRequirementSheet);
router.get('/exams/:id/requirement-sheet', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.getExamRequirementSheet);
router.get('/exams/:id/requirement-sheet/download', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.downloadExamRequirementSheet);
router.get('/exams/:id/summary', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.getExamSummary);
router.post('/exams/:id/summary/sync', requireRole(Role.ADMIN, Role.PM), AdminController.syncExamSummary);

// Exam Dates Management
router.get('/exams/:examId/dates', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.listExamDates);
router.post('/exams/:examId/dates', requireRole(Role.ADMIN, Role.PM), validateRequest({ body: createExamDateSchema }), AdminController.createExamDate);
router.delete('/exams/dates/:dateId', requireRole(Role.ADMIN), AdminController.deleteExamDate);

// Exam Shifts Management
router.get('/exams/dates/:dateId/shifts', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.listExamShifts);
router.post('/exams/dates/:dateId/shifts', requireRole(Role.ADMIN, Role.PM), validateRequest({ body: createExamShiftSchema }), AdminController.createExamShift);
router.delete('/exams/shifts/:shiftId', requireRole(Role.ADMIN), AdminController.deleteExamShift);

// Centre Management (Overview & Lifecycle per OEMP PDF)
router.get('/centres/summary', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.getCentresSummary);
router.get('/centres', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), validateRequest({ query: centreQuerySchema }), AdminController.listCentres);
router.post('/centres', requireRole(Role.ADMIN, Role.OPERATIONS), validateRequest({ body: createCentreSchema }), AdminController.createCentre);
router.get('/centres/:id', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.getCentreById);
router.get('/centres/:id/profile', requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS), AdminController.getCentreProfile);
router.put('/centres/:id', requireRole(Role.ADMIN, Role.OPERATIONS), validateRequest({ body: updateCentreSchema }), AdminController.updateCentre);
router.patch(
  '/centres/:id/status',
  requireRole(Role.ADMIN, Role.OPERATIONS),
  validateRequest({ body: updateCentreStatusSchema }),
  AdminController.updateCentreStatus
);
router.post('/centres/:id/verify-document', requireRole(Role.ADMIN, Role.OPERATIONS), AdminController.verifyDocument);
router.post('/centres/:id/verify-bank', requireRole(Role.ADMIN, Role.OPERATIONS), AdminController.verifyBank);
router.post('/centres/:id/approve', requireRole(Role.ADMIN), AdminController.approveApplication);
router.post('/centres/:id/reject', requireRole(Role.ADMIN), AdminController.rejectApplication);
router.post('/centres/:id/assign-auditor', requireRole(Role.ADMIN, Role.OPERATIONS), AdminController.assignAuditor);

// Eligibility & Blacklist Oversight (Admin only)
router.post(
  '/eligibility/blacklist',
  requireRole(Role.ADMIN),
  validateRequest({ body: blacklistCentreSchema }),
  AdminController.blacklistCentre
);
router.post(
  '/eligibility/override',
  requireRole(Role.ADMIN),
  validateRequest({ body: overrideEligibilitySchema }),
  AdminController.overrideEligibility
);

// Audit Trail & System Configuration (Admin only)
router.get('/audit-logs', requireRole(Role.ADMIN), AdminController.getAuditLogs);
router.get('/config', requireRole(Role.ADMIN), AdminController.getSystemConfigs);
router.put(
  '/config/:key',
  requireRole(Role.ADMIN),
  validateRequest({ body: updateConfigSchema }),
  AdminController.updateSystemConfig
);

export default router;
