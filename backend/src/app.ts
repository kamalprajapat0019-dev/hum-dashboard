import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { apiRateLimiter } from './middleware/rateLimiter.middleware.js';
import { sendError } from './utils/response.js';

export function createApp(): Express {
  const app = express();

  // Security Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin) return callback(null, true);
        if (
          origin === env.CORS_ORIGIN ||
          origin === 'http://localhost:5173' ||
          origin === 'http://127.0.0.1:5173' ||
          origin.endsWith('.vercel.app') ||
          env.CORS_ORIGIN === '*'
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request Parsing & Logging
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Rate Limiting
  app.use(apiRateLimiter);

  // Root status check
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      success: true,
      service: 'OEM Portal Backend API',
      status: 'online',
      version: '1.0.0',
      endpoints: {
        health: `${env.API_PREFIX}/health`,
        auth: `${env.API_PREFIX}/auth`,
        admin: `${env.API_PREFIX}/admin`,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API version prefix
  app.use(env.API_PREFIX, routes);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    sendError(res, 404, 'NOT_FOUND', `Endpoint ${req.method} ${req.originalUrl} not found`);
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
