import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('OEMP Centre Master & Centre Registration Workflow Audit', () => {
  let server: Server;
  let baseUrl: string;
  let adminToken: string;
  let adminUserId: string;
  let centreToken: string;
  let centreUserId: string;
  let testCentreId: string;
  let testCentreCode: string;

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

    // 3. Create or provision a Centre User for testing
    const testCentreEmail = `centre.test.${Date.now()}@oemportal.in`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.default.hash('centre_secure_pass_123', 10);

    const centreUser = await prisma.user.create({
      data: {
        email: testCentreEmail,
        passwordHash,
        name: 'Apex Test Centre Head',
        role: 'CENTRE',
        status: 'Active',
      },
    });
    centreUserId = centreUser.id;

    // Login as Centre User
    const centreLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCentreEmail,
        password: 'centre_secure_pass_123',
      }),
    });
    const centreLoginBody = await centreLoginRes.json();
    centreToken = centreLoginBody.data.token;
  });

  afterAll(async () => {
    // Cleanup created test records
    if (testCentreId) {
      await prisma.auditAssignment.deleteMany({ where: { centreId: testCentreId } }).catch(() => {});
      await prisma.auditLog.deleteMany({ where: { entityId: testCentreId } }).catch(() => {});
      await prisma.centre.deleteMany({ where: { id: testCentreId } }).catch(() => {});
    }
    if (centreUserId) {
      await prisma.user.deleteMany({ where: { id: centreUserId } }).catch(() => {});
    }
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // ── Phase 1: Centre Portal Registration ───────────────────────────────────

  it('1. Centre User: Can save Step 1-7 Draft with auto-generated Centre ID (CTR-2026-XXXX)', async () => {
    const draftPayload = {
      centreName: 'Apex Institute of Computer Technology',
      centreCategory: 'College',
      regionId: 'North',
      centreAddress: 'Plot 45, Institutional Area, Sector 62, Noida - 201309',
      stateName: 'Uttar Pradesh',
      cityName: 'Noida',
      pincode: '201309',
      totalNodes: 250,
      previousExamConducted: true,
      previousEduExam: 'UGC NET 2024, JEE Main 2025',
      officialEmail: 'apex.cbt@gmail.com',
      officialMobile: '9876543210',
      organizationType: 'Trust',
      contacts: [
        {
          personType: 'Owner',
          fullName: 'Dr. Ramesh Sharma',
          contactNumber: '9876543210',
          email: 'ramesh.sharma@apex.edu.in',
          aadhaarNumber: '123456789012',
          permanentAddress: 'B-14 Sector 44, Noida',
        },
        {
          personType: 'Centre CS',
          fullName: 'Prof. Sunita Verma',
          contactNumber: '9876543211',
          email: 'sunita@apex.edu.in',
        },
        {
          personType: 'IT Person',
          fullName: 'Amit Kumar',
          contactNumber: '9876543212',
          email: 'it.amit@apex.edu.in',
        },
        {
          personType: 'Electrician',
          fullName: 'Mohan Lal',
          contactNumber: '9876543213',
        },
      ],
      infrastructure: {
        noOfFloors: 3,
        buildingType: 'Educational Institution Building',
        noOfLifts: 2,
        noOfEntryGates: 2,
        noOfExitGates: 2,
        noOfCctvCameras: 24,
        cctvLobby: true,
        upsAvailable: true,
        upsCapacityKva: 30,
        gensetAvailable: true,
        gensetCapacityKva: 60,
        coreSwitch1Gbps: true,
        lanType: 'Single LAN',
        noOfFireExtinguishers: 8,
        firstAidKit: true,
        adequateHygiene: true,
      },
      bankAccount: {
        accountName: 'Apex Institute of Computer Technology',
        bankName: 'State Bank of India',
        branchName: 'Sector 62 Noida Branch',
        accountNumber: '30998877665',
        confirmAccountNumber: '30998877665',
        ifscCode: 'SBIN0004567',
        accountType: 'Current Account',
      },
    };

    const res = await fetch(`${baseUrl}/centre/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${centreToken}`,
      },
      body: JSON.stringify(draftPayload),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.centreCode).toMatch(/^CTR-\d{4}-\d{4}$/);
    expect(body.data.centreStatus).toBe('Draft');

    testCentreId = body.data.id;
    testCentreCode = body.data.centreCode;
  });

  it('2. Centre User: Can retrieve own centre with masked bank details (XXXX XXXX 7665)', async () => {
    const res = await fetch(`${baseUrl}/centre/my-centre`, {
      headers: { Authorization: `Bearer ${centreToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(testCentreId);
    expect(body.data.centreName).toBe('Apex Institute of Computer Technology');
    expect(body.data.bankAccount.accountNumber).toBe('XXXX XXXX 7665');
  });

  it('3. Centre User: Can upload required documents with validation', async () => {
    const testDocPayload = {
      documentType: 'current_electricity_bill',
      documentName: 'Current Electricity Bill',
      fileName: 'electricity_bill_oct2026.pdf',
      fileUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==',
      fileSize: 1024,
      mimeType: 'application/pdf',
    };

    const res = await fetch(`${baseUrl}/centre/documents/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${centreToken}`,
      },
      body: JSON.stringify(testDocPayload),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.documentType).toBe('current_electricity_bill');
    expect(body.data.status).toBe('Pending');
  });

  it('4. Centre User: Bank ownership validation blocks duplicate bank account', async () => {
    // Attempt to register another centre with identical account number
    const otherUserEmail = `other.user.${Date.now()}@oemportal.in`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.default.hash('pass123', 10);
    const otherUser = await prisma.user.create({
      data: { email: otherUserEmail, passwordHash, name: 'Other User', role: 'CENTRE', status: 'Active' },
    });

    const otherLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otherUserEmail, password: 'pass123' }),
    });
    const otherToken = (await otherLogin.json()).data.token;

    // Save draft with duplicate account
    await fetch(`${baseUrl}/centre/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherToken}` },
      body: JSON.stringify({
        centreName: 'Different Centre Name',
        centreCategory: 'School',
        centreAddress: 'Address 123',
        stateName: 'Delhi',
        cityName: 'Delhi',
        pincode: '110001',
        totalNodes: 50,
        bankAccount: {
          accountName: 'Different Name',
          bankName: 'SBI',
          branchName: 'Branch',
          accountNumber: '30998877665', // duplicate
          ifscCode: 'SBIN0004567',
        },
      }),
    });

    // Submitting with duplicate account must fail
    const submitRes = await fetch(`${baseUrl}/centre/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherToken}` },
    });

    expect(submitRes.status).toBe(400);
    const submitBody = await submitRes.json();
    expect(submitBody.success).toBe(false);
    expect(submitBody.error?.message).toContain('already associated with another centre');

    // Clean up other user
    const otherCentre = await prisma.centre.findFirst({ where: { userId: otherUser.id } });
    if (otherCentre) await prisma.centre.delete({ where: { id: otherCentre.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });

  // ── Phase 2: Admin Dashboard Centre Master ────────────────────────────────

  it('5. Admin Centre Master: Summary Cards endpoint returns 4 status groupings dynamically', async () => {
    const res = await fetch(`${baseUrl}/admin/centres/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.card1).toBeDefined(); // All & Ready to Book
    expect(body.data.card2).toBeDefined(); // Invited & Booked
    expect(body.data.card3).toBeDefined(); // Auditor Assigned & Audited
    expect(body.data.card4).toBeDefined(); // Rejected & Blacklisted
    expect(typeof body.data.card1.all).toBe('number');
  });

  it('6. Admin Centre Master: Listing table returns centres with continuous pagination', async () => {
    const res = await fetch(`${baseUrl}/admin/centres?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(10);
  });

  it('7. Admin Centre Master: Can view complete 8-tab Centre Profile with activity history', async () => {
    const res = await fetch(`${baseUrl}/admin/centres/${testCentreId}/profile`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.centreName).toBe('Apex Institute of Computer Technology');
    expect(body.data.infrastructure).toBeDefined();
    expect(body.data.bankAccount).toBeDefined();
    expect(body.data.contacts.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(body.data.activityHistory)).toBe(true);
  });

  it('8. Admin Centre Master: Can verify uploaded documents with remarks', async () => {
    // Get doc id
    const centreRec = await prisma.centre.findUnique({
      where: { id: testCentreId },
      include: { documents: true },
    });
    const docId = centreRec!.documents[0].id;

    const res = await fetch(`${baseUrl}/admin/centres/${testCentreId}/verify-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        documentId: docId,
        status: 'Verified',
        remarks: 'Electricity bill verified against discom record.',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('Verified');
    expect(body.data.verifiedBy).toBe('admin@oemportal.in');
  });

  it('9. Admin Centre Master: Can approve centre application (sets status to Ready to Book)', async () => {
    const res = await fetch(`${baseUrl}/admin/centres/${testCentreId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ remarks: 'All infrastructure criteria satisfied.' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.centreStatus).toBe('Ready to Book');
  });

  it('10. Admin Centre Master: Rejecting application requires mandatory reason', async () => {
    // Attempt without reason -> must fail 400
    const failRes = await fetch(`${baseUrl}/admin/centres/${testCentreId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: '' }),
    });

    expect(failRes.status).toBe(400);

    // Provide valid reason
    const okRes = await fetch(`${baseUrl}/admin/centres/${testCentreId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: 'Fire clearance document illegible and expired.' }),
    });

    expect(okRes.status).toBe(200);
    const okBody = await okRes.json();
    expect(okBody.success).toBe(true);
    expect(okBody.data.centreStatus).toBe('Rejected');
    expect(okBody.data.rejectionReason).toBe('Fire clearance document illegible and expired.');
  });

  it('11. Admin Centre Master: Can verify bank details and set isPaymentEligible', async () => {
    const res = await fetch(`${baseUrl}/admin/centres/${testCentreId}/verify-bank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'Verified',
        remarks: 'Cancelled cheque verified with IFSC matching SBI branch.',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.verificationStatus).toBe('Verified');
    expect(body.data.isPaymentEligible).toBe(true);
  });

  it('12. Admin Centre Master: Can assign auditor and transition to Auditor Assigned', async () => {
    // Find an auditor user
    let auditor = await prisma.user.findFirst({ where: { role: 'AUDITOR' } });
    if (!auditor) {
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.default.hash('auditor_pass_123', 10);
      auditor = await prisma.user.create({
        data: {
          email: `auditor.${Date.now()}@oemportal.in`,
          passwordHash: hash,
          name: 'Certified Auditor',
          role: 'AUDITOR',
          status: 'Active',
        },
      });
    }

    const res = await fetch(`${baseUrl}/admin/centres/${testCentreId}/assign-auditor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        auditorId: auditor.id,
        auditDate: '2026-04-15',
        remarks: 'Physical premises, network and fire safety audit.',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.centre?.centreStatus || body.data.centreStatus).toBe('Auditor Assigned');
    expect(body.data.assignment).toBeDefined();
  });

  it('13. Workflow Transitions: Can transition through all OEMP statuses via status endpoint', async () => {
    const statuses = ['Invited', 'Booked', 'Audited', 'Allocated', 'Ready to Book', 'Blacklisted'];

    for (const st of statuses) {
      const res = await fetch(`${baseUrl}/admin/centres/${testCentreId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: st, reason: `Status transition test for ${st}` }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.centreStatus).toBe(st);
    }
  });

  it('14. Duplicate / Illegal Submission: Submitting an already approved centre throws error', async () => {
    // First approve
    await fetch(`${baseUrl}/admin/centres/${testCentreId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ remarks: 'Approved' }),
    });

    // Centre user attempts to submit again
    const res = await fetch(`${baseUrl}/centre/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${centreToken}` },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error?.message).toContain('already approved');
  });

  it('15. Security & RBAC: Centre User is strictly FORBIDDEN (403) from Admin Centre Master', async () => {
    const res = await fetch(`${baseUrl}/admin/centres`, {
      headers: { Authorization: `Bearer ${centreToken}` },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe('FORBIDDEN');
  });

  it('16. Unauthenticated requests are rejected with 401 UNAUTHORIZED', async () => {
    const res = await fetch(`${baseUrl}/admin/centres`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe('UNAUTHORIZED');
  });
});
