import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@oemportal.in').toLowerCase().trim();
  const rawPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin_secure_pass_123';
  const adminName = process.env.INITIAL_ADMIN_NAME || 'Rajesh Kumar';

  console.log(`🌱 Starting OEM Portal seed procedure...`);
  console.log(`👤 Seeding Admin user: ${adminEmail}`);

  const passwordHash = await bcrypt.hash(rawPassword, 12);

  // 1. Seed or update Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: Role.ADMIN,
      status: 'Active',
      scope: { clients: ['all'], projects: ['all'], centres: ['all'] },
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: Role.ADMIN,
      avatar: 'RK',
      status: 'Active',
      scope: { clients: ['all'], projects: ['all'], centres: ['all'] },
    },
  });

  // 2. Seed Default System Configs
  console.log(`⚙️  Seeding System Configurations...`);
  await prisma.systemConfig.upsert({
    where: { key: 'SYSTEM_SETTINGS' },
    update: {},
    create: {
      key: 'SYSTEM_SETTINGS',
      category: 'GENERAL',
      value: {
        portalName: 'Operations & Examination Management Portal',
        version: '1.0.0',
        supportEmail: 'support@oemportal.in',
        maintenanceMode: false,
      },
      updatedBy: adminEmail,
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'NOTIFICATION_RULES' },
    update: {},
    create: {
      key: 'NOTIFICATION_RULES',
      category: 'NOTIFICATION',
      value: {
        sendEmailOnIncident: true,
        sendSmsOnDateLock: true,
        auditEscalationThresholdDays: 3,
      },
      updatedBy: adminEmail,
    },
  });

  // 3. Seed Default Clients (NTA, UGC, AICTE)
  console.log(`🏛️  Seeding Government Clients...`);
  const clients = [
    { code: 'CL-001', name: 'NTA', fullName: 'National Testing Agency', contactEmail: 'nta@gov.in' },
    { code: 'CL-002', name: 'UGC', fullName: 'University Grants Commission', contactEmail: 'ugc@gov.in' },
    { code: 'CL-003', name: 'AICTE', fullName: 'All India Council for Technical Education', contactEmail: 'aicte@gov.in' },
  ];

  for (const c of clients) {
    await prisma.client.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        name: c.name,
        fullName: c.fullName,
        contactEmail: c.contactEmail,
        status: 'Active',
      },
    });
  }

  // 4. Record Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: 'SYSTEM_SEEDED',
      entity: 'SystemConfig',
      entityId: 'SEED',
      details: { seededBy: 'SeedScript', timestamp: new Date().toISOString() },
    },
  });

  console.log(`✅ Seed procedure completed successfully.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
