import { prisma } from '../src/config/database.js';
import { generateToken } from '../src/utils/jwt.js';
import { Role } from '@prisma/client';
import { app } from '../src/app.js';
import { Server } from 'http';

async function verifyAll() {
  console.log('=== STARTING ENTERPRISE CLIENT FILTER VERIFICATION ===\n');

  // 1. Verify MySQL Client Records
  console.log('1. Checking MySQL Client Records:');
  const clients = await prisma.client.findMany({
    where: {
      name: { in: ['Eduquity', 'Edu-Spark'] },
    },
  });
  console.log(`Found ${clients.length} matching clients:`);
  for (const c of clients) {
    console.log(`   - ID: ${c.id} | Code: ${c.code} | Name: ${c.name} | FullName: ${c.fullName}`);
  }

  const eduquity = clients.find((c) => c.name === 'Eduquity');
  const eduSpark = clients.find((c) => c.name === 'Edu-Spark');

  if (!eduquity || !eduSpark) {
    throw new Error('Both Eduquity and Edu-Spark must exist in MySQL database');
  }

  // 2. Start HTTP Server for API tests
  let server: Server;
  let baseUrl: string;
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://localhost:${addr.port}/api/v1`;
      }
      resolve();
    });
  });

  try {
    const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN, status: 'Active' } });
    if (!adminUser) throw new Error('No active admin user found in database');

    const pmUser = await prisma.user.findFirst({ where: { role: Role.PM, status: 'Active' } });

    const adminToken = generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: Role.ADMIN,
      name: adminUser.name,
    });

    const pmToken = generateToken({
      userId: pmUser ? pmUser.id : 'usr_pm_fake',
      email: pmUser ? pmUser.email : 'pm@oemportal.in',
      role: Role.PM,
      name: pmUser ? pmUser.name : 'Priya Sharma',
    });

    // Test 1: Eduquity Analytics & Data Isolation
    console.log('\n2. Testing Eduquity API Analytics (GET /admin/analytics?clientId=...):');
    const resEdq = await fetch(`${baseUrl}/admin/analytics?clientId=${eduquity.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataEdq = await resEdq.json();
    console.log('   Status Code:', resEdq.status);
    console.log('   Client Returned:', dataEdq.data?.client?.name);
    console.log('   KPIs:', dataEdq.data?.kpis);
    console.log('   Chart Projects:', dataEdq.data?.charts?.projectStatusData);
    console.log('   Chart Centres:', dataEdq.data?.charts?.centreStatusData);

    if (dataEdq.data?.kpis?.activeProjects?.value !== 2) {
      throw new Error(`Expected Eduquity to have 2 active projects, got ${dataEdq.data?.kpis?.activeProjects?.value}`);
    }
    if (dataEdq.data?.kpis?.totalCentres?.value !== 2) {
      throw new Error(`Expected Eduquity to have 2 centres, got ${dataEdq.data?.kpis?.totalCentres?.value}`);
    }
    if (dataEdq.data?.kpis?.candidates?.total !== 42000) {
      throw new Error(`Expected Eduquity candidates to be 42000, got ${dataEdq.data?.kpis?.candidates?.total}`);
    }

    // Test 2: Eduquity Projects List
    console.log('\n3. Testing Eduquity Projects Endpoint (GET /admin/projects?clientId=...):');
    const resEdqProjects = await fetch(`${baseUrl}/admin/projects?clientId=${eduquity.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataEdqProjects = await resEdqProjects.json();
    console.log(`   Found ${dataEdqProjects.data?.length} projects for Eduquity:`);
    for (const p of dataEdqProjects.data) {
      console.log(`   - Code: ${p.projectCode} | Name: ${p.name} | Stage: ${p.stage} | Candidates: ${p.candidateTarget}`);
    }
    if (dataEdqProjects.data?.length !== 2) {
      throw new Error(`Expected 2 projects for Eduquity, got ${dataEdqProjects.data?.length}`);
    }

    // Test 3: Edu-Spark Analytics & Data Isolation
    console.log('\n4. Testing Edu-Spark API Analytics (GET /admin/analytics?clientId=...):');
    const resEsp = await fetch(`${baseUrl}/admin/analytics?clientId=${eduSpark.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataEsp = await resEsp.json();
    console.log('   Status Code:', resEsp.status);
    console.log('   Client Returned:', dataEsp.data?.client?.name);
    console.log('   KPIs:', dataEsp.data?.kpis);
    console.log('   Chart Projects Count:', dataEsp.data?.charts?.projectStatusData.length);
    console.log('   Chart Centres Count:', dataEsp.data?.charts?.centreStatusData.length);

    if (dataEsp.data?.kpis?.activeProjects?.value !== 0) {
      throw new Error(`Expected Edu-Spark active projects to be 0, got ${dataEsp.data?.kpis?.activeProjects?.value}`);
    }
    if (dataEsp.data?.kpis?.totalCentres?.value !== 0) {
      throw new Error(`Expected Edu-Spark centres to be 0, got ${dataEsp.data?.kpis?.totalCentres?.value}`);
    }
    if (dataEsp.data?.kpis?.candidates?.total !== 0) {
      throw new Error(`Expected Edu-Spark candidates to be 0, got ${dataEsp.data?.kpis?.candidates?.total}`);
    }
    if (dataEsp.data?.charts?.projectStatusData.length !== 0) {
      throw new Error('Expected Edu-Spark to have 0 project chart stages');
    }

    // Test 4: Edu-Spark Projects List
    console.log('\n5. Testing Edu-Spark Projects Endpoint (GET /admin/projects?clientId=...):');
    const resEspProjects = await fetch(`${baseUrl}/admin/projects?clientId=${eduSpark.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataEspProjects = await resEspProjects.json();
    console.log(`   Found ${dataEspProjects.data?.length} projects for Edu-Spark`);
    if (dataEspProjects.data?.length !== 0) {
      throw new Error(`Expected 0 projects for Edu-Spark, got ${dataEspProjects.data?.length}`);
    }

    // Test 5: Invalid Client ID Handling
    console.log('\n6. Testing Invalid Client ID rejection (GET /admin/analytics?clientId=nonexistent):');
    const resInvalid = await fetch(`${baseUrl}/admin/analytics?clientId=invalid_client_cuid_999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataInvalid = await resInvalid.json();
    console.log('   Status Code:', resInvalid.status);
    console.log('   Error Code:', dataInvalid.error?.code);
    console.log('   Error Message:', dataInvalid.error?.message);
    if (resInvalid.status !== 404 || dataInvalid.error?.code !== 'CLIENT_NOT_FOUND') {
      throw new Error('Invalid client ID must return 404 CLIENT_NOT_FOUND');
    }

    // Test 6: Authorization Guard (Role Check)
    console.log('\n7. Testing Role-Based Authorization Guard with non-Admin token:');
    const resAuth = await fetch(`${baseUrl}/admin/analytics?clientId=${eduquity.id}`, {
      headers: { Authorization: `Bearer ${pmToken}` },
    });
    console.log('   PM Status Code on Admin Route:', resAuth.status);
    if (resAuth.status !== 403) {
      throw new Error(`Expected 403 Forbidden for PM on Admin route, got ${resAuth.status}`);
    }

    console.log('\n✅ ALL VERIFICATION CHECKS PASSED PERFECTLY!');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

verifyAll().catch((err) => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
