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
  centreQuerySchema,
  createCentreSchema,
  updateCentreSchema,
  updateCentreStatusSchema,
  blacklistCentreSchema,
  overrideEligibilitySchema,
  updateConfigSchema,
} from './admin.schemas.js';

const router = Router();

// Protect ALL admin routes with Auth + Admin Role Check
router.use(authMiddleware);
router.use(requireRole(Role.ADMIN));

// Executive Analytics
router.get('/analytics', validateRequest({ query: analyticsQuerySchema }), AdminController.getAnalytics);

// Client Management
router.get('/clients', validateRequest({ query: clientQuerySchema }), AdminController.listClients);
router.post('/clients', validateRequest({ body: createClientSchema }), AdminController.createClient);
router.get('/clients/:id', AdminController.getClientById);
router.put('/clients/:id', validateRequest({ body: updateClientSchema }), AdminController.updateClient);
router.patch('/clients/:id/status', validateRequest({ body: updateClientStatusSchema }), AdminController.updateClientStatus);

// User Management
router.get('/users', validateRequest({ query: userQuerySchema }), AdminController.listUsers);
router.post('/users', validateRequest({ body: createUserSchema }), AdminController.createUser);
router.get('/users/:id', AdminController.getUserById);
router.put('/users/:id', validateRequest({ body: updateUserSchema }), AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);

// Project Management
router.get('/projects', validateRequest({ query: projectQuerySchema }), AdminController.listProjects);
router.post('/projects', validateRequest({ body: createProjectSchema }), AdminController.createProject);
router.get('/projects/:id', AdminController.getProjectById);
router.put('/projects/:id', validateRequest({ body: updateProjectSchema }), AdminController.updateProject);
router.patch('/projects/:id/status', validateRequest({ body: updateProjectStatusSchema }), AdminController.updateProjectStatus);

// Annual Examination Calendar Synchronization
router.get('/calendar', validateRequest({ query: calendarQuerySchema }), AdminController.getCalendarExams);
router.get('/calendar/exams', validateRequest({ query: calendarQuerySchema }), AdminController.getCalendarExams);

// Exam Types Management
router.get('/exam-types', validateRequest({ query: examTypeQuerySchema }), AdminController.listExamTypes);
router.post('/exam-types', validateRequest({ body: createExamTypeSchema }), AdminController.createExamType);
router.get('/exam-types/:id', AdminController.getExamTypeById);
router.put('/exam-types/:id', validateRequest({ body: updateExamTypeSchema }), AdminController.updateExamType);
router.patch('/exam-types/:id/status', validateRequest({ body: updateExamTypeStatusSchema }), AdminController.updateExamTypeStatus);
router.delete('/exam-types/:id', AdminController.deleteExamType);

// Exam Instances Management
router.get('/exams', validateRequest({ query: examQuerySchema }), AdminController.listExams);
router.post('/exams', validateRequest({ body: createExamSchema }), AdminController.createExam);
router.get('/exams/:id', AdminController.getExamById);
router.put('/exams/:id', validateRequest({ body: updateExamSchema }), AdminController.updateExam);
router.delete('/exams/:id', AdminController.deleteExam);

// Exam Dates Management
router.get('/exams/:examId/dates', AdminController.listExamDates);
router.post('/exams/:examId/dates', validateRequest({ body: createExamDateSchema }), AdminController.createExamDate);
router.delete('/exams/dates/:dateId', AdminController.deleteExamDate);

// Exam Shifts Management
router.get('/exams/dates/:dateId/shifts', AdminController.listExamShifts);
router.post('/exams/dates/:dateId/shifts', validateRequest({ body: createExamShiftSchema }), AdminController.createExamShift);
router.delete('/exams/shifts/:shiftId', AdminController.deleteExamShift);

// Centre Management
router.get('/centres', validateRequest({ query: centreQuerySchema }), AdminController.listCentres);
router.post('/centres', validateRequest({ body: createCentreSchema }), AdminController.createCentre);
router.get('/centres/:id', AdminController.getCentreById);
router.put('/centres/:id', validateRequest({ body: updateCentreSchema }), AdminController.updateCentre);
router.patch(
  '/centres/:id/status',
  validateRequest({ body: updateCentreStatusSchema }),
  AdminController.updateCentreStatus
);

// Eligibility & Blacklist Oversight
router.post(
  '/eligibility/blacklist',
  validateRequest({ body: blacklistCentreSchema }),
  AdminController.blacklistCentre
);
router.post(
  '/eligibility/override',
  validateRequest({ body: overrideEligibilitySchema }),
  AdminController.overrideEligibility
);

// Audit Trail & System Configuration
router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/config', AdminController.getSystemConfigs);
router.put(
  '/config/:key',
  validateRequest({ body: updateConfigSchema }),
  AdminController.updateSystemConfig
);

export default router;
