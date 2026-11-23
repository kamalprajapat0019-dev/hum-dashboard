import { prisma } from '../../../config/database.js';
import { Prisma } from '@prisma/client';

export class CentreAdminService {
  static async listCentres(params: {
    page: number;
    limit: number;
    search?: string;
    regionId?: string;
    stateId?: string;
    cityId?: string;
    status?: string;
    eligibilityStatus?: string;
    clientId?: string;
  }) {
    const { page, limit, search, regionId, stateId, cityId, status, eligibilityStatus, clientId } = params;
    const skip = (page - 1) * limit;

    const conditions: Prisma.CentreWhereInput[] = [];

    if (status && status !== 'All') {
      conditions.push({ centreStatus: status });
    }
    if (eligibilityStatus && eligibilityStatus !== 'All') {
      conditions.push({ eligibilityStatus });
    }
    if (regionId && regionId !== 'All') {
      conditions.push({ regionId });
    }
    if (stateId && stateId.trim()) {
      const s = stateId.trim();
      conditions.push({
        OR: [
          { stateId: { contains: s } },
          { stateName: { contains: s } },
        ],
      });
    }
    if (cityId && cityId.trim()) {
      const c = cityId.trim();
      conditions.push({
        OR: [
          { cityId: { contains: c } },
          { cityName: { contains: c } },
        ],
      });
    }
    if (clientId && clientId.trim()) {
      const cid = clientId.trim();
      conditions.push({
        OR: [
          { bookings: { some: { project: { clientId: cid } } } },
          { audits: { some: { project: { clientId: cid } } } },
        ],
      });
    }
    if (search && search.trim()) {
      const term = search.trim();
      conditions.push({
        OR: [
          { centreName: { contains: term } },
          { centreCode: { contains: term } },
          { eduCode: { contains: term } },
          { tcCode: { contains: term } },
          { cityName: { contains: term } },
        ],
      });
    }

    const where: Prisma.CentreWhereInput = conditions.length > 0 ? { AND: conditions } : {};

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
        totalPages: Math.ceil(total / limit) || 1,
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
}
