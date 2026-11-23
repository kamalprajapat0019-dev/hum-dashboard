import { prisma } from '../../../config/database.js';
import { Prisma } from '@prisma/client';

export class ProjectAdminService {
  static extractFinancialYear(project: any): string {
    if (project.description) {
      try {
        const meta = JSON.parse(project.description);
        if (meta && typeof meta === 'object' && meta.financialYear) {
          return meta.financialYear;
        }
      } catch {}
    }
    const refDate = project.examDate || project.startDate || project.createdAt;
    if (refDate) {
      const d = new Date(refDate);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      if (month >= 4) {
        return `${year}-${String(year + 1).slice(-2)}`;
      } else {
        return `${year - 1}-${String(year).slice(-2)}`;
      }
    }
    return '2026-27';
  }

  static extractCandidateTarget(project: any): number {
    let sum = 0;
    let hasExams = false;
    if (project.examTypes && Array.isArray(project.examTypes)) {
      for (const et of project.examTypes) {
        if (et.exams && Array.isArray(et.exams)) {
          for (const ex of et.exams) {
            hasExams = true;
            let count = 0;
            if (ex.description) {
              try {
                const meta = JSON.parse(ex.description);
                if (meta && typeof meta === 'object' && meta.candidateRequiredCount) {
                  count = Number(meta.candidateRequiredCount) || 0;
                }
              } catch {}
            }
            sum += count;
          }
        }
      }
    }
    if (!hasExams || sum === 0) {
      return project.candidateTarget || 0;
    }
    return sum;
  }

  static async getNextProjectCode(): Promise<string> {
    const projects = await prisma.project.findMany({
      select: { projectCode: true },
      orderBy: { projectCode: 'desc' },
    });

    let maxNum = 0;
    const regex = /^PRJ-(\d{4})$/;
    for (const p of projects) {
      const match = p.projectCode.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    return `PRJ-${String(nextNum).padStart(4, '0')}`;
  }

  static async getProjectSummary(params: { clientId?: string }) {
    const { clientId } = params;
    const where: Prisma.ProjectWhereInput = {
      ...(clientId && clientId !== 'All' ? { clientId } : {}),
    };

    const [totalProjects, activeProjects, projectsForCandidates, distinctYears] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.count({ where: { ...where, status: 'Active' } }),
      prisma.project.findMany({
        where,
        select: {
          id: true,
          candidateTarget: true,
          examTypes: {
            select: {
              exams: {
                select: {
                  id: true,
                  description: true,
                },
              },
            },
          },
        },
      }),
      prisma.exam.findMany({
        select: { examYear: true },
        distinct: ['examYear'],
        orderBy: { examYear: 'asc' },
      }),
    ]);

    let candidateTentativeCount = 0;
    for (const p of projectsForCandidates) {
      candidateTentativeCount += ProjectAdminService.extractCandidateTarget(p);
    }

    const availableYears = distinctYears.map((y) => y.examYear).filter(Boolean);

    return {
      totalProjects,
      activeProjects,
      activeRatio: `${activeProjects} / ${totalProjects}`,
      candidateTentativeCount,
      availableYears,
    };
  }

  static async listProjects(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    stage?: string;
    clientId?: string;
    projectId?: string;
    examTypeId?: string;
    year?: string | number;
  }) {
    const { page, limit, search, status, stage, clientId, projectId, examTypeId, year } = params;
    const skip = (page - 1) * limit;

    let yearFilter: Prisma.ExamTypeListRelationFilter | undefined = undefined;
    if (year && year !== 'All') {
      const numericYear = parseInt(String(year), 10);
      if (!isNaN(numericYear)) {
        yearFilter = {
          some: {
            exams: {
              some: {
                examYear: numericYear,
              },
            },
          },
        };
      }
    }

    const where: Prisma.ProjectWhereInput = {
      ...(status && status !== 'All' ? { status } : {}),
      ...(stage ? { stage } : {}),
      ...(clientId && clientId !== 'All' ? { clientId } : {}),
      ...(projectId ? { id: projectId } : {}),
      ...(examTypeId ? { examTypes: { some: { id: examTypeId } } } : {}),
      ...(yearFilter ? { examTypes: yearFilter } : {}),
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

    const [rawProjects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, fullName: true } },
          projectManager: { select: { id: true, name: true, email: true } },
          examDates: { orderBy: { examDate: 'asc' } },
          examTypes: {
            include: {
              exams: {
                select: {
                  id: true,
                  examName: true,
                  examCode: true,
                  examYear: true,
                  description: true,
                  status: true,
                },
              },
            },
          },
          _count: { select: { bookings: true, audits: true, examTypes: true, examDates: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const projects = rawProjects.map((p) => {
      const candidateTarget = ProjectAdminService.extractCandidateTarget(p);
      const financialYear = ProjectAdminService.extractFinancialYear(p);
      return {
        ...p,
        candidateTarget,
        financialYear,
      };
    });

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
      financialYear?: string;
      examDates?: Array<{ examDate: string; shift?: string; startTime?: string; endTime?: string }>;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    if (!data.clientId) {
      throw new Error('Associated client is mandatory');
    }
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });
    if (!client) {
      throw new Error('Selected client does not exist or is invalid');
    }

    let projectCode = (data.projectCode || '').trim();
    if (!projectCode || projectCode === 'AUTO' || projectCode.startsWith('PRJ-0000') || projectCode === '') {
      projectCode = await ProjectAdminService.getNextProjectCode();
    }

    let collision = await prisma.project.findUnique({ where: { projectCode } });
    let safetyCounter = 0;
    while (collision && safetyCounter < 100) {
      const match = projectCode.match(/^PRJ-(\d{4})$/);
      const nextNum = (match ? parseInt(match[1], 10) : 0) + 1;
      projectCode = `PRJ-${String(nextNum).padStart(4, '0')}`;
      collision = await prisma.project.findUnique({ where: { projectCode } });
      safetyCounter++;
    }

    const { examDates, financialYear, ...projectInput } = data;

    let meta: any = {};
    if (projectInput.description) {
      try {
        meta = JSON.parse(projectInput.description);
        if (typeof meta !== 'object' || meta === null) {
          meta = { text: projectInput.description };
        }
      } catch {
        meta = { text: projectInput.description };
      }
    }
    if (financialYear) {
      meta.financialYear = financialYear;
    }
    const description = Object.keys(meta).length > 0 ? JSON.stringify(meta) : (projectInput.description || null);

    const examType = projectInput.examType || 'Standard Examination';
    const status = projectInput.status || 'Active';

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
          projectCode,
          examType,
          status,
          description,
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

      return {
        ...project,
        financialYear: financialYear || '2026-27',
      };
    });
  }

  static async getProjectById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        projectManager: { select: { id: true, name: true, email: true } },
        examDates: { orderBy: { examDate: 'asc' } },
        examTypes: {
          include: {
            exams: {
              include: {
                dates: {
                  orderBy: { examDate: 'asc' },
                  include: {
                    shifts: {
                      orderBy: { shiftNumber: 'asc' },
                      include: {
                        bookings: {
                          select: {
                            id: true,
                            systemsBooked: true,
                            status: true,
                            centre: { select: { id: true, centreName: true, cityName: true, stateName: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        bookings: { include: { centre: true } },
        audits: { include: { centre: true, auditor: { select: { name: true } } } },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const projectObj: any = project;
    const examinations: Array<any> = [];
    let totalExamCandidates = 0;

    for (const et of projectObj.examTypes || []) {
      for (const ex of et.exams || []) {
        let candidateRequiredCount = 0;
        let lifecycleStage = ex.status;
        let coverage = 0;
        if (ex.description) {
          try {
            const meta = JSON.parse(ex.description);
            if (meta && typeof meta === 'object') {
              if (meta.candidateRequiredCount) candidateRequiredCount = Number(meta.candidateRequiredCount);
              if (meta.lifecycleStage) lifecycleStage = meta.lifecycleStage;
              if (meta.coverage) coverage = meta.coverage;
            }
          } catch {}
        }
        totalExamCandidates += candidateRequiredCount;

        let totalAllocatedInExam = 0;
        const formattedDates = (ex.dates || []).map((d: any) => {
          const formattedShifts = (d.shifts || []).map((s: any) => {
            const shiftAllocation = (s.bookings || []).reduce(
              (acc: number, b: any) => acc + (b.systemsBooked || 0),
              0
            );
            totalAllocatedInExam += shiftAllocation;
            return {
              id: s.id,
              shiftName: s.shiftName,
              shiftNumber: s.shiftNumber,
              startTime: s.startTime,
              endTime: s.endTime,
              reportingTime: s.reportingTime,
              status: s.status,
              candidateAllocation: shiftAllocation,
              bookingsCount: (s.bookings || []).length,
              bookings: s.bookings,
            };
          });

          return {
            id: d.id,
            examDate: d.examDate,
            reportingTime: d.reportingTime,
            status: d.status,
            shifts: formattedShifts,
            shiftsCount: formattedShifts.length,
          };
        });

        const totalShiftsCount = formattedDates.reduce((acc: number, d: any) => acc + d.shiftsCount, 0);

        examinations.push({
          id: ex.id,
          examName: ex.examName,
          examCode: ex.examCode,
          examYear: ex.examYear,
          status: ex.status,
          lifecycleStage,
          coverage,
          candidateRequiredCount,
          totalAllocatedInExam,
          examTypeId: et.id,
          examTypeName: et.examTypeName,
          examTypeCode: et.examCode,
          dates: formattedDates,
          datesCount: formattedDates.length,
          shiftsCount: totalShiftsCount,
        });
      }
    }

    const financialYear = ProjectAdminService.extractFinancialYear(project);
    const candidateTarget = examinations.length > 0 && totalExamCandidates > 0
      ? totalExamCandidates
      : (project.candidateTarget || 0);

    return {
      ...project,
      financialYear,
      candidateTarget,
      totalCandidateTarget: candidateTarget,
      examinations,
      examinationsCount: examinations.length,
    };
  }

  static async updateProject(
    id: string,
    data: (Prisma.ProjectUncheckedUpdateInput | Prisma.ProjectUpdateInput) & {
      clientId?: string;
      financialYear?: string;
      examDates?: Array<{ id?: string; examDate: string; shift?: string; startTime?: string; endTime?: string }>;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Project not found');
    }

    delete (data as any).projectCode;

    if (data.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: data.clientId as string },
      });
      if (!client) {
        throw new Error('Selected client does not exist');
      }
    }

    const { examDates, financialYear, ...projectData } = data;

    if (financialYear !== undefined || projectData.description !== undefined) {
      let meta: any = {};
      const currentDesc = projectData.description !== undefined ? projectData.description : existing.description;
      if (currentDesc) {
        try {
          meta = JSON.parse(currentDesc as string);
          if (typeof meta !== 'object' || meta === null) {
            meta = { text: currentDesc };
          }
        } catch {
          meta = { text: currentDesc };
        }
      }
      if (financialYear) {
        meta.financialYear = financialYear;
      }
      projectData.description = JSON.stringify(meta);
    }

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
}
