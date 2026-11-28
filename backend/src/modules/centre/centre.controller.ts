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

  static async uploadMediaAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const asset = await CentreService.uploadMediaAsset(
        req.user!.userId,
        req.user!.email,
        req.user!.role,
        req.body
      );
      sendSuccess(res, asset, 201, { message: 'Media asset uploaded successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Media upload failed';
      sendError(res, 400, 'MEDIA_UPLOAD_FAILED', msg);
    }
  }

  static async getMediaAssetDownload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const assetId = req.params.assetId as string;
      const result = await CentreService.getMediaAssetDownload(
        req.user!.userId,
        req.user!.role,
        assetId
      );
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to access media asset';
      sendError(res, 403, 'MEDIA_ACCESS_DENIED', msg);
    }
  }

  static async getDocumentDownload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const docId = req.params.docId as string;
      const result = await CentreService.getDocumentDownload(
        req.user!.userId,
        req.user!.role,
        docId
      );
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download document';
      sendError(res, 403, 'DOC_ACCESS_DENIED', msg);
    }
  }

  static async deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const docId = req.params.docId as string;
      const result = await CentreService.deleteDocument(
        req.user!.userId,
        req.user!.role,
        req.user!.email,
        docId
      );
      sendSuccess(res, result, 200, { message: 'Document deleted successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete document';
      sendError(res, 400, 'DOC_DELETE_FAILED', msg);
    }
  }

  static async updateSubmoduleReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const review = await CentreService.updateSubmoduleReview(
        req.user!.userId,
        req.user!.role,
        req.user!.email,
        req.body
      );
      sendSuccess(res, review, 200, { message: 'Submodule review status updated successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submodule review update failed';
      sendError(res, 400, 'REVIEW_UPDATE_FAILED', msg);
    }
  }

  static async getSubmoduleReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const reviews = await CentreService.getSubmoduleReviews(
        req.user!.userId,
        req.user!.role,
        req.query.centreId as string
      );
      sendSuccess(res, reviews);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve submodule reviews';
      sendError(res, 500, 'REVIEWS_RETRIEVAL_ERROR', msg);
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

  static async getInvitations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AdminService.listCentreInvitations(req.query as any);
      sendSuccess(res, result.items, 200, result.meta);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve centre invitations';
      sendError(res, 500, 'INVITATION_RETRIEVAL_ERROR', msg);
    }
  }

  static async recordFollowUp(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AdminService.recordInvitationFollowUp(
        String(req.params.id),
        req.body.action,
        req.body.notes,
        req.user?.userId,
        req.user?.email
      );
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record invitation follow-up';
      sendError(res, 400, 'FOLLOW_UP_FAILED', msg);
    }
  }

  static async resendInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AdminService.resendCentreInvitation(
        String(req.params.id),
        req.user?.userId,
        req.user?.email
      );
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend sign-up link';
      sendError(res, 400, 'RESEND_INVITATION_FAILED', msg);
    }
  }
}
