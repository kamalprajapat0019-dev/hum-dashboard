import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { loginSchema } from './auth.schemas.js';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), AuthController.login);
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/me', authMiddleware, AuthController.me);

export default router;
