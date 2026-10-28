import { app } from './app.js';
import { env } from './config/env.js';
import { prisma, verifyDatabaseConnection } from './config/database.js';

const server = app.listen(env.PORT, async () => {
  console.log(`🚀 OEM Portal Admin Backend running on port ${env.PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 API Base: http://localhost:${env.PORT}${env.API_PREFIX}`);

  const dbStatus = await verifyDatabaseConnection();
  if (dbStatus.connected) {
    console.log('✅ Connected to MySQL database');
  } else {
    console.warn('⚠️  Database connectivity check failed (MySQL connection pending verification/credentials)');
  }
});

// Graceful Port & Startup Error Handling
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Startup Error: Port ${env.PORT} is already in use by another process.`);
    console.error(`💡 An OECM backend process is likely already running in another terminal or background task.`);
    console.error(`   To identify and stop the conflicting process on Windows:`);
    console.error(`     1. Find process: Get-NetTCPConnection -LocalPort ${env.PORT} | Select-Object OwningProcess`);
    console.error(`     2. Stop process: Stop-Process -Id <PID> -Force`);
    console.error(`   Alternatively, set a different PORT in backend/.env (e.g. PORT=5001) and update VITE_API_BASE_URL in frontend/.env.\n`);
    process.exit(1);
  } else {
    console.error('\n❌ Server encountered an unexpected error:', err.message);
    process.exit(1);
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
