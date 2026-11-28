import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { AdminService } from '../admin/admin.service.js';
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
        refreshToken: result.refreshToken,
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

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.body?.refreshToken || req.headers['x-refresh-token'];
      if (!refreshToken || typeof refreshToken !== 'string') {
        sendError(res, 400, 'MISSING_REFRESH_TOKEN', 'Refresh token is required');
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);
      if (!result.success) {
        sendError(res, 401, result.code, result.message);
        return;
      }

      sendSuccess(res, {
        token: result.token,
        refreshToken: result.refreshToken,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Token refresh failed';
      sendError(res, 500, 'REFRESH_ERROR', msg);
    }
  }

  static async verifyResetToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token as string;
      const result = await AdminService.verifyResetToken(token);
      if (!result.valid) {
        sendError(res, 400, 'INVALID_RESET_TOKEN', result.message || 'Invalid or expired token');
        return;
      }
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Token verification failed';
      sendError(res, 400, 'TOKEN_VERIFY_ERROR', msg);
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;
      const result = await AdminService.completePasswordReset(token, password);
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed';
      sendError(res, 400, 'PASSWORD_RESET_FAILED', msg);
    }
  }

  static async verifyInvitation(req: Request, res: Response): Promise<void> {
    try {
      const token = (req.params.token || req.body?.token || req.query?.token) as string;
      const result = await AuthService.validateSignUpInvite(token);
      if (!result.valid) {
        sendError(res, 400, 'INVALID_INVITATION_TOKEN', result.message || 'Invalid or expired activation link');
        return;
      }
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invitation verification failed';
      sendError(res, 400, 'INVITATION_VERIFY_ERROR', msg);
    }
  }

  static async activateAccount(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;
      const result = await AdminService.completeAccountActivation(token, password);
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Account activation failed';
      sendError(res, 400, 'ACTIVATION_FAILED', msg);
    }
  }

  // ── FRD Sec. 4: Sign-Up Link, Registration & OTP Verification ─────────────

  static async validateInvite(req: Request, res: Response): Promise<void> {
    try {
      const token = (req.params.token || req.body?.token || req.query?.token) as string;
      if (!token) {
        sendError(res, 400, 'MISSING_TOKEN', 'Invitation token is required');
        return;
      }
      const result = await AuthService.validateSignUpInvite(token);
      if (!result.valid) {
        sendError(res, 400, 'INVALID_INVITE_TOKEN', result.message);
        return;
      }
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invite validation failed';
      sendError(res, 400, 'INVITE_VALIDATION_ERROR', msg);
    }
  }

  static async registerFromInvite(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.registerFromInvite(req.body);
      sendSuccess(res, result, 201, { message: result.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration from invite failed';
      sendError(res, 400, 'REGISTRATION_FAILED', msg);
    }
  }

  static async verifyInviteOtp(req: Request, res: Response): Promise<void> {
    try {
      const { token, otpType, otpCode } = req.body;
      const result = await AuthService.verifyInviteOtp(token, otpType, otpCode);
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OTP verification failed';
      sendError(res, 400, 'OTP_VERIFICATION_FAILED', msg);
    }
  }

  static async resendInviteOtp(req: Request, res: Response): Promise<void> {
    try {
      const { token, otpType } = req.body;
      const result = await AuthService.resendInviteOtp(token, otpType);
      if (!result.success && (result as any).isExpired) {
        sendError(res, 400, 'INVITE_EXPIRED', result.message);
        return;
      }
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend OTP';
      sendError(res, 400, 'RESEND_OTP_FAILED', msg);
    }
  }

  static async requestNewSignUpLink(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        sendError(res, 400, 'EMAIL_REQUIRED', 'Official email is required to request a new sign-up link');
        return;
      }
      const result = await AuthService.requestNewSignUpLink(email);
      if (!result.success) {
        sendError(res, 404, 'INVITATION_NOT_FOUND', result.message);
        return;
      }
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request fresh sign-up link';
      sendError(res, 400, 'REQUEST_SIGNUP_LINK_FAILED', msg);
    }
  }
}
