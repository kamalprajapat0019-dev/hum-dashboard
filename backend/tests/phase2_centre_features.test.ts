import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import crypto from 'crypto';

describe('Phase 2: Centre Module, 72h Invite, State Machine & Nested Hierarchy Audit', () => {
  let server: Server;
  let baseUrl: string;
  let adminToken: string;
  let adminUserId: string;
  let pmToken: string;
  let pmUserId: string;
  let centreToken: string;
  let centreUserId: string;
  let testCentreId: string;
  let inviteToken: string;
  let invitedCentreUserToken: string;

  beforeAll(async () => {
    // 1. Start server on dynamic port
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://localhost:${addr.port}/api/v1`;
        }
        resolve();
      });
    });

    // 2. Login Admin
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

    // 3. Create & Login PM User
    const bcrypt = await import('bcryptjs');
    const pmHash = await bcrypt.default.hash('pm_pass_123', 10);
    const pmEmail = `pm.phase2.${Date.now()}@oemportal.in`;
    const pmUser = await prisma.user.create({
      data: {
        email: pmEmail,
        passwordHash: pmHash,
        name: 'Project Manager Phase 2',
        role: 'PM',
        status: 'Active',
      },
    });
    pmUserId = pmUser.id;

    const pmLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pmEmail, password: 'pm_pass_123' }),
    });
    pmToken = (await pmLoginRes.json()).data.token;

    // 4. Create & Login Centre User
    const centreHash = await bcrypt.default.hash('centre_pass_123', 10);
    const centreEmail = `centre.phase2.${Date.now()}@oemportal.in`;
    const cUser = await prisma.user.create({
      data: {
        email: centreEmail,
        passwordHash: centreHash,
        name: 'Centre User Phase 2',
        role: 'CENTRE',
        status: 'Active',
      },
    });
    centreUserId = cUser.id;

    const centreLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: centreEmail, password: 'centre_pass_123' }),
    });
    centreToken = (await centreLoginRes.json()).data.token;
  });

  afterAll(async () => {
    if (testCentreId) {
      await prisma.centreMediaAsset.deleteMany({ where: { centreId: testCentreId } }).catch(() => {});
      await prisma.centreSubmoduleReview.deleteMany({ where: { centreId: testCentreId } }).catch(() => {});
      await prisma.centreLab.deleteMany({ where: { centreId: testCentreId } }).catch(() => {});
      await prisma.centreFloor.deleteMany({ where: { centreId: testCentreId } }).catch(() => {});
      await prisma.centreBuilding.deleteMany({ where: { centreId: testCentreId } }).catch(() => {});
      await prisma.auditLog.deleteMany({ where: { entityId: testCentreId } }).catch(() => {});
      await prisma.centre.deleteMany({ where: { id: testCentreId } }).catch(() => {});
    }
    if (pmUserId) {
      await prisma.user.deleteMany({ where: { id: pmUserId } }).catch(() => {});
    }
    if (centreUserId) {
      await prisma.user.deleteMany({ where: { id: centreUserId } }).catch(() => {});
    }
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // ── A. 72-Hour Sign-Up Link, OTP Verification & Account Activation ────────

  it('1. Admin: Generates 72-hour sign-up invite link with WhatsApp number', async () => {
    const invitePayload = {
      email: `invited.centre.${Date.now()}@testoem.in`,
      name: 'Dr. Vivek Agnihotri',
      whatsappNumber: '9812345678',
      role: 'CENTRE',
    };

    const res = await fetch(`${baseUrl}/centre/invite-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(invitePayload),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.invitation.whatsappNumber).toBe('9812345678');
    expect(body.data.invitation.status).toBe('Pending');

    const expiresAt = new Date(body.data.invitation.expiresAt);
    const diffHours = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(70);
    expect(diffHours).toBeLessThanOrEqual(72);

    inviteToken = body.data.invitation.token;
  });

  it('2. Public: Validates invite token successfully before registration', async () => {
    const res = await fetch(`${baseUrl}/auth/invite/validate/${inviteToken}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.valid).toBe(true);
    expect(body.data.invitation.whatsappNumber).toBe('9812345678');
  });

  it('3. Centre User: Registers from invite, creates Centre + User in Inactive status', async () => {
    // Read the invited email from invitation record
    const inv = await prisma.userInvitation.findUnique({ where: { token: inviteToken } });

    const registerPayload = {
      token: inviteToken,
      centreName: 'St. Xavier CBT Examination Center',
      mobile: '9812345678',
      email: inv!.email,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      termsAccepted: true,
    };

    const res = await fetch(`${baseUrl}/auth/invite/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.requiresOtp).toBe(true);
    expect(body.data.centreCode).toMatch(/^CTR-\d{4}-\d{4,}$/);

    // Verify user cannot log in before verifying OTP
    const preVerifyLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inv!.email, password: 'SecurePassword123!' }),
    });
    expect(preVerifyLogin.status).toBe(401);
    const preVerifyBody = await preVerifyLogin.json();
    expect(preVerifyBody.error?.code).toBe('ACCOUNT_INACTIVE');
  });

  it('4. Public: Verifies Email OTP and WhatsApp Mobile OTP, activating the account', async () => {
    // 1. Verify email OTP
    const emailRes = await fetch(`${baseUrl}/auth/invite/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: inviteToken,
        otpType: 'EMAIL',
        otpCode: '123456',
      }),
    });
    expect(emailRes.status).toBe(200);
    const emailBody = await emailRes.json();
    expect(emailBody.success).toBe(true);
    expect(emailBody.data.verified).toBe(true);

    // 2. Verify mobile OTP
    const mobileRes = await fetch(`${baseUrl}/auth/invite/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: inviteToken,
        otpType: 'MOBILE',
        otpCode: '654321',
      }),
    });
    expect(mobileRes.status).toBe(200);
    const mobileBody = await mobileRes.json();
    expect(mobileBody.success).toBe(true);
    expect(mobileBody.data.isFullyActivated).toBe(true);

    // 3. User can now successfully login!
    const inv = await prisma.userInvitation.findUnique({ where: { token: inviteToken } });
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inv!.email, password: 'SecurePassword123!' }),
    });
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody.success).toBe(true);
    expect(loginBody.data.token).toBeDefined();
    invitedCentreUserToken = loginBody.data.token;
  });

  // ── B. Nested Building -> Floor -> Lab Draft Persistence ──────────────────

  it('5. Centre User: Saves draft with nested buildings, floors, and labs hierarchy', async () => {
    const nestedDraftPayload = {
      centreName: 'St. Xavier Advanced CBT Campus',
      centreCategory: 'Autonomous College',
      customCentreCategory: 'Grade A++ Accredited',
      district: 'Gautam Buddha Nagar',
      taluka: 'Dadri',
      centreAddress: 'Knowledge Park III, Greater Noida',
      stateName: 'Uttar Pradesh',
      cityName: 'Greater Noida',
      pincode: '201310',
      totalNodes: 350,
      actualNodes: 350,
      examNodes: 300,
      contacts: [
        {
          personType: 'Owner',
          fullName: 'Rev. Fr. Augustine',
          contactNumber: '9812345678',
          aadhaarNumber: '998877665544',
        },
      ],
      infrastructure: {
        electricityProvider: 'NPCL Noida Power Company Limited',
        sanctionedLoadKw: 75.5,
        upsAvailable: true,
        upsCapacityKva: 50,
        gensetAvailable: true,
        gensetCapacityKva: 80,
        primaryIspName: 'Airtel Enterprise Fiber',
        primaryIspBandwidthMbps: 500,
        networkAdminsCount: 3,
        medicalFacilityNearby: true,
        nearestHospitalDistanceKm: 1.5,
        doctorOnCall: true,
      },
      buildings: [
        {
          buildingName: 'Academic Block A',
          buildingOrder: 1,
          noOfFloors: 2,
          receptionPresent: true,
          liftAvailable: true,
          floors: [
            {
              floorName: 'Ground Floor',
              floorOrder: 1,
              noOfLabs: 1,
              washroomsAvailable: true,
              totalWashrooms: 4,
              acAvailable: true,
              labs: [
                {
                  labName: 'Lab 101 - Primary Exam Lab',
                  labOrder: 1,
                  totalNodes: 150,
                  examNodes: 130,
                  workingNodes: 150,
                  pwdSuitable: true,
                  partitionAvailable: true,
                  partitionType: 'Full Wood Partition with Acrylic Shield',
                  canFormatSystems: true,
                  canChangeIp: true,
                  upsAvailable: true,
                  cctvAvailable: true,
                  cctvCount: 6,
                },
              ],
            },
            {
              floorName: 'First Floor',
              floorOrder: 2,
              noOfLabs: 1,
              washroomsAvailable: true,
              totalWashrooms: 4,
              acAvailable: true,
              labs: [
                {
                  labName: 'Lab 201 - Secondary CBT Lab',
                  labOrder: 1,
                  totalNodes: 200,
                  examNodes: 170,
                  workingNodes: 200,
                  pwdSuitable: false,
                  partitionAvailable: true,
                  upsAvailable: true,
                  cctvAvailable: true,
                  cctvCount: 8,
                },
              ],
            },
          ],
        },
      ],
    };

    const res = await fetch(`${baseUrl}/centre/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invitedCentreUserToken}`,
      },
      body: JSON.stringify(nestedDraftPayload),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.centreCode).toMatch(/^CTR-\d{4}-\d{4,}$/);
    testCentreId = body.data.id;
  });

  it('6. Centre User: GET /my-centre retrieves nested hierarchy, masked Aadhaar & lean queries', async () => {
    const res = await fetch(`${baseUrl}/centre/my-centre`, {
      headers: { Authorization: `Bearer ${invitedCentreUserToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(testCentreId);

    // Masked Aadhaar check (XXXX-XXXX-5544)
    expect(body.data.contacts[0].aadhaarNumber).toBe('XXXX-XXXX-5544');

    // Nested hierarchy verification
    expect(body.data.buildings.length).toBe(1);
    expect(body.data.buildings[0].buildingName).toBe('Academic Block A');
    expect(body.data.buildings[0].floors.length).toBe(2);
    expect(body.data.buildings[0].floors[0].floorName).toBe('Ground Floor');
    expect(body.data.buildings[0].floors[0].labs.length).toBe(1);
    expect(body.data.buildings[0].floors[0].labs[0].labName).toBe('Lab 101 - Primary Exam Lab');
    expect(body.data.buildings[0].floors[0].labs[0].partitionType).toBe(
      'Full Wood Partition with Acrylic Shield'
    );
  });

  // ── C. Media Asset Upload, Validation, Replacement & Download ─────────────

  it('7. Centre User: Uploads photo media asset with validation, versioning & replace tracking', async () => {
    const sampleJpegBase64 =
      'data:image/jpeg;base64,' +
      Buffer.from('Fake JPEG Photo Content for Centre Gate').toString('base64');

    const uploadPayload = {
      entityType: 'CENTRE',
      entityId: testCentreId,
      fieldKey: 'centre_main_gate_photo',
      assetCategory: 'PHOTO',
      fileName: 'main_gate_v1.jpg',
      fileUrl: sampleJpegBase64,
      fileSize: 1024,
      mimeType: 'image/jpeg',
    };

    const res = await fetch(`${baseUrl}/centre/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invitedCentreUserToken}`,
      },
      body: JSON.stringify(uploadPayload),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.version).toBe(1);
    expect(body.data.isActive).toBe(true);
    expect(body.data.fieldKey).toBe('centre_main_gate_photo');

    const assetId = body.data.id;

    // Now re-upload (replace) with version 2
    const replacePayload = {
      ...uploadPayload,
      fileName: 'main_gate_v2_higher_res.jpg',
    };

    const replaceRes = await fetch(`${baseUrl}/centre/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invitedCentreUserToken}`,
      },
      body: JSON.stringify(replacePayload),
    });

    expect(replaceRes.status).toBe(201);
    const replaceBody = await replaceRes.json();
    expect(replaceBody.data.version).toBe(2);
    expect(replaceBody.data.isActive).toBe(true);
    expect(replaceBody.data.replacedById).toBe(assetId);

    // Verify secure download endpoint
    const downloadRes = await fetch(`${baseUrl}/centre/media/${replaceBody.data.id}`, {
      headers: { Authorization: `Bearer ${invitedCentreUserToken}` },
    });
    expect(downloadRes.status).toBe(200);
    const downloadBody = await downloadRes.json();
    expect(downloadBody.data.downloadUrl).toBeDefined();
  });

  // ── D. Submodule & Section State Machine & Role Restrictions ──────────────

  it('8. Auditor/Ops: Can flag a section for rework with mandatory reason', async () => {
    const reworkPayload = {
      submoduleKey: 'BUILDING_INFRA',
      sectionKey: 'LAB_1',
      status: 'REWORK_REQUIRED',
      reworkReason: 'Lab 101 partitions must be at least 1.5ft high for privacy.',
      centreId: testCentreId,
    };

    const res = await fetch(`${baseUrl}/centre/submodules/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(reworkPayload),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('REWORK_REQUIRED');
    expect(body.data.reworkReason).toContain('partitions must be at least 1.5ft high');

    // Verify centre status is now 'Rework Required'
    const statusRes = await fetch(`${baseUrl}/centre/status`, {
      headers: { Authorization: `Bearer ${invitedCentreUserToken}` },
    });
    const statusBody = await statusRes.json();
    expect(statusBody.data.status).toBe('Rework Required');
    expect(statusBody.data.submodules.reworkRequired).toBe(1);
  });

  it('9. Non-PM/Admin role is FORBIDDEN from setting VERIFIED status on submodule', async () => {
    // Centre User attempts to verify own submodule -> Forbidden
    const res = await fetch(`${baseUrl}/centre/submodules/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invitedCentreUserToken}`,
      },
      body: JSON.stringify({
        submoduleKey: 'BUILDING_INFRA',
        sectionKey: 'LAB_1',
        status: 'VERIFIED',
      }),
    });

    expect(res.status).toBe(403);
  });

  it('10. PM/Admin: Can verify submodule during final review approval', async () => {
    const verifyPayload = {
      submoduleKey: 'BUILDING_INFRA',
      sectionKey: 'LAB_1',
      status: 'VERIFIED',
      centreId: testCentreId,
    };

    const res = await fetch(`${baseUrl}/centre/submodules/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pmToken}`,
      },
      body: JSON.stringify(verifyPayload),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('VERIFIED');
    expect(body.data.pmApprovedById).toBe(pmUserId);
  });
});
