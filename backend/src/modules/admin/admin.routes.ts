import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { AdminController } from './admin.controller.js';
import {
  userQuerySchema,
  createUserSchema,
  updateUserSchema,
  projectQuerySchema,
  createProjectSchema,
  updateProjectSchema,
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
router.get('/analytics', AdminController.getAnalytics);

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
