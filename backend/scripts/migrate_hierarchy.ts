import { prisma } from '../src/config/database.js';

async function migrate() {
  console.log('=== RUNNING ADDITIVE HIERARCHY SCHEMA MIGRATION ===\n');

  // 1. Additive columns to oecm_clients
  console.log('1. Updating oecm_clients...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE \`oecm_clients\` 
      ADD COLUMN IF NOT EXISTS \`description\` TEXT NULL,
      ADD COLUMN IF NOT EXISTS \`isActive\` TINYINT(1) NOT NULL DEFAULT 1;
  `);

  // 2. Additive columns to oecm_projects
  console.log('2. Updating oecm_projects...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE \`oecm_projects\`
      ADD COLUMN IF NOT EXISTS \`description\` TEXT NULL,
      ADD COLUMN IF NOT EXISTS \`startDate\` DATETIME(3) NULL,
      ADD COLUMN IF NOT EXISTS \`endDate\` DATETIME(3) NULL;
  `);

  // 3. Create oecm_exam_types
  console.log('3. Creating oecm_exam_types...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`oecm_exam_types\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`projectId\` VARCHAR(191) NOT NULL,
      \`examCode\` VARCHAR(191) NOT NULL,
      \`examTypeName\` VARCHAR(191) NOT NULL,
      \`description\` TEXT NULL,
      \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`oecm_exam_types_projectId_examCode_key\` (\`projectId\`, \`examCode\`),
      INDEX \`oecm_exam_types_projectId_isActive_idx\` (\`projectId\`, \`isActive\`),
      CONSTRAINT \`oecm_exam_types_projectId_fkey\` FOREIGN KEY (\`projectId\`) REFERENCES \`oecm_projects\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Create oecm_exams (Exam Instances)
  console.log('4. Creating oecm_exams...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`oecm_exams\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`examTypeId\` VARCHAR(191) NOT NULL,
      \`examCode\` VARCHAR(191) NOT NULL,
      \`examName\` VARCHAR(191) NOT NULL,
      \`examYear\` INT NOT NULL,
      \`description\` TEXT NULL,
      \`status\` VARCHAR(191) NOT NULL DEFAULT 'Scheduled',
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`oecm_exams_examTypeId_examCode_key\` (\`examTypeId\`, \`examCode\`),
      INDEX \`oecm_exams_examTypeId_status_idx\` (\`examTypeId\`, \`status\`),
      CONSTRAINT \`oecm_exams_examTypeId_fkey\` FOREIGN KEY (\`examTypeId\`) REFERENCES \`oecm_exam_types\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 5. Create oecm_exam_dates
  console.log('5. Creating oecm_exam_dates...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`oecm_exam_dates\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`examId\` VARCHAR(191) NOT NULL,
      \`examDate\` DATETIME(3) NOT NULL,
      \`reportingTime\` VARCHAR(191) NULL,
      \`status\` VARCHAR(191) NOT NULL DEFAULT 'Scheduled',
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`oecm_exam_dates_examId_examDate_idx\` (\`examId\`, \`examDate\`),
      CONSTRAINT \`oecm_exam_dates_examId_fkey\` FOREIGN KEY (\`examId\`) REFERENCES \`oecm_exams\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 6. Create oecm_exam_shifts
  console.log('6. Creating oecm_exam_shifts...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`oecm_exam_shifts\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`examDateId\` VARCHAR(191) NOT NULL,
      \`shiftName\` VARCHAR(191) NOT NULL,
      \`shiftNumber\` INT NOT NULL,
      \`startTime\` VARCHAR(191) NOT NULL,
      \`endTime\` VARCHAR(191) NOT NULL,
      \`reportingTime\` VARCHAR(191) NULL,
      \`status\` VARCHAR(191) NOT NULL DEFAULT 'Scheduled',
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`oecm_exam_shifts_examDateId_shiftNumber_idx\` (\`examDateId\`, \`shiftNumber\`),
      CONSTRAINT \`oecm_exam_shifts_examDateId_fkey\` FOREIGN KEY (\`examDateId\`) REFERENCES \`oecm_exam_dates\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 7. Add optional exam links to bookings and audits
  console.log('7. Updating oecm_bookings and oecm_audit_assignments...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE \`oecm_bookings\`
      ADD COLUMN IF NOT EXISTS \`examId\` VARCHAR(191) NULL,
      ADD COLUMN IF NOT EXISTS \`examShiftId\` VARCHAR(191) NULL;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE \`oecm_audit_assignments\`
      ADD COLUMN IF NOT EXISTS \`examId\` VARCHAR(191) NULL;
  `);

  console.log('\n✅ ADDITIVE SCHEMA MIGRATION COMPLETED SUCCESSFULLY!');
  await prisma.$disconnect();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

