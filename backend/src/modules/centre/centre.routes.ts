import { Router } from 'express';
import { Role } from '@prisma/client';
import { CentreController } from './centre.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  saveDraftSchema,
  uploadDocumentSchema,
  uploadMediaAssetSchema,
  reviewSubmoduleSchema,
  inviteCentreUserSchema,
} from './centre.schemas.js';

const router = Router();

// Protect all centre routes
router.use(authMiddleware);
router.use(requireRole(Role.CENTRE, Role.ADMIN, Role.OPERATIONS, Role.PM, Role.AUDITOR));

// Core Centre Profile & Draft Routes
router.get('/my-centre', CentreController.getMyCentre);
router.post('/draft', validateRequest({ body: saveDraftSchema }), CentreController.saveDraft);
router.post('/documents/upload', validateRequest({ body: uploadDocumentSchema }), CentreController.uploadDocument);
router.post('/media/upload', validateRequest({ body: uploadMediaAssetSchema }), CentreController.uploadMediaAsset);
router.get('/media/:assetId', CentreController.getMediaAssetDownload);
router.get('/documents/:docId/download', CentreController.getDocumentDownload);
router.delete('/documents/:docId', CentreController.deleteDocument);

// Submodule & Section State Machine Reviews
router.get('/submodules/reviews', CentreController.getSubmoduleReviews);
router.post(
  '/submodules/review',
  requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS, Role.AUDITOR),
  validateRequest({ body: reviewSubmoduleSchema }),
  CentreController.updateSubmoduleReview
);

// Registration & Application Status
router.post('/submit', CentreController.submitRegistration);
router.get('/status', CentreController.getStatus);
router.post(
  '/invite-user',
  requireRole(Role.ADMIN, Role.PM, Role.OPERATIONS),
  validateRequest({ body: inviteCentreUserSchema }),
  CentreController.inviteCentreUser
);

export default router;
