import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { hashPassword } from '../../utils/hasher.js';
import { Role, UserStatus, Prisma } from '@prisma/client';

export class AdminService {
  // ── 1. Analytics & Executive KPI Aggregation ──────────────────────────────
  static async getExecutiveAnalytics(filters: {
    clientId?: string;
    projectId?: string;
    examTypeId?: string;
    examId?: string;
  } = {}) {
    const { clientId, projectId, examTypeId, examId } = filters;

    let clientRecord = null;
    let projectRecord = null;
    let examTypeRecord = null;
    let examRecord = null;

    if (clientId) {
      clientRecord = await prisma.client.findUnique({
        where: { id: clientId },
      });
      if (!clientRecord) {
        throw new Error('Client not found');
      }
    }

    if (projectId) {
      projectRecord = await prisma.project.findUnique({
        where: { id: projectId },
        include: { client: true },
      });
      if (!projectRecord) {
        throw new Error('Project not found');
      }
      if (clientId && projectRecord.clientId !== clientId) {
        throw new Error('Project does not belong to the selected client');
      }
      if (!clientRecord) {
        clientRecord = projectRecord.client;
      }
    }

    if (examTypeId) {
      examTypeRecord = await prisma.examType.findUnique({
        where: { id: examTypeId },
        include: { project: { include: { client: true } } },
      });
      if (!examTypeRecord) {
        throw new Error('Exam type not found');
      }
      if (projectId && examTypeRecord.projectId !== projectId) {
        throw new Error('Exam type does not belong to the selected project');
      }
      if (clientId && examTypeRecord.project.clientId !== clientId) {
        throw new Error('Exam type does not belong to the selected client');
      }
      if (!projectRecord) {
        projectRecord = examTypeRecord.project;
      }
      if (!clientRecord) {
        clientRecord = examTypeRecord.project.client;
      }
    }

    if (examId) {
      examRecord = await prisma.exam.findUnique({
        where: { id: examId },
        include: { examType: { include: { project: { include: { client: true } } } } },
      });
      if (!examRecord) {
        throw new Error('Exam not found');
      }
      if (examTypeId && examRecord.examTypeId !== examTypeId) {
        throw new Error('Exam does not belong to the selected exam type');
      }
      if (projectId && examRecord.examType.projectId !== projectId) {
        throw new Error('Exam does not belong to the selected project');
      }
      if (clientId && examRecord.examType.project.clientId !== clientId) {
        throw new Error('Exam does not belong to the selected client');
      }
      if (!examTypeRecord) {
        examTypeRecord = examRecord.examType;
      }
      if (!projectRecord) {
        projectRecord = examRecord.examType.project;
      }
      if (!clientRecord) {
        clientRecord = examRecord.examType.project.client;
      }
    }

    const projectWhere: Prisma.ProjectWhereInput = {};
    if (projectId) {
      projectWhere.id = projectId;
    } else if (examTypeId) {
      projectWhere.examTypes = { some: { id: examTypeId } };
    } else if (examId) {
      projectWhere.examTypes = { some: { exams: { some: { id: examId } } } };
    } else if (clientId) {
      projectWhere.clientId = clientId;
    }

    // Centres linked to this hierarchy selection (via Bookings or Audits)
    let centreWhere: Prisma.CentreWhereInput = {};
    if (examId) {
      centreWhere = {
        OR: [
          { bookings: { some: { examId } } },
          { bookings: { some: { project: { id: examRecord!.examType.projectId } } } },
          { audits: { some: { project: { id: examRecord!.examType.projectId } } } },
        ],
      };
    } else if (examTypeId) {
      centreWhere = {
        OR: [
          { bookings: { some: { exam: { examTypeId } } } },
          { bookings: { some: { project: { id: examTypeRecord!.projectId } } } },
          { audits: { some: { project: { id: examTypeRecord!.projectId } } } },
        ],
      };
    } else if (projectId) {
      centreWhere = {
        OR: [
          { bookings: { some: { projectId } } },
          { audits: { some: { projectId } } },
        ],
      };
    } else if (clientId) {
      centreWhere = {
        OR: [
          { bookings: { some: { project: { clientId } } } },
          { audits: { some: { project: { clientId } } } },
        ],
      };
    }

    const hasFilter = Boolean(clientId || projectId || examTypeId || examId);
    const blacklistWhere: Prisma.BlacklistRecordWhereInput = {
      isActive: true,
      ...(hasFilter ? { centre: centreWhere } : {}),
    };

    // High-performance consolidated aggregation: replaces 14 slow subquery counts with 7 parallel grouped queries
    const [
      centreStatuses,
      projectStatuses,
      projectStages,
      projectAggregate,
      userStatuses,
      openBlacklists,
      recentAuditLogs,
    ] = await Promise.all([
      // 1. Group centres by status once (derives total, active, draft without 3 extra full counts)
      prisma.centre.groupBy({
        by: ['centreStatus'],
        where: centreWhere,
        _count: { _all: true },
      }),
      // 2. Group projects by status once (derives total, active, completed, on-hold without 4 extra counts)
      prisma.project.groupBy({
        by: ['status'],
        where: projectWhere,
        _count: { _all: true },
      }),
      // 3. Project stages breakdown for stage pipeline chart
      prisma.project.groupBy({
        by: ['stage'],
        where: projectWhere,
        _count: { stage: true },
      }),
      // 4. Candidate & centre targets sum
      prisma.project.aggregate({
        where: projectWhere,
        _sum: {
          candidateTarget: true,
          centreTarget: true,
        },
      }),
      // 5. User statuses breakdown
      prisma.user.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      // 6. Active blacklist records
      prisma.blacklistRecord.count({ where: blacklistWhere }),
      // 7. Recent audit trail with lean field selection
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          details: true,
          userEmail: true,
          createdAt: true,
          user: { select: { name: true, role: true } },
        },
      }),
    ]);

    // Derive centre counts from single groupBy
    let totalCentres = 0;
    let activeCentres = 0;
    let pendingApprovalCentres = 0;
    for (const cs of centreStatuses) {
      const count = cs._count._all || 0;
      totalCentres += count;
      if (cs.centreStatus === 'Approved' || cs.centreStatus === 'Active') {
        activeCentres += count;
      } else if (cs.centreStatus === 'Draft') {
        pendingApprovalCentres += count;
      }
    }

    // Derive project counts from single groupBy
    let totalProjects = 0;
    let activeProjects = 0;
    let completedProjects = 0;
    let onHoldProjects = 0;
    for (const ps of projectStatuses) {
      const count = ps._count._all || 0;
      totalProjects += count;
      if (ps.status === 'Active') activeProjects += count;
      else if (ps.status === 'Completed') completedProjects += count;
      else if (ps.status === 'OnHold') onHoldProjects += count;
    }

    // Derive user counts from single groupBy
    let totalUsers = 0;
    let activeUsers = 0;
    for (const us of userStatuses) {
      const count = us._count._all || 0;
      totalUsers += count;
      if (us.status === 'Active') activeUsers += count;
    }

    const projectStatusData = projectStages.map((ps: any) => ({
      name: ps.stage,
      value: ps._count.stage,
      color:
        ps.stage === 'Execution'
          ? '#2563eb'
          : ps.stage === 'Audit & Compliance'
            ? '#059669'
            : ps.stage === 'Booking'
              ? '#d97706'
              : ps.stage === 'Document Verification'
                ? '#7c3aed'
                : '#64748b',
    }));

    const centreStatusData = centreStatuses.map((cs: any) => ({
      name: cs.centreStatus,
      value: cs._count._all,
      color:
        cs.centreStatus === 'Approved'
          ? '#16a34a'
          : cs.centreStatus === 'Active'
            ? '#2563eb'
            : cs.centreStatus === 'Draft'
              ? '#d97706'
              : '#dc2626',
    }));

    return {
      client: clientRecord
        ? {
          id: clientRecord.id,
          code: clientRecord.code,
          name: clientRecord.name,
          fullName: clientRecord.fullName,
        }
        : null,
      project: projectRecord
        ? {
          id: projectRecord.id,
          projectCode: projectRecord.projectCode,
          name: projectRecord.name,
        }
        : null,
      examType: examTypeRecord
        ? {
          id: examTypeRecord.id,
          examCode: examTypeRecord.examCode,
          examTypeName: examTypeRecord.examTypeName,
        }
        : null,
      exam: examRecord
        ? {
          id: examRecord.id,
          examCode: examRecord.examCode,
          examName: examRecord.examName,
          examYear: examRecord.examYear,
        }
        : null,
      filters: {
        clientId: clientRecord?.id || null,
        projectId: projectRecord?.id || null,
        examTypeId: examTypeRecord?.id || null,
        examId: examRecord?.id || null,
      },
      kpis: {
        activeProjects: {
          value: activeProjects,
          total: totalProjects,
          completed: completedProjects,
          onHold: onHoldProjects,
        },
        totalCentres: {
          value: totalCentres,
          active: activeCentres,
          pending: pendingApprovalCentres,
        },
        candidates: {
          total: projectAggregate._sum.candidateTarget || 0,
          target: projectAggregate._sum.candidateTarget || 0,
        },
        centreRequirements: {
          target: projectAggregate._sum.centreTarget || 0,
        },
        activeUsers: { value: activeUsers, total: totalUsers },
        openExceptions: { value: openBlacklists, critical: openBlacklists },
        pendingApprovals: { value: pendingApprovalCentres },
      },
      charts: {
        projectStatusData,
        centreStatusData,
      },
      recentActivity: recentAuditLogs.map((log: any) => ({
        id: log.id,
        user: log.user?.name || log.userEmail || 'System',
        role: log.user?.role || 'SYSTEM',
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        time: log.createdAt,
      })),
    };
  }

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
      data.role === Role.FINANCE ||
      data.role === Role.ADMIN;
    if (isInternalRole) {
      const allowed = await this.isDomainAllowed(cleanEmail);
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
    return this.deactivateUser(id, adminUserId, adminEmail, callerRole);
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
      centreId?: string;
      clientId?: string;
      scope?: unknown;
    },
    inviterId: string,
    inviterEmail: string,
    inviterRole: Role = Role.ADMIN
  ) {
    const cleanEmail = data.email.toLowerCase().trim();

    // Enforce email uniqueness across active users
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingUser && existingUser.status === 'Active') {
      throw new Error('A user with this email address already exists and is active');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.$transaction(async (tx: any) => {
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
          phone: data.phoneNumber ? data.phoneNumber.trim() : null,
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
      if (!existingUser) {
        const tempHash = await hashPassword(`Invited@${crypto.randomBytes(4).toString('hex')}`);
        await tx.user.create({
          data: {
            email: cleanEmail,
            name: data.name.trim(),
            phoneNumber: data.phoneNumber ? data.phoneNumber.trim() : null,
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
            centreId: data.centreId,
            clientId: data.clientId,
          },
        },
      });

      return inv;
    });

    return {
      success: true,
      invitation,
      activationUrl: `/activate-account?token=${token}`,
      expiresAt,
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

  // ── 3. Project Management ────────────────────────────────────────────────
  static async listProjects(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    stage?: string;
    clientId?: string;
    projectId?: string;
    examTypeId?: string;
  }) {
    const { page, limit, search, status, stage, clientId, projectId, examTypeId } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      ...(status ? { status } : {}),
      ...(stage ? { stage } : {}),
      ...(clientId ? { clientId } : {}),
      ...(projectId ? { id: projectId } : {}),
      ...(examTypeId ? { examTypes: { some: { id: examTypeId } } } : {}),
      ...(search
        ? {
          OR: [
            { name: { contains: search } },
            { projectCode: { contains: search } },
            { examType: { contains: search } },
          ],
        }
        : {}),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, fullName: true } },
          projectManager: { select: { id: true, name: true, email: true } },
          examDates: { orderBy: { examDate: 'asc' } },
          _count: { select: { bookings: true, audits: true, examTypes: true, examDates: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async createProject(
    data: Prisma.ProjectUncheckedCreateInput & {
      examDates?: Array<{ examDate: string; shift?: string; startTime?: string; endTime?: string }>;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.project.findUnique({
      where: { projectCode: data.projectCode },
    });
    if (existing) {
      throw new Error(`Project code "${data.projectCode}" is already in use`);
    }

    const { examDates, ...projectInput } = data;

    let primaryExamDate = projectInput.examDate ? new Date(projectInput.examDate as string) : undefined;
    if (examDates && examDates.length > 0 && !primaryExamDate) {
      primaryExamDate = new Date(examDates[0].examDate);
    }

    let datesToCreate: Array<{ examDate: Date; shift: string; startTime?: string | null; endTime?: string | null }> = [];
    if (examDates && examDates.length > 0) {
      datesToCreate = examDates.map((ed) => ({
        examDate: new Date(ed.examDate),
        shift: ed.shift || 'Shift 1',
        startTime: ed.startTime || null,
        endTime: ed.endTime || null,
      }));
    } else if (primaryExamDate) {
      datesToCreate = [
        {
          examDate: primaryExamDate,
          shift: 'Shift 1',
          startTime: '09:00 AM',
          endTime: '12:00 PM',
        },
      ];
    }

    return prisma.$transaction(async (tx: any) => {
      const project = await tx.project.create({
        data: {
          ...projectInput,
          examDate: primaryExamDate,
          examDates: datesToCreate.length > 0 ? {
            create: datesToCreate,
          } : undefined,
        },
        include: {
          client: true,
          examDates: { orderBy: { examDate: 'asc' } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'PROJECT_CREATED',
          entity: 'Project',
          entityId: project.id,
          details: { name: project.name, projectCode: project.projectCode, examDatesCount: datesToCreate.length },
        },
      });

      return project;
    });
  }

  static async getProjectById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        projectManager: { select: { id: true, name: true, email: true } },
        examDates: { orderBy: { examDate: 'asc' } },
        bookings: { include: { centre: true } },
        audits: { include: { centre: true, auditor: { select: { name: true } } } },
      },
    });
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  }

  static async updateProject(
    id: string,
    data: Prisma.ProjectUpdateInput & {
      examDates?: Array<{ id?: string; examDate: string; shift?: string; startTime?: string; endTime?: string }>;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Project not found');
    }

    const { examDates, ...projectData } = data;

    return prisma.$transaction(async (tx: any) => {
      if (examDates !== undefined) {
        await tx.projectExamDate.deleteMany({
          where: { projectId: id },
        });

        if (examDates.length > 0) {
          await tx.projectExamDate.createMany({
            data: examDates.map((ed) => ({
              projectId: id,
              examDate: new Date(ed.examDate),
              shift: ed.shift || 'Shift 1',
              startTime: ed.startTime || null,
              endTime: ed.endTime || null,
            })),
          });
          projectData.examDate = new Date(examDates[0].examDate);
        } else {
          projectData.examDate = null;
        }
      }

      const updated = await tx.project.update({
        where: { id },
        data: projectData as Prisma.ProjectUpdateInput,
        include: {
          client: true,
          examDates: { orderBy: { examDate: 'asc' } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'PROJECT_UPDATED',
          entity: 'Project',
          entityId: id,
          details: JSON.parse(JSON.stringify(data)),
        },
      });

      return updated;
    });
  }


  // ── 3b. Annual Examination Calendar Synchronization ────────────────────────
  static async getCalendarExams(filters: {
    year?: number;
    month?: number;
    clientId?: string;
    agency?: string;
    date?: string;
  } = {}) {
    const year = filters.year || new Date().getFullYear();
    const { month, clientId, agency, date } = filters;

    let startDate: Date;
    let endDate: Date;

    if (date) {
      startDate = new Date(`${date}T00:00:00.000Z`);
      endDate = new Date(`${date}T23:59:59.999Z`);
    } else if (month !== undefined && month >= 1 && month <= 12) {
      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    } else {
      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    }

    const where: Prisma.ProjectExamDateWhereInput = {
      examDate: {
        gte: startDate,
        lte: endDate,
      },
      project: {
        ...(clientId ? { clientId } : {}),
        ...(agency && agency !== 'All'
          ? {
            client: {
              OR: [
                { name: { contains: agency } },
                { fullName: { contains: agency } },
              ],
            },
          }
          : {}),
      },
    };

    const examDates = await prisma.projectExamDate.findMany({
      where,
      orderBy: [{ examDate: 'asc' }, { shift: 'asc' }],
      select: {
        id: true,
        projectId: true,
        examDate: true,
        shift: true,
        startTime: true,
        endTime: true,
        project: {
          select: {
            id: true,
            clientId: true,
            projectCode: true,
            name: true,
            examType: true,
            stage: true,
            status: true,
            candidateTarget: true,
            centreTarget: true,
            citiesCount: true,
            slaHealth: true,
            client: { select: { id: true, name: true, fullName: true } },
          },
        },
      },
    });

    const CLIENT_COLORS: Record<string, string> = {
      Eduquity: '#1e40af',
      'Edu-Spark': '#d97706',
      NTA: '#2563eb',
      UGC: '#7c3aed',
      AICTE: '#0ea5e9',
      CSIR: '#16a34a',
    };

    const exams = examDates.map((item: any) => {
      const clientName = item.project.client?.name || 'Eduquity';
      const color =
        CLIENT_COLORS[clientName] ||
        (clientName.toLowerCase().includes('spark') ? '#d97706' : '#1e40af');
      const isoDate = item.examDate.toISOString().split('T')[0];

      return {
        id: item.id,
        projectId: item.projectId,
        projectCode: item.project.projectCode,
        name: item.project.name,
        projectName: item.project.name,
        client: clientName,
        clientId: item.project.clientId,
        clientFullName: item.project.client?.fullName || clientName,
        examType: item.project.examType || 'CBT Exam',
        type: item.project.examType || 'CBT Exam',
        date: isoDate,
        rawDate: item.examDate.toISOString(),
        shift: item.shift || 'Shift 1',
        startTime: item.startTime || '09:00 AM',
        endTime: item.endTime || '12:00 PM',
        candidateTarget: item.project.candidateTarget || 0,
        candidates: Number(item.project.candidateTarget || 0).toLocaleString(),
        centreTarget: item.project.centreTarget || 0,
        centres: item.project.centreTarget || 0,
        citiesCount: item.project.citiesCount || 1,
        cities: item.project.citiesCount || 1,
        stage: item.project.stage || 'Setup',
        status: item.project.status || 'Active',
        slaHealth: item.project.slaHealth || 'OnTrack',
        color,
      };
    });

    const activeProjectIds = new Set(exams.map((e: any) => e.projectId));

    return {
      exams,
      summary: {
        year,
        totalExams: exams.length,
        activeProjects: activeProjectIds.size,
        totalCandidateTarget: exams.reduce((acc: number, e: any) => acc + (e.candidateTarget || 0), 0),
        totalCentreTarget: exams.reduce((acc: number, e: any) => acc + (e.centreTarget || 0), 0),
        clientId: clientId || null,
        agency: agency || null,
      },
    };
  }

  static async updateProjectStatus(
    id: string,
    status: 'Active' | 'OnHold' | 'Completed' | 'Closed',
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Project not found');
    }

    return prisma.$transaction(async (tx: any) => {
      const updated = await tx.project.update({
        where: { id },
        data: { status },
        include: { client: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'PROJECT_STATUS_UPDATED',
          entity: 'Project',
          entityId: id,
          details: { status },
        },
      });

      return updated;
    });
  }

  // ── 4. Centre Master Management ──────────────────────────────────────────
  static async listCentres(params: {
    page: number;
    limit: number;
    search?: string;
    regionId?: string;
    stateId?: string;
    cityId?: string;
    status?: string;
    eligibilityStatus?: string;
  }) {
    const { page, limit, search, regionId, stateId, cityId, status, eligibilityStatus } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CentreWhereInput = {
      ...(status ? { centreStatus: status } : {}),
      ...(eligibilityStatus ? { eligibilityStatus } : {}),
      ...(regionId ? { regionId } : {}),
      ...(stateId ? { stateId } : {}),
      ...(cityId ? { cityId } : {}),
      ...(search
        ? {
          OR: [
            { centreName: { contains: search } },
            { centreCode: { contains: search } },
            { eduCode: { contains: search } },
            { tcCode: { contains: search } },
            { cityName: { contains: search } },
          ],
        }
        : {}),
    };

    const [centres, total] = await Promise.all([
      prisma.centre.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          capacity: true,
          contacts: { where: { isPrimary: true } },
          _count: { select: { bookings: true, audits: true } },
        },
      }),
      prisma.centre.count({ where }),
    ]);

    return {
      centres,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async createCentre(
    data: Prisma.CentreCreateInput,
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.centre.findUnique({
      where: { centreCode: data.centreCode },
    });
    if (existing) {
      throw new Error(`Centre code "${data.centreCode}" already exists`);
    }

    return prisma.$transaction(async (tx: any) => {
      const centre = await tx.centre.create({
        data,
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'CENTRE_CREATED',
          entity: 'Centre',
          entityId: centre.id,
          details: { name: centre.centreName, code: centre.centreCode },
        },
      });

      return centre;
    });
  }

  static async getCentreById(id: string) {
    const centre = await prisma.centre.findUnique({
      where: { id },
      include: {
        contacts: true,
        capacity: true,
        bookings: { include: { project: true } },
        audits: { include: { project: true, auditor: { select: { name: true } } } },
        blacklists: { where: { isActive: true } },
      },
    });

    if (!centre) {
      throw new Error('Centre not found');
    }
    return centre;
  }

  static async updateCentre(
    id: string,
    data: Prisma.CentreUpdateInput,
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.centre.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Centre not found');
    }

    return prisma.$transaction(async (tx: any) => {
      const updated = await tx.centre.update({
        where: { id },
        data,
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'CENTRE_UPDATED',
          entity: 'Centre',
          entityId: id,
          details: JSON.parse(JSON.stringify(data)),
        },
      });

      return updated;
    });
  }

  static async updateCentreStatus(
    id: string,
    status: string,
    reason: string | undefined,
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.centre.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Centre not found');
    }

    return prisma.$transaction(async (tx: any) => {
      const updateData: any = { centreStatus: status };
      if (status === 'Rejected' && reason) {
        updateData.rejectionReason = reason;
      }

      const updated = await tx.centre.update({
        where: { id },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: `CENTRE_STATUS_${status.toUpperCase().replace(/\s+/g, '_')}`,
          entity: 'Centre',
          entityId: id,
          details: { priorStatus: existing.centreStatus, newStatus: status, reason },
        },
      });

      return updated;
    });
  }

  // ── Centre Master Overview Summary (4 Status Cards per OEMP PDF) ────────
  static async getCentresSummary(clientId?: string) {
    let where: Prisma.CentreWhereInput = {};
    if (clientId) {
      where = {
        OR: [
          { bookings: { some: { project: { clientId } } } },
          { audits: { some: { project: { clientId } } } },
        ],
      };
    }

    const [statusGroups, activeBlacklists, totalCount] = await Promise.all([
      prisma.centre.groupBy({
        by: ['centreStatus'],
        where,
        _count: { _all: true },
      }),
      prisma.blacklistRecord.count({
        where: {
          isActive: true,
          ...(clientId ? { centre: where } : {}),
        },
      }),
      prisma.centre.count({ where }),
    ]);

    const counts: Record<string, number> = {};
    for (const sg of statusGroups) {
      counts[sg.centreStatus] = sg._count._all;
    }

    // Card 1: All & Ready-for-Booking
    // Card 2: Invited & Booked
    // Card 3: Auditor Assigned & Audited
    // Card 4: Rejected & Blacklisted
    const all = totalCount;
    const readyForBooking = (counts['Ready to Book'] || 0) + (counts['Approved'] || 0);
    const invited = counts['Invited'] || 0;
    const booked = counts['Booked'] || 0;
    const auditorAssigned = counts['Auditor Assigned'] || 0;
    const audited = counts['Audited'] || 0;
    const rejected = counts['Rejected'] || 0;
    const blacklisted = activeBlacklists || (counts['Blacklisted'] || 0);

    return {
      card1: { all, readyForBooking },
      card2: { invited, booked },
      card3: { auditorAssigned, audited },
      card4: { rejected, blacklisted },
      rawCounts: counts,
    };
  }

  // ── Centre Complete 8-Tab Profile ────────────────────────────────────────
  static async getCentreProfile(
    id: string,
    userRole: string,
    adminUserId: string,
    adminEmail: string
  ) {
    const centre = await prisma.centre.findUnique({
      where: { id },
      include: {
        contacts: true,
        capacity: true,
        documents: { orderBy: { createdAt: 'desc' } },
        infrastructure: true,
        bankAccount: true,
        bookings: { include: { project: { select: { id: true, name: true, projectCode: true } } } },
        audits: {
          include: {
            project: { select: { id: true, name: true, projectCode: true } },
            auditor: { select: { id: true, name: true, email: true } },
          },
        },
        blacklists: { where: { isActive: true } },
      },
    });

    if (!centre) {
      throw new Error('Centre not found');
    }

    // Fetch related audit logs for Activity History tab
    const activityHistory = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entity: 'Centre', entityId: id },
          { entityId: id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, role: true } } },
    });

    // Mask bank account number if not authorized (Admin and Operations see full details)
    let bankAccount = centre.bankAccount;
    if (bankAccount && userRole !== 'ADMIN' && userRole !== 'OPERATIONS') {
      const rawAcc = bankAccount.accountNumber || '';
      bankAccount = {
        ...bankAccount,
        accountNumber: rawAcc.length > 4 ? `XXXX XXXX ${rawAcc.slice(-4)}` : rawAcc,
      };
    }

    return {
      ...centre,
      bankAccount,
      activityHistory,
    };
  }

  // ── Verify or Reject Individual Document ──────────────────────────────────
  static async verifyDocument(
    centreId: string,
    documentId: string,
    status: 'Verified' | 'Rejected',
    remarks: string | undefined,
    rejectionReason: string | undefined,
    adminUserId: string,
    adminEmail: string
  ) {
    const doc = await prisma.centreDocument.findFirst({
      where: { id: documentId, centreId },
    });
    if (!doc) throw new Error('Document not found for this centre');

    if (status === 'Rejected' && !rejectionReason?.trim()) {
      throw new Error('Rejection reason is mandatory when rejecting a document');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.centreDocument.update({
        where: { id: documentId },
        data: {
          status,
          remarks: remarks || null,
          rejectionReason: status === 'Rejected' ? rejectionReason : null,
          verifiedBy: adminEmail,
          verifiedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: status === 'Verified' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
          entity: 'CentreDocument',
          entityId: documentId,
          details: { centreId, documentType: doc.documentType, status, rejectionReason },
        },
      });

      return updated;
    });
  }

  // ── Verify or Reject Bank Account Details ─────────────────────────────────
  static async verifyBank(
    centreId: string,
    status: 'Verified' | 'Rejected',
    remarks: string | undefined,
    rejectionReason: string | undefined,
    adminUserId: string,
    adminEmail: string
  ) {
    const bank = await prisma.centreBankAccount.findUnique({
      where: { centreId },
    });
    if (!bank) throw new Error('Bank account record not found for this centre');

    if (status === 'Rejected' && !rejectionReason?.trim()) {
      throw new Error('Rejection reason is mandatory when rejecting bank details');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.centreBankAccount.update({
        where: { centreId },
        data: {
          verificationStatus: status,
          isPaymentEligible: status === 'Verified',
          remarks: remarks || null,
          rejectionReason: status === 'Rejected' ? rejectionReason : null,
          verifiedBy: adminEmail,
          verifiedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: status === 'Verified' ? 'BANK_VERIFIED' : 'BANK_REJECTED',
          entity: 'CentreBankAccount',
          entityId: bank.id,
          details: { centreId, status, rejectionReason },
        },
      });

      return updated;
    });
  }

  // ── Approve Centre Application ───────────────────────────────────────────
  static async approveApplication(
    centreId: string,
    remarks: string | undefined,
    adminUserId: string,
    adminEmail: string
  ) {
    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
    });
    if (!centre) throw new Error('Centre not found');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.centre.update({
        where: { id: centreId },
        data: {
          centreStatus: 'Ready to Book',
          rejectionReason: null,
          remarks: remarks || centre.remarks,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'CENTRE_APPLICATION_APPROVED',
          entity: 'Centre',
          entityId: centreId,
          details: { priorStatus: centre.centreStatus, newStatus: 'Ready to Book', remarks },
        },
      });

      return updated;
    });
  }

  // ── Reject Centre Application ────────────────────────────────────────────
  static async rejectApplication(
    centreId: string,
    reason: string,
    adminUserId: string,
    adminEmail: string
  ) {
    if (!reason?.trim()) {
      throw new Error('A rejection reason is mandatory');
    }

    const centre = await prisma.centre.findUnique({ where: { id: centreId } });
    if (!centre) throw new Error('Centre not found');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.centre.update({
        where: { id: centreId },
        data: {
          centreStatus: 'Rejected',
          rejectionReason: reason,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'CENTRE_APPLICATION_REJECTED',
          entity: 'Centre',
          entityId: centreId,
          details: { priorStatus: centre.centreStatus, newStatus: 'Rejected', reason },
        },
      });

      return updated;
    });
  }

  // ── Assign Auditor to Centre ─────────────────────────────────────────────
  static async assignAuditor(
    centreId: string,
    auditorId: string,
    auditDate: string | undefined,
    remarks: string | undefined,
    adminUserId: string,
    adminEmail: string
  ) {
    const centre = await prisma.centre.findUnique({ where: { id: centreId } });
    if (!centre) throw new Error('Centre not found');

    const auditor = await prisma.user.findUnique({ where: { id: auditorId } });
    if (!auditor) throw new Error('Selected auditor not found');

    const firstProject = await prisma.project.findFirst({ select: { id: true } });
    if (!firstProject) throw new Error('At least one examination project must exist to assign an auditor');

    return prisma.$transaction(async (tx) => {
      const assignmentCode = `AUD-${Date.now().toString().slice(-6)}`;
      const assignment = await tx.auditAssignment.create({
        data: {
          assignmentCode,
          projectId: firstProject.id,
          centreId,
          auditorId,
          auditDate: auditDate ? new Date(auditDate) : new Date(),
          status: 'Assigned',
          findingsSummary: remarks || null,
        },
      });

      const updated = await tx.centre.update({
        where: { id: centreId },
        data: { centreStatus: 'Auditor Assigned' },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'AUDITOR_ASSIGNED',
          entity: 'Centre',
          entityId: centreId,
          details: { auditorId, auditorName: auditor.name, assignmentCode },
        },
      });

      return { assignment, centre: updated };
    });
  }

  // ── 5. Eligibility & Blacklist Oversight ─────────────────────────────────
  static async blacklistCentre(
    centreId: string,
    reason: string,
    adminUserId: string,
    adminEmail: string
  ) {
    const centre = await prisma.centre.findUnique({ where: { id: centreId } });
    if (!centre) {
      throw new Error('Centre not found');
    }

    return prisma.$transaction(async (tx: any) => {
      // Mark active blacklist record
      const record = await tx.blacklistRecord.create({
        data: {
          centreId,
          reason,
          flaggedBy: adminEmail,
          isActive: true,
        },
      });

      // Update centre eligibility
      await tx.centre.update({
        where: { id: centreId },
        data: { eligibilityStatus: 'Blacklisted' },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'CENTRE_BLACKLISTED',
          entity: 'Centre',
          entityId: centreId,
          details: { reason, recordId: record.id },
        },
      });

      return record;
    });
  }

  static async overrideEligibility(
    centreId: string,
    eligibilityStatus: string,
    overrideReason: string,
    adminUserId: string,
    adminEmail: string
  ) {
    const centre = await prisma.centre.findUnique({ where: { id: centreId } });
    if (!centre) {
      throw new Error('Centre not found');
    }

    return prisma.$transaction(async (tx: any) => {
      // If was blacklisted, deactivate existing blacklist records
      if (centre.eligibilityStatus === 'Blacklisted' && eligibilityStatus !== 'Blacklisted') {
        await tx.blacklistRecord.updateMany({
          where: { centreId, isActive: true },
          data: {
            isActive: false,
            overrideReason,
            overriddenBy: adminEmail,
            overriddenAt: new Date(),
          },
        });
      }

      const updatedCentre = await tx.centre.update({
        where: { id: centreId },
        data: { eligibilityStatus },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'ELIGIBILITY_OVERRIDDEN',
          entity: 'Centre',
          entityId: centreId,
          details: {
            priorEligibility: centre.eligibilityStatus,
            newEligibility: eligibilityStatus,
            overrideReason,
          },
        },
      });

      return updatedCentre;
    });
  }

  // ── 6. Audit Trail & System Config ───────────────────────────────────────
  static async getAuditLogs(params: {
    page: number;
    limit: number;
    action?: string;
    entity?: string;
  }) {
    const { page, limit, action, entity } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(action ? { action } : {}),
      ...(entity ? { entity } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getSystemConfigs() {
    return prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });
  }

  static async updateSystemConfig(
    key: string,
    value: Record<string, unknown>,
    category: string | undefined,
    adminUserId: string,
    adminEmail: string
  ) {
    return prisma.$transaction(async (tx: any) => {
      const config = await tx.systemConfig.upsert({
        where: { key },
        update: {
          value: value as Prisma.InputJsonValue,
          ...(category ? { category } : {}),
          updatedBy: adminEmail,
        },
        create: {
          key,
          value: value as Prisma.InputJsonValue,
          category: category || 'GENERAL',
          updatedBy: adminEmail,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'SYSTEM_CONFIG_UPDATED',
          entity: 'SystemConfig',
          entityId: config.id,
          details: { key, updatedBy: adminEmail },
        },
      });

      return config;
    });
  }

  // ── 7. Client Management ──────────────────────────────────────────────────
  static async listClients(params: { page: number; limit: number; search?: string; status?: string }) {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ClientWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
          OR: [
            { name: { contains: search } },
            { fullName: { contains: search } },
            { contactEmail: { contains: search } },
          ],
        }
        : {}),
    };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { projects: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    return {
      data: clients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getClientById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            projectCode: true,
            name: true,
            examType: true,
            stage: true,
            status: true,
          },
        },
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    return client;
  }

  static async createClient(
    data: {
      code?: string;
      name: string;
      fullName: string;
      contactEmail: string;
      description?: string;
      isActive?: boolean;
      status?: string;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    return prisma.$transaction(async (tx: any) => {
      const client = await tx.client.create({
        data: {
          code: data.code,
          name: data.name,
          fullName: data.fullName,
          contactEmail: data.contactEmail,
          description: data.description,
          isActive: data.isActive ?? true,
          status: data.status || 'Active',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'CLIENT_CREATED',
          entity: 'Client',
          entityId: client.id,
          details: { name: client.name, fullName: client.fullName },
        },
      });

      return client;
    });
  }

  static async updateClient(
    id: string,
    data: {
      code?: string;
      name?: string;
      fullName?: string;
      contactEmail?: string;
      description?: string;
      isActive?: boolean;
      status?: string;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    return prisma.$transaction(async (tx: any) => {
      const existing = await tx.client.findUnique({ where: { id } });
      if (!existing) {
        throw new Error('Client not found');
      }

      const updated = await tx.client.update({
        where: { id },
        data,
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'CLIENT_UPDATED',
          entity: 'Client',
          entityId: id,
          details: { changes: data },
        },
      });

      return updated;
    });
  }

  static async updateClientStatus(
    id: string,
    data: { status?: 'Active' | 'Inactive'; isActive?: boolean },
    adminUserId: string,
    adminEmail: string
  ) {
    return prisma.$transaction(async (tx: any) => {
      const existing = await tx.client.findUnique({ where: { id } });
      if (!existing) {
        throw new Error('Client not found');
      }

      const updateData: Prisma.ClientUpdateInput = {};
      if (data.status) {
        updateData.status = data.status;
        updateData.isActive = data.status === 'Active';
      }
      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
        if (!data.status) {
          updateData.status = data.isActive ? 'Active' : 'Inactive';
        }
      }

      const updated = await tx.client.update({
        where: { id },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'CLIENT_STATUS_UPDATED',
          entity: 'Client',
          entityId: id,
          details: JSON.parse(JSON.stringify(updateData)),
        },
      });

      return updated;
    });
  }

  // ── 8. Exam Types Management ─────────────────────────────────────────────
  static async listExamTypes(params: {
    page: number;
    limit: number;
    search?: string;
    projectId?: string;
    clientId?: string;
    isActive?: boolean;
  }) {
    const { page, limit, search, projectId, clientId, isActive } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ExamTypeWhereInput = {
      ...(projectId ? { projectId } : {}),
      ...(clientId ? { project: { clientId } } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
          OR: [
            { examCode: { contains: search } },
            { examTypeName: { contains: search } },
          ],
        }
        : {}),
    };

    const [examTypes, total] = await Promise.all([
      prisma.examType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              projectCode: true,
              name: true,
              clientId: true,
              client: { select: { id: true, name: true, fullName: true } },
            },
          },
          _count: { select: { exams: true } },
        },
      }),
      prisma.examType.count({ where }),
    ]);

    return {
      data: examTypes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getExamTypeById(id: string) {
    const examType = await prisma.examType.findUnique({
      where: { id },
      include: {
        project: {
          include: { client: true },
        },
        exams: {
          orderBy: { createdAt: 'desc' },
          include: {
            dates: {
              orderBy: { examDate: 'asc' },
              include: { shifts: { orderBy: { shiftNumber: 'asc' } } },
            },
            _count: { select: { bookings: true } },
          },
        },
      },
    });

    if (!examType) {
      throw new Error('Exam type not found');
    }

    return examType;
  }

  static async createExamType(
    data: {
      projectId: string;
      examCode: string;
      examTypeName: string;
      description?: string;
      isActive?: boolean;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });
    if (!project) {
      throw new Error('Project not found');
    }

    const existing = await prisma.examType.findUnique({
      where: {
        projectId_examCode: {
          projectId: data.projectId,
          examCode: data.examCode,
        },
      },
    });
    if (existing) {
      throw new Error(`Exam code "${data.examCode}" already exists for this project`);
    }

    return prisma.$transaction(async (tx: any) => {
      const examType = await tx.examType.create({
        data: {
          projectId: data.projectId,
          examCode: data.examCode.trim(),
          examTypeName: data.examTypeName.trim(),
          description: data.description,
          isActive: data.isActive ?? true,
        },
        include: {
          project: { include: { client: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'EXAM_TYPE_CREATED',
          entity: 'ExamType',
          entityId: examType.id,
          details: { examCode: examType.examCode, examTypeName: examType.examTypeName },
        },
      });

      return examType;
    });
  }

  static async updateExamType(
    id: string,
    data: {
      projectId?: string;
      examCode?: string;
      examTypeName?: string;
      description?: string;
      isActive?: boolean;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.examType.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Exam type not found');
    }

    if (data.projectId && data.projectId !== existing.projectId) {
      const targetProject = await prisma.project.findUnique({ where: { id: data.projectId } });
      if (!targetProject) {
        throw new Error('Target project not found');
      }
    }

    return prisma.$transaction(async (tx: any) => {
      const updated = await tx.examType.update({
        where: { id },
        data: {
          ...(data.projectId ? { projectId: data.projectId } : {}),
          ...(data.examCode ? { examCode: data.examCode.trim() } : {}),
          ...(data.examTypeName ? { examTypeName: data.examTypeName.trim() } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
        include: { project: { include: { client: true } } },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'EXAM_TYPE_UPDATED',
          entity: 'ExamType',
          entityId: id,
          details: { changes: data },
        },
      });

      return updated;
    });
  }

  static async updateExamTypeStatus(
    id: string,
    isActive: boolean,
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.examType.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Exam type not found');
    }

    return prisma.$transaction(async (tx: any) => {
      const updated = await tx.examType.update({
        where: { id },
        data: { isActive },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'EXAM_TYPE_STATUS_UPDATED',
          entity: 'ExamType',
          entityId: id,
          details: { isActive },
        },
      });

      return updated;
    });
  }

  static async deleteExamType(id: string, adminUserId: string, adminEmail: string) {
    const existing = await prisma.examType.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Exam type not found');
    }

    return prisma.$transaction(async (tx: any) => {
      await tx.examType.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'EXAM_TYPE_DELETED',
          entity: 'ExamType',
          entityId: id,
          details: { examCode: existing.examCode, examTypeName: existing.examTypeName },
        },
      });

      return { success: true };
    });
  }

  // ── 9. Exam Instances Management ─────────────────────────────────────────
  static async listExams(params: {
    page: number;
    limit: number;
    search?: string;
    examTypeId?: string;
    projectId?: string;
    clientId?: string;
    status?: string;
  }) {
    const { page, limit, search, examTypeId, projectId, clientId, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ExamWhereInput = {
      ...(examTypeId ? { examTypeId } : {}),
      ...(projectId ? { examType: { projectId } } : {}),
      ...(clientId ? { examType: { project: { clientId } } } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
          OR: [
            { examCode: { contains: search } },
            { examName: { contains: search } },
          ],
        }
        : {}),
    };

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          examType: {
            include: {
              project: {
                select: {
                  id: true,
                  projectCode: true,
                  name: true,
                  client: { select: { id: true, name: true, fullName: true } },
                },
              },
            },
          },
          dates: {
            orderBy: { examDate: 'asc' },
            include: { shifts: { orderBy: { shiftNumber: 'asc' } } },
          },
          _count: { select: { bookings: true } },
        },
      }),
      prisma.exam.count({ where }),
    ]);

    return {
      data: exams,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getExamById(id: string) {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        examType: {
          include: {
            project: {
              include: { client: true },
            },
          },
        },
        dates: {
          orderBy: { examDate: 'asc' },
          include: { shifts: { orderBy: { shiftNumber: 'asc' } } },
        },
        bookings: {
          include: { centre: true },
        },
      },
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    return exam;
  }

  static async createExam(
    data: {
      examTypeId: string;
      examCode: string;
      examName: string;
      examYear?: number;
      description?: string;
      status?: string;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const examType = await prisma.examType.findUnique({ where: { id: data.examTypeId } });
    if (!examType) {
      throw new Error('Exam type not found');
    }

    const existing = await prisma.exam.findUnique({
      where: {
        examTypeId_examCode: {
          examTypeId: data.examTypeId,
          examCode: data.examCode,
        },
      },
    });
    if (existing) {
      throw new Error(`Exam code "${data.examCode}" already exists for this exam type`);
    }

    return prisma.$transaction(async (tx: any) => {
      const exam = await tx.exam.create({
        data: {
          examTypeId: data.examTypeId,
          examCode: data.examCode.trim(),
          examName: data.examName.trim(),
          examYear: data.examYear || new Date().getFullYear(),
          description: data.description,
          status: data.status || 'Scheduled',
        },
        include: {
          examType: { include: { project: { include: { client: true } } } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'EXAM_CREATED',
          entity: 'Exam',
          entityId: exam.id,
          details: { examCode: exam.examCode, examName: exam.examName },
        },
      });

      return exam;
    });
  }

  static async updateExam(
    id: string,
    data: {
      examTypeId?: string;
      examCode?: string;
      examName?: string;
      examYear?: number;
      description?: string;
      status?: string;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Exam not found');
    }

    if (data.examTypeId && data.examTypeId !== existing.examTypeId) {
      const targetType = await prisma.examType.findUnique({ where: { id: data.examTypeId } });
      if (!targetType) {
        throw new Error('Target exam type not found');
      }
    }

    return prisma.$transaction(async (tx: any) => {
      const updated = await tx.exam.update({
        where: { id },
        data: {
          ...(data.examTypeId ? { examTypeId: data.examTypeId } : {}),
          ...(data.examCode ? { examCode: data.examCode.trim() } : {}),
          ...(data.examName ? { examName: data.examName.trim() } : {}),
          ...(data.examYear !== undefined ? { examYear: data.examYear } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.status ? { status: data.status } : {}),
        },
        include: {
          examType: { include: { project: { include: { client: true } } } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'EXAM_UPDATED',
          entity: 'Exam',
          entityId: id,
          details: { changes: data },
        },
      });

      return updated;
    });
  }

  static async deleteExam(id: string, adminUserId: string, adminEmail: string) {
    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Exam not found');
    }

    return prisma.$transaction(async (tx: any) => {
      await tx.exam.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'EXAM_DELETED',
          entity: 'Exam',
          entityId: id,
          details: { examCode: existing.examCode, examName: existing.examName },
        },
      });

      return { success: true };
    });
  }

  // ── 10. Exam Dates Management ────────────────────────────────────────────
  static async listExamDates(examId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      throw new Error('Exam not found');
    }

    return prisma.examDate.findMany({
      where: { examId },
      orderBy: { examDate: 'asc' },
      include: {
        shifts: { orderBy: { shiftNumber: 'asc' } },
      },
    });
  }

  static async createExamDate(
    examId: string,
    data: {
      examDate: string | Date;
      reportingTime?: string;
      status?: string;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      throw new Error('Exam not found');
    }

    return prisma.$transaction(async (tx: any) => {
      const examDate = await tx.examDate.create({
        data: {
          examId,
          examDate: new Date(data.examDate),
          reportingTime: data.reportingTime,
          status: data.status || 'Scheduled',
        },
        include: { shifts: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'EXAM_DATE_CREATED',
          entity: 'ExamDate',
          entityId: examDate.id,
          details: { examId, examDate: data.examDate },
        },
      });

      return examDate;
    });
  }

  static async deleteExamDate(id: string, adminUserId: string, adminEmail: string) {
    const existing = await prisma.examDate.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Exam date not found');
    }

    return prisma.$transaction(async (tx: any) => {
      await tx.examDate.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'EXAM_DATE_DELETED',
          entity: 'ExamDate',
          entityId: id,
          details: { examId: existing.examId, examDate: existing.examDate },
        },
      });

      return { success: true };
    });
  }

  // ── 11. Exam Shifts Management ───────────────────────────────────────────
  static async listExamShifts(examDateId: string) {
    const examDate = await prisma.examDate.findUnique({ where: { id: examDateId } });
    if (!examDate) {
      throw new Error('Exam date not found');
    }

    return prisma.examShift.findMany({
      where: { examDateId },
      orderBy: { shiftNumber: 'asc' },
    });
  }

  static async createExamShift(
    examDateId: string,
    data: {
      shiftName: string;
      shiftNumber?: number;
      startTime: string;
      endTime: string;
      reportingTime?: string;
      status?: string;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const examDate = await prisma.examDate.findUnique({ where: { id: examDateId } });
    if (!examDate) {
      throw new Error('Exam date not found');
    }

    return prisma.$transaction(async (tx: any) => {
      const shift = await tx.examShift.create({
        data: {
          examDateId,
          shiftName: data.shiftName.trim(),
          shiftNumber: data.shiftNumber || 1,
          startTime: data.startTime.trim(),
          endTime: data.endTime.trim(),
          reportingTime: data.reportingTime?.trim(),
          status: data.status || 'Scheduled',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'EXAM_SHIFT_CREATED',
          entity: 'ExamShift',
          entityId: shift.id,
          details: { examDateId, shiftName: shift.shiftName, shiftNumber: shift.shiftNumber },
        },
      });

      return shift;
    });
  }

  static async deleteExamShift(id: string, adminUserId: string, adminEmail: string) {
    const existing = await prisma.examShift.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Exam shift not found');
    }

    return prisma.$transaction(async (tx: any) => {
      await tx.examShift.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'EXAM_SHIFT_DELETED',
          entity: 'ExamShift',
          entityId: id,
          details: { examDateId: existing.examDateId, shiftName: existing.shiftName },
        },
      });

      return { success: true };
    });
  }
}

