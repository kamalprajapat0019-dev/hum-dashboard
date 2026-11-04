import { Server } from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

interface EndpointTest {
  name: string;
  method: string;
  path: string;
  body?: any;
  needsAuth?: boolean;
  expectedStatus: number;
  validator?: (data: any) => void;
}

async function runAudit() {
  console.log('================================================================');
  console.log('🚀 RUNNING PRODUCTION API & DATABASE INTEGRATION AUDIT');
  console.log('================================================================\n');

  // 1. Verify Database Connection
  console.log('📦 Task 5: Testing Real Remote MySQL Connection via Prisma...');
  const clientsCount = await prisma.client.count();
  const projectsCount = await prisma.project.count();
  const examsCount = await prisma.exam.count();
  console.log(`   ✓ Connected to MySQL Database.`);
  console.log(`   ✓ Records found: ${clientsCount} Clients, ${projectsCount} Projects, ${examsCount} Exam Instances.\n`);

  // 2. Start Temporary HTTP Server on random port to test HTTP wire protocol
  let server: Server;
  let baseUrl: string;

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://localhost:${addr.port}`;
      }
      resolve();
    });
  });

  console.log(`📡 Temporary HTTP test server running at ${baseUrl}\n`);

  try {
    // 3. Login as Admin to obtain JWT token
    console.log('🔑 Authenticating as Admin to test Protected Endpoints...');
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@oemportal.in',
        password: 'admin_secure_pass_123',
      }),
    });

    const loginContentType = loginRes.headers.get('content-type') || '';
    if (!loginContentType.includes('application/json')) {
      throw new Error(`Login failed with non-JSON content-type: ${loginContentType}`);
    }

    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.data?.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    const adminToken = loginData.data.token;
    console.log('   ✓ Admin JWT successfully generated.\n');

    // Fetch actual client IDs from database for accurate parameterized tests
    const eduquityClient = await prisma.client.findFirst({
      where: { name: { contains: 'Eduquity' } },
    });
    const eduSparkClient = await prisma.client.findFirst({
      where: { name: { contains: 'Edu-Spark' } },
    });

    const edqId = eduquityClient?.id || 'cmvuiz0mv0006ugkkf86q4hpt';
    const espId = eduSparkClient?.id || 'cmvuiz0sp0007ugkkxc8nblu7';

    // 4. Define Endpoint Test Matrix
    const tests: EndpointTest[] = [
      {
        name: 'Root Service Identifier',
        method: 'GET',
        path: '/',
        expectedStatus: 200,
        validator: (d) => {
          if (!d.service || d.status !== 'online') throw new Error('Invalid root payload');
        },
      },
      {
        name: 'Root Direct Health Check',
        method: 'GET',
        path: '/health',
        expectedStatus: 200,
        validator: (d) => {
          if (!d.data?.database?.status) throw new Error('Database status missing in /health');
        },
      },
      {
        name: 'API v1 Root Information',
        method: 'GET',
        path: '/api/v1',
        expectedStatus: 200,
      },
      {
        name: 'API v1 Health Check Endpoint',
        method: 'GET',
        path: '/api/v1/health',
        expectedStatus: 200,
        validator: (d) => {
          if (d.data?.database?.status !== 'connected') throw new Error('Database not connected in /api/v1/health');
        },
      },
      {
        name: 'API v1 Double-Prefix Resilience (/api/v1/api/v1/health)',
        method: 'GET',
        path: '/api/v1/api/v1/health',
        expectedStatus: 200,
      },
      {
        name: 'Unprefixed Fallback (/health)',
        method: 'GET',
        path: '/health',
        expectedStatus: 200,
      },
      {
        name: 'GET /api/v1/auth/me (Current User)',
        method: 'GET',
        path: '/api/v1/auth/me',
        needsAuth: true,
        expectedStatus: 200,
        validator: (d) => {
          const email = d.data?.email || d.data?.user?.email;
          if (email !== 'admin@oemportal.in') throw new Error(`Wrong user returned: ${email}`);
        },
      },
      {
        name: 'GET /api/v1/admin/clients (Clients Master)',
        method: 'GET',
        path: '/api/v1/admin/clients?limit=100',
        needsAuth: true,
        expectedStatus: 200,
        validator: (d) => {
          if (!Array.isArray(d.data) || d.data.length < 2) throw new Error('Clients list must contain at least 2 clients');
        },
      },
      {
        name: 'GET /api/v1/admin/analytics (Eduquity Isolated Scope)',
        method: 'GET',
        path: `/api/v1/admin/analytics?clientId=${edqId}`,
        needsAuth: true,
        expectedStatus: 200,
        validator: (d) => {
          if (typeof d.data?.kpis?.activeProjects?.value !== 'number') throw new Error('KPI activeProjects missing');
          if (!Array.isArray(d.data?.charts?.projectStatusData)) throw new Error('Charts projectStatusData missing');
        },
      },
      {
        name: 'GET /api/v1/admin/analytics (Edu-Spark Isolated Scope)',
        method: 'GET',
        path: `/api/v1/admin/analytics?clientId=${espId}`,
        needsAuth: true,
        expectedStatus: 200,
        validator: (d) => {
          if (typeof d.data?.kpis?.activeProjects?.value !== 'number') throw new Error('KPI activeProjects missing');
        },
      },
      {
        name: 'GET /api/v1/admin/projects (Projects Listing)',
        method: 'GET',
        path: `/api/v1/admin/projects?clientId=${edqId}&limit=10`,
        needsAuth: true,
        expectedStatus: 200,
        validator: (d) => {
          if (!Array.isArray(d.data)) throw new Error('Projects data must be an array');
        },
      },
      {
        name: 'GET /api/v1/admin/exam-types (Exam Types Listing)',
        method: 'GET',
        path: '/api/v1/admin/exam-types?limit=100',
        needsAuth: true,
        expectedStatus: 200,
        validator: (d) => {
          if (!Array.isArray(d.data)) throw new Error('Exam types data must be an array');
        },
      },
      {
        name: 'GET /api/v1/admin/exams (Exams Listing)',
        method: 'GET',
        path: '/api/v1/admin/exams?limit=100',
        needsAuth: true,
        expectedStatus: 200,
        validator: (d) => {
          if (!Array.isArray(d.data)) throw new Error('Exams data must be an array');
        },
      },
      {
        name: 'GET /api/v1/admin/centres (Centres Listing)',
        method: 'GET',
        path: '/api/v1/admin/centres?limit=10',
        needsAuth: true,
        expectedStatus: 200,
        validator: (d) => {
          if (!Array.isArray(d.data)) throw new Error('Centres data must be an array');
        },
      },
      {
        name: 'GET /api/v1/admin/calendar (Annual Examination Calendar)',
        method: 'GET',
        path: '/api/v1/admin/calendar?year=2027',
        needsAuth: true,
        expectedStatus: 200,
        validator: (d) => {
          if (!Array.isArray(d.data?.exams)) throw new Error('Calendar exams must be an array');
        },
      },
      {
        name: 'Unprefixed /admin/clients (Graceful Routing Fallback)',
        method: 'GET',
        path: '/admin/clients?limit=10',
        needsAuth: true,
        expectedStatus: 200,
        validator: (d) => {
          if (!Array.isArray(d.data)) throw new Error('Unprefixed /admin/clients failed');
        },
      },
    ];

    console.log('🧪 Executing Test Matrix across all Production Endpoints...\n');
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (test.needsAuth) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      if (test.body) {
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(`${baseUrl}${test.path}`, {
        method: test.method,
        headers,
        body: test.body ? JSON.stringify(test.body) : undefined,
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!isJson) {
        console.error(`   ❌ [FAIL] ${test.name}: Expected application/json but received Content-Type: ${contentType}`);
        failed++;
        continue;
      }

      let data: any;
      try {
        data = await res.json();
      } catch (jsonErr: any) {
        console.error(`   ❌ [FAIL] ${test.name}: Response body is not valid JSON! Error: ${jsonErr.message}`);
        failed++;
        continue;
      }

      if (res.status !== test.expectedStatus) {
        console.error(`   ❌ [FAIL] ${test.name}: Expected status ${test.expectedStatus} but received ${res.status}. Data: ${JSON.stringify(data)}`);
        failed++;
        continue;
      }

      try {
        if (test.validator) test.validator(data);
      } catch (valErr: any) {
        console.error(`   ❌ [FAIL] ${test.name}: Validation failed: ${valErr.message}`);
        failed++;
        continue;
      }

      console.log(`   ✓ [PASS] [HTTP ${res.status}] ${test.method.padEnd(4)} ${test.path.padEnd(50)} -> Valid JSON`);
      passed++;
    }

    console.log('\n================================================================');
    console.log(`🏁 AUDIT COMPLETE: ${passed} Passed, ${failed} Failed.`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await prisma.$disconnect();
  }
}

runAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
