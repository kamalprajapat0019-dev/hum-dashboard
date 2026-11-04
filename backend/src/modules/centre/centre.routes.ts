import { Router } from 'express';
import { Role } from '@prisma/client';
import { CentreController } from './centre.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

// Protect all centre routes
router.use(authMiddleware);
router.use(requireRole(Role.CENTRE, Role.ADMIN, Role.OPERATIONS));

router.get('/my-centre', CentreController.getMyCentre);
router.post('/draft', CentreController.saveDraft);
router.post('/documents/upload', CentreController.uploadDocument);
router.post('/submit', CentreController.submitRegistration);
router.get('/status', CentreController.getStatus);

export default router;
