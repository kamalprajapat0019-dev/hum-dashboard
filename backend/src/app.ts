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
      origin: [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
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
