import { app } from './app.js';
import { env } from './config/env.js';
import { prisma, verifyDatabaseConnection } from './config/database.js';

const server = app.listen(env.PORT, async () => {
  console.log(`🚀 OEM Portal Admin Backend running on port ${env.PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 API Base: http://localhost:${env.PORT}${env.API_PREFIX}`);

  const dbStatus = await verifyDatabaseConnection();
  if (dbStatus.connected) {
    console.log('✅ Connected to PostgreSQL database');
  } else {
    console.warn('⚠️  Database connectivity check failed (Neon connection pending credentials)');
  }
});

// Graceful Shutdown
const shutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('🔒 Prisma disconnected. Server closed cleanly.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
