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

    const newUser = await prisma.$transaction(async (tx: any) => {
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

    const updated = await prisma.$transaction(async (tx: any) => {
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

    await prisma.$transaction(async (tx: any) => {
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

