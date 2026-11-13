import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('OEMP User Management Module & RBAC Security Audit', () => {
  let server: Server;
  let baseUrl: string;
  let adminToken: string;
  let adminUserId: string;
  let pmToken: string;
  let pmUserId: string;
  let opsToken: string;
  let opsUserId: string;

  const timestamp = Date.now();
  const testPmEmail = `pm.audit.${timestamp}@oemportal.in`;
  const testOpsEmail = `ops.audit.${timestamp}@assessinfra.com`;
  const defaultPassword = 'TempSecurePassword2026!';

  beforeAll(async () => {
    // 1. Start test server on random port
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://localhost:${addr.port}/api/v1`;
        }
        resolve();
      });
    });

    // 2. Login as Admin
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@oemportal.in',
        password: 'admin_secure_pass_123',
      }),
    });
    const adminLoginBody = await adminLoginRes.json();
    adminToken = adminLoginBody.data.token;
    adminUserId = adminLoginBody.data.user.id;

    // 3. Create a Project Manager (PM) for hierarchy tests
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const pmUser = await prisma.user.create({
      data: {
        email: testPmEmail,
        passwordHash: hashedPassword,
        name: 'Audit Project Manager',
        role: Role.PM,
        status: 'Active',
      },
    });
    pmUserId = pmUser.id;

    const pmLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testPmEmail,
        password: defaultPassword,
      }),
    });
    const pmLoginBody = await pmLoginRes.json();
    pmToken = pmLoginBody.data.token;

    // 4. Create an Operations user
    const opsUser = await prisma.user.create({
      data: {
        email: testOpsEmail,
        passwordHash: hashedPassword,
        name: 'Audit Operations Lead',
        role: Role.OPERATIONS,
        status: 'Active',
        managerId: pmUserId,
      },
    });
    opsUserId = opsUser.id;

    const opsLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testOpsEmail,
        password: defaultPassword,
      }),
    });
    const opsLoginBody = await opsLoginRes.json();
    opsToken = opsLoginBody.data.token;
  });

  afterAll(async () => {
    // Clean up created test users
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: `audit.${timestamp}`,
        },
      },
    });

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // ── TEST 1: Summary Cards ──────────────────────────────────────────────────
  it('1. GET /api/v1/admin/users/summary returns dynamic card counts', async () => {
    const res = await fetch(`${baseUrl}/admin/users/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(typeof body.data.totalUsers).toBe('number');
    expect(typeof body.data.internalUsers).toBe('number');
    expect(typeof body.data.centreUsers).toBe('number');
    expect(typeof body.data.activeUsers).toBe('number');
    expect(typeof body.data.inactiveUsers).toBe('number');
    expect(body.data.totalUsers).toBeGreaterThanOrEqual(1);
    expect(body.data.internalUsers).toBeGreaterThanOrEqual(1);
  });

  // ── TEST 2: Email Domain Allowlist Validation ─────────────────────────────
  it('2. Creating internal user with unauthorized email domain should fail with 400', async () => {
    const invalidEmail = `hacker.${timestamp}@gmail.com`;
    const res = await fetch(`${baseUrl}/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Unauthorized Domain User',
        email: invalidEmail,
        role: 'PM',
        password: 'ValidPassword123!',
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('DOMAIN_NOT_ALLOWED');
  });

  it('3. Creating internal user with approved @oemportal.in domain succeeds', async () => {
    const validEmail = `new.ops.lead.${timestamp}@oemportal.in`;
    const res = await fetch(`${baseUrl}/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Approved Operations Lead',
        email: validEmail,
        phoneNumber: '+91 9876543210',
        role: 'OPERATIONS',
        password: defaultPassword,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(validEmail);
    expect(body.data.role).toBe('OPERATIONS');
    expect(body.data.passwordHash).toBeUndefined(); // Never expose password hash
  });

  // ── TEST 4: Listing Table with Pagination & Sorting ───────────────────────
  it('4. GET /api/v1/admin/users returns alphabetical default sorting and pagination', async () => {
    const res = await fetch(`${baseUrl}/admin/users?page=1&limit=10&sortBy=name&sortOrder=asc`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(10);
    expect(body.meta.total).toBeGreaterThanOrEqual(1);

    // Verify alphabetical ordering of names
    if (body.data.length > 1) {
      const names = body.data.map((u: any) => (u.name || '').toLowerCase());
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i].localeCompare(names[i + 1])).toBeLessThanOrEqual(0);
      }
    }
  });

  // ── TEST 5: Search Filter ─────────────────────────────────────────────────
  it('5. GET /api/v1/admin/users?search=... correctly filters by email or name', async () => {
    const res = await fetch(`${baseUrl}/admin/users?search=admin@oemportal.in`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.some((u: any) => u.email === 'admin@oemportal.in')).toBe(true);
  });

  // ── TEST 6: View and Edit Single User ─────────────────────────────────────
  let createdTargetUserId: string;
  const targetEmail = `target.user.${timestamp}@assessinfra.com`;

  it('6. Admin can create, view and update a user', async () => {
    // Create user
    const createRes = await fetch(`${baseUrl}/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Target Edit User',
        email: targetEmail,
        phoneNumber: '9123456789',
        role: 'AUDITOR',
        password: defaultPassword,
      }),
    });
    const createBody = await createRes.json();
    expect(createRes.status).toBe(201);
    createdTargetUserId = createBody.data.id;

    // View user
    const viewRes = await fetch(`${baseUrl}/admin/users/${createdTargetUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(viewRes.status).toBe(200);
    const viewBody = await viewRes.json();
    expect(viewBody.data.email).toBe(targetEmail);
    expect(viewBody.data.role).toBe('AUDITOR');
    expect(viewBody.data.passwordHash).toBeUndefined();

    // Edit user (update phone and name)
    const editRes = await fetch(`${baseUrl}/admin/users/${createdTargetUserId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Target Edit User - Updated Name',
        phoneNumber: '+91 9999988888',
      }),
    });
    expect(editRes.status).toBe(200);
    const editBody = await editRes.json();
    expect(editBody.data.name).toBe('Target Edit User - Updated Name');
    expect(editBody.data.phoneNumber).toBe('+91 9999988888');
  });

  // ── TEST 7: Deactivate & Activate with Login Enforcement ──────────────────
  it('7. Deactivating a user prevents login with ACCOUNT_INACTIVE; reactivating restores access', async () => {
    // 1. Deactivate target user
    const deactivateRes = await fetch(`${baseUrl}/admin/users/${createdTargetUserId}/deactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(deactivateRes.status).toBe(200);
    const deactivateBody = await deactivateRes.json();
    expect(deactivateBody.data.status).toBe('Inactive');

    // 2. Attempt login as deactivated user — must fail
    const blockedLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        password: defaultPassword,
      }),
    });
    expect(blockedLoginRes.status).toBe(401);
    const blockedBody = await blockedLoginRes.json();
    expect(blockedBody.error.code).toBe('ACCOUNT_INACTIVE');

    // 3. Reactivate user
    const activateRes = await fetch(`${baseUrl}/admin/users/${createdTargetUserId}/activate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(activateRes.status).toBe(200);
    const activateBody = await activateRes.json();
    expect(activateBody.data.status).toBe('Active');

    // 4. Verify login succeeds now
    const restoredLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        password: defaultPassword,
      }),
    });
    expect(restoredLoginRes.status).toBe(200);
    const restoredBody = await restoredLoginRes.json();
    expect(restoredBody.data.token).toBeDefined();
  });

  // ── TEST 8: Single-Use 24-Hour Password Reset Workflow ────────────────────
  it('8. Single-use time-limited password reset token workflow', async () => {
    // 1. Admin initiates password reset
    const resetInitRes = await fetch(`${baseUrl}/admin/users/${createdTargetUserId}/reset-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(resetInitRes.status).toBe(200);
    const resetInitBody = await resetInitRes.json();
    expect(resetInitBody.data.token).toBeDefined();
    expect(resetInitBody.data.expiresAt).toBeDefined();

    const resetToken = resetInitBody.data.token;

    // 2. Verify token endpoint
    const verifyTokenRes = await fetch(`${baseUrl}/auth/verify-reset-token/${resetToken}`);
    expect(verifyTokenRes.status).toBe(200);
    const verifyTokenBody = await verifyTokenRes.json();
    expect(verifyTokenBody.success).toBe(true);
    expect(verifyTokenBody.data.user.email).toBe(targetEmail);

    // 3. Complete password reset with new password
    const newPassword = 'BrandNewPassword2026!#';
    const completeResetRes = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        password: newPassword,
        confirmPassword: newPassword,
      }),
    });
    expect(completeResetRes.status).toBe(200);
    const completeResetBody = await completeResetRes.json();
    expect(completeResetBody.success).toBe(true);

    // 4. Reuse of same token must be rejected
    const reuseRes = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        password: 'AnotherPassword999!',
        confirmPassword: 'AnotherPassword999!',
      }),
    });
    expect(reuseRes.status).toBe(400);

    // 5. Old password no longer works
    const oldLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        password: defaultPassword,
      }),
    });
    expect(oldLoginRes.status).toBe(401);

    // 6. New password works
    const newLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        password: newPassword,
      }),
    });
    expect(newLoginRes.status).toBe(200);
  }, 25000);

  // ── TEST 9: Centre User Invitation & Account Activation (7 Days) ──────────
  it('9. Centre user invitation, token verification, and 7-day account activation', async () => {
    const invitedEmail = `centre.invite.${timestamp}@external-college.ac.in`;
    const contactName = 'Dr. S. K. Sharma';

    // 1. Operations user invites Centre User via /centre/invite-user
    const inviteRes = await fetch(`${baseUrl}/centre/invite-user`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opsToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: contactName,
        email: invitedEmail,
        phone: '+91 9845012345',
        role: 'CENTRE',
        scope: { centres: ['CTR-TEST-001'], projects: [] },
      }),
    });

    expect(inviteRes.status).toBe(201);
    const inviteBody = await inviteRes.json();
    expect(inviteBody.success).toBe(true);
    expect(inviteBody.data.invitation.token).toBeDefined();

    const inviteToken = inviteBody.data.invitation.token;

    // 2. Verify invitation token endpoint
    const verifyInviteRes = await fetch(`${baseUrl}/auth/verify-invitation/${inviteToken}`);
    expect(verifyInviteRes.status).toBe(200);
    const verifyInviteBody = await verifyInviteRes.json();
    expect(verifyInviteBody.data.invitation.email).toBe(invitedEmail);
    expect(verifyInviteBody.data.invitation.name).toBe(contactName);

    // 3. Complete account activation
    const centreUserPassword = 'CentrePortalPassword2026!';
    const activateRes = await fetch(`${baseUrl}/auth/activate-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: inviteToken,
        password: centreUserPassword,
        confirmPassword: centreUserPassword,
      }),
    });

    expect(activateRes.status).toBe(200);
    const activateBody = await activateRes.json();
    expect(activateBody.success).toBe(true);
    expect(activateBody.data.message).toBeDefined();

    // 4. Invitation token cannot be reused
    const reuseInviteRes = await fetch(`${baseUrl}/auth/activate-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: inviteToken,
        password: 'AnotherPassword123!',
        confirmPassword: 'AnotherPassword123!',
      }),
    });
    expect(reuseInviteRes.status).toBe(400);

    // 5. Newly activated centre user can log in
    const centreLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: invitedEmail,
        password: centreUserPassword,
      }),
    });
    expect(centreLoginRes.status).toBe(200);
    const centreLoginBody = await centreLoginRes.json();
    expect(centreLoginBody.data.user.role).toBe('CENTRE');
  }, 25000);

  // ── TEST 10: Role Hierarchy & Security Boundaries ─────────────────────────
  it('10. Role-based security guards: PM cannot access /admin/users', async () => {
    const res = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${pmToken}` },
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('11. Allowed Email Domains API is accessible to Admin', async () => {
    const res = await fetch(`${baseUrl}/admin/allowed-domains`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    const domains = body.data.map((d: any) => d.domain);
    expect(domains).toContain('oemportal.in');
    expect(domains).toContain('assessinfra.com');
  });
});

