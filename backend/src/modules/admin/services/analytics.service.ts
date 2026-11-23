import { prisma } from '../../../config/database.js';
import { Role, Prisma } from '@prisma/client';

export class AnalyticsService {
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

    // Also fetch exams for these projects to associate examination names and metadata
    const activeProjectIdsList = Array.from(new Set(examDates.map((item: any) => item.projectId)));
    const relatedExams = activeProjectIdsList.length > 0
      ? await prisma.exam.findMany({
          where: {
            examType: {
              projectId: { in: activeProjectIdsList },
            },
          },
          include: {
            dates: {
              include: {
                shifts: true,
              },
            },
          },
        })
      : [];

    const exams = examDates.map((item: any) => {
      const clientName = item.project.client?.name || 'Eduquity';
      const color =
        CLIENT_COLORS[clientName] ||
        (clientName.toLowerCase().includes('spark') ? '#d97706' : '#1e40af');
      const isoDate = item.examDate.toISOString().split('T')[0];

      // Match exam for this project, date, and shift
      const matchingExam = relatedExams.find((ex: any) => {
        if (ex.examType?.projectId !== item.projectId) return false;
        return (ex.dates || []).some((d: any) => {
          const dIso = d.examDate.toISOString().split('T')[0];
          if (dIso !== isoDate) return false;
          return (d.shifts || []).some(
            (s: any) => (s.shiftName || '').toLowerCase() === (item.shift || '').toLowerCase()
          );
        });
      });

      let examMeta: any = {};
      if (matchingExam?.description) {
        try {
          examMeta = JSON.parse(matchingExam.description);
          if (typeof examMeta !== 'object' || examMeta === null) examMeta = {};
        } catch {
          examMeta = {};
        }
      }

      const examName = matchingExam?.examName || item.project.name;
      const candidateTarget =
        examMeta.candidateRequiredCount ||
        examMeta.summary?.candidateTarget ||
        item.project.candidateTarget ||
        0;
      const citiesCount =
        examMeta.coverage ||
        examMeta.summary?.coverageCount ||
        item.project.citiesCount ||
        1;

      return {
        id: item.id,
        examId: matchingExam?.id,
        projectId: item.projectId,
        projectCode: item.project.projectCode,
        name: examName,
        examName,
        examCode: matchingExam?.examCode,
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
        candidateTarget,
        candidates: Number(candidateTarget).toLocaleString(),
        centreTarget: item.project.centreTarget || 0,
        centres: item.project.centreTarget || 0,
        citiesCount,
        cities: citiesCount,
        stage: item.project.stage || 'Setup',
        status: matchingExam?.status || item.project.status || 'Active',
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

}
