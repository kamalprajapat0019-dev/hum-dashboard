import crypto from 'crypto';
import { prisma } from '../../../config/database.js';
import { hashPassword } from '../../../utils/hasher.js';
import { Role, UserStatus, Prisma } from '@prisma/client';
import { NotificationService } from '../../../services/notification.service.js';

export class UserAdminService {
  // ── 2. User Management ───────────────────────────────────────────────────
  static async getUserSummary(callerRole: Role = Role.ADMIN, callerUserId?: string) {
    let where: Prisma.UserWhereInput = {};
    if (callerRole === Role.PM && callerUserId) {
      where = {
        OR: [
          { managerId: callerUserId },
          { id: callerUserId },
        ],
      };
    }

    const [totalUsers, userStatuses, rolesGroup] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      prisma.user.groupBy({
        by: ['role'],
        where,
        _count: { _all: true },
      }),
    ]);

    let activeUsers = 0;
    let inactiveUsers = 0;
    for (const s of userStatuses) {
      if (s.status === 'Active') activeUsers += s._count._all;
      else inactiveUsers += s._count._all;
    }

    let internalUsers = 0;
    let centreUsers = 0;
    let adminUsers = 0;
    for (const r of rolesGroup) {
      const cnt = r._count._all;
      if (r.role === Role.ADMIN) {
        adminUsers += cnt;
      } else if (r.role === Role.CENTRE) {
        centreUsers += cnt;
      } else {
        // Project Manager, Operations, Auditor, and Accounts
        internalUsers += cnt;
      }
    }

    return {
      totalUsers,
      internalUsers,
      centreUsers,
      adminUsers,
      activeUsers,
      inactiveUsers,
    };
  }

  static async listUsers(params: {
    page: number;
    limit: number;
    search?: string;
    role?: Role;
    status?: UserStatus;
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'id' | 'email';
    sortOrder?: 'asc' | 'desc';
    callerRole?: Role;
    callerUserId?: string;
  }) {
    const {
      page,
      limit,
      search,
      role,
      status,
      sortBy = 'name',
      sortOrder = 'asc',
      callerRole = Role.ADMIN,
      callerUserId,
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phoneNumber: { contains: search } },
            { id: { contains: search } },
          ],
        }
        : {}),
    };

    if (callerRole === Role.PM && callerUserId) {
      where.OR = [
        { managerId: callerUserId },
        { id: callerUserId },
      ];
    }

    let orderBy: Prisma.UserOrderByWithRelationInput[] = [];
    if (sortBy === 'name') {
      orderBy = [{ name: sortOrder }, { id: 'asc' }];
    } else if (sortBy === 'createdAt') {
      orderBy = [{ createdAt: sortOrder }, { id: 'asc' }];
    } else if (sortBy === 'updatedAt') {
      orderBy = [{ updatedAt: sortOrder }, { id: 'asc' }];
    } else if (sortBy === 'email') {
      orderBy = [{ email: sortOrder }, { id: 'asc' }];
    } else {
      orderBy = [{ id: sortOrder }];
    }

    const [rawUsers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          avatar: true,
          status: true,
          scope: true,
          managerId: true,
          manager: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          centreId: true,
          clientId: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Continuous page serial numbering: (page - 1) * limit + index + 1
    const users = rawUsers.map((u, idx) => ({
      ...u,
      serialNumber: skip + idx + 1,
    }));

    return {
      users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async isDomainAllowed(email: string): Promise<boolean> {
    const parts = (email || '').trim().toLowerCase().split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1];

    // Check if table has entries; seed defaults if empty
    const count = await prisma.allowedEmailDomain.count();
    if (count === 0) {
      await prisma.allowedEmailDomain.createMany({
        data: [
          { domain: 'oemportal.in', isActive: true },
          { domain: 'assessinfra.com', isActive: true },
        ],
        skipDuplicates: true,
      });
    }

    const allowed = await prisma.allowedEmailDomain.findFirst({
      where: {
        domain: { equals: domain },
        isActive: true,
      },
    });

    return !!allowed;
  }

  static async createUser(
    data: {
      email: string;
      password?: string;
      name: string;
      phoneNumber?: string;
      role: Role;
      status?: UserStatus;
      managerId?: string;
      centreId?: string;
      clientId?: string;
      scope?: unknown;
    },
    adminUserId: string,
    adminEmail: string,
    callerRole: Role = Role.ADMIN
  ) {
    const cleanEmail = data.email.toLowerCase().trim();

    // 1. Role-Based Hierarchy Enforcement
    if (callerRole === Role.PM && data.role !== Role.OPERATIONS && data.role !== Role.CENTRE) {
      throw new Error('Project Managers can only provision Operations or Centre User accounts');
    }
    if (callerRole === Role.OPERATIONS && data.role !== Role.CENTRE) {
      throw new Error('Operations users can only invite Centre Users');
    }

    // 2. Email Domain Validation for Internal Users
    const isInternalRole =
      data.role === Role.PM ||
      data.role === Role.OPERATIONS ||
      data.role === Role.AUDITOR ||
      data.role === Role.FINANCE;
    if (isInternalRole) {
      const allowed = await UserAdminService.isDomainAllowed(cleanEmail);
      if (!allowed) {
        throw new Error(
          `Internal users must use an approved organisation domain email address (e.g. @oemportal.in, @assessinfra.com). The domain "@${cleanEmail.split('@')[1] || ''}" is not authorized.`
        );
      }
    }

    // 3. Email Uniqueness
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existing) {
      throw new Error('A user with this email address already exists');
    }

    // 4. Delegated Manager Association
    let finalManagerId = data.managerId || null;
    if (callerRole === Role.PM) {
      finalManagerId = adminUserId;
    }

    // 5. Password Hashing (if provided or generated)
    const rawPassword =
      data.password && data.password.trim()
        ? data.password.trim()
        : `OEMP@${crypto.randomBytes(4).toString('hex')}!`;
    const passwordHash = await hashPassword(rawPassword);

    const newUser = await prisma.$transaction(async (tx: any) => {
      const created = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          name: data.name.trim(),
          phoneNumber: data.phoneNumber ? data.phoneNumber.trim() : null,
          role: data.role,
          status: data.status || 'Active',
          managerId: finalManagerId,
          centreId: data.centreId || null,
          clientId: data.clientId || null,
          scope: data.scope ? (data.scope as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          status: true,
          managerId: true,
          centreId: true,
          clientId: true,
          scope: true,
          createdAt: true,
        },
      });

      // Also create an activation token if password wasn't explicitly supplied
      let activationToken = null;
      if (!data.password) {
        const tokenStr = crypto.randomBytes(32).toString('hex');
        await tx.userInvitation.create({
          data: {
            email: cleanEmail,
            name: data.name.trim(),
            role: data.role,
            phone: data.phoneNumber || null,
            centreId: data.centreId || null,
            clientId: data.clientId || null,
            token: tokenStr,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            status: 'Pending',
            inviterId: adminUserId,
          },
        });
        activationToken = tokenStr;
      }

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'USER_CREATED',
          entity: 'User',
          entityId: created.id,
          details: {
            name: created.name,
            email: created.email,
            role: created.role,
            managerId: finalManagerId,
            status: created.status,
          },
        },
      });

      return {
        ...created,
        activationToken,
      };
    });

    return newUser;
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        avatar: true,
        status: true,
        scope: true,
        managerId: true,
        manager: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        managedUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
        centreId: true,
        clientId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async updateUser(
    id: string,
    data: {
      name?: string;
      phoneNumber?: string;
      role?: Role;
      status?: UserStatus;
      password?: string;
      managerId?: string | null;
      centreId?: string | null;
      clientId?: string | null;
      scope?: unknown;
    },
    adminUserId: string,
    adminEmail: string,
    callerRole: Role = Role.ADMIN
  ) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('User not found');
    }

    if (callerRole === Role.PM && existing.managerId !== adminUserId && existing.id !== adminUserId) {
      throw new Error('Access denied: You can only update users delegated to your responsibility');
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber ? data.phoneNumber.trim() : null;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.managerId !== undefined) updateData.manager = data.managerId ? { connect: { id: data.managerId } } : { disconnect: true };
    if (data.centreId !== undefined) updateData.centreId = data.centreId;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.scope !== undefined) updateData.scope = data.scope as Prisma.InputJsonValue;
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const u = await tx.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          status: true,
          managerId: true,
          centreId: true,
          clientId: true,
          scope: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'USER_UPDATED',
          entity: 'User',
          entityId: id,
          details: {
            changes: {
              name: data.name,
              phoneNumber: data.phoneNumber,
              role: data.role,
              status: data.status,
              passwordReset: !!data.password,
            },
          },
        },
      });

      return u;
    });

    return updated;
  }

  static async activateUser(id: string, adminUserId: string, adminEmail: string, callerRole: Role = Role.ADMIN) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('User not found');
    }

    if (callerRole === Role.PM && existing.managerId !== adminUserId && existing.id !== adminUserId) {
      throw new Error('Access denied: You can only activate accounts delegated to you');
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const u = await tx.user.update({
        where: { id },
        data: { status: 'Active' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'USER_ACTIVATED',
          entity: 'User',
          entityId: id,
          details: { priorStatus: existing.status, newStatus: 'Active' },
        },
      });

      return u;
    });

    return updated;
  }

  static async deactivateUser(id: string, adminUserId: string, adminEmail: string, callerRole: Role = Role.ADMIN) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('User not found');
    }

    if (existing.id === adminUserId) {
      throw new Error('Administrators cannot deactivate their own account');
    }

    if (callerRole === Role.PM && existing.managerId !== adminUserId) {
      throw new Error('Access denied: You can only deactivate accounts delegated to you');
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const u = await tx.user.update({
        where: { id },
        data: { status: 'Inactive' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'USER_DEACTIVATED',
          entity: 'User',
          entityId: id,
          details: { priorStatus: existing.status, newStatus: 'Inactive' },
        },
      });

      return u;
    });

    return updated;
  }

  static async deleteUser(id: string, adminUserId: string, adminEmail: string, callerRole: Role = Role.ADMIN) {
    // Soft deletion: deactivates user rather than permanently dropping records
    return UserAdminService.deactivateUser(id, adminUserId, adminEmail, callerRole);
  }

  static async initiatePasswordReset(targetUserId: string, adminUserId: string, adminEmail: string) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new Error('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.$transaction(async (tx: any) => {
      // Invalidate existing unused tokens for this user
      await tx.passwordResetToken.updateMany({
        where: { userId: targetUserId, usedAt: null },
        data: { usedAt: new Date() },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: targetUserId,
          token,
          expiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'PASSWORD_RESET_INITIATED',
          entity: 'User',
          entityId: targetUserId,
          details: {
            targetEmail: user.email,
            expiresAt,
          },
        },
      });
    });

    return {
      success: true,
      token,
      resetUrl: `/reset-password?token=${token}`,
      expiresAt,
      targetUser: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  static async completePasswordReset(token: string, newPassword: string) {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new Error('Password reset link is invalid or has expired. Please request a new reset link.');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId: record.userId,
          userEmail: record.user.email,
          action: 'PASSWORD_RESET_COMPLETED',
          entity: 'User',
          entityId: record.userId,
          details: { completedAt: new Date() },
        },
      });
    });

    return {
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.',
    };
  }

  static async verifyResetToken(token: string) {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return { valid: false, message: 'Password reset link is invalid or has expired.' };
    }

    return {
      valid: true,
      user: record.user,
      expiresAt: record.expiresAt,
    };
  }

  static async inviteCentreUser(
    data: {
      email: string;
      name: string;
      phoneNumber?: string;
      phone?: string;
      whatsappNumber?: string;
      centreId?: string;
      clientId?: string;
      scope?: unknown;
    },
    inviterId: string,
    inviterEmail: string,
    inviterRole: Role = Role.ADMIN
  ) {
    const cleanEmail = data.email.toLowerCase().trim();
    const whatsappNum = (data.whatsappNumber || data.phone || data.phoneNumber || '').trim();

    if (!cleanEmail) {
      throw new Error('Centre Official Email is required before sending the sign-up link.');
    }
    if (!whatsappNum) {
      throw new Error('Centre WhatsApp Mobile Number is required before sending the sign-up link.');
    }

    // Enforce email uniqueness across active users
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingUser && existingUser.status === 'Active') {
      throw new Error('A user with this email address already exists and is active');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72-hour window (FRD Sec. 4)

    // Pre-compute placeholder hash outside transaction
    const tempHash = !existingUser
      ? await hashPassword(`Invited@${crypto.randomBytes(4).toString('hex')}`)
      : null;

    const invitation = await prisma.$transaction(
      async (tx: any) => {
        // Invalidate any existing pending invitation for this email
        await tx.userInvitation.updateMany({
          where: { email: cleanEmail, status: 'Pending' },
          data: { status: 'Revoked' },
        });

        const inv = await tx.userInvitation.create({
          data: {
            email: cleanEmail,
            name: data.name.trim(),
            role: Role.CENTRE,
            phone: whatsappNum,
            whatsappNumber: whatsappNum,
            centreId: data.centreId || null,
            clientId: data.clientId || null,
            scope: data.scope ? (data.scope as Prisma.InputJsonValue) : Prisma.JsonNull,
            token,
            expiresAt,
            status: 'Pending',
            inviterId,
          },
        });

        // If user doesn't exist, create an inactive placeholder
        if (!existingUser && tempHash) {
          await tx.user.create({
            data: {
              email: cleanEmail,
              name: data.name.trim(),
              phoneNumber: whatsappNum,
              role: Role.CENTRE,
              passwordHash: tempHash,
              status: 'Inactive',
              centreId: data.centreId || null,
              clientId: data.clientId || null,
              managerId: inviterRole === Role.PM ? inviterId : null,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: inviterId,
            userEmail: inviterEmail,
            action: 'CENTRE_USER_INVITED',
            entity: 'UserInvitation',
            entityId: inv.id,
            details: {
              email: cleanEmail,
              name: data.name,
              whatsappNumber: whatsappNum,
              centreId: data.centreId,
              clientId: data.clientId,
            },
          },
        });

        return inv;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    const registrationUrl = `/invite/register?token=${token}`;

    // Actively dispatch the 72-hour sign-up link to Email and WhatsApp (FRD Sec. 4.1)
    let dispatchResult: any;
    try {
      dispatchResult = await NotificationService.dispatchSignUpLink({
        centreName: data.name,
        email: cleanEmail,
        whatsappNumber: whatsappNum,
        token,
        registrationUrl,
        expiresAt,
      });

      await prisma.userInvitation.update({
        where: { id: invitation.id },
        data: {
          emailDispatched: dispatchResult.email.sent,
          whatsappDispatched: dispatchResult.whatsapp.sent,
          lastDispatchedAt: new Date(),
          dispatchStatus: dispatchResult as any,
        },
      });
    } catch (dispatchErr) {
      console.error('[INVITE:DISPATCH:ERROR]', dispatchErr);
      dispatchResult = {
        email: { sent: false, recipient: cleanEmail, status: 'failed', error: String(dispatchErr) },
        whatsapp: { sent: false, recipient: whatsappNum, status: 'failed', error: String(dispatchErr) },
      };
    }

    return {
      success: true,
      invitation,
      registrationUrl,
      fullRegistrationUrl: NotificationService.getFullRegistrationUrl(registrationUrl),
      activationUrl: `/activate-account?token=${token}`,
      token,
      expiresAt,
      emailDispatched: dispatchResult.email.sent,
      whatsappDispatched: dispatchResult.whatsapp.sent,
      dispatch: dispatchResult,
    };
  }

  static async listCentreInvitations(query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const where: Prisma.UserInvitationWhereInput = {
      role: Role.CENTRE,
    };

    if (query.status && query.status !== 'All') {
      if (query.status === 'Expired') {
        where.status = 'Pending';
        where.expiresAt = { lt: new Date() };
      } else if (query.status === 'Pending') {
        where.status = 'Pending';
        where.expiresAt = { gte: new Date() };
      } else {
        where.status = query.status;
      }
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { email: { contains: s } },
        { name: { contains: s } },
        { whatsappNumber: { contains: s } },
        { phone: { contains: s } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.userInvitation.count({ where }),
      prisma.userInvitation.findMany({
        where,
        include: {
          inviter: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const now = new Date();
    const enriched = items.map((inv) => ({
      ...inv,
      isExpired: inv.status === 'Pending' && inv.expiresAt < now,
      registrationUrl: `/invite/register?token=${inv.token}`,
    }));

    return {
      items: enriched,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async recordInvitationFollowUp(
    invitationId: string,
    action: string,
    notes: string = '',
    actorId?: string,
    actorEmail?: string
  ) {
    const inv = await prisma.userInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!inv) throw new Error('Invitation record not found');

    const normAction = action.toUpperCase();
    const updated = await prisma.userInvitation.update({
      where: { id: invitationId },
      data: {
        followUpAction: normAction,
        followUpNotes: notes || null,
        lastFollowUpAt: new Date(),
      },
    });

    if (actorId && actorEmail) {
      await prisma.auditLog.create({
        data: {
          userId: actorId,
          userEmail: actorEmail,
          action: 'INVITATION_FOLLOW_UP',
          entity: 'UserInvitation',
          entityId: invitationId,
          details: { action: normAction, notes, email: inv.email },
        },
      });
    }

    return updated;
  }

  static async resendCentreInvitation(
    invitationId: string,
    actorId?: string,
    actorEmail?: string
  ) {
    const inv = await prisma.userInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!inv) throw new Error('Invitation record not found');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const updated = await prisma.userInvitation.update({
      where: { id: invitationId },
      data: {
        token,
        expiresAt,
        status: 'Pending',
        usedAt: null,
        resendCount: inv.resendCount + 1,
      },
      include: {
        inviter: { select: { id: true, name: true, email: true } },
      },
    });

    if (actorId && actorEmail) {
      await prisma.auditLog.create({
        data: {
          userId: actorId,
          userEmail: actorEmail,
          action: 'CENTRE_SIGNUP_LINK_RESENT',
          entity: 'UserInvitation',
          entityId: invitationId,
          details: { email: inv.email, resendCount: updated.resendCount },
        },
      });
    }

    const registrationUrl = `/invite/register?token=${token}`;

    // Actively re-dispatch the renewed 72-hour sign-up link to Email and WhatsApp (FRD Sec. 4.1)
    let dispatchResult: any;
    try {
      dispatchResult = await NotificationService.dispatchSignUpLink({
        centreName: inv.name,
        email: inv.email,
        whatsappNumber: inv.whatsappNumber || inv.phone || '',
        token,
        registrationUrl,
        expiresAt,
      });

      await prisma.userInvitation.update({
        where: { id: invitationId },
        data: {
          emailDispatched: dispatchResult.email.sent,
          whatsappDispatched: dispatchResult.whatsapp.sent,
          lastDispatchedAt: new Date(),
          dispatchStatus: dispatchResult as any,
        },
      });
    } catch (dispatchErr) {
      console.error('[RESEND:DISPATCH:ERROR]', dispatchErr);
      dispatchResult = {
        email: { sent: false, recipient: inv.email, status: 'failed', error: String(dispatchErr) },
        whatsapp: { sent: false, recipient: inv.whatsappNumber || '', status: 'failed', error: String(dispatchErr) },
      };
    }

    return {
      invitation: updated,
      registrationUrl,
      fullRegistrationUrl: NotificationService.getFullRegistrationUrl(registrationUrl),
      activationUrl: `/activate-account?token=${token}`,
      expiresAt,
      emailDispatched: dispatchResult.email.sent,
      whatsappDispatched: dispatchResult.whatsapp.sent,
      dispatch: dispatchResult,
    };
  }

  static async completeAccountActivation(token: string, password: string) {
    const inv = await prisma.userInvitation.findUnique({
      where: { token },
    });

    if (!inv || inv.status !== 'Pending' || inv.expiresAt < new Date()) {
      throw new Error('Activation link is invalid or has expired. Please contact your administrator.');
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction(async (tx: any) => {
      const existing = await tx.user.findUnique({ where: { email: inv.email } });
      let userId: string;
      if (existing) {
        userId = existing.id;
        await tx.user.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            status: 'Active',
            phoneNumber: inv.phone || existing.phoneNumber,
            centreId: inv.centreId || existing.centreId,
            clientId: inv.clientId || existing.clientId,
          },
        });
      } else {
        const u = await tx.user.create({
          data: {
            email: inv.email,
            name: inv.name,
            role: inv.role,
            phoneNumber: inv.phone || null,
            passwordHash,
            status: 'Active',
            centreId: inv.centreId || null,
            clientId: inv.clientId || null,
          },
        });
        userId = u.id;
      }

      await tx.userInvitation.update({
        where: { id: inv.id },
        data: {
          status: 'Accepted',
          acceptedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          userEmail: inv.email,
          action: 'CENTRE_USER_ACTIVATED',
          entity: 'User',
          entityId: userId,
          details: {
            invitationId: inv.id,
            activatedAt: new Date(),
          },
        },
      });
    });

    return {
      success: true,
      message: 'Account activated successfully. You can now log in.',
    };
  }

  static async verifyInvitationToken(token: string) {
    const record = await prisma.userInvitation.findUnique({
      where: { token },
    });

    if (!record || record.status !== 'Pending' || record.expiresAt < new Date()) {
      return { valid: false, message: 'Activation link is invalid or has expired.' };
    }

    return {
      valid: true,
      invitation: {
        name: record.name,
        email: record.email,
        role: record.role,
        centreId: record.centreId,
      },
      expiresAt: record.expiresAt,
    };
  }

  static async getAllowedDomains() {
    const domains = await prisma.allowedEmailDomain.findMany({
      orderBy: { domain: 'asc' },
    });
    if (domains.length === 0) {
      await prisma.allowedEmailDomain.createMany({
        data: [
          { domain: 'oemportal.in', isActive: true },
          { domain: 'assessinfra.com', isActive: true },
        ],
        skipDuplicates: true,
      });
      return prisma.allowedEmailDomain.findMany({ orderBy: { domain: 'asc' } });
    }
    return domains;
  }

  static async addAllowedDomain(domain: string, adminUserId: string) {
    const cleanDomain = domain.toLowerCase().trim().replace(/^@/, '');
    const created = await prisma.allowedEmailDomain.upsert({
      where: { domain: cleanDomain },
      update: { isActive: true },
      create: {
        domain: cleanDomain,
        isActive: true,
        createdBy: adminUserId,
      },
    });
    return created;
  }
}
