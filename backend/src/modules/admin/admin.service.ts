import { prisma } from '../../config/database.js';
import { hashPassword } from '../../utils/hasher.js';
import { Role, UserStatus, Prisma } from '@prisma/client';

export class AdminService {
  // ── 1. Analytics & Executive KPI Aggregation ──────────────────────────────
  static async getExecutiveAnalytics() {
    const [
      totalCentres,
      activeCentres,
      pendingApprovalCentres,
      totalProjects,
      activeProjects,
      totalUsers,
      activeUsers,
      openBlacklists,
      recentAuditLogs,
      projectStages,
      centreStatuses,
    ] = await Promise.all([
      prisma.centre.count(),
      prisma.centre.count({ where: { centreStatus: { in: ['Approved', 'Active'] } } }),
      prisma.centre.count({ where: { centreStatus: 'Draft' } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'Active' } }),
      prisma.user.count(),
      prisma.user.count({ where: { status: 'Active' } }),
      prisma.blacklistRecord.count({ where: { isActive: true } }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, role: true } } },
      }),
      prisma.project.groupBy({
        by: ['stage'],
        _count: { stage: true },
      }),
      prisma.centre.groupBy({
        by: ['centreStatus'],
        _count: { centreStatus: true },
      }),
    ]);

    const projectStatusData = projectStages.map((ps) => ({
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

    const centreStatusData = centreStatuses.map((cs) => ({
      name: cs.centreStatus,
      value: cs._count.centreStatus,
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
      kpis: {
        activeProjects: { value: activeProjects, total: totalProjects },
        totalCentres: { value: totalCentres, active: activeCentres },
        activeUsers: { value: activeUsers, total: totalUsers },
        openExceptions: { value: openBlacklists, critical: openBlacklists },
        pendingApprovals: { value: pendingApprovalCentres },
      },
      charts: {
        projectStatusData,
        centreStatusData,
      },
      recentActivity: recentAuditLogs.map((log) => ({
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
  static async listUsers(params: {
    page: number;
    limit: number;
    search?: string;
    role?: Role;
    status?: UserStatus;
  }) {
    const { page, limit, search, role, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          status: true,
          scope: true,
          lastLogin: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

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

  static async createUser(
    data: {
      email: string;
      password: string;
      name: string;
      role: Role;
      status?: UserStatus;
      scope?: unknown;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new Error('A user with this email address already exists');
    }

    const passwordHash = await hashPassword(data.password);

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          passwordHash,
          name: data.name,
          role: data.role,
          status: data.status || 'Active',
          scope: data.scope ? (data.scope as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          scope: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'USER_CREATED',
          entity: 'User',
          entityId: created.id,
          details: { name: created.name, email: created.email, role: created.role },
        },
      });

      return created;
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
        role: true,
        avatar: true,
        status: true,
        scope: true,
        lastLogin: true,
        createdAt: true,
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
      role?: Role;
      status?: UserStatus;
      password?: string;
      scope?: unknown;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('User not found');
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (data.name) updateData.name = data.name;
    if (data.role) updateData.role = data.role;
    if (data.status) updateData.status = data.status;
    if (data.scope) updateData.scope = data.scope as Prisma.InputJsonValue;
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
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

  static async deleteUser(id: string, adminUserId: string, adminEmail: string) {
    // Soft deletion: deactivates user rather than removing records
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('User not found');
    }

    if (existing.id === adminUserId) {
      throw new Error('Administrators cannot deactivate their own account');
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { status: 'Inactive' },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'USER_DEACTIVATED',
          entity: 'User',
          entityId: id,
          details: { priorStatus: existing.status },
        },
      });
    });

    return { success: true };
  }

  // ── 3. Project Management ────────────────────────────────────────────────
  static async listProjects(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    stage?: string;
    clientId?: string;
  }) {
    const { page, limit, search, status, stage, clientId } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      ...(status ? { status } : {}),
      ...(stage ? { stage } : {}),
      ...(clientId ? { clientId } : {}),
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
          _count: { select: { bookings: true, audits: true } },
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
    data: Prisma.ProjectUncheckedCreateInput,
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.project.findUnique({
      where: { projectCode: data.projectCode },
    });
    if (existing) {
      throw new Error(`Project code "${data.projectCode}" is already in use`);
    }

    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data,
        include: { client: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'PROJECT_CREATED',
          entity: 'Project',
          entityId: project.id,
          details: { name: project.name, projectCode: project.projectCode },
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
    data: Prisma.ProjectUpdateInput,
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Project not found');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id },
        data,
        include: { client: true },
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

    return prisma.$transaction(async (tx) => {
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

    return prisma.$transaction(async (tx) => {
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

    return prisma.$transaction(async (tx) => {
      const updated = await tx.centre.update({
        where: { id },
        data: { centreStatus: status },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: `CENTRE_STATUS_${status.toUpperCase()}`,
          entity: 'Centre',
          entityId: id,
          details: { priorStatus: existing.centreStatus, newStatus: status, reason },
        },
      });

      return updated;
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

    return prisma.$transaction(async (tx) => {
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

    return prisma.$transaction(async (tx) => {
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
    return prisma.$transaction(async (tx) => {
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
    data: { code?: string; name: string; fullName: string; contactEmail: string; status?: string },
    adminUserId: string,
    adminEmail: string
  ) {
    return prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          code: data.code,
          name: data.name,
          fullName: data.fullName,
          contactEmail: data.contactEmail,
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
    data: { code?: string; name?: string; fullName?: string; contactEmail?: string; status?: string },
    adminUserId: string,
    adminEmail: string
  ) {
    return prisma.$transaction(async (tx) => {
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
}

