import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

export function errorHandler(
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.status || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected internal error occurred'
      : err.message || 'Server error';

  if (env.NODE_ENV !== 'test') {
    console.error(`[Error] ${errorCode}: ${err.message}`, err.stack);
  }

  sendError(
    res,
    statusCode,
    errorCode,
    message,
    env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  );
}
