import { prisma } from '../../../config/database.js';
import { Prisma } from '@prisma/client';

export class SystemAdminService {
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
}
