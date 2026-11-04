import { Router, Request, Response } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import { verifyDatabaseConnection } from '../config/database.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

// ── Root API v1 Information ───────────────────────────────────────────────
router.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'online',
    service: 'oem-portal-backend-api-v1',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth',
      admin: '/admin',
    },
    timestamp: new Date().toISOString(),
  });
});

// ── Health Check (Sanitized - no credentials exposed) ──────────────────────
router.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = await verifyDatabaseConnection();
  sendSuccess(res, {
    status: dbStatus.connected ? 'healthy' : 'degraded',
    service: 'oem-portal-backend',
    version: '1.0.0',
    database: {
      status: dbStatus.connected ? 'connected' : 'disconnected',
    },
    timestamp: new Date().toISOString(),
  });
});

// ── Module Mounts ──────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

export default router;
