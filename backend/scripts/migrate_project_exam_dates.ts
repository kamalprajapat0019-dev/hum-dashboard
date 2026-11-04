import { prisma } from '../src/config/database.js';

async function migrate() {
  console.log('=== RUNNING ADDITIVE MIGRATION: oecm_project_exam_dates ===\n');

  console.log('1. Creating oecm_project_exam_dates table in MySQL...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`oecm_project_exam_dates\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`projectId\` VARCHAR(191) NOT NULL,
      \`examDate\` DATETIME(3) NOT NULL,
      \`shift\` VARCHAR(191) NOT NULL DEFAULT 'Shift 1',
      \`startTime\` VARCHAR(191) NULL,
      \`endTime\` VARCHAR(191) NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`oecm_project_exam_dates_projectId_examDate_shift_key\` (\`projectId\`, \`examDate\`, \`shift\`),
      INDEX \`oecm_project_exam_dates_projectId_examDate_idx\` (\`projectId\`, \`examDate\`),
      INDEX \`oecm_project_exam_dates_examDate_idx\` (\`examDate\`),
      CONSTRAINT \`oecm_project_exam_dates_projectId_fkey\` FOREIGN KEY (\`projectId\`) REFERENCES \`oecm_projects\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('2. Syncing legacy project.examDate into oecm_project_exam_dates...');
  const projects = await prisma.project.findMany({
    where: { examDate: { not: null } },
    select: { id: true, projectCode: true, name: true, examDate: true },
  });

  console.log(`Found ${projects.length} existing projects with examDate:`);
  for (const p of projects) {
    if (!p.examDate) continue;
    // Check if already in oecm_project_exam_dates
    const existingDates: any[] = await prisma.$queryRawUnsafe(
      'SELECT id FROM `oecm_project_exam_dates` WHERE projectId = ? AND examDate = ? LIMIT 1',
      p.id,
      p.examDate
    );

    if (existingDates.length === 0) {
      const generatedId = `ped_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      await prisma.$executeRawUnsafe(
        'INSERT INTO `oecm_project_exam_dates` (`id`, `projectId`, `examDate`, `shift`, `startTime`, `endTime`) VALUES (?, ?, ?, ?, ?, ?)',
        generatedId,
        p.id,
        p.examDate,
        'Shift 1',
        '09:00 AM',
        '12:00 PM'
      );
      console.log(`   + Migrated date for [${p.projectCode}] ${p.name}: ${p.examDate.toISOString()}`);
    } else {
      console.log(`   = Already exists for [${p.projectCode}]`);
    }
  }

  console.log('\n✅ Migration complete!');
}

migrate()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

