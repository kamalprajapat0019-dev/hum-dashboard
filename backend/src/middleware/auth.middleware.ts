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

  try {
    const decoded = verifyToken(token);

    // Verify user is still active in database
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
  } catch (err: unknown) {
    sendError(res, 401, 'INVALID_TOKEN', 'Session token is invalid or has expired');
  }
}
