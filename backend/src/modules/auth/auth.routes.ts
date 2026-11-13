import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { loginSchema } from './auth.schemas.js';
import { resetPasswordSchema, activateAccountSchema } from '../admin/admin.schemas.js';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), AuthController.login);
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/me', authMiddleware, AuthController.me);

// Password Reset & Account Activation Public Routes
router.get('/verify-reset-token/:token', AuthController.verifyResetToken);
router.post('/reset-password', validateRequest({ body: resetPasswordSchema }), AuthController.resetPassword);
router.get('/verify-invitation/:token', AuthController.verifyInvitation);
router.post('/activate-account', validateRequest({ body: activateAccountSchema }), AuthController.activateAccount);

export default router;
