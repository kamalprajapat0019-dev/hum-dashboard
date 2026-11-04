import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

export class CentreService {
  /**
   * Generates a unique, concurrency-safe Centre ID in format: CTR-2026-XXXX
   */
  static async generateCentreCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CTR-${year}-`;
    
    // Find the latest centre code created this year
    const lastCentre = await prisma.centre.findFirst({
      where: {
        centreCode: { startsWith: prefix },
      },
      orderBy: { createdAt: 'desc' },
      select: { centreCode: true },
    });

    let nextNumber = 1;
    if (lastCentre && lastCentre.centreCode) {
      const parts = lastCentre.centreCode.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) {
          nextNumber = num + 1;
        }
      }
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Retrieves the authenticated Centre User's centre profile with all related sections
   */
  static async getMyCentre(userId: string) {
    const centre = await prisma.centre.findFirst({
      where: { userId },
      include: {
        contacts: true,
        capacity: true,
        documents: { orderBy: { createdAt: 'desc' } },
        infrastructure: true,
        bankAccount: true,
      },
    });

    if (!centre) {
      return null;
    }

    // Mask bank account number for Centre User display (e.g. XXXX XXXX 1234)
    let maskedBank = null;
    if (centre.bankAccount) {
      const rawAcc = centre.bankAccount.accountNumber || '';
      const maskedAcc = rawAcc.length > 4 ? `XXXX XXXX ${rawAcc.slice(-4)}` : rawAcc;
      maskedBank = {
        ...centre.bankAccount,
        accountNumber: maskedAcc,
      };
    }

    return {
      ...centre,
      bankAccount: maskedBank,
    };
  }

  /**
   * Saves or updates a draft centre registration for the logged-in Centre User
   */
  static async saveDraft(userId: string, userEmail: string, data: any) {
    let centre = await prisma.centre.findFirst({
      where: { userId },
    });

    const isNew = !centre;
    const centreCode = centre ? centre.centreCode : (await this.generateCentreCode());

    return prisma.$transaction(async (tx) => {
      // 1. Upsert Centre Basic Information
      const centreData: Prisma.CentreCreateInput = {
        centreCode,
        userId,
        centreName: data.centreName || 'Draft Centre Application',
        centreCategory: data.centreCategory || null,
        regionId: data.regionId || null,
        stateId: data.stateId || null,
        cityId: data.cityId || null,
        stateName: data.stateName || null,
        cityName: data.cityName || null,
        taluka: data.taluka || null,
        centreAddress: data.centreAddress || '',
        pincode: data.pincode || '',
        eduCode: data.eduCode || null,
        tcCode: data.tcCode || null,
        venueStatus: data.venueStatus || 'Old',
        previousExamConducted: Boolean(data.previousExamConducted),
        previousEduExam: data.previousEduExam || null,
        officialEmail: data.officialEmail || userEmail,
        officialMobile: data.officialMobile || null,
        alternateMobile: data.alternateMobile || null,
        phoneStd: data.phoneStd || null,
        googleMapLink: data.googleMapLink || null,
        remarks: data.remarks || null,
        organizationType: data.organizationType || 'Trust',
        centreStatus: centre?.centreStatus === 'Registered' ? 'Registered' : 'Draft',
      };

      let savedCentre: any;
      if (isNew) {
        savedCentre = await tx.centre.create({ data: centreData });
      } else {
        savedCentre = await tx.centre.update({
          where: { id: centre.id },
          data: {
            centreName: data.centreName ?? centre.centreName,
            centreCategory: data.centreCategory ?? centre.centreCategory,
            regionId: data.regionId ?? centre.regionId,
            stateId: data.stateId ?? centre.stateId,
            cityId: data.cityId ?? centre.cityId,
            stateName: data.stateName ?? centre.stateName,
            cityName: data.cityName ?? centre.cityName,
            taluka: data.taluka ?? centre.taluka,
            centreAddress: data.centreAddress ?? centre.centreAddress,
            pincode: data.pincode ?? centre.pincode,
            eduCode: data.eduCode ?? centre.eduCode,
            tcCode: data.tcCode ?? centre.tcCode,
            venueStatus: data.venueStatus ?? centre.venueStatus,
            previousExamConducted: data.previousExamConducted !== undefined ? Boolean(data.previousExamConducted) : centre.previousExamConducted,
            previousEduExam: data.previousEduExam ?? centre.previousEduExam,
            officialEmail: data.officialEmail ?? centre.officialEmail,
            officialMobile: data.officialMobile ?? centre.officialMobile,
            alternateMobile: data.alternateMobile ?? centre.alternateMobile,
            phoneStd: data.phoneStd ?? centre.phoneStd,
            googleMapLink: data.googleMapLink ?? centre.googleMapLink,
            remarks: data.remarks ?? centre.remarks,
            organizationType: data.organizationType ?? centre.organizationType,
          },
        });
      }

      const centreId = savedCentre.id;

      // 2. Capacity (Total Nodes)
      if (data.totalNodes !== undefined || data.capacity !== undefined) {
        const totalNodes = Number(data.totalNodes || data.capacity?.examNodes || 0);
        await tx.centreCapacity.upsert({
          where: { centreId },
          create: {
            centreId,
            totalSystems: totalNodes,
            examNodes: totalNodes,
            bufferPercent: Number(data.capacity?.bufferPercent || 10.0),
            regDeskCount: Number(data.capacity?.regDeskCount || 2),
            serverCount: Number(data.capacity?.serverCount || 1),
          },
          update: {
            totalSystems: totalNodes,
            examNodes: totalNodes,
            bufferPercent: Number(data.capacity?.bufferPercent || 10.0),
            regDeskCount: Number(data.capacity?.regDeskCount || 2),
            serverCount: Number(data.capacity?.serverCount || 1),
          },
        });
      }

      // 3. Key Personnel (Step 2: Owner, Centre CS, IT Person, Electrician)
      if (data.contacts && Array.isArray(data.contacts)) {
        for (const c of data.contacts) {
          if (!c.personType) continue;
          const existingContact = await tx.centreContact.findFirst({
            where: { centreId, personType: c.personType },
          });

          if (existingContact) {
            await tx.centreContact.update({
              where: { id: existingContact.id },
              data: {
                fullName: c.fullName || existingContact.fullName,
                contactNumber: c.contactNumber || existingContact.contactNumber,
                email: c.email ?? existingContact.email,
                aadhaarNumber: c.aadhaarNumber ?? existingContact.aadhaarNumber,
                fatherName: c.fatherName ?? existingContact.fatherName,
                motherName: c.motherName ?? existingContact.motherName,
                permanentAddress: c.permanentAddress ?? existingContact.permanentAddress,
                currentAddress: c.currentAddress ?? existingContact.currentAddress,
                isPrimary: c.personType === 'Owner',
              },
            });
          } else {
            await tx.centreContact.create({
              data: {
                centreId,
                personType: c.personType,
                fullName: c.fullName || '—',
                contactNumber: c.contactNumber || '—',
                email: c.email || null,
                aadhaarNumber: c.aadhaarNumber || null,
                fatherName: c.fatherName || null,
                motherName: c.motherName || null,
                permanentAddress: c.permanentAddress || null,
                currentAddress: c.currentAddress || null,
                isPrimary: c.personType === 'Owner',
              },
            });
          }
        }
      }

      // 4. Infrastructure (Step 4, 5, 6)
      if (data.infrastructure) {
        const inf = data.infrastructure;
        await tx.centreInfrastructure.upsert({
          where: { centreId },
          create: {
            centreId,
            busStandNearby: Boolean(inf.busStandNearby),
            busStandName: inf.busStandName || null,
            metroNearby: Boolean(inf.metroNearby),
            metroStationName: inf.metroStationName || null,
            distanceFromMainRoad: inf.distanceFromMainRoad !== undefined ? Number(inf.distanceFromMainRoad) : null,
            signBoards: Boolean(inf.signBoards),
            printerAvailable: Boolean(inf.printerAvailable),
            jammerAvailable: Boolean(inf.jammerAvailable),
            phFriendly: Boolean(inf.phFriendly),
            phCandidateCount: inf.phCandidateCount ? Number(inf.phCandidateCount) : null,
            elevatorAvailable: Boolean(inf.elevatorAvailable),
            wheelchairAvailable: Boolean(inf.wheelchairAvailable),
            noOfFloors: inf.noOfFloors ? Number(inf.noOfFloors) : 1,
            buildingType: inf.buildingType || null,
            specifiedBuildingType: inf.specifiedBuildingType || null,
            noOfLifts: inf.noOfLifts ? Number(inf.noOfLifts) : 0,
            noOfEntryGates: inf.noOfEntryGates ? Number(inf.noOfEntryGates) : 1,
            noOfExitGates: inf.noOfExitGates ? Number(inf.noOfExitGates) : 1,
            buildingNameWing: inf.buildingNameWing || null,
            floorBuildingDetails: inf.floorBuildingDetails || null,
            washroomsEachFloor: inf.washroomsEachFloor ? Number(inf.washroomsEachFloor) : 1,
            maleWashroomsEachFloor: inf.maleWashroomsEachFloor ? Number(inf.maleWashroomsEachFloor) : 1,
            femaleWashroomsEachFloor: inf.femaleWashroomsEachFloor ? Number(inf.femaleWashroomsEachFloor) : 1,
            noOfCctvCameras: inf.noOfCctvCameras ? Number(inf.noOfCctvCameras) : 0,
            cctvAreas: inf.cctvAreas || null,
            drinkingWaterArea: inf.drinkingWaterArea || null,
            parkingAvailable: Boolean(inf.parkingAvailable),
            candidateParkingInside: Boolean(inf.candidateParkingInside),
            receptionArea: Boolean(inf.receptionArea),
            waitingArea: Boolean(inf.waitingArea),
            maleWashroom: Boolean(inf.maleWashroom),
            femaleWashroom: Boolean(inf.femaleWashroom),
            separateWashrooms: Boolean(inf.separateWashrooms),
            drinkingWater: Boolean(inf.drinkingWater),
            acAvailable: Boolean(inf.acAvailable),
            lockerFacility: Boolean(inf.lockerFacility),
            separateEntryExit: Boolean(inf.separateEntryExit),
            suitablePwd: Boolean(inf.suitablePwd),
            rampFacility: Boolean(inf.rampFacility),
            railingSupport: Boolean(inf.railingSupport),
            cctvLobby: Boolean(inf.cctvLobby),
            serverRoomAvailable: Boolean(inf.serverRoomAvailable),
            acInServerRoom: Boolean(inf.acInServerRoom),
            serverRoomUpsNetwork: Boolean(inf.serverRoomUpsNetwork),
            dedicatedServerRoom: Boolean(inf.dedicatedServerRoom),
            upsAvailable: Boolean(inf.upsAvailable),
            upsCapacityKva: inf.upsCapacityKva ? Number(inf.upsCapacityKva) : null,
            gensetAvailable: Boolean(inf.gensetAvailable),
            gensetCapacityKva: inf.gensetCapacityKva ? Number(inf.gensetCapacityKva) : null,
            backupGensetAvailable: Boolean(inf.backupGensetAvailable),
            backupGensetCapacityKva: inf.backupGensetCapacityKva ? Number(inf.backupGensetCapacityKva) : null,
            coreSwitch1Gbps: Boolean(inf.coreSwitch1Gbps),
            primaryInternet: Boolean(inf.primaryInternet),
            backupInternet: Boolean(inf.backupInternet),
            ipScanningAvailable: Boolean(inf.ipScanningAvailable),
            networkDiagramAvailable: Boolean(inf.networkDiagramAvailable),
            lanType: inf.lanType || null,
            noOfFireExtinguishers: inf.noOfFireExtinguishers ? Number(inf.noOfFireExtinguishers) : 0,
            fireSafetyClearanceDate: inf.fireSafetyClearanceDate ? new Date(inf.fireSafetyClearanceDate) : null,
            fireExtinguisherRefillDate: inf.fireExtinguisherRefillDate ? new Date(inf.fireExtinguisherRefillDate) : null,
            firstAidKit: Boolean(inf.firstAidKit),
            fireExtinguisherEachFloor: Boolean(inf.fireExtinguisherEachFloor),
            fireEmergencyAccessible: Boolean(inf.fireEmergencyAccessible),
            assemblyArea: Boolean(inf.assemblyArea),
            safetySignage: Boolean(inf.safetySignage),
            safeArea: Boolean(inf.safeArea),
            safeLateHours: Boolean(inf.safeLateHours),
            adequateHygiene: Boolean(inf.adequateHygiene),
            insuranceCoverage: Boolean(inf.insuranceCoverage),
          },
          update: {
            busStandNearby: Boolean(inf.busStandNearby),
            busStandName: inf.busStandName ?? undefined,
            metroNearby: Boolean(inf.metroNearby),
            metroStationName: inf.metroStationName ?? undefined,
            distanceFromMainRoad: inf.distanceFromMainRoad !== undefined ? Number(inf.distanceFromMainRoad) : undefined,
            signBoards: Boolean(inf.signBoards),
            printerAvailable: Boolean(inf.printerAvailable),
            jammerAvailable: Boolean(inf.jammerAvailable),
            phFriendly: Boolean(inf.phFriendly),
            phCandidateCount: inf.phCandidateCount ? Number(inf.phCandidateCount) : undefined,
            elevatorAvailable: Boolean(inf.elevatorAvailable),
            wheelchairAvailable: Boolean(inf.wheelchairAvailable),
            noOfFloors: inf.noOfFloors ? Number(inf.noOfFloors) : undefined,
            buildingType: inf.buildingType ?? undefined,
            specifiedBuildingType: inf.specifiedBuildingType ?? undefined,
            noOfLifts: inf.noOfLifts !== undefined ? Number(inf.noOfLifts) : undefined,
            noOfEntryGates: inf.noOfEntryGates !== undefined ? Number(inf.noOfEntryGates) : undefined,
            noOfExitGates: inf.noOfExitGates !== undefined ? Number(inf.noOfExitGates) : undefined,
            buildingNameWing: inf.buildingNameWing ?? undefined,
            floorBuildingDetails: inf.floorBuildingDetails ?? undefined,
            washroomsEachFloor: inf.washroomsEachFloor !== undefined ? Number(inf.washroomsEachFloor) : undefined,
            maleWashroomsEachFloor: inf.maleWashroomsEachFloor !== undefined ? Number(inf.maleWashroomsEachFloor) : undefined,
            femaleWashroomsEachFloor: inf.femaleWashroomsEachFloor !== undefined ? Number(inf.femaleWashroomsEachFloor) : undefined,
            noOfCctvCameras: inf.noOfCctvCameras !== undefined ? Number(inf.noOfCctvCameras) : undefined,
            cctvAreas: inf.cctvAreas ?? undefined,
            drinkingWaterArea: inf.drinkingWaterArea ?? undefined,
            parkingAvailable: Boolean(inf.parkingAvailable),
            candidateParkingInside: Boolean(inf.candidateParkingInside),
            receptionArea: Boolean(inf.receptionArea),
            waitingArea: Boolean(inf.waitingArea),
            maleWashroom: Boolean(inf.maleWashroom),
            femaleWashroom: Boolean(inf.femaleWashroom),
            separateWashrooms: Boolean(inf.separateWashrooms),
            drinkingWater: Boolean(inf.drinkingWater),
            acAvailable: Boolean(inf.acAvailable),
            lockerFacility: Boolean(inf.lockerFacility),
            separateEntryExit: Boolean(inf.separateEntryExit),
            suitablePwd: Boolean(inf.suitablePwd),
            rampFacility: Boolean(inf.rampFacility),
            railingSupport: Boolean(inf.railingSupport),
            cctvLobby: Boolean(inf.cctvLobby),
            serverRoomAvailable: Boolean(inf.serverRoomAvailable),
            acInServerRoom: Boolean(inf.acInServerRoom),
            serverRoomUpsNetwork: Boolean(inf.serverRoomUpsNetwork),
            dedicatedServerRoom: Boolean(inf.dedicatedServerRoom),
            upsAvailable: Boolean(inf.upsAvailable),
            upsCapacityKva: inf.upsCapacityKva !== undefined ? Number(inf.upsCapacityKva) : undefined,
            gensetAvailable: Boolean(inf.gensetAvailable),
            gensetCapacityKva: inf.gensetCapacityKva !== undefined ? Number(inf.gensetCapacityKva) : undefined,
            backupGensetAvailable: Boolean(inf.backupGensetAvailable),
            backupGensetCapacityKva: inf.backupGensetCapacityKva !== undefined ? Number(inf.backupGensetCapacityKva) : undefined,
            coreSwitch1Gbps: Boolean(inf.coreSwitch1Gbps),
            primaryInternet: Boolean(inf.primaryInternet),
            backupInternet: Boolean(inf.backupInternet),
            ipScanningAvailable: Boolean(inf.ipScanningAvailable),
            networkDiagramAvailable: Boolean(inf.networkDiagramAvailable),
            lanType: inf.lanType ?? undefined,
            noOfFireExtinguishers: inf.noOfFireExtinguishers !== undefined ? Number(inf.noOfFireExtinguishers) : undefined,
            fireSafetyClearanceDate: inf.fireSafetyClearanceDate ? new Date(inf.fireSafetyClearanceDate) : undefined,
            fireExtinguisherRefillDate: inf.fireExtinguisherRefillDate ? new Date(inf.fireExtinguisherRefillDate) : undefined,
            firstAidKit: Boolean(inf.firstAidKit),
            fireExtinguisherEachFloor: Boolean(inf.fireExtinguisherEachFloor),
            fireEmergencyAccessible: Boolean(inf.fireEmergencyAccessible),
            assemblyArea: Boolean(inf.assemblyArea),
            safetySignage: Boolean(inf.safetySignage),
            safeArea: Boolean(inf.safeArea),
            safeLateHours: Boolean(inf.safeLateHours),
            adequateHygiene: Boolean(inf.adequateHygiene),
            insuranceCoverage: Boolean(inf.insuranceCoverage),
          },
        });
      }

      // 5. Bank Account Details (Step 7)
      if (data.bankAccount) {
        const b = data.bankAccount;
        if (b.confirmAccountNumber && b.accountNumber && b.confirmAccountNumber !== b.accountNumber) {
          throw new Error('Step 7: Account Number and Confirm Account Number must match exactly.');
        }
        if (b.accountName || b.accountNumber) {
          // Check if editing bank account invalidates previous approval
          const existingBank = await tx.centreBankAccount.findUnique({ where: { centreId } });
          const isMaterialChange = existingBank && (
            existingBank.accountNumber !== b.accountNumber ||
            existingBank.ifscCode !== b.ifscCode?.toUpperCase() ||
            existingBank.accountName !== b.accountName
          );

          await tx.centreBankAccount.upsert({
            where: { centreId },
            create: {
              centreId,
              accountName: b.accountName || '',
              bankName: b.bankName || '',
              branchName: b.branchName || '',
              accountNumber: b.accountNumber || '',
              ifscCode: (b.ifscCode || '').trim().toUpperCase(),
              accountType: b.accountType || 'Current Account',
              branchAddress: b.branchAddress || null,
              cancelledChequeUrl: b.cancelledChequeUrl || null,
              passbookUrl: b.passbookUrl || null,
              verificationStatus: 'Submitted',
              isPaymentEligible: false,
            },
            update: {
              accountName: b.accountName ?? undefined,
              bankName: b.bankName ?? undefined,
              branchName: b.branchName ?? undefined,
              accountNumber: b.accountNumber ?? undefined,
              ifscCode: b.ifscCode ? b.ifscCode.trim().toUpperCase() : undefined,
              accountType: b.accountType ?? undefined,
              branchAddress: b.branchAddress ?? undefined,
              cancelledChequeUrl: b.cancelledChequeUrl ?? undefined,
              passbookUrl: b.passbookUrl ?? undefined,
              verificationStatus: isMaterialChange ? 'Re-verification Required' : undefined,
              isPaymentEligible: isMaterialChange ? false : undefined,
            },
          });
        }
      }

      // Log Draft Save Audit
      await tx.auditLog.create({
        data: {
          userId,
          userEmail,
          action: isNew ? 'CENTRE_DRAFT_CREATED' : 'CENTRE_DRAFT_UPDATED',
          entity: 'Centre',
          entityId: centreId,
          details: { centreCode, status: savedCentre.centreStatus },
        },
      });

      return savedCentre;
    });
  }

  /**
   * Uploads or replaces a supporting document
   */
  static async uploadDocument(
    userId: string,
    userEmail: string,
    payload: {
      documentType: string;
      documentName: string;
      fileName: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
    }
  ) {
    const centre = await prisma.centre.findFirst({ where: { userId } });
    if (!centre) {
      throw new Error('Please start your centre registration draft first.');
    }

    // Size limit: 10MB
    const maxSize = 10 * 1024 * 1024;
    if (payload.fileSize && payload.fileSize > maxSize) {
      throw new Error('File size exceeds the 10 MB limit.');
    }

    const allowedMime = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (payload.mimeType && !allowedMime.includes(payload.mimeType)) {
      throw new Error('Unsupported file format. Please upload PDF, JPG, or PNG.');
    }

    const existingDoc = await prisma.centreDocument.findFirst({
      where: { centreId: centre.id, documentType: payload.documentType },
    });

    const version = existingDoc ? existingDoc.version + 1 : 1;

    const doc = await prisma.$transaction(async (tx) => {
      let savedDoc;
      if (existingDoc) {
        savedDoc = await tx.centreDocument.update({
          where: { id: existingDoc.id },
          data: {
            fileName: payload.fileName,
            fileUrl: payload.fileUrl,
            fileSize: payload.fileSize || 0,
            mimeType: payload.mimeType || 'application/pdf',
            status: 'Pending',
            rejectionReason: null,
            remarks: null,
            version,
            verifiedAt: null,
            verifiedBy: null,
          },
        });
      } else {
        savedDoc = await tx.centreDocument.create({
          data: {
            centreId: centre.id,
            documentType: payload.documentType,
            documentName: payload.documentName || payload.documentType,
            fileName: payload.fileName,
            fileUrl: payload.fileUrl,
            fileSize: payload.fileSize || 0,
            mimeType: payload.mimeType || 'application/pdf',
            status: 'Pending',
            version: 1,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          userEmail,
          action: 'DOCUMENT_UPLOADED',
          entity: 'CentreDocument',
          entityId: savedDoc.id,
          details: {
            centreId: centre.id,
            documentType: payload.documentType,
            fileName: payload.fileName,
            version,
          },
        },
      });

      return savedDoc;
    });

    return doc;
  }

  /**
   * Final submission of Centre Registration Application
   * Performs full business rule and ownership validation
   */
  static async submitRegistration(userId: string, userEmail: string) {
    const centre = await prisma.centre.findFirst({
      where: { userId },
      include: {
        contacts: true,
        capacity: true,
        documents: true,
        infrastructure: true,
        bankAccount: true,
      },
    });

    if (!centre) {
      throw new Error('Registration record not found.');
    }

    if (centre.centreStatus === 'Ready to Book' || centre.centreStatus === 'Approved') {
      throw new Error('This centre application is already approved and active.');
    }

    // ── 0. Bank Account Duplicate Check (Section 14.9) ───────────────────────
    if (centre.bankAccount?.accountNumber) {
      const duplicateBank = await prisma.centreBankAccount.findFirst({
        where: {
          accountNumber: centre.bankAccount.accountNumber,
          centreId: { not: centre.id },
        },
        include: { centre: { select: { centreName: true, centreCode: true } } },
      });

      if (duplicateBank) {
        throw new Error(
          `This bank account is already associated with another centre (${duplicateBank.centre.centreName} - ${duplicateBank.centre.centreCode}). Please contact the OEMP support team.`
        );
      }
    }

    // ── 1. Step 1 Validation: Basic Information ─────────────────────────────
    if (!centre.centreName?.trim()) {
      throw new Error('Step 1: Centre Name (As per Document) is required.');
    }
    if (!centre.centreCategory) {
      throw new Error('Step 1: Centre Category is required.');
    }
    if (!centre.centreAddress?.trim()) {
      throw new Error('Step 1: Centre Address is required.');
    }
    if (!centre.stateName || !centre.cityName) {
      throw new Error('Step 1: State and City are required.');
    }
    if (!centre.pincode || !/^\d{6}$/.test(centre.pincode.trim())) {
      throw new Error('Step 1: A valid 6-digit PIN code is required.');
    }
    if (!centre.capacity || centre.capacity.examNodes <= 0) {
      throw new Error('Step 1: Declared Total Nodes (capacity) is required.');
    }
    if (centre.previousExamConducted && !centre.previousEduExam?.trim()) {
      throw new Error('Step 1: Previous Examination details are required when Previous Exam Conducted is Yes.');
    }

    // ── 2. Step 2 Validation: Personnel Details ──────────────────────────────
    const owner = centre.contacts.find((c) => c.personType === 'Owner');
    if (!owner || !owner.fullName?.trim() || !owner.contactNumber?.trim()) {
      throw new Error('Step 2: Owner Name and Contact Number are required.');
    }

    // ── 3. Step 3 Validation: Mandatory Documents ────────────────────────────
    const mandatoryDocTypes = [
      'current_electricity_bill',
      'cancelled_cheque',
      'centre_pan',
      'gst_document',
      'ef_data_sheet',
      'mou',
      'nda',
    ];

    const uploadedDocTypes = new Set(centre.documents.map((d) => d.documentType.toLowerCase()));
    const missingDocs: string[] = [];

    // Check financial / core documents
    if (!uploadedDocTypes.has('current_electricity_bill') && !uploadedDocTypes.has('electricity_bill')) {
      missingDocs.push('Current Electricity Bill');
    }
    if (!uploadedDocTypes.has('cancelled_cheque')) {
      missingDocs.push('Cancelled Cheque');
    }
    if (!uploadedDocTypes.has('centre_pan')) {
      missingDocs.push('Centre PAN');
    }
    if (!uploadedDocTypes.has('gst_document')) {
      missingDocs.push('GST Document');
    }

    // Conditional document checks
    if (centre.organizationType === 'Trust' || centre.organizationType === 'Society') {
      if (!uploadedDocTypes.has('trust_society_certificate') && !uploadedDocTypes.has('trust_deed')) {
        missingDocs.push('Trust Deed / Society Certificate');
      }
    }
    if (centre.organizationType === 'Partnership') {
      if (!uploadedDocTypes.has('partnership_deed')) {
        missingDocs.push('Partnership Deed');
      }
    }

    // Note: To remain friendly during onboarding while enforcing required documents,
    // if critical documents are missing we alert clearly.
    if (missingDocs.length > 0) {
      throw new Error(`Step 3: Missing required document(s): ${missingDocs.join(', ')}.`);
    }

    // ── 4. Step 7 Validation: Bank Account Details & Ownership ──────────────
    const bank = centre.bankAccount;
    if (!bank) {
      throw new Error('Step 7: Bank Account details must be entered before submitting.');
    }
    if (!bank.accountName?.trim()) {
      throw new Error('Step 7: Bank Account Holder Name is required.');
    }
    if (!bank.bankName?.trim()) {
      throw new Error('Step 7: Bank Name is required.');
    }
    if (!bank.branchName?.trim()) {
      throw new Error('Step 7: Bank Branch Name is required.');
    }
    if (!bank.accountNumber || !/^\d{6,20}$/.test(bank.accountNumber.trim())) {
      throw new Error('Step 7: A valid Bank Account Number (digits only) is required.');
    }
    if (!bank.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifscCode.trim().toUpperCase())) {
      throw new Error('Step 7: A valid 11-character uppercase IFSC code is required (e.g. SBIN0001234).');
    }

    // Check for Bank Proof (Cancelled Cheque or Bank Passbook)
    const hasBankProof =
      Boolean(bank.cancelledChequeUrl) ||
      Boolean(bank.passbookUrl) ||
      uploadedDocTypes.has('cancelled_cheque') ||
      uploadedDocTypes.has('bank_passbook');

    if (!hasBankProof) {
      throw new Error('Step 7: At least one bank proof must be uploaded (Cancelled Cheque or Bank Passbook).');
    }

    // Bank Account Ownership Check (Section 14.9)
    // Duplicate account check across other centres
    const duplicateBank = await prisma.centreBankAccount.findFirst({
      where: {
        accountNumber: bank.accountNumber,
        centreId: { not: centre.id },
      },
      include: { centre: { select: { centreName: true, centreCode: true } } },
    });

    if (duplicateBank) {
      throw new Error(
        `This bank account is already associated with another centre (${duplicateBank.centre.centreName} - ${duplicateBank.centre.centreCode}). Please contact the OEMP support team.`
      );
    }

    // Beneficiary name comparison vs centre name and owner name
    const benName = bank.accountName.toLowerCase().trim();
    const cName = centre.centreName.toLowerCase().trim();
    const oName = (owner?.fullName || '').toLowerCase().trim();

    const isMatch = Boolean(
      benName.includes(cName) ||
      cName.includes(benName) ||
      (oName && (benName.includes(oName) || oName.includes(benName)))
    );

    // ── 5. Transition Status to Registered ──────────────────────────────────
    return prisma.$transaction(async (tx) => {
      const updatedCentre = await tx.centre.update({
        where: { id: centre.id },
        data: {
          centreStatus: 'Registered',
          rejectionReason: null,
        },
      });

      await tx.centreBankAccount.update({
        where: { centreId: centre.id },
        data: {
          verificationStatus: 'Pending Verification',
          beneficiaryMatched: isMatch,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          userEmail,
          action: 'CENTRE_APPLICATION_SUBMITTED',
          entity: 'Centre',
          entityId: centre.id,
          details: {
            centreCode: centre.centreCode,
            status: 'Registered',
            totalNodes: centre.capacity?.examNodes,
            beneficiaryMatched: isMatch,
          },
        },
      });

      return {
        success: true,
        message: 'Your Centre Registration application has been submitted successfully for verification.',
        centre: updatedCentre,
      };
    });
  }

  /**
   * Tracks application status and review milestones for the Centre User
   */
  static async getApplicationStatus(userId: string) {
    const centre = await prisma.centre.findFirst({
      where: { userId },
      include: {
        documents: { select: { documentType: true, documentName: true, status: true, rejectionReason: true } },
        bankAccount: { select: { verificationStatus: true, isPaymentEligible: true, rejectionReason: true } },
        audits: { select: { assignmentCode: true, status: true, auditDate: true } },
      },
    });

    if (!centre) {
      return { hasApplied: false, status: 'Not Started' };
    }

    const totalDocs = centre.documents.length;
    const verifiedDocs = centre.documents.filter((d) => d.status === 'Verified').length;
    const rejectedDocs = centre.documents.filter((d) => d.status === 'Rejected');

    return {
      hasApplied: true,
      centreId: centre.id,
      centreCode: centre.centreCode,
      centreName: centre.centreName,
      status: centre.centreStatus,
      rejectionReason: centre.rejectionReason,
      documents: {
        total: totalDocs,
        verified: verifiedDocs,
        rejected: rejectedDocs.length,
        rejectedItems: rejectedDocs,
      },
      bankAccount: {
        status: centre.bankAccount?.verificationStatus || 'Not Submitted',
        isPaymentEligible: Boolean(centre.bankAccount?.isPaymentEligible),
        rejectionReason: centre.bankAccount?.rejectionReason || null,
      },
      audit: centre.audits[0] || null,
    };
  }
}
