import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { prisma } from '../config/database.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload & { scope?: unknown };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication token is missing or malformed');
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token || token.trim() === '' || token === 'undefined' || token === 'null') {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication token is missing or malformed');
    return;
  }

  // 1. Verify JWT signature and expiration
  let decoded: TokenPayload;
  try {
    decoded = verifyToken(token);
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      sendError(res, 401, 'TOKEN_EXPIRED', 'Session token has expired');
      return;
    }
    sendError(res, 401, 'INVALID_TOKEN', 'Session token is invalid or has expired');
    return;
  }

  // 2. Verify active account state in database (isolated from JWT catch)
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true, status: true, scope: true },
    });

    if (!dbUser) {
      sendError(res, 401, 'UNAUTHORIZED', 'User account not found');
      return;
    }

    if (dbUser.status !== 'Active') {
      sendError(res, 403, 'ACCOUNT_INACTIVE', `User account is ${dbUser.status.toLowerCase()}`);
      return;
    }

    req.user = {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name,
      scope: dbUser.scope,
    };

    next();
  } catch (dbErr: any) {
    console.error('[authMiddleware] Database query error:', dbErr?.message);
    sendError(res, 500, 'DATABASE_ERROR', 'Internal server error validating user authentication state');
  }
}
