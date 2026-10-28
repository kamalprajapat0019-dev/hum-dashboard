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

  it('16. Logout endpoint gracefully acknowledges session termination', async () => {
    const res = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
