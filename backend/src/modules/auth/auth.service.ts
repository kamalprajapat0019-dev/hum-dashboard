import { prisma } from '../../config/database.js';
import { verifyPassword } from '../../utils/hasher.js';
import { generateToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../../utils/jwt.js';
import { LoginInput } from './auth.schemas.js';

export class AuthService {
  static async login(input: LoginInput, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        role: true,
        avatar: true,
        status: true,
        scope: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return { success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    if (user.status !== 'Active') {
      return {
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: `Account is ${user.status.toLowerCase()}. Please contact administrator.`,
      };
    }

    const isMatch = await verifyPassword(input.password, user.passwordHash);
    if (!isMatch) {
      return { success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    // Execute lastLogin timestamp update and audit log recording in parallel
    const now = new Date();
    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: now },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: 'USER_LOGIN',
          entity: 'User',
          entityId: user.id,
          details: { role: user.role, userAgent: 'Browser' },
          ipAddress,
        },
      }),
    ]);

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar || (user.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'U'),
      status: user.status,
      scope: user.scope || { clients: ['all'], projects: ['all'], centres: ['all'] },
      lastLogin: user.lastLogin,
    };

    return { success: true, token, refreshToken, user: safeUser };
  }

  static async refreshToken(refreshTokenString: string) {
    if (!refreshTokenString || typeof refreshTokenString !== 'string') {
      return { success: false, code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is required' };
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyRefreshToken(refreshTokenString);
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        return { success: false, code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh token has expired' };
      }
      return { success: false, code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid or malformed' };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return { success: false, code: 'UNAUTHORIZED', message: 'User account not found' };
    }

    if (user.status !== 'Active') {
      return {
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: `Account is ${user.status.toLowerCase()}. Please contact administrator.`,
      };
    }

    const newPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const newAccessToken = generateToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    return {
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        status: true,
        scope: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      avatar: user.avatar || (user.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'U'),
    };
  }
}
