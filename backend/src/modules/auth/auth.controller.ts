import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const ip = req.ip || req.socket.remoteAddress;
      const result = await AuthService.login(req.body, ip);

      if (!result.success) {
        sendError(res, 401, result.code, result.message);
        return;
      }

      sendSuccess(res, {
        token: result.token,
        user: result.user,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication service error';
      sendError(res, 500, 'AUTH_ERROR', msg);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'UNAUTHORIZED', 'Not authenticated');
        return;
      }

      const profile = await AuthService.getMe(req.user.userId);
      if (!profile) {
        sendError(res, 404, 'USER_NOT_FOUND', 'User profile not found');
        return;
      }

      sendSuccess(res, profile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve profile';
      sendError(res, 500, 'PROFILE_ERROR', msg);
    }
  }

  static async logout(_req: AuthenticatedRequest, res: Response): Promise<void> {
    sendSuccess(res, { message: 'Logged out successfully' });
  }
}
