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

  // 3. Seed Default Clients (NTA, UGC, AICTE, Eduquity, Edu-Spark, FutureScope)
  console.log(`🏛️  Seeding Enterprise Clients...`);
  const clients = [
    { code: 'CL-001', name: 'NTA', fullName: 'National Testing Agency', contactEmail: 'nta@gov.in' },
    { code: 'CL-002', name: 'UGC', fullName: 'University Grants Commission', contactEmail: 'ugc@gov.in' },
    { code: 'CL-003', name: 'AICTE', fullName: 'All India Council for Technical Education', contactEmail: 'aicte@gov.in' },
    { code: 'CL-EDQ', name: 'Eduquity', fullName: 'Eduquity Career Technologies', contactEmail: 'contact@eduquity.com', description: 'Enterprise testing and assessment service provider' },
    { code: 'CL-ESP', name: 'Edu-Spark', fullName: 'Edu-Spark Global Services', contactEmail: 'contact@edu-spark.com', description: 'State entrance exam delivery partner' },
    { code: 'CL-FSC', name: 'FutureScope', fullName: 'FutureScope Technologies', contactEmail: 'contact@futurescope.in', description: 'Next-generation examination management client' },
  ];

  const clientMap = new Map<string, string>();
  for (const c of clients) {
    const record = await prisma.client.upsert({
      where: { code: c.code },
      update: { name: c.name, fullName: c.fullName, contactEmail: c.contactEmail, description: c.description },
      create: {
        code: c.code,
        name: c.name,
        fullName: c.fullName,
        contactEmail: c.contactEmail,
        description: c.description,
        status: 'Active',
      },
    });
    clientMap.set(c.code, record.id);
  }

  // 4. Seed Eduquity Projects & Associated Exam Centres
  console.log(`📋 Seeding Eduquity Projects and Centres...`);
  const eduquityId = clientMap.get('CL-EDQ')!;

  const p1 = await prisma.project.upsert({
    where: { projectCode: 'PRJ-EDQ-001' },
    update: { clientId: eduquityId },
    create: {
      projectCode: 'PRJ-EDQ-001',
      name: 'CAT 2026 – Common Admission Test',
      clientId: eduquityId,
      examType: 'CBT Exam',
      stage: 'Execution',
      status: 'Active',
      examDate: new Date('2026-11-29T09:00:00Z'),
      citiesCount: 24,
      candidateTarget: 24000,
      centreTarget: 48,
      slaHealth: 'OnTrack',
    },
  });

  const p2 = await prisma.project.upsert({
    where: { projectCode: 'PRJ-EDQ-002' },
    update: { clientId: eduquityId },
    create: {
      projectCode: 'PRJ-EDQ-002',
      name: 'GATE 2027 – Computer Science & IT',
      clientId: eduquityId,
      examType: 'GATE CBT',
      stage: 'Audit & Compliance',
      status: 'Active',
      examDate: new Date('2027-02-06T09:00:00Z'),
      citiesCount: 18,
      candidateTarget: 18000,
      centreTarget: 36,
      slaHealth: 'AtRisk',
    },
  });

  const c1 = await prisma.centre.upsert({
    where: { centreCode: 'CN-001' },
    update: {},
    create: {
      centreCode: 'CN-001',
      centreName: 'Lotus Computer Education',
      centreAddress: 'Plot 24, Sector 8, Rohini, New Delhi - 110085',
      pincode: '110085',
      venueStatus: 'Old',
      previousEduExam: 'NEET PG 2025',
      officialEmail: 'lotus@gmail.com',
      centreStatus: 'Approved',
      eligibilityStatus: 'Eligible',
      organizationType: 'Trust',
    },
  });

  const c2 = await prisma.centre.upsert({
    where: { centreCode: 'CN-002' },
    update: {},
    create: {
      centreCode: 'CN-002',
      centreName: 'Sunrise IT Academy',
      centreAddress: 'Bldg 7A, MIDC, Andheri East, Mumbai - 400093',
      pincode: '400093',
      venueStatus: 'New',
      officialEmail: 'sunrise@itmumbai.in',
      centreStatus: 'Active',
      eligibilityStatus: 'Eligible',
      organizationType: 'Company',
    },
  });

  await prisma.booking.upsert({
    where: { bookingCode: 'BK-EDQ-001' },
    update: {},
    create: {
      bookingCode: 'BK-EDQ-001',
      projectId: p1.id,
      centreId: c1.id,
      dates: ['2026-11-29'],
      shiftsCount: 2,
      systemsBooked: 250,
      status: 'Confirmed',
    },
  });

  await prisma.booking.upsert({
    where: { bookingCode: 'BK-EDQ-002' },
    update: {},
    create: {
      bookingCode: 'BK-EDQ-002',
      projectId: p2.id,
      centreId: c2.id,
      dates: ['2027-02-06'],
      shiftsCount: 2,
      systemsBooked: 180,
      status: 'Confirmed',
    },
  });

  // 5. Seed Enterprise Examination Hierarchy (SSC, Non-SSC, MHCET)
  console.log(`🏛️  Seeding Examination Hierarchy (Project -> ExamType -> Exam -> Date -> Shift)...`);
  
  // A. Eduquity -> SSC Project
  const sscProject = await prisma.project.upsert({
    where: { projectCode: 'PRJ-EDQ-SSC' },
    update: { clientId: eduquityId, name: 'SSC Project' },
    create: {
      projectCode: 'PRJ-EDQ-SSC',
      name: 'SSC Project',
      clientId: eduquityId,
      examType: 'SSC Multi-Drive',
      description: 'Staff Selection Commission central recruitment examination drives',
      stage: 'Execution',
      status: 'Active',
      startDate: new Date('2026-12-01T00:00:00Z'),
      endDate: new Date('2027-06-30T00:00:00Z'),
      examDate: new Date('2027-01-10T09:00:00Z'),
      citiesCount: 45,
      candidateTarget: 85000,
      centreTarget: 120,
      slaHealth: 'OnTrack',
    },
  });

  // SSC Exam Types: SSC GD, SSC CHSL, SSC CGL, SSC MTS
  const sscTypes = [
    { code: 'SSC-GD', name: 'SSC GD', desc: 'General Duty Constable Examination' },
    { code: 'SSC-CHSL', name: 'SSC CHSL', desc: 'Combined Higher Secondary Level Examination' },
    { code: 'SSC-CGL', name: 'SSC CGL', desc: 'Combined Graduate Level Examination' },
    { code: 'SSC-MTS', name: 'SSC MTS', desc: 'Multi-Tasking Staff Examination' },
  ];

  const sscTypeMap = new Map<string, string>();
  for (const st of sscTypes) {
    const et = await prisma.examType.upsert({
      where: {
        projectId_examCode: {
          projectId: sscProject.id,
          examCode: st.code,
        },
      },
      update: { examTypeName: st.name, description: st.desc },
      create: {
        projectId: sscProject.id,
        examCode: st.code,
        examTypeName: st.name,
        description: st.desc,
        isActive: true,
      },
    });
    sscTypeMap.set(st.code, et.id);
  }

  // Sample Exam Instance: SSC GD 2027
  const sscGdTypeId = sscTypeMap.get('SSC-GD')!;
  const sscGdExam = await prisma.exam.upsert({
    where: {
      examTypeId_examCode: {
        examTypeId: sscGdTypeId,
        examCode: 'SSC-GD-2027',
      },
    },
    update: { examName: 'SSC GD Examination 2027', examYear: 2027 },
    create: {
      examTypeId: sscGdTypeId,
      examCode: 'SSC-GD-2027',
      examName: 'SSC GD Examination 2027',
      examYear: 2027,
      description: 'National SSC GD Constable Examination Drive 2027',
      status: 'Scheduled',
    },
  });

  // Exam Dates for SSC GD 2027
  const existingSscDate = await prisma.examDate.findFirst({
    where: { examId: sscGdExam.id, examDate: new Date('2027-01-10T00:00:00Z') },
  });
  if (!existingSscDate) {
    await prisma.examDate.create({
      data: {
        examId: sscGdExam.id,
        examDate: new Date('2027-01-10T00:00:00Z'),
        reportingTime: '07:30 AM',
        status: 'Scheduled',
        shifts: {
          create: [
            { shiftName: 'Shift 1 - Morning', shiftNumber: 1, startTime: '09:00 AM', endTime: '11:00 AM', reportingTime: '07:30 AM', status: 'Scheduled' },
            { shiftName: 'Shift 2 - Afternoon', shiftNumber: 2, startTime: '01:00 PM', endTime: '03:00 PM', reportingTime: '11:30 AM', status: 'Scheduled' },
          ],
        },
      },
    });
  }

  // B. Eduquity -> Non-SSC Project
  const nonSscProject = await prisma.project.upsert({
    where: { projectCode: 'PRJ-EDQ-NONSSC' },
    update: { clientId: eduquityId, name: 'Non-SSC Project' },
    create: {
      projectCode: 'PRJ-EDQ-NONSSC',
      name: 'Non-SSC Project',
      clientId: eduquityId,
      examType: 'Autonomous & PSUs',
      description: 'Autonomous institutions, PSUs and agricultural research drives',
      stage: 'Audit & Compliance',
      status: 'Active',
      startDate: new Date('2027-01-01T00:00:00Z'),
      endDate: new Date('2027-08-31T00:00:00Z'),
      examDate: new Date('2027-02-15T09:00:00Z'),
      citiesCount: 22,
      candidateTarget: 32000,
      centreTarget: 45,
      slaHealth: 'OnTrack',
    },
  });

  const nonSscTypes = [
    { code: 'EDCIL', name: 'EDCIL', desc: 'Educational Consultants India Limited Entrance' },
    { code: 'ICAR', name: 'ICAR', desc: 'Indian Council of Agricultural Research All India Entrance' },
  ];

  for (const nt of nonSscTypes) {
    await prisma.examType.upsert({
      where: {
        projectId_examCode: {
          projectId: nonSscProject.id,
          examCode: nt.code,
        },
      },
      update: { examTypeName: nt.name, description: nt.desc },
      create: {
        projectId: nonSscProject.id,
        examCode: nt.code,
        examTypeName: nt.name,
        description: nt.desc,
        isActive: true,
      },
    });
  }

  // C. Edu-Spark -> MHCET Project
  const eduSparkId = clientMap.get('CL-ESP')!;
  const mhcetProject = await prisma.project.upsert({
    where: { projectCode: 'PRJ-ESP-MHCET' },
    update: { clientId: eduSparkId, name: 'MHCET Project' },
    create: {
      projectCode: 'PRJ-ESP-MHCET',
      name: 'MHCET Project',
      clientId: eduSparkId,
      examType: 'State Common Entrance',
      description: 'Government of Maharashtra State Common Entrance Examination',
      stage: 'Setup',
      status: 'Active',
      startDate: new Date('2027-02-01T00:00:00Z'),
      endDate: new Date('2027-07-31T00:00:00Z'),
      examDate: new Date('2027-03-15T09:00:00Z'),
      citiesCount: 36,
      candidateTarget: 60000,
      centreTarget: 95,
      slaHealth: 'OnTrack',
    },
  });

  const mhcetType = await prisma.examType.upsert({
    where: {
      projectId_examCode: {
        projectId: mhcetProject.id,
        examCode: 'MHCET',
      },
    },
    update: { examTypeName: 'MHCET' },
    create: {
      projectId: mhcetProject.id,
      examCode: 'MHCET',
      examTypeName: 'MHCET',
      description: 'Maharashtra Common Entrance Test Engineering & Medical',
      isActive: true,
    },
  });

  const mhcetExam = await prisma.exam.upsert({
    where: {
      examTypeId_examCode: {
        examTypeId: mhcetType.id,
        examCode: 'MHCET-2027',
      },
    },
    update: { examName: 'MHCET Examination 2027', examYear: 2027 },
    create: {
      examTypeId: mhcetType.id,
      examCode: 'MHCET-2027',
      examName: 'MHCET Examination 2027',
      examYear: 2027,
      description: 'Maharashtra State Common Entrance Examination 2027',
      status: 'Scheduled',
    },
  });

  const existingMhcetDate = await prisma.examDate.findFirst({
    where: { examId: mhcetExam.id, examDate: new Date('2027-03-15T00:00:00Z') },
  });
  if (!existingMhcetDate) {
    await prisma.examDate.create({
      data: {
        examId: mhcetExam.id,
        examDate: new Date('2027-03-15T00:00:00Z'),
        reportingTime: '07:00 AM',
        status: 'Scheduled',
        shifts: {
          create: [
            { shiftName: 'Shift 1 - PCM', shiftNumber: 1, startTime: '08:30 AM', endTime: '11:30 AM', reportingTime: '07:00 AM', status: 'Scheduled' },
            { shiftName: 'Shift 2 - PCB', shiftNumber: 2, startTime: '02:00 PM', endTime: '05:00 PM', reportingTime: '12:30 PM', status: 'Scheduled' },
          ],
        },
      },
    });
  }

  // 6. Record Initial Audit Log
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
