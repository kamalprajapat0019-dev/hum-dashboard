import { Router } from 'express';
import { Role } from '@prisma/client';
import { CentreController } from './centre.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  saveDraftSchema,
  uploadDocumentSchema,
  inviteCentreUserSchema,
} from './centre.schemas.js';

const router = Router();

// Protect all centre routes
router.use(authMiddleware);
router.use(requireRole(Role.CENTRE, Role.ADMIN, Role.OPERATIONS, Role.PM));

router.get('/my-centre', CentreController.getMyCentre);
router.post('/draft', validateRequest({ body: saveDraftSchema }), CentreController.saveDraft);
router.post('/documents/upload', validateRequest({ body: uploadDocumentSchema }), CentreController.uploadDocument);
router.post('/submit', CentreController.submitRegistration);
router.get('/status', CentreController.getStatus);
router.post('/invite-user', validateRequest({ body: inviteCentreUserSchema }), CentreController.inviteCentreUser);

export default router;
