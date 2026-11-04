import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { Role } from '@prisma/client';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://localhost:${addr.port}/api/v1`;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe('End-to-End Authentication & Authorization Audit', () => {
  let adminToken: string;
  let pmToken: string;
  const pmEmail = `test.pm.${Date.now()}@oemportal.in`;
  const pmPassword = 'SecurePMPassword2026!';

  it('1. Public Health Check should return healthy and never leak secrets', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('healthy');
    expect(body.data.database.status).toBe('connected');
    expect(body.data.password).toBeUndefined();
    expect(body.data.jwtSecret).toBeUndefined();
    expect(body.data.DATABASE_URL).toBeUndefined();
  });

  it('2. Admin Login with seeded credentials should authenticate and issue JWT', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.INITIAL_ADMIN_EMAIL || 'admin@oemportal.in',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'admin_secure_pass_123',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.role).toBe('ADMIN');
    expect(body.data.user.passwordHash).toBeUndefined(); // Never expose hash

    adminToken = body.data.token;
  });

  it('3. Login with invalid password should fail with 401 and generic message', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.INITIAL_ADMIN_EMAIL || 'admin@oemportal.in',
        password: 'IncorrectPassword999!',
      }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('4. GET /auth/me with valid Admin token should return authenticated user', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.role).toBe('ADMIN');
    expect(body.data.status).toBe('Active');
  });

  it('5. GET /auth/me with invalid or tampered token should return 401 INVALID_TOKEN', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: 'Bearer this.is.a.tampered.token' },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_TOKEN');
  });

  it('6. GET /auth/me with missing token should return 401 UNAUTHORIZED', async () => {
    const res = await fetch(`${baseUrl}/auth/me`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('7. Public Registration does NOT exist (no unauthorized signup)', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hacker@test.com', password: 'password', role: 'ADMIN' }),
    });
    // Should be 404 Not Found since public registration route does not exist
    expect(res.status).toBe(404);
  });

  it('8. Admin endpoint /admin/analytics returns real aggregated data', async () => {
    const res = await fetch(`${baseUrl}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.kpis).toBeDefined();
    expect(body.data.kpis.activeProjects.total).toBeGreaterThanOrEqual(0);
    expect(body.data.kpis.totalCentres.value).toBeGreaterThanOrEqual(0);
    expect(body.data.charts).toBeDefined();
    expect(body.data.recentActivity).toBeDefined();
  });

  it('9. Admin endpoint /admin/clients returns seeded government clients', async () => {
    const res = await fetch(`${baseUrl}/admin/clients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(3);
    const clientCodes = body.data.map((c: any) => c.code);
    expect(clientCodes).toContain('CL-001'); // NTA
  });

  it('10. Admin can provision a new Project Manager (PM) user', async () => {
    const res = await fetch(`${baseUrl}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        email: pmEmail,
        password: pmPassword,
        name: 'Suresh Raina',
        role: Role.PM,
        scope: { clients: ['CL-001'], projects: [], centres: [] },
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(pmEmail);
    expect(body.data.role).toBe('PM');
  });

  it('11. Newly created PM can log in and obtain PM JWT token', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: pmEmail,
        password: pmPassword,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.role).toBe('PM');
    pmToken = body.data.token;
  });

  it('12. PM user is strictly FORBIDDEN (403) from accessing Admin Analytics', async () => {
    const res = await fetch(`${baseUrl}/admin/analytics`, {
      headers: { Authorization: `Bearer ${pmToken}` },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('13. PM user is strictly FORBIDDEN (403) from accessing Admin Users list', async () => {
    const res = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${pmToken}` },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('14. Admin endpoint /admin/audit-logs returns real audit trail', async () => {
    const res = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('15. Admin endpoint /admin/config returns system configurations', async () => {
    const res = await fetch(`${baseUrl}/admin/config`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    const keys = body.data.map((cfg: any) => cfg.key);
    expect(keys).toContain('SYSTEM_SETTINGS');
  });

  it('16. Client-specific analytics for Eduquity returns isolated database aggregates', async () => {
    // 1. Get Eduquity client ID from /admin/clients
    const clientsRes = await fetch(`${baseUrl}/admin/clients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const clientsBody = await clientsRes.json();
    const eduquityClient = clientsBody.data.find((c: any) => c.name === 'Eduquity');
    expect(eduquityClient).toBeDefined();

    // 2. Fetch analytics for Eduquity
    const res = await fetch(`${baseUrl}/admin/analytics?clientId=${eduquityClient.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.client.name).toBe('Eduquity');
    expect(body.data.kpis.activeProjects.value).toBeGreaterThanOrEqual(4);
    expect(body.data.kpis.totalCentres.value).toBeGreaterThanOrEqual(2);
    expect(body.data.kpis.candidates.total).toBeGreaterThanOrEqual(159000);

    // 3. Fetch projects for Eduquity
    const projRes = await fetch(`${baseUrl}/admin/projects?clientId=${eduquityClient.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const projBody = await projRes.json();
    expect(projBody.success).toBe(true);
    expect(projBody.data.length).toBeGreaterThanOrEqual(4);
    expect(projBody.data.every((p: any) => p.clientId === eduquityClient.id)).toBe(true);
  });

  it('17. Client-specific analytics for Edu-Spark returns isolated MHCET data', async () => {
    const clientsRes = await fetch(`${baseUrl}/admin/clients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const clientsBody = await clientsRes.json();
    const eduSparkClient = clientsBody.data.find((c: any) => c.name === 'Edu-Spark');
    expect(eduSparkClient).toBeDefined();

    // Fetch analytics for Edu-Spark
    const res = await fetch(`${baseUrl}/admin/analytics?clientId=${eduSparkClient.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.client.name).toBe('Edu-Spark');
    expect(body.data.kpis.activeProjects.value).toBeGreaterThanOrEqual(1);
    expect(body.data.kpis.activeProjects.total).toBeGreaterThanOrEqual(1);

    // Fetch projects for Edu-Spark
    const projRes = await fetch(`${baseUrl}/admin/projects?clientId=${eduSparkClient.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const projBody = await projRes.json();
    expect(projBody.success).toBe(true);
    expect(projBody.data.length).toBeGreaterThanOrEqual(1);
    expect(projBody.data.some((p: any) => p.projectCode === 'PRJ-ESP-MHCET')).toBe(true);
    expect(projBody.data.every((p: any) => p.clientId === eduSparkClient.id)).toBe(true);
  });

  it('18. Client-specific analytics for FutureScope returns true zero/empty state with full isolation', async () => {
    const clientsRes = await fetch(`${baseUrl}/admin/clients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const clientsBody = await clientsRes.json();
    const futureScopeClient = clientsBody.data.find((c: any) => c.name === 'FutureScope');
    expect(futureScopeClient).toBeDefined();

    const res = await fetch(`${baseUrl}/admin/analytics?clientId=${futureScopeClient.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.client.name).toBe('FutureScope');
    expect(body.data.kpis.activeProjects.value).toBe(0);
    expect(body.data.kpis.activeProjects.total).toBe(0);
    expect(body.data.kpis.totalCentres.value).toBe(0);
    expect(body.data.kpis.candidates.total).toBe(0);
  });

  it('19. GET /admin/analytics with invalid/non-existent clientId returns 404 CLIENT_NOT_FOUND', async () => {
    const res = await fetch(`${baseUrl}/admin/analytics?clientId=cmv_invalid_nonexistent_id`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('CLIENT_NOT_FOUND');
  });

  it('20. Hierarchy validation: Rejects cross-client project filtering in analytics with 400', async () => {
    const clientsRes = await fetch(`${baseUrl}/admin/clients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const clientsBody = await clientsRes.json();
    const eduSparkClient = clientsBody.data.find((c: any) => c.name === 'Edu-Spark');
    const eduquityClient = clientsBody.data.find((c: any) => c.name === 'Eduquity');

    const eduquityProjectsRes = await fetch(`${baseUrl}/admin/projects?clientId=${eduquityClient.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const eduquityProjects = await eduquityProjectsRes.json();
    const eduquityProjectId = eduquityProjects.data[0].id;

    // Passing Edu-Spark clientId but an Eduquity projectId must fail with 400
    const res = await fetch(
      `${baseUrl}/admin/analytics?clientId=${eduSparkClient.id}&projectId=${eduquityProjectId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_HIERARCHY');
  });

  it('21. Exam Types & Hierarchy CRUD: Can list, query and validate exam types', async () => {
    const res = await fetch(`${baseUrl}/admin/exam-types`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const sscGd = body.data.find((et: any) => et.examCode === 'SSC-GD');
    expect(sscGd).toBeDefined();
    expect(sscGd.examTypeName).toBe('SSC GD');
  });

  let createdProjectId: string;
  const testProjectCode = `PRJ-TEST-${Date.now()}`;

  it('22. Multiple Examination Dates: Create project with 5 dates and shifts and verify all rows in MySQL', async () => {
    // 1. Get Eduquity client ID
    const clientsRes = await fetch(`${baseUrl}/admin/clients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const clientsBody = await clientsRes.json();
    const eduquityClient = clientsBody.data.find((c: any) => c.name === 'Eduquity');
    expect(eduquityClient).toBeDefined();

    // 2. Create project with 5 exam dates (e.g. SSC GD 2027: Jan 10, 11, 12, 15, 16)
    const newProjectPayload = {
      projectCode: testProjectCode,
      name: 'SSC GD 2027 Examination Drive',
      clientId: eduquityClient.id,
      examType: 'CBT Exam',
      description: 'National recruitment multi-date examination',
      stage: 'Setup',
      status: 'Active',
      citiesCount: 28,
      candidateTarget: 85000,
      centreTarget: 140,
      slaHealth: 'OnTrack',
      examDates: [
        { examDate: '2027-01-10T00:00:00.000Z', shift: 'Shift 1', startTime: '09:00 AM', endTime: '12:00 PM' },
        { examDate: '2027-01-11T00:00:00.000Z', shift: 'Shift 1', startTime: '09:00 AM', endTime: '12:00 PM' },
        { examDate: '2027-01-12T00:00:00.000Z', shift: 'Shift 2', startTime: '01:00 PM', endTime: '04:00 PM' },
        { examDate: '2027-01-15T00:00:00.000Z', shift: 'Shift 1', startTime: '09:00 AM', endTime: '12:00 PM' },
        { examDate: '2027-01-16T00:00:00.000Z', shift: 'Shift 2', startTime: '01:00 PM', endTime: '04:00 PM' },
      ],
    };

    const res = await fetch(`${baseUrl}/admin/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(newProjectPayload),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.projectCode).toBe(testProjectCode);
    expect(body.data.examDates).toBeDefined();
    expect(body.data.examDates.length).toBe(5);

    createdProjectId = body.data.id;
  });

  it('23. Calendar Synchronization: Query GET /admin/calendar?year=2027 and verify complete fields and highlights', async () => {
    const res = await fetch(`${baseUrl}/admin/calendar?year=2027`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.exams).toBeDefined();
    expect(Array.isArray(body.data.exams)).toBe(true);

    // Verify all 5 dates appear in calendar
    const testExams = body.data.exams.filter((e: any) => e.projectId === createdProjectId);
    expect(testExams.length).toBe(5);

    // Verify essential inspection fields are present
    const firstExam = testExams[0];
    expect(firstExam.projectCode).toBe(testProjectCode);
    expect(firstExam.projectName).toBe('SSC GD 2027 Examination Drive');
    expect(firstExam.client).toBe('Eduquity');
    expect(firstExam.examType).toBe('CBT Exam');
    expect(firstExam.date).toBe('2027-01-10');
    expect(firstExam.shift).toBe('Shift 1');
    expect(firstExam.startTime).toBe('09:00 AM');
    expect(firstExam.endTime).toBe('12:00 PM');
    expect(firstExam.candidateTarget).toBe(85000);
    expect(firstExam.centreTarget).toBe(140);
    expect(firstExam.stage).toBe('Setup');

    // Summary metrics
    expect(body.data.summary.totalExams).toBeGreaterThanOrEqual(5);
    expect(body.data.summary.activeProjects).toBeGreaterThanOrEqual(1);
  });

  it('24. Calendar Multiple Sessions on Same Date: Verify multiple shifts on same date without overwriting', async () => {
    // Add a second shift on Jan 10, 2027 for the same project
    const updatePayload = {
      examDates: [
        { examDate: '2027-01-10T00:00:00.000Z', shift: 'Shift 1', startTime: '09:00 AM', endTime: '12:00 PM' },
        { examDate: '2027-01-10T00:00:00.000Z', shift: 'Shift 2', startTime: '01:00 PM', endTime: '04:00 PM' },
        { examDate: '2027-01-11T00:00:00.000Z', shift: 'Shift 1', startTime: '09:00 AM', endTime: '12:00 PM' },
        { examDate: '2027-01-12T00:00:00.000Z', shift: 'Shift 2', startTime: '01:00 PM', endTime: '04:00 PM' },
        { examDate: '2027-01-15T00:00:00.000Z', shift: 'Shift 1', startTime: '09:00 AM', endTime: '12:00 PM' },
        { examDate: '2027-01-16T00:00:00.000Z', shift: 'Shift 2', startTime: '01:00 PM', endTime: '04:00 PM' },
      ],
    };

    const updateRes = await fetch(`${baseUrl}/admin/projects/${createdProjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(updatePayload),
    });

    expect(updateRes.status).toBe(200);

    // Now query calendar specifically for date 2027-01-10
    const calRes = await fetch(`${baseUrl}/admin/calendar?date=2027-01-10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(calRes.status).toBe(200);
    const calBody = await calRes.json();
    const sessionsOnJan10 = calBody.data.exams.filter((e: any) => e.projectId === createdProjectId && e.date === '2027-01-10');

    // Both Shift 1 and Shift 2 must be present without overwriting
    expect(sessionsOnJan10.length).toBe(2);
    expect(sessionsOnJan10.some((s: any) => s.shift === 'Shift 1')).toBe(true);
    expect(sessionsOnJan10.some((s: any) => s.shift === 'Shift 2')).toBe(true);
  });

  it('25. Calendar Enterprise Client Isolation: Verify Eduquity vs Edu-Spark schedules are strictly isolated', async () => {
    const clientsRes = await fetch(`${baseUrl}/admin/clients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const clientsBody = await clientsRes.json();
    const eduquityClient = clientsBody.data.find((c: any) => c.name === 'Eduquity');
    const eduSparkClient = clientsBody.data.find((c: any) => c.name === 'Edu-Spark');

    // 1. Query calendar filtering by Eduquity
    const eduqRes = await fetch(`${baseUrl}/admin/calendar?year=2027&clientId=${eduquityClient.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const eduqBody = await eduqRes.json();
    expect(eduqBody.success).toBe(true);
    expect(eduqBody.data.exams.every((e: any) => e.clientId === eduquityClient.id)).toBe(true);
    expect(eduqBody.data.exams.some((e: any) => e.projectId === createdProjectId)).toBe(true);

    // 2. Query calendar filtering by Edu-Spark
    const sparkRes = await fetch(`${baseUrl}/admin/calendar?year=2027&clientId=${eduSparkClient.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const sparkBody = await sparkRes.json();
    expect(sparkBody.success).toBe(true);
    expect(sparkBody.data.exams.every((e: any) => e.clientId === eduSparkClient.id)).toBe(true);
    // Eduquity's project must NEVER appear under Edu-Spark
    expect(sparkBody.data.exams.some((e: any) => e.projectId === createdProjectId)).toBe(false);
  });

  it('26. Logout endpoint gracefully acknowledges session termination', async () => {
    const res = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
