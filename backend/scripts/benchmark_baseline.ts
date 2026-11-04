import { Server } from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

async function runBenchmark() {
  console.log('=== PERFORMANCE BENCHMARK (BASELINE AUDIT) ===\n');

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
    // 1. Measure Login
    const t0 = performance.now();
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@oemportal.in',
        password: 'admin_secure_pass_123',
      }),
    });
    const t1 = performance.now();
    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    console.log(`⏱️  1. Login API: ${(t1 - t0).toFixed(2)} ms (Status: ${loginRes.status})`);

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    // 2. Measure Clients List
    const t2 = performance.now();
    const clientsRes = await fetch(`${baseUrl}/admin/clients?limit=100`, { headers });
    const t3 = performance.now();
    await clientsRes.json();
    console.log(`⏱️  2. Clients API (/admin/clients): ${(t3 - t2).toFixed(2)} ms (Status: ${clientsRes.status})`);

    const client = await prisma.client.findFirst({ where: { name: { contains: 'Eduquity' } } });
    const clientId = client?.id || 'cmvuiz0mv0006ugkkf86q4hpt';

    // 3. Measure Executive Analytics
    const t4 = performance.now();
    const analyticsRes = await fetch(`${baseUrl}/admin/analytics?clientId=${clientId}`, { headers });
    const t5 = performance.now();
    await analyticsRes.json();
    console.log(`⏱️  3. Analytics API (/admin/analytics): ${(t5 - t4).toFixed(2)} ms (Status: ${analyticsRes.status})`);

    // 4. Measure Projects List
    const t6 = performance.now();
    const projectsRes = await fetch(`${baseUrl}/admin/projects?clientId=${clientId}&limit=100`, { headers });
    const t7 = performance.now();
    await projectsRes.json();
    console.log(`⏱️  4. Projects API (/admin/projects): ${(t7 - t6).toFixed(2)} ms (Status: ${projectsRes.status})`);

    // 5. Measure Calendar
    const t8 = performance.now();
    const calRes = await fetch(`${baseUrl}/admin/calendar?year=2027&clientId=${clientId}`, { headers });
    const t9 = performance.now();
    await calRes.json();
    console.log(`⏱️  5. Calendar API (/admin/calendar): ${(t9 - t8).toFixed(2)} ms (Status: ${calRes.status})`);

    console.log('\n=== END BASELINE BENCHMARK ===');
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await prisma.$disconnect();
  }
}

runBenchmark().catch(console.error);

