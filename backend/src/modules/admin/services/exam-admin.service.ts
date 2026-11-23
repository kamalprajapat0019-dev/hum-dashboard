import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { prisma } from '../../../config/database.js';
import { Prisma } from '@prisma/client';
import { ExamSummaryEngine, ExamSummaryResult } from '../exam-summary.engine.js';

function getRequirementSheetStorageDir(): string {
  const base = process.cwd().endsWith('backend') ? process.cwd() : path.resolve(process.cwd(), 'backend');
  const dir = path.resolve(base, 'storage', 'examination_workbooks');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export class ExamAdminService {
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
  static async getExamsSummary(params: { clientId?: string; projectId?: string; status?: string } = {}) {
    const { clientId, projectId, status } = params;

    const where: Prisma.ExamWhereInput = {
      ...(projectId && projectId !== 'All' ? { examType: { projectId } } : {}),
      ...(clientId && clientId !== 'All' ? { examType: { project: { clientId } } } : {}),
      ...(status && status !== 'All' ? { status } : {}),
    };

    const exams = await prisma.exam.findMany({
      where,
      select: {
        id: true,
        examCode: true,
        examName: true,
        status: true,
        description: true,
        dates: {
          select: {
            id: true,
            examDate: true,
            shifts: { select: { id: true, shiftNumber: true } }
          }
        }
      }
    });

    const totalExams = exams.length;
    let activeScheduledExams = 0;
    let totalCandidateTarget = 0;
    let totalCoverage = 0;
    const uniqueCities = new Set<string>();

    for (const ex of exams) {
      if (['Active', 'Scheduled'].includes(ex.status)) {
        activeScheduledExams++;
      }

      let meta: any = {};
      if (ex.description) {
        try {
          meta = JSON.parse(ex.description);
          if (typeof meta !== 'object' || meta === null) meta = {};
        } catch {
          meta = {};
        }
      }

      // Candidate Target for this exam
      const candTarget =
        Number(meta.candidateRequiredCount) ||
        Number(meta.summary?.candidateTarget) ||
        Number(meta.requirementSheet?.totalCandidates) ||
        0;
      totalCandidateTarget += candTarget;

      // Coverage for this exam
      const cov =
        Number(meta.coverage) ||
        Number(meta.summary?.coverageCount) ||
        Number(meta.requirementSheet?.totalCities) ||
        0;
      totalCoverage += cov;

      // Also track unique cities if available
      if (Array.isArray(meta.requirementSheet?.cityWiseTotals)) {
        for (const c of meta.requirementSheet.cityWiseTotals) {
          if (c.city && typeof c.city === 'string') {
            uniqueCities.add(c.city.trim().toLowerCase());
          }
        }
      }
    }

    return {
      totalExams,
      activeScheduledExams,
      totalCandidateTarget,
      totalCoverage: uniqueCities.size > 0 ? uniqueCities.size : totalCoverage,
      cumulativeCoverage: totalCoverage,
      uniqueCitiesCount: uniqueCities.size,
    };
  }

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

  // ── Examination Calendar Synchronization ───────────────────────────────────
  static async syncCalendarForExam(examId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examType: {
          include: {
            project: true,
          },
        },
        dates: {
          include: {
            shifts: true,
          },
        },
      },
    });

    if (!exam || !exam.examType?.project) return;
    const projectId = exam.examType.project.id;

    // 1. Upsert current examination dates and shifts into ProjectExamDate
    for (const d of exam.dates) {
      const targetDateObj = new Date(d.examDate);
      if (isNaN(targetDateObj.getTime())) continue;

      for (const s of d.shifts) {
        const shiftName = s.shiftName || `Shift ${s.shiftNumber || 1}`;

        await prisma.projectExamDate.upsert({
          where: {
            projectId_examDate_shift: {
              projectId,
              examDate: targetDateObj,
              shift: shiftName,
            },
          },
          update: {
            startTime: s.startTime || '09:00 AM',
            endTime: s.endTime || '12:00 PM',
          },
          create: {
            projectId,
            examDate: targetDateObj,
            shift: shiftName,
            startTime: s.startTime || '09:00 AM',
            endTime: s.endTime || '12:00 PM',
          },
        });
      }
    }

    // 2. Safely clean up stale dates for this project that are no longer part of any exam under this project and have no bookings
    const projectExams = await prisma.exam.findMany({
      where: { examType: { projectId } },
      include: { dates: { include: { shifts: true } } },
    });

    const activeProjectScheduleKeys = new Set<string>();
    for (const ex of projectExams) {
      for (const d of ex.dates) {
        const iso = d.examDate.toISOString().split('T')[0];
        for (const s of d.shifts) {
          activeProjectScheduleKeys.add(`${iso}__${s.shiftName}`);
        }
      }
    }

    const currentProjectDates = await prisma.projectExamDate.findMany({
      where: { projectId },
    });

    for (const ped of currentProjectDates) {
      const pedIso = ped.examDate.toISOString().split('T')[0];
      const key = `${pedIso}__${ped.shift}`;
      if (!activeProjectScheduleKeys.has(key)) {
        const bookingsCount = await prisma.booking.count({
          where: {
            projectId,
            status: { notIn: ['Cancelled', 'Rejected'] },
          },
        });
        if (bookingsCount === 0) {
          await prisma.projectExamDate.delete({ where: { id: ped.id } }).catch(() => {});
        }
      }
    }
  }

  static async createExam(
    data: {
      examTypeId: string;
      examCode: string;
      examName: string;
      examYear?: number;
      description?: string;
      status?: string;
      registrationDesk?: number | string;
      bufferNodes?: number | string;
      manpower?: any;
      requirementSheet?: any;
      dates?: Array<{
        examDate: string;
        displayDate?: string;
        shifts?: Array<{
          shiftName: string;
          shiftNumber: number;
          startTime?: string;
          endTime?: string;
          reportingTime?: string;
        }>;
      }>;
      notes?: string;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const examType = await prisma.examType.findUnique({
      where: { id: data.examTypeId },
      include: { project: true },
    });
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

    // Build initial metadata
    let meta: any = {};
    if (data.description) {
      try {
        meta = JSON.parse(data.description);
        if (typeof meta !== 'object' || meta === null) meta = { text: data.description };
      } catch {
        meta = { text: data.description };
      }
    }

    if (data.registrationDesk !== undefined) meta.registrationDesk = Number(data.registrationDesk) || 5;
    if (data.bufferNodes !== undefined) meta.bufferNodes = Number(data.bufferNodes) || 3;
    if (data.manpower !== undefined) meta.manpower = data.manpower;
    if (data.notes !== undefined) meta.notes = data.notes;

    // Handle physical storage of requirement sheet if uploaded
    let storageKey: string | null = null;
    let actualFileSize = data.requirementSheet?.fileSize || 0;

    if (data.requirementSheet?.fileBufferBase64) {
      const storageDir = getRequirementSheetStorageDir();
      const safeName = (data.requirementSheet.fileName || 'Examination_Requirement.xlsx').replace(/[^a-zA-Z0-9._-]/g, '_');
      const diskFileName = `${data.examCode.trim()}_${Date.now()}_${safeName}`;
      const filePath = path.join(storageDir, diskFileName);
      const buffer = Buffer.from(data.requirementSheet.fileBufferBase64, 'base64');
      fs.writeFileSync(filePath, buffer);
      storageKey = filePath;
      actualFileSize = buffer.length;

      meta.requirementSheet = {
        fileName: data.requirementSheet.fileName || 'Examination_Requirements.xlsx',
        storageKey,
        fileSize: actualFileSize,
        mimeType: data.requirementSheet.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedAt: new Date().toISOString(),
        uploadedBy: adminUserId,
        importStatus: 'Imported',
        totalRows: data.requirementSheet.totalRows || 0,
        totalCandidates: Number(data.requirementSheet.totalCandidates) || 0,
        totalCities: Number(data.requirementSheet.totalCities) || 0,
        datesCount: data.dates?.length || 0,
        shiftsCount: data.dates?.reduce((acc: number, d: any) => acc + (d.shifts?.length || 0), 0) || 0,
        rows: data.requirementSheet.rows || [],
      };
    }

    const createdExam = await prisma.$transaction(async (tx: any) => {
      const exam = await tx.exam.create({
        data: {
          examTypeId: data.examTypeId,
          examCode: data.examCode.trim(),
          examName: data.examName.trim(),
          examYear: data.examYear || new Date().getFullYear(),
          description: JSON.stringify(meta),
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

    // Synchronize Dates & Shifts from sheet if provided
    if (data.dates && Array.isArray(data.dates) && data.dates.length > 0) {
      const dateGroupsForSync = data.dates.map((d: any) => ({
        dateIso: new Date(d.examDate).toISOString().substring(0, 10),
        shifts: (d.shifts || []).map((s: any) => ({
          shiftName: s.shiftName || `Shift ${s.shiftNumber || 1}`,
          shiftNumber: s.shiftNumber || 1,
          startTime: s.startTime,
          endTime: s.endTime,
          reportingTime: s.reportingTime,
        })),
      }));
      await ExamSummaryEngine.syncDatabaseSchedule(createdExam, dateGroupsForSync);
    }

    // Synchronize Global Calendar after successful persistence
    await ExamAdminService.syncCalendarForExam(createdExam.id);

    // Re-calculate summary if dates exist
    if (data.dates && data.dates.length > 0) {
      const summary = await ExamSummaryEngine.calculateExamSummary(createdExam.id, { syncDatabaseDates: true });
      meta.summary = summary;
      meta.candidateRequiredCount = summary.candidateTarget;
      meta.coverage = summary.coverageCount;
      if (meta.requirementSheet) {
        meta.requirementSheet.totalCandidates = summary.candidateTarget;
        meta.requirementSheet.totalCities = summary.coverageCount;
        meta.requirementSheet.datesCount = summary.examinationDateCount;
        meta.requirementSheet.shiftsCount = summary.shiftCount;
      }
      await prisma.exam.update({
        where: { id: createdExam.id },
        data: { description: JSON.stringify(meta) },
      });
    }

    return prisma.exam.findUnique({
      where: { id: createdExam.id },
      include: {
        examType: { include: { project: { include: { client: true } } } },
        dates: { include: { shifts: true }, orderBy: { examDate: 'asc' } },
      },
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
      registrationDesk?: number | string;
      bufferNodes?: number | string;
      manpower?: any;
      requirementSheet?: any;
      dates?: Array<{
        examDate: string;
        displayDate?: string;
        shifts?: Array<{
          shiftName: string;
          shiftNumber: number;
          startTime?: string;
          endTime?: string;
          reportingTime?: string;
        }>;
      }>;
      notes?: string;
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const existing = await prisma.exam.findUnique({
      where: { id },
      include: {
        examType: { include: { project: true } },
        dates: { include: { shifts: true } },
      },
    });
    if (!existing) {
      throw new Error('Exam not found');
    }

    if (data.examTypeId && data.examTypeId !== existing.examTypeId) {
      const targetType = await prisma.examType.findUnique({ where: { id: data.examTypeId } });
      if (!targetType) {
        throw new Error('Target exam type not found');
      }
    }

    let meta: any = {};
    if (existing.description) {
      try {
        meta = JSON.parse(existing.description);
        if (typeof meta !== 'object' || meta === null) meta = { text: existing.description };
      } catch {
        meta = { text: existing.description };
      }
    }

    if (data.registrationDesk !== undefined) meta.registrationDesk = Number(data.registrationDesk) || 5;
    if (data.bufferNodes !== undefined) meta.bufferNodes = Number(data.bufferNodes) || 3;
    if (data.manpower !== undefined) meta.manpower = data.manpower;
    if (data.notes !== undefined) meta.notes = data.notes;

    // Handle physical storage of new requirement sheet if uploaded
    if (data.requirementSheet?.fileBufferBase64) {
      const storageDir = getRequirementSheetStorageDir();
      const safeName = (data.requirementSheet.fileName || 'Examination_Requirement.xlsx').replace(/[^a-zA-Z0-9._-]/g, '_');
      const diskFileName = `${(data.examCode || existing.examCode).trim()}_${Date.now()}_${safeName}`;
      const filePath = path.join(storageDir, diskFileName);
      const buffer = Buffer.from(data.requirementSheet.fileBufferBase64, 'base64');
      fs.writeFileSync(filePath, buffer);

      meta.requirementSheet = {
        fileName: data.requirementSheet.fileName || 'Examination_Requirements.xlsx',
        storageKey: filePath,
        fileSize: buffer.length,
        mimeType: data.requirementSheet.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedAt: new Date().toISOString(),
        uploadedBy: adminUserId,
        importStatus: 'Imported',
        totalRows: data.requirementSheet.totalRows || 0,
        totalCandidates: Number(data.requirementSheet.totalCandidates) || 0,
        totalCities: Number(data.requirementSheet.totalCities) || 0,
        datesCount: data.dates?.length || 0,
        shiftsCount: data.dates?.reduce((acc: number, d: any) => acc + (d.shifts?.length || 0), 0) || 0,
        rows: data.requirementSheet.rows || [],
      };
    }

    // Sync dates if new dates provided
    if (data.dates && Array.isArray(data.dates) && data.dates.length > 0) {
      const dateGroupsForSync = data.dates.map((d: any) => ({
        dateIso: new Date(d.examDate).toISOString().substring(0, 10),
        shifts: (d.shifts || []).map((s: any) => ({
          shiftName: s.shiftName || `Shift ${s.shiftNumber || 1}`,
          shiftNumber: s.shiftNumber || 1,
          startTime: s.startTime,
          endTime: s.endTime,
          reportingTime: s.reportingTime,
        })),
      }));
      await ExamSummaryEngine.syncDatabaseSchedule(existing, dateGroupsForSync);
    }

    await ExamAdminService.syncCalendarForExam(id);

    if (data.dates && data.dates.length > 0) {
      const summary = await ExamSummaryEngine.calculateExamSummary(id, { syncDatabaseDates: true });
      meta.summary = summary;
      meta.candidateRequiredCount = summary.candidateTarget;
      meta.coverage = summary.coverageCount;
      if (meta.requirementSheet) {
        meta.requirementSheet.totalCandidates = summary.candidateTarget;
        meta.requirementSheet.totalCities = summary.coverageCount;
        meta.requirementSheet.datesCount = summary.examinationDateCount;
        meta.requirementSheet.shiftsCount = summary.shiftCount;
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
          description: JSON.stringify(meta),
          ...(data.status ? { status: data.status } : {}),
        },
        include: {
          examType: { include: { project: { include: { client: true } } } },
          dates: { include: { shifts: true }, orderBy: { examDate: 'asc' } },
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

  // ── 12. Requirement Sheet Import, View & Download ──────────────────────────
  static async importRequirementSheet(
    examId: string,
    data: {
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      fileBufferBase64?: string;
      totalRows?: number;
      totalCandidates?: number;
      totalCities?: number;
      dates?: Array<{
        examDate: string;
        displayDate?: string;
        shifts?: Array<{
          shiftName: string;
          shiftNumber: number;
          startTime?: string;
          endTime?: string;
          reportingTime?: string;
        }>;
      }>;
      rows?: any[];
    },
    adminUserId: string,
    adminEmail: string
  ) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examType: {
          include: {
            project: true,
          },
        },
        dates: {
          include: {
            shifts: true,
          },
        },
      },
    });

    if (!exam) {
      throw new Error('Examination not found');
    }

    // 0. Secure permanent storage of the original uploaded Excel workbook
    const storageDir = getRequirementSheetStorageDir();

    let storageKey: string | null = null;
    let actualFileSize = data.fileSize || 0;

    if (data.fileBufferBase64) {
      const safeName = (data.fileName || 'Examination_Requirement.xlsx').replace(/[^a-zA-Z0-9._-]/g, '_');
      const diskFileName = `${exam.id}_${Date.now()}_${safeName}`;
      const filePath = path.join(storageDir, diskFileName);
      const buffer = Buffer.from(data.fileBufferBase64, 'base64');
      fs.writeFileSync(filePath, buffer);
      storageKey = filePath;
      actualFileSize = buffer.length;
    }

    // 1. Process and synchronize Dates and Shifts using the Schedule Engine
    if (data.dates && Array.isArray(data.dates) && data.dates.length > 0) {
      const dateGroupsForSync = data.dates.map((d: any) => ({
        dateIso: new Date(d.examDate).toISOString().substring(0, 10),
        shifts: (d.shifts || []).map((s: any) => ({
          shiftName: s.shiftName || `Shift ${s.shiftNumber || 1}`,
          shiftNumber: s.shiftNumber || 1,
        })),
      }));
      await ExamSummaryEngine.syncDatabaseSchedule(exam, dateGroupsForSync);
    }

    // 2. Calculate universal summary from the engine (single source of truth)
    let meta: any = {};
    if (exam.description) {
      try {
        meta = JSON.parse(exam.description);
        if (typeof meta !== 'object' || meta === null) meta = { text: exam.description };
      } catch {
        meta = { text: exam.description };
      }
    }

    meta.requirementSheet = {
      fileName: data.fileName || 'Examination_Requirements.xlsx',
      storageKey: storageKey || meta.requirementSheet?.storageKey || null,
      fileSize: actualFileSize,
      mimeType: data.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      uploadedAt: new Date().toISOString(),
      uploadedBy: adminUserId,
      importStatus: 'Imported',
      totalRows: data.totalRows || 0,
      totalCandidates: Number(data.totalCandidates) || 0,
      totalCities: Number(data.totalCities) || 0,
      datesCount: data.dates?.length || 0,
      shiftsCount: data.dates?.reduce((acc: number, d: any) => acc + (d.shifts?.length || 0), 0) || 0,
      rows: data.rows || [],
    };

    // Temporarily save metadata to allow calculation engine to read storageKey
    await prisma.exam.update({
      where: { id: exam.id },
      data: { description: JSON.stringify(meta) },
    });

    const summary = await ExamSummaryEngine.calculateExamSummary(exam.id, { syncDatabaseDates: true });

    meta.summary = summary;
    meta.candidateRequiredCount = summary.candidateTarget;
    meta.coverage = summary.coverageCount;
    meta.requirementSheet.totalCandidates = summary.candidateTarget;
    meta.requirementSheet.totalCities = summary.coverageCount;
    meta.requirementSheet.datesCount = summary.examinationDateCount;
    meta.requirementSheet.shiftsCount = summary.shiftCount;

    return prisma.$transaction(async (tx: any) => {
      const updatedExam = await tx.exam.update({
        where: { id: exam.id },
        data: {
          description: JSON.stringify(meta),
        },
        include: {
          examType: { include: { project: { include: { client: true } } } },
          dates: { include: { shifts: true }, orderBy: { examDate: 'asc' } },
        },
      });

      // 3. Update Parent Project targets if project exists
      if (exam.examType?.project) {
        await tx.project.update({
          where: { id: exam.examType.project.id },
          data: {
            candidateTarget: Math.max(exam.examType.project.candidateTarget || 0, summary.candidateTarget),
            citiesCount: Math.max(exam.examType.project.citiesCount || 0, summary.coverageCount),
          },
        });
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'EXAM_REQUIREMENT_SHEET_IMPORTED',
          entity: 'Exam',
          entityId: exam.id,
          details: {
            fileName: data.fileName,
            fileSize: actualFileSize,
            storageKey,
            totalRows: data.totalRows,
            totalCandidates: summary.candidateTarget,
            totalCities: summary.coverageCount,
            datesCount: summary.examinationDateCount,
            shiftsCount: summary.shiftCount,
            calculationModel: summary.calculationModel,
          },
        },
      });

      return {
        success: true,
        exam: updatedExam,
        summary,
        importedCount: summary.candidateTarget,
        citiesCount: summary.coverageCount,
        datesCount: summary.examinationDateCount,
        shiftsCount: summary.shiftCount,
      };
    }).then(async (result: any) => {
      // Synchronize Global Calendar entries automatically after successful import
      await ExamAdminService.syncCalendarForExam(exam.id);
      return result;
    });
  }

  static async getExamRequirementSheet(examId: string, _adminUserId?: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examType: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        dates: {
          include: {
            shifts: true,
          },
        },
      },
    });

    if (!exam) {
      throw new Error('Examination not found');
    }

    let meta: any = {};
    if (exam.description) {
      try {
        meta = JSON.parse(exam.description);
      } catch {
        meta = {};
      }
    }

    const sheetMeta = meta.requirementSheet;
    const storageKey = sheetMeta?.storageKey;

    // Single authoritative source of truth for metrics
    const summary = await ExamSummaryEngine.calculateExamSummary(examId);

    if (!sheetMeta || !storageKey || !fs.existsSync(storageKey)) {
      return {
        hasFile: false,
        message: 'No original Excel requirement sheet is available for this examination.',
        summary,
        exam: {
          id: exam.id,
          examCode: exam.examCode,
          examName: exam.examName,
          status: summary.lifecycleStage,
          project: summary.projectName,
          client: summary.clientName,
          datesCount: summary.examinationDateCount,
          shiftsCount: summary.shiftCount,
          candidateTarget: summary.candidateTarget,
          coverage: summary.coverageCount,
        },
      };
    }

    // Read actual original Excel workbook from storage
    const buffer = fs.readFileSync(storageKey);
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: false });

    const sheets = wb.SheetNames.map(sheetName => {
      const ws = wb.Sheets[sheetName];
      const rawGrid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
      const merges = ws['!merges'] || [];
      return {
        sheetName,
        rawGrid,
        merges,
        totalRows: rawGrid.length,
        totalCols: rawGrid.reduce((max: number, r: any) => Math.max(max, Array.isArray(r) ? r.length : 0), 0),
      };
    });

    return {
      hasFile: true,
      summary,
      exam: {
        id: exam.id,
        examCode: exam.examCode,
        examName: exam.examName,
        status: summary.lifecycleStage,
        project: summary.projectName,
        client: summary.clientName,
        datesCount: summary.examinationDateCount,
        shiftsCount: summary.shiftCount,
        candidateTarget: summary.candidateTarget,
        coverage: summary.coverageCount,
      },
      metadata: {
        fileName: sheetMeta.fileName || 'Examination_Requirement.xlsx',
        fileSize: sheetMeta.fileSize || buffer.length,
        mimeType: sheetMeta.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedAt: sheetMeta.uploadedAt,
        uploadedBy: sheetMeta.uploadedBy,
        totalCandidates: summary.candidateTarget,
        totalCities: summary.coverageCount,
        datesCount: summary.examinationDateCount,
        shiftsCount: summary.shiftCount,
      },
      sheets,
      activeSheet: sheets[0]?.sheetName || '',
    };
  }

  static async getExamSummary(examId: string): Promise<ExamSummaryResult> {
    return ExamSummaryEngine.calculateExamSummary(examId);
  }

  static async syncExamSummary(examId: string): Promise<ExamSummaryResult> {
    const summary = await ExamSummaryEngine.calculateExamSummary(examId, { syncDatabaseDates: true });
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (exam) {
      let meta: any = {};
      try {
        meta = JSON.parse(exam.description || '{}');
      } catch {}
      meta.summary = summary;
      meta.candidateRequiredCount = summary.candidateTarget;
      meta.coverage = summary.coverageCount;
      if (meta.requirementSheet) {
        meta.requirementSheet.totalCandidates = summary.candidateTarget;
        meta.requirementSheet.totalCities = summary.coverageCount;
        meta.requirementSheet.datesCount = summary.examinationDateCount;
        meta.requirementSheet.shiftsCount = summary.shiftCount;
      }
      await prisma.exam.update({
        where: { id: examId },
        data: { description: JSON.stringify(meta) },
      });
    }
    return summary;
  }

  static async downloadExamRequirementSheet(examId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new Error('Examination not found');
    }

    let meta: any = {};
    if (exam.description) {
      try {
        meta = JSON.parse(exam.description);
      } catch {
        meta = {};
      }
    }

    const sheetMeta = meta.requirementSheet;
    const storageKey = sheetMeta?.storageKey;

    if (!sheetMeta || !storageKey || !fs.existsSync(storageKey)) {
      throw new Error('No original Excel requirement sheet is available for this examination.');
    }

    return {
      filePath: storageKey,
      fileName: sheetMeta.fileName || 'Examination_Requirement.xlsx',
      mimeType: sheetMeta.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
