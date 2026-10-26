import { prisma } from '../../config/database.js';
import { verifyPassword } from '../../utils/hasher.js';
import { generateToken } from '../../utils/jwt.js';
import { LoginInput } from './auth.schemas.js';

export class AuthService {
  static async login(input: LoginInput, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
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

    // Update lastLogin timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Record login in audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id,
        details: { role: user.role, userAgent: 'Browser' },
        ipAddress,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar || (user.name ? user.name.split(' ').map((n) => n[0]).join('') : 'U'),
      status: user.status,
      scope: user.scope || { clients: ['all'], projects: ['all'], centres: ['all'] },
      lastLogin: user.lastLogin,
    };

    return { success: true, token, user: safeUser };
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
      avatar: user.avatar || (user.name ? user.name.split(' ').map((n) => n[0]).join('') : 'U'),
    };
  }
}
