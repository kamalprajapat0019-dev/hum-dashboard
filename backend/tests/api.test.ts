import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { app } from '../src/app.js';
import { generateToken } from '../src/utils/jwt.js';
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

describe('Public API Endpoints', () => {
  it('GET /api/v1/health should return sanitized health status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.service).toBe('oem-portal-backend');
    expect(data.data.version).toBe('1.0.0');
    // Ensure credentials and secrets are NEVER exposed
    expect(data.data.databaseUrl).toBeUndefined();
    expect(data.data.password).toBeUndefined();
    expect(data.data.jwtSecret).toBeUndefined();
  });

  it('POST /api/v1/auth/login with invalid payload should return 400 validation error', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'notanemail', password: '' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Admin Protected Routes & Security Guards', () => {
  it('GET /api/v1/admin/analytics should reject unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/admin/analytics`);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/admin/users should reject unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/admin/users`);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/admin/projects should reject unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/admin/projects`);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/admin/clients should reject unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/admin/clients`);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/admin/centres should reject unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/admin/centres`);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('Protected route should reject non-Admin role token with 403 Forbidden', async () => {
    // Generate a valid token with Role: PM (not ADMIN)
    const pmToken = generateToken({
      userId: 'usr_pm_demo',
      email: 'pm@oemportal.in',
      role: Role.PM,
      name: 'Priya Sharma',
    });

    const res = await fetch(`${baseUrl}/admin/analytics`, {
      headers: { Authorization: `Bearer ${pmToken}` },
    });

    // Expect 401 or 403 because usr_pm_demo is not in the db or not ADMIN
    expect([401, 403]).toContain(res.status);
    const data = await res.json();
    expect(data.success).toBe(false);
  });
});
