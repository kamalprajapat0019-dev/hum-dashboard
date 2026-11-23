import { prisma } from '../../../config/database.js';
import { Prisma } from '@prisma/client';

export class ClientAdminService {
  static async getClientsSummary() {
    const [totalClients, activeClients, inactiveClients] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: 'Active' } }),
      prisma.client.count({ where: { status: { not: 'Active' } } }),
    ]);

    return {
      totalClients,
      activeClients,
      inactiveClients,
    };
  }

  static async listClients(params: { page: number; limit: number; search?: string; status?: string }) {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ClientWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
          OR: [
            { code: { contains: search } },
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
          projects: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    const mappedClients = clients.map((c: any, idx: number) => {
      const totalExams = c._count?.projects ?? (c.projects?.length || 0);
      const activeExams = c.projects ? c.projects.filter((p: any) => p.status === 'Active').length : 0;
      return {
        id: c.id,
        code: c.code || `CLT-${c.id.slice(-4).toUpperCase()}`,
        name: c.name,
        fullName: c.fullName,
        contactEmail: c.contactEmail,
        description: c.description,
        isActive: c.isActive,
        status: c.status || 'Active',
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        totalExams,
        activeExams,
        serialNumber: skip + idx + 1,
      };
    });

    return {
      data: mappedClients,
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
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            projectCode: true,
            name: true,
            examType: true,
            stage: true,
            status: true,
            candidateTarget: true,
            citiesCount: true,
            centreTarget: true,
            examDate: true,
          },
        },
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const totalExams = client.projects.length;
    const activeExams = client.projects.filter((p: any) => p.status === 'Active').length;

    return {
      ...client,
      code: client.code || `CLT-${client.id.slice(-4).toUpperCase()}`,
      totalExams,
      activeExams,
    };
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
    const trimmedName = data.name.trim();
    const cleanEmail = data.contactEmail.trim().toLowerCase();
    const repName = data.fullName.trim();

    // 1. Check duplicate client name
    const existingName = await prisma.client.findFirst({
      where: { name: { equals: trimmedName } },
    });
    if (existingName) {
      throw new Error(`A client organisation with the name "${trimmedName}" already exists`);
    }

    // 2. Auto-generate immutable Client ID / Code if not provided
    let finalCode = data.code?.trim().toUpperCase();
    if (!finalCode) {
      const count = await prisma.client.count();
      let candidate = `CLT-${String(count + 1).padStart(3, '0')}`;
      const codeExists = await prisma.client.findUnique({ where: { code: candidate } });
      if (codeExists) {
        candidate = `CLT-${Date.now().toString().slice(-4)}`;
      }
      finalCode = candidate;
    }

    return prisma.$transaction(async (tx: any) => {
      const client = await tx.client.create({
        data: {
          code: finalCode,
          name: trimmedName,
          fullName: repName,
          contactEmail: cleanEmail,
          description: data.description?.trim() || null,
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
          details: { name: client.name, fullName: client.fullName, code: client.code },
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

      // Editing rules:
      // Client ID: Immutable (never modified)
      // Client Name: Read-only during normal edit (preserve existing unless explicit rename process)
      const updatePayload: Prisma.ClientUpdateInput = {
        fullName: data.fullName !== undefined ? data.fullName.trim() : existing.fullName,
        contactEmail: data.contactEmail !== undefined ? data.contactEmail.trim().toLowerCase() : existing.contactEmail,
        description: data.description !== undefined ? data.description.trim() : existing.description,
        status: data.status !== undefined ? data.status : existing.status,
        isActive: data.isActive !== undefined ? data.isActive : (data.status === 'Active' ? true : existing.isActive),
      };

      const updated = await tx.client.update({
        where: { id },
        data: updatePayload,
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          userEmail: adminEmail,
          action: 'CLIENT_UPDATED',
          entity: 'Client',
          entityId: id,
          details: {
            before: { fullName: existing.fullName, contactEmail: existing.contactEmail, status: existing.status },
            after: { fullName: updated.fullName, contactEmail: updated.contactEmail, status: updated.status },
          },
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
}
