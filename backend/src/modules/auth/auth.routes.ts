import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  loginSchema,
  validateInviteSchema,
  registerFromInviteSchema,
  verifyOtpSchema,
  resendInviteOtpSchema,
} from './auth.schemas.js';
import { resetPasswordSchema, activateAccountSchema } from '../admin/admin.schemas.js';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/me', authMiddleware, AuthController.me);

// Password Reset & Account Activation Public Routes
router.get('/verify-reset-token/:token', AuthController.verifyResetToken);
router.post('/reset-password', validateRequest({ body: resetPasswordSchema }), AuthController.resetPassword);
router.get('/verify-invitation/:token', AuthController.verifyInvitation);
router.post('/activate-account', validateRequest({ body: activateAccountSchema }), AuthController.activateAccount);

// ── FRD Sec. 4: 72-Hour Sign-Up Invite Link, Registration & OTP Verification ──
router.get('/invite/validate/:token', AuthController.validateInvite);
router.post('/invite/validate', validateRequest({ body: validateInviteSchema }), AuthController.validateInvite);
router.post('/invite/register', validateRequest({ body: registerFromInviteSchema }), AuthController.registerFromInvite);
router.post('/invite/verify-otp', validateRequest({ body: verifyOtpSchema }), AuthController.verifyInviteOtp);
router.post('/invite/resend-otp', validateRequest({ body: resendInviteOtpSchema }), AuthController.resendInviteOtp);
router.post('/invite/request-new', AuthController.requestNewSignUpLink);

export default router;
