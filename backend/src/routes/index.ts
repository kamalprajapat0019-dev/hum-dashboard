import { Router, Request, Response } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import { verifyDatabaseConnection } from '../config/database.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

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
