import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// Always maintain connection cache across serverless warm invocations
globalForPrisma.prisma = prisma;

/**
 * Safe database connection verification without exposing credentials in logs
 */
export async function verifyDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database connectivity check failed';
    return { connected: false, error: message };
  }
}
