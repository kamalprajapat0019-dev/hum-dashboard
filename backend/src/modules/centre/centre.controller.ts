import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { CentreService } from './centre.service.js';
import { AdminService } from '../admin/admin.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class CentreController {
  static async getMyCentre(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await CentreService.getMyCentre(req.user!.userId);
      sendSuccess(res, data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve centre profile';
      sendError(res, 500, 'CENTRE_PROFILE_ERROR', msg);
    }
  }

  static async saveDraft(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const centre = await CentreService.saveDraft(
        req.user!.userId,
        req.user!.email,
        req.body
      );
      sendSuccess(res, centre, 200, { message: 'Draft saved successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save draft';
      sendError(res, 400, 'SAVE_DRAFT_FAILED', msg);
    }
  }

  static async uploadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const doc = await CentreService.uploadDocument(
        req.user!.userId,
        req.user!.email,
        req.body
      );
      sendSuccess(res, doc, 201, { message: 'Document uploaded successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Document upload failed';
      sendError(res, 400, 'UPLOAD_FAILED', msg);
    }
  }

  static async submitRegistration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await CentreService.submitRegistration(
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, result.centre, 200, { message: result.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      sendError(res, 400, 'SUBMISSION_FAILED', msg);
    }
  }

  static async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const statusData = await CentreService.getApplicationStatus(req.user!.userId);
      sendSuccess(res, statusData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve application status';
      sendError(res, 500, 'STATUS_RETRIEVAL_ERROR', msg);
    }
  }

  static async inviteCentreUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AdminService.inviteCentreUser(
        req.body,
        req.user!.userId,
        req.user!.email,
        req.user?.role as any
      );
      sendSuccess(res, result, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send centre user invitation';
      sendError(res, 400, 'INVITATION_FAILED', msg);
    }
  }
}

