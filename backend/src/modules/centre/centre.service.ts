import { prisma } from '../../config/database.js';
import { Prisma, Role } from '@prisma/client';
import { StorageService } from '../../services/storage.service.js';
import { ReviewSubmoduleInput, UploadMediaAssetInput } from './centre.schemas.js';

export class CentreService {
  /**
   * Helper: Resolves the Centre for a given User using both Centre.userId, User.centreId,
   * and any assigned centres in user.scope.centres.
   */
  static async resolveCentreForUser(userId: string, tx: any = prisma) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, centreId: true, scope: true },
    });

    if (!user) {
      return null;
    }

    const orConditions: Prisma.CentreWhereInput[] = [{ userId }];

    if (user.centreId) {
      orConditions.push({ id: user.centreId });
    }

    const scopeCentres = (user.scope as any)?.centres;
    if (Array.isArray(scopeCentres) && scopeCentres.length > 0 && !scopeCentres.includes('all')) {
      orConditions.push({ id: { in: scopeCentres } });
    }

    const centre = await tx.centre.findFirst({
      where: { OR: orConditions },
    });

    return centre;
  }

  /**
   * Masks sensitive Aadhaar number: formats as XXXX-XXXX-1234 (or last 4 digits)
   */
  static maskAadhaar(aadhaar: string | null | undefined): string | null {
    if (!aadhaar) return null;
    const clean = aadhaar.replace(/[^0-9]/g, '');
    if (clean.length >= 4) {
      return `XXXX-XXXX-${clean.slice(-4)}`;
    }
    return 'XXXX';
  }

  /**
   * Masks sensitive bank account number: formats as XXXX XXXX 1234
   */
  static maskAccountNumber(acc: string | null | undefined): string | null {
    if (!acc) return null;
    const clean = acc.trim();
    if (clean.length > 4) {
      return `XXXX XXXX ${clean.slice(-4)}`;
    }
    return clean;
  }

  /**
   * Generates a unique, concurrency-safe Centre ID in format: CTR-2026-XXXX
   */
  static async generateCentreCode(tx: any = prisma): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CTR-${year}-`;

    const centres = await tx.centre.findMany({
      where: {
        centreCode: { startsWith: prefix },
      },
      select: { centreCode: true },
    });

    let maxNumber = 0;
    for (const c of centres) {
      if (c.centreCode) {
        const parts = c.centreCode.split('-');
        if (parts.length === 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }

    let candidateNumber = maxNumber + 1;
    while (
      await tx.centre.findUnique({
        where: { centreCode: `${prefix}${String(candidateNumber).padStart(4, '0')}` },
      })
    ) {
      candidateNumber++;
    }

    return `${prefix}${String(candidateNumber).padStart(4, '0')}`;
  }

  /**
   * Retrieves the authenticated Centre User's centre profile with lean queries
   * (omitting heavy Base64 blobs from documents and media assets)
   */
  static async getMyCentre(userId: string) {
    const centre = await this.resolveCentreForUser(userId);
    if (!centre) {
      return null;
    }

    const [
      contacts,
      capacity,
      documents,
      infrastructure,
      bankAccount,
      buildings,
      submoduleReviews,
      mediaAssets,
    ] = await Promise.all([
      // 1. Contacts with masked Aadhaar
      prisma.centreContact.findMany({
        where: { centreId: centre.id },
      }),
      // 2. Capacity
      prisma.centreCapacity.findUnique({
        where: { centreId: centre.id },
      }),
      // 3. Documents - LEAN QUERY (omits @db.LongText fileUrl)
      prisma.centreDocument.findMany({
        where: { centreId: centre.id },
        select: {
          id: true,
          centreId: true,
          documentType: true,
          documentName: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          status: true,
          rejectionReason: true,
          remarks: true,
          version: true,
          verifiedAt: true,
          verifiedBy: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      // 4. Infrastructure
      prisma.centreInfrastructure.findUnique({
        where: { centreId: centre.id },
      }),
      // 5. Bank Account
      prisma.centreBankAccount.findUnique({
        where: { centreId: centre.id },
      }),
      // 6. Nested Buildings -> Floors -> Labs
      prisma.centreBuilding.findMany({
        where: { centreId: centre.id },
        include: {
          floors: {
            include: {
              labs: {
                orderBy: { labOrder: 'asc' },
              },
            },
            orderBy: { floorOrder: 'asc' },
          },
        },
        orderBy: { buildingOrder: 'asc' },
      }),
      // 7. Submodule Reviews
      prisma.centreSubmoduleReview.findMany({
        where: { centreId: centre.id },
        select: {
          id: true,
          submoduleKey: true,
          sectionKey: true,
          status: true,
          reworkReason: true,
          reviewedAt: true,
          pmApprovedAt: true,
        },
      }),
      // 8. Media Assets - LEAN QUERY (omits Base64 fileUrl)
      prisma.centreMediaAsset.findMany({
        where: { centreId: centre.id, isActive: true },
        select: {
          id: true,
          entityType: true,
          entityId: true,
          fieldKey: true,
          assetCategory: true,
          fileName: true,
          storageProvider: true,
          storageKey: true,
          mimeType: true,
          originalSizeBytes: true,
          finalSizeBytes: true,
          isCompressed: true,
          version: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Mask contacts Aadhaar
    const maskedContacts = contacts.map((c) => ({
      ...c,
      aadhaarNumber: this.maskAadhaar(c.aadhaarNumber),
    }));

    // Mask bank account number
    let maskedBank = null;
    if (bankAccount) {
      maskedBank = {
        ...bankAccount,
        accountNumber: this.maskAccountNumber(bankAccount.accountNumber),
        // Omit raw Base64 data from cancelledChequeUrl/passbookUrl in list/profile view
        cancelledChequeUrl: bankAccount.cancelledChequeUrl
          ? `/api/v1/centre/bank-proof/cancelled-cheque`
          : null,
        passbookUrl: bankAccount.passbookUrl
          ? `/api/v1/centre/bank-proof/passbook`
          : null,
      };
    }

    return {
      ...centre,
      centreOfficialEmail: centre.centreOfficialEmail || centre.officialEmail,
      officialEmail: centre.officialEmail || centre.centreOfficialEmail,
      centreOfficialMobile: centre.officialMobile,
      centreWhatsappMobile: centre.whatsappMobile,
      centreAlternateMobile: centre.alternateMobile,
      centreAlternateEmail: centre.alternativeEmail,
      centrePhoneNumberWithStdCode: centre.phoneStd || centre.landlineStd,
      busStandDistanceKm: centre.busStandDistanceKm,
      railwayStationDistanceKm: centre.railwayStationDistanceKm,
      contacts: maskedContacts,
      capacity,
      documents,
      infrastructure,
      bankAccount: maskedBank,
      buildings,
      submoduleReviews,
      mediaAssets,
    };
  }

  /**
   * Saves or updates a draft centre registration for the logged-in Centre User
   * Supports basic info, capacity, contacts, infrastructure, bank details,
   * and nested building -> floor -> lab hierarchy.
   */
  static async saveDraft(userId: string, userEmail: string, data: any) {
    let attempts = 0;
    while (attempts < 5) {
      try {
        let centre = await this.resolveCentreForUser(userId);
        const isNew = !centre;

        return await prisma.$transaction(
          async (tx) => {
            const centreCode = centre ? centre.centreCode : (await this.generateCentreCode(tx));
            // 1. Upsert Centre Basic Information
            const centreData: Prisma.CentreCreateInput = {
              centreCode,
              userId,
              centreName: data.centreName || 'Draft Centre Application',
              centreCategory: data.centreCategory || null,
              customCentreCategory: data.customCentreCategory || null,
              regionId: data.regionId || null,
              stateId: data.stateId || null,
              cityId: data.cityId || null,
              stateName: data.stateName || null,
              cityName: data.cityName || null,
              district: data.district || null,
              taluka: data.taluka || null,
              centreAddress: data.centreAddress || '',
              pincode: data.pincode || '',
              eduCode: data.eduCode || null,
              tcCode: data.tcCode || null,
              venueStatus: data.venueStatus || 'Old',
              previousExamConducted: Boolean(data.previousExamConducted),
              previousEduExam: data.previousEduExam || null,
              previousExamName: data.previousExamName || null,
              previousExamDate: data.previousExamDate ? new Date(data.previousExamDate) : null,
              officialEmail: data.centreOfficialEmail || data.officialEmail || userEmail,
              centreOfficialEmail: data.centreOfficialEmail || data.officialEmail || userEmail,
              alternativeEmail: data.centreAlternateEmail || data.alternativeEmail || null,
              officialMobile: data.centreOfficialMobile || data.officialMobile || null,
              whatsappMobile: data.centreWhatsappMobile || data.whatsappMobile || null,
              alternateMobile: data.centreAlternateMobile || data.alternateMobile || null,
              phoneStd: data.centrePhoneNumberWithStdCode || data.phoneStd || null,
              landlineStd: data.landlineStd || null,
              googleMapLink: data.googleMapLink || null,
              busStandNearby: Boolean(data.busStandNearby || (data.busStandDistanceKm !== undefined && data.busStandDistanceKm !== null)),
              busStandDistanceKm: data.busStandDistanceKm !== undefined && data.busStandDistanceKm !== '' ? Number(data.busStandDistanceKm) : null,
              busStandName: data.busStandName || null,
              railwayStationNearby: Boolean(data.railwayStationNearby || (data.railwayStationDistanceKm !== undefined && data.railwayStationDistanceKm !== null)),
              railwayStationDistanceKm: data.railwayStationDistanceKm !== undefined && data.railwayStationDistanceKm !== '' ? Number(data.railwayStationDistanceKm) : null,
              railwayStationName: data.railwayStationName || null,
              mainRoadDistanceKm: data.mainRoadDistanceKm !== undefined && data.mainRoadDistanceKm !== '' ? Number(data.mainRoadDistanceKm) : null,
              signBoardsAvailable: Boolean(data.signBoardsAvailable),
              hotelsNearby: Boolean(data.hotelsNearby),
              nearestHotelDistanceKm: data.nearestHotelDistanceKm !== undefined ? Number(data.nearestHotelDistanceKm) : null,
              canteenAvailable: Boolean(data.canteenAvailable),
              canteenFoodForStaff: Boolean(data.canteenFoodForStaff),
              foodForTestingDays: Boolean(data.foodForTestingDays),
              foodForMockDays: Boolean(data.foodForMockDays),
              outsideFoodPossible: Boolean(data.outsideFoodPossible),
              outsideFoodDetails: data.outsideFoodDetails || null,
              remarks: data.remarks || null,
              organizationType: data.organizationType || 'Trust',
              centreStatus: centre?.centreStatus === 'Registered' ? 'Registered' : 'Draft',
            };

            let savedCentre: any;
            if (isNew) {
              savedCentre = await tx.centre.create({
                data: centreData,
              });
              // Link centreId on User if not present
              await tx.user.update({
                where: { id: userId },
                data: { centreId: savedCentre.id },
              });
            } else {
          savedCentre = await tx.centre.update({
            where: { id: centre.id },
            data: {
              centreName: data.centreName ?? centre.centreName,
              centreCategory: data.centreCategory ?? centre.centreCategory,
              customCentreCategory: data.customCentreCategory ?? centre.customCentreCategory,
              regionId: data.regionId ?? centre.regionId,
              stateId: data.stateId ?? centre.stateId,
              cityId: data.cityId ?? centre.cityId,
              stateName: data.stateName ?? centre.stateName,
              cityName: data.cityName ?? centre.cityName,
              district: data.district ?? centre.district,
              taluka: data.taluka ?? centre.taluka,
              centreAddress: data.centreAddress ?? centre.centreAddress,
              pincode: data.pincode ?? centre.pincode,
              eduCode: data.eduCode ?? centre.eduCode,
              tcCode: data.tcCode ?? centre.tcCode,
              venueStatus: data.venueStatus ?? centre.venueStatus,
              previousExamConducted:
                data.previousExamConducted !== undefined
                  ? Boolean(data.previousExamConducted)
                  : centre.previousExamConducted,
              previousEduExam: data.previousEduExam ?? centre.previousEduExam,
              previousExamName: data.previousExamName ?? centre.previousExamName,
              previousExamDate: data.previousExamDate ? new Date(data.previousExamDate) : centre.previousExamDate,
              officialEmail: data.centreOfficialEmail ?? data.officialEmail ?? centre.officialEmail,
              centreOfficialEmail: data.centreOfficialEmail ?? data.officialEmail ?? centre.centreOfficialEmail ?? centre.officialEmail,
              alternativeEmail: data.centreAlternateEmail ?? data.alternativeEmail ?? centre.alternativeEmail,
              officialMobile: data.centreOfficialMobile ?? data.officialMobile ?? centre.officialMobile,
              whatsappMobile: data.centreWhatsappMobile ?? data.whatsappMobile ?? centre.whatsappMobile,
              alternateMobile: data.centreAlternateMobile ?? data.alternateMobile ?? centre.alternateMobile,
              phoneStd: data.centrePhoneNumberWithStdCode ?? data.phoneStd ?? centre.phoneStd,
              landlineStd: data.landlineStd ?? centre.landlineStd,
              googleMapLink: data.googleMapLink ?? centre.googleMapLink,
              busStandNearby: data.busStandNearby !== undefined ? Boolean(data.busStandNearby) : (data.busStandDistanceKm !== undefined ? Boolean(data.busStandDistanceKm !== null) : centre.busStandNearby),
              busStandDistanceKm: data.busStandDistanceKm !== undefined ? (data.busStandDistanceKm !== '' ? Number(data.busStandDistanceKm) : null) : centre.busStandDistanceKm,
              busStandName: data.busStandName ?? centre.busStandName,
              railwayStationNearby: data.railwayStationNearby !== undefined ? Boolean(data.railwayStationNearby) : (data.railwayStationDistanceKm !== undefined ? Boolean(data.railwayStationDistanceKm !== null) : centre.railwayStationNearby),
              railwayStationDistanceKm: data.railwayStationDistanceKm !== undefined ? (data.railwayStationDistanceKm !== '' ? Number(data.railwayStationDistanceKm) : null) : centre.railwayStationDistanceKm,
              railwayStationName: data.railwayStationName ?? centre.railwayStationName,
              mainRoadDistanceKm: data.mainRoadDistanceKm !== undefined ? (data.mainRoadDistanceKm !== '' ? Number(data.mainRoadDistanceKm) : null) : centre.mainRoadDistanceKm,
              signBoardsAvailable: data.signBoardsAvailable !== undefined ? Boolean(data.signBoardsAvailable) : centre.signBoardsAvailable,
              hotelsNearby: data.hotelsNearby !== undefined ? Boolean(data.hotelsNearby) : centre.hotelsNearby,
              nearestHotelDistanceKm: data.nearestHotelDistanceKm !== undefined ? Number(data.nearestHotelDistanceKm) : centre.nearestHotelDistanceKm,
              canteenAvailable: data.canteenAvailable !== undefined ? Boolean(data.canteenAvailable) : centre.canteenAvailable,
              canteenFoodForStaff: data.canteenFoodForStaff !== undefined ? Boolean(data.canteenFoodForStaff) : centre.canteenFoodForStaff,
              foodForTestingDays: data.foodForTestingDays !== undefined ? Boolean(data.foodForTestingDays) : centre.foodForTestingDays,
              foodForMockDays: data.foodForMockDays !== undefined ? Boolean(data.foodForMockDays) : centre.foodForMockDays,
              outsideFoodPossible: data.outsideFoodPossible !== undefined ? Boolean(data.outsideFoodPossible) : centre.outsideFoodPossible,
              outsideFoodDetails: data.outsideFoodDetails ?? centre.outsideFoodDetails,
              remarks: data.remarks ?? centre.remarks,
              organizationType: data.organizationType ?? centre.organizationType,
            },
          });
        }

        const centreId = savedCentre.id;

        // 2. Capacity (Total Nodes, Exam Nodes)
        if (
          data.totalNodes !== undefined ||
          data.actualNodes !== undefined ||
          data.examNodes !== undefined ||
          data.capacity !== undefined
        ) {
          const totalNodes = Number(
            data.actualNodes || data.totalNodes || data.capacity?.totalSystems || data.capacity?.examNodes || 0
          );
          const examNodes = Number(data.examNodes || data.capacity?.examNodes || totalNodes);
          const regDeskCount = Number(data.capacity?.regDeskCount || 2);
          const serverCount = Number(data.capacity?.serverCount || 1);

          await tx.centreCapacity.upsert({
            where: { centreId },
            create: {
              centreId,
              totalSystems: totalNodes,
              examNodes,
              regDeskCount,
              serverCount,
            },
            update: {
              totalSystems: totalNodes,
              examNodes,
              regDeskCount,
              serverCount,
            },
          });
        }

        // 3. Key Personnel (Owner, TCA_CS, IT_PERSON, Electrician)
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
                  aadhaarNumber:
                    c.aadhaarNumber && !c.aadhaarNumber.includes('X')
                      ? c.aadhaarNumber
                      : existingContact.aadhaarNumber,
                  panNumber: c.panNumber ?? existingContact.panNumber,
                  fatherName: c.fatherName ?? existingContact.fatherName,
                  motherName: c.motherName ?? existingContact.motherName,
                  permanentAddress: c.permanentAddress ?? existingContact.permanentAddress,
                  currentAddress: c.currentAddress ?? existingContact.currentAddress,
                  alternateContactNumber: c.alternateNumber || c.alternateContactNumber || existingContact.alternateContactNumber,
                  qualification: c.qualification ?? existingContact.qualification,
                  experienceYears: c.experienceYears !== undefined ? Number(c.experienceYears) : existingContact.experienceYears,
                  isPrimary: c.personType === 'Owner' || c.personType === 'OWNER',
                },
              });
            } else {
              await tx.centreContact.create({
                data: {
                  centreId,
                  personType: c.personType,
                  fullName: c.fullName || '—',
                  contactNumber: c.contactNumber || '—',
                  alternateContactNumber: c.alternateNumber || c.alternateContactNumber || null,
                  email: c.email || null,
                  aadhaarNumber: c.aadhaarNumber || null,
                  panNumber: c.panNumber || null,
                  fatherName: c.fatherName || null,
                  motherName: c.motherName || null,
                  permanentAddress: c.permanentAddress || null,
                  currentAddress: c.currentAddress || null,
                  qualification: c.qualification || null,
                  experienceYears: c.experienceYears !== undefined ? Number(c.experienceYears) : null,
                  isPrimary: c.personType === 'Owner' || c.personType === 'OWNER',
                },
              });
            }
          }
        }

        // 4. Infrastructure Details (Power, Network, Generators, Medical)
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
              distanceFromMainRoad:
                inf.distanceFromMainRoad !== undefined ? Number(inf.distanceFromMainRoad) : null,
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
              // Extended Power & Generators
              electricityProvider: inf.electricityProvider || null,
              connectionType: inf.connectionType || null,
              sanctionedLoadKw: inf.sanctionedLoadKw !== undefined ? Number(inf.sanctionedLoadKw) : null,
              avgMonthlyKwh: inf.avgMonthlyKwh !== undefined ? Number(inf.avgMonthlyKwh) : null,
              upsAvailable: Boolean(inf.upsAvailable),
              upsCapacityKva: inf.upsCapacityKva ? Number(inf.upsCapacityKva) : null,
              upsModel: inf.upsModel || null,
              upsBackupDurationMins: inf.upsBackupDurationMins ? Number(inf.upsBackupDurationMins) : null,
              gensetAvailable: Boolean(inf.gensetAvailable),
              gensetCapacityKva: inf.gensetCapacityKva ? Number(inf.gensetCapacityKva) : null,
              generatorFuelType: inf.generatorFuelType || null,
              generatorModel: inf.generatorModel || null,
              generatorAutoSwitchover: Boolean(inf.generatorAutoSwitchover),
              backupGensetAvailable: Boolean(inf.backupGensetAvailable),
              backupGensetCapacityKva: inf.backupGensetCapacityKva ? Number(inf.backupGensetCapacityKva) : null,
              backupGeneratorFuelType: inf.backupGeneratorFuelType || null,
              backupGeneratorModel: inf.backupGeneratorModel || null,
              electricianAvailableOnsite: Boolean(inf.electricianAvailableOnsite),
              electricianArrangementSlaHours: inf.electricianArrangementSlaHours ? Number(inf.electricianArrangementSlaHours) : null,
              // Extended Network & LAN
              coreSwitch1Gbps: Boolean(inf.coreSwitch1Gbps),
              primaryInternet: Boolean(inf.primaryInternet),
              backupInternet: Boolean(inf.backupInternet),
              primaryIspName: inf.primaryIspName || null,
              primaryIspBandwidthMbps: inf.primaryIspBandwidthMbps !== undefined ? Number(inf.primaryIspBandwidthMbps) : null,
              secondaryIspName: inf.secondaryIspName || null,
              secondaryIspBandwidthMbps: inf.secondaryIspBandwidthMbps !== undefined ? Number(inf.secondaryIspBandwidthMbps) : null,
              backupDonglesAvailable: Boolean(inf.backupDonglesAvailable),
              backupDonglesCount: inf.backupDonglesCount ? Number(inf.backupDonglesCount) : null,
              backupDonglesDetails: inf.backupDonglesDetails || null,
              networkAdminsCount: inf.networkAdminsCount ? Number(inf.networkAdminsCount) : 0,
              networkAdminsDetails: inf.networkAdminsDetails || null,
              spareHardwareItems: inf.spareHardwareItems || null,
              spareArrangementTimeHours: inf.spareArrangementTimeHours ? Number(inf.spareArrangementTimeHours) : null,
              switchType: inf.switchType || null,
              ipScanningAvailable: Boolean(inf.ipScanningAvailable),
              networkDiagramAvailable: Boolean(inf.networkDiagramAvailable),
              lanType: inf.lanType || null,
              // Safety & Medical
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
              medicalFacilityNearby: Boolean(inf.medicalFacilityNearby),
              nearestHospitalDistanceKm: inf.nearestHospitalDistanceKm !== undefined ? Number(inf.nearestHospitalDistanceKm) : null,
              doctorOnCall: Boolean(inf.doctorOnCall),
              ambulanceContactNumber: inf.ambulanceContactNumber || null,
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
              // Extended Power & Generators
              electricityProvider: inf.electricityProvider ?? undefined,
              connectionType: inf.connectionType ?? undefined,
              sanctionedLoadKw: inf.sanctionedLoadKw !== undefined ? Number(inf.sanctionedLoadKw) : undefined,
              avgMonthlyKwh: inf.avgMonthlyKwh !== undefined ? Number(inf.avgMonthlyKwh) : undefined,
              upsAvailable: Boolean(inf.upsAvailable),
              upsCapacityKva: inf.upsCapacityKva !== undefined ? Number(inf.upsCapacityKva) : undefined,
              upsModel: inf.upsModel ?? undefined,
              upsBackupDurationMins: inf.upsBackupDurationMins !== undefined ? Number(inf.upsBackupDurationMins) : undefined,
              gensetAvailable: Boolean(inf.gensetAvailable),
              gensetCapacityKva: inf.gensetCapacityKva !== undefined ? Number(inf.gensetCapacityKva) : undefined,
              generatorFuelType: inf.generatorFuelType ?? undefined,
              generatorModel: inf.generatorModel ?? undefined,
              generatorAutoSwitchover: Boolean(inf.generatorAutoSwitchover),
              backupGensetAvailable: Boolean(inf.backupGensetAvailable),
              backupGensetCapacityKva: inf.backupGensetCapacityKva !== undefined ? Number(inf.backupGensetCapacityKva) : undefined,
              backupGeneratorFuelType: inf.backupGeneratorFuelType ?? undefined,
              backupGeneratorModel: inf.backupGeneratorModel ?? undefined,
              electricianAvailableOnsite: Boolean(inf.electricianAvailableOnsite),
              electricianArrangementSlaHours: inf.electricianArrangementSlaHours !== undefined ? Number(inf.electricianArrangementSlaHours) : undefined,
              // Extended Network & LAN
              coreSwitch1Gbps: Boolean(inf.coreSwitch1Gbps),
              primaryInternet: Boolean(inf.primaryInternet),
              backupInternet: Boolean(inf.backupInternet),
              primaryIspName: inf.primaryIspName ?? undefined,
              primaryIspBandwidthMbps: inf.primaryIspBandwidthMbps !== undefined ? Number(inf.primaryIspBandwidthMbps) : undefined,
              secondaryIspName: inf.secondaryIspName ?? undefined,
              secondaryIspBandwidthMbps: inf.secondaryIspBandwidthMbps !== undefined ? Number(inf.secondaryIspBandwidthMbps) : undefined,
              backupDonglesAvailable: Boolean(inf.backupDonglesAvailable),
              backupDonglesCount: inf.backupDonglesCount !== undefined ? Number(inf.backupDonglesCount) : undefined,
              backupDonglesDetails: inf.backupDonglesDetails ?? undefined,
              networkAdminsCount: inf.networkAdminsCount !== undefined ? Number(inf.networkAdminsCount) : undefined,
              networkAdminsDetails: inf.networkAdminsDetails ?? undefined,
              spareHardwareItems: inf.spareHardwareItems ?? undefined,
              spareArrangementTimeHours: inf.spareArrangementTimeHours !== undefined ? Number(inf.spareArrangementTimeHours) : undefined,
              switchType: inf.switchType ?? undefined,
              ipScanningAvailable: Boolean(inf.ipScanningAvailable),
              networkDiagramAvailable: Boolean(inf.networkDiagramAvailable),
              lanType: inf.lanType ?? undefined,
              // Safety & Medical
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
              medicalFacilityNearby: Boolean(inf.medicalFacilityNearby),
              nearestHospitalDistanceKm: inf.nearestHospitalDistanceKm !== undefined ? Number(inf.nearestHospitalDistanceKm) : undefined,
              doctorOnCall: Boolean(inf.doctorOnCall),
              ambulanceContactNumber: inf.ambulanceContactNumber ?? undefined,
            },
          });
        }

        // 5. Bank Account Details
        if (data.bankAccount) {
          const b = data.bankAccount;
          if (b.confirmAccountNumber && b.accountNumber && b.confirmAccountNumber !== b.accountNumber) {
            throw new Error('Step 7: Account Number and Confirm Account Number must match exactly.');
          }
          if (b.accountName || b.accountNumber) {
            const existingBank = await tx.centreBankAccount.findUnique({ where: { centreId } });
            const isMaterialChange =
              existingBank &&
              ((b.accountNumber && !b.accountNumber.includes('X') && b.accountNumber !== existingBank.accountNumber) ||
                (b.ifscCode && existingBank.ifscCode !== b.ifscCode.toUpperCase()) ||
                (b.accountName && existingBank.accountName !== b.accountName));

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
                accountNumber:
                  b.accountNumber && !b.accountNumber.includes('X')
                    ? b.accountNumber
                    : existingBank?.accountNumber,
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

        // 6. Nested Building -> Floor -> Lab Persistence
        if (data.buildings && Array.isArray(data.buildings)) {
          for (let bIdx = 0; bIdx < data.buildings.length; bIdx++) {
            const b = data.buildings[bIdx];
            const buildingOrder = b.buildingOrder ?? bIdx + 1;
            const buildingName = b.buildingName || `Building ${buildingOrder}`;

            // Upsert building
            let buildingRec = b.id
              ? await tx.centreBuilding.findFirst({ where: { id: b.id, centreId } })
              : await tx.centreBuilding.findFirst({ where: { centreId, buildingOrder } });

            if (buildingRec) {
              buildingRec = await tx.centreBuilding.update({
                where: { id: buildingRec.id },
                data: {
                  buildingName,
                  buildingOrder,
                  noOfFloors: b.noOfFloors ?? buildingRec.noOfFloors,
                  entryGateCount: b.entryGateCount ?? buildingRec.entryGateCount,
                  exitGateCount: b.exitGateCount ?? buildingRec.exitGateCount,
                  receptionPresent: b.receptionPresent ?? buildingRec.receptionPresent,
                  waitingAreaPresent: b.waitingAreaPresent ?? buildingRec.waitingAreaPresent,
                  drinkingWaterAvailable: b.drinkingWaterAvailable ?? buildingRec.drinkingWaterAvailable,
                  liftAvailable: b.liftAvailable ?? buildingRec.liftAvailable,
                  noOfLifts: b.noOfLifts ?? buildingRec.noOfLifts,
                },
              });
            } else {
              buildingRec = await tx.centreBuilding.create({
                data: {
                  centreId,
                  buildingName,
                  buildingOrder,
                  noOfFloors: b.noOfFloors ?? 1,
                  entryGateCount: b.entryGateCount ?? 1,
                  exitGateCount: b.exitGateCount ?? 1,
                  receptionPresent: Boolean(b.receptionPresent),
                  waitingAreaPresent: Boolean(b.waitingAreaPresent),
                  drinkingWaterAvailable: Boolean(b.drinkingWaterAvailable),
                  liftAvailable: Boolean(b.liftAvailable),
                  noOfLifts: b.noOfLifts ?? 0,
                },
              });
            }

            // Sync Floors
            if (b.floors && Array.isArray(b.floors)) {
              for (let fIdx = 0; fIdx < b.floors.length; fIdx++) {
                const f = b.floors[fIdx];
                const floorOrder = f.floorOrder ?? fIdx + 1;
                const floorName = f.floorName || `Floor ${floorOrder}`;

                let floorRec = f.id
                  ? await tx.centreFloor.findFirst({ where: { id: f.id, buildingId: buildingRec.id } })
                  : await tx.centreFloor.findFirst({ where: { buildingId: buildingRec.id, floorOrder } });

                if (floorRec) {
                  floorRec = await tx.centreFloor.update({
                    where: { id: floorRec.id },
                    data: {
                      floorName,
                      floorOrder,
                      noOfLabs: f.noOfLabs ?? floorRec.noOfLabs,
                      washroomsAvailable: f.washroomsAvailable ?? floorRec.washroomsAvailable,
                      totalWashrooms: f.totalWashrooms ?? floorRec.totalWashrooms,
                      maleWashrooms: f.maleWashrooms ?? floorRec.maleWashrooms,
                      femaleWashrooms: f.femaleWashrooms ?? floorRec.femaleWashrooms,
                      drinkingWaterAvailable: f.drinkingWaterAvailable ?? floorRec.drinkingWaterAvailable,
                      acAvailable: f.acAvailable ?? floorRec.acAvailable,
                      sufficientFans: f.sufficientFans ?? floorRec.sufficientFans,
                      fireExtinguisherAvailable: f.fireExtinguisherAvailable ?? floorRec.fireExtinguisherAvailable,
                      cctvCoverage: f.cctvCoverage ?? floorRec.cctvCoverage,
                      pwdAccessible: f.pwdAccessible ?? floorRec.pwdAccessible,
                      rampOrLiftAccess: f.rampOrLiftAccess ?? floorRec.rampOrLiftAccess,
                      pwdWashroomAvailable: f.pwdWashroomAvailable ?? floorRec.pwdWashroomAvailable,
                    },
                  });
                } else {
                  floorRec = await tx.centreFloor.create({
                    data: {
                      buildingId: buildingRec.id,
                      centreId,
                      floorName,
                      floorOrder,
                      noOfLabs: f.noOfLabs ?? 1,
                      washroomsAvailable: Boolean(f.washroomsAvailable),
                      totalWashrooms: f.totalWashrooms ?? 0,
                      maleWashrooms: f.maleWashrooms ?? 0,
                      femaleWashrooms: f.femaleWashrooms ?? 0,
                      drinkingWaterAvailable: Boolean(f.drinkingWaterAvailable),
                      acAvailable: Boolean(f.acAvailable),
                      sufficientFans: Boolean(f.sufficientFans),
                      fireExtinguisherAvailable: Boolean(f.fireExtinguisherAvailable),
                      cctvCoverage: Boolean(f.cctvCoverage),
                      pwdAccessible: Boolean(f.pwdAccessible),
                      rampOrLiftAccess: Boolean(f.rampOrLiftAccess),
                      pwdWashroomAvailable: Boolean(f.pwdWashroomAvailable),
                    },
                  });
                }

                // Sync Labs
                if (f.labs && Array.isArray(f.labs)) {
                  for (let lIdx = 0; lIdx < f.labs.length; lIdx++) {
                    const l = f.labs[lIdx];
                    const labOrder = l.labOrder ?? lIdx + 1;
                    const labName = l.labName || `Lab ${labOrder}`;

                    let labRec = l.id
                      ? await tx.centreLab.findFirst({ where: { id: l.id, floorId: floorRec.id } })
                      : await tx.centreLab.findFirst({ where: { floorId: floorRec.id, labOrder } });

                    const labData = {
                      labName,
                      labOrder,
                      labType: l.labType || 'Dedicated CBT Lab',
                      customLabType: l.customLabType || null,
                      totalNodes: l.totalNodes ?? 0,
                      examNodes: l.examNodes ?? 0,
                      workingNodes: l.workingNodes ?? 0,
                      pwdSuitable: Boolean(l.pwdSuitable),
                      adjacentComputerDistanceFt:
                        l.adjacentComputerDistanceFt !== undefined ? Number(l.adjacentComputerDistanceFt) : null,
                      partitionAvailable: Boolean(l.partitionAvailable),
                      partitionType: l.partitionType || null,
                      systemOwnership: l.systemOwnership || 'Owned',
                      systemOwnershipRemarks: l.systemOwnershipRemarks || null,
                      renovationPlanned: Boolean(l.renovationPlanned),
                      renovationStartDate: l.renovationStartDate ? new Date(l.renovationStartDate) : null,
                      renovationEndDate: l.renovationEndDate ? new Date(l.renovationEndDate) : null,
                      renovationRemarks: l.renovationRemarks || null,
                      canFormatSystems: Boolean(l.canFormatSystems),
                      canChangeIp: Boolean(l.canChangeIp),
                      canChangeSystemNames: Boolean(l.canChangeSystemNames),
                      internetAvailable: Boolean(l.internetAvailable),
                      upsAvailable: Boolean(l.upsAvailable),
                      upsCapacityKva: l.upsCapacityKva !== undefined ? Number(l.upsCapacityKva) : null,
                      printerAvailable: Boolean(l.printerAvailable),
                      biometricAvailable: Boolean(l.biometricAvailable),
                      cctvAvailable: Boolean(l.cctvAvailable),
                      cctvCount: l.cctvCount ?? 0,
                      jammerInstallable: Boolean(l.jammerInstallable),
                      seatingType: l.seatingType || null,
                      candidateDeskAvailable: Boolean(l.candidateDeskAvailable),
                      candidateChairAvailable: Boolean(l.candidateChairAvailable),
                      invigilatorSeatAvailable: Boolean(l.invigilatorSeatAvailable),
                      whiteboardAvailable: Boolean(l.whiteboardAvailable),
                      fireExtinguisherAvailable: Boolean(l.fireExtinguisherAvailable),
                      emergencyExitAvailable: Boolean(l.emergencyExitAvailable),
                      emergencySignageAvailable: Boolean(l.emergencySignageAvailable),
                      firstAidAvailable: Boolean(l.firstAidAvailable),
                    };

                    if (labRec) {
                      await tx.centreLab.update({
                        where: { id: labRec.id },
                        data: labData,
                      });
                    } else {
                      await tx.centreLab.create({
                        data: {
                          floorId: floorRec.id,
                          buildingId: buildingRec.id,
                          centreId,
                          ...labData,
                        },
                      });
                    }
                  }
                }
              }
            }
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
      },
      {
        timeout: 30000,
        maxWait: 10000,
      }
    );
      } catch (err: any) {
        if (err?.code === 'P2002' && attempts < 4) {
          attempts++;
          await new Promise((r) => setTimeout(r, 60 * attempts + Math.floor(Math.random() * 40)));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Failed to save draft. Please try again.');
  }

  /**
   * Uploads or replaces a supporting compliance document
   */
  static async uploadDocument(
    userId: string,
    userEmail: string,
    payload: {
      documentType: string;
      documentName?: string;
      fileName: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
    }
  ) {
    const centre = await this.resolveCentreForUser(userId);
    if (!centre) {
      throw new Error('Please start your centre registration draft first.');
    }

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

    const doc = await prisma.$transaction(
      async (tx) => {
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
      },
      {
        timeout: 25000,
        maxWait: 10000,
      }
    );

    return doc;
  }

  /**
   * Uploads and validates media asset (photo or document) with version replacement tracking
   */
  static async uploadMediaAsset(
    userId: string,
    userEmail: string,
    callerRole: string,
    payload: UploadMediaAssetInput
  ) {
    let centreId = payload.centreId;
    if (callerRole === 'CENTRE' || !centreId) {
      const centre = await this.resolveCentreForUser(userId);
      if (!centre) {
        throw new Error('Centre profile not found. Please initialize your centre registration.');
      }
      centreId = centre.id;
    }

    if (!centreId) {
      throw new Error('Target centre ID could not be resolved');
    }

    const resolvedCentreId: string = centreId;

    // Determine category
    const isDoc = payload.assetCategory === 'DOCUMENT' || payload.mimeType === 'application/pdf';
    const isPhoto = payload.assetCategory === 'PHOTO' || !isDoc;

    // Buffer conversion if Base64
    let fileBuffer: Buffer;
    if (payload.fileUrl.startsWith('data:')) {
      const base64Data = payload.fileUrl.split(',')[1] || '';
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else {
      fileBuffer = Buffer.from(payload.fileUrl, 'utf-8');
    }

    // Server-side strict size & mime validation
    if (isPhoto) {
      const v = StorageService.validatePhoto(fileBuffer, payload.mimeType);
      if (!v.valid) {
        throw new Error(v.error);
      }
    } else {
      const v = StorageService.validateDocument(fileBuffer, payload.mimeType);
      if (!v.valid) {
        throw new Error(v.error);
      }
    }

    // Storage persistence via StorageService
    const uploadRes = await StorageService.upload(fileBuffer, {
      centreId: resolvedCentreId,
      entityType: payload.entityType,
      entityId: payload.entityId,
      fieldKey: payload.fieldKey,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      assetCategory: payload.assetCategory,
      uploadedById: userId,
    });

    return prisma.$transaction(async (tx) => {
      // Find existing active asset to replace
      const existingAsset = await tx.centreMediaAsset.findFirst({
        where: {
          centreId: resolvedCentreId,
          entityType: payload.entityType,
          entityId: payload.entityId,
          fieldKey: payload.fieldKey,
          isActive: true,
        },
      });

      const nextVersion = existingAsset ? existingAsset.version + 1 : 1;

      if (existingAsset) {
        await tx.centreMediaAsset.update({
          where: { id: existingAsset.id },
          data: { isActive: false },
        });
      }

      const newAsset = await tx.centreMediaAsset.create({
        data: {
          centreId: resolvedCentreId,
          entityType: payload.entityType,
          entityId: payload.entityId,
          fieldKey: payload.fieldKey,
          assetCategory: payload.assetCategory,
          fileName: payload.fileName,
          fileUrl: uploadRes.fileUrl,
          storageProvider: uploadRes.storageProvider,
          storageKey: uploadRes.storageKey,
          mimeType: payload.mimeType,
          originalSizeBytes: uploadRes.originalSizeBytes,
          finalSizeBytes: uploadRes.finalSizeBytes,
          isCompressed: uploadRes.isCompressed,
          version: nextVersion,
          isActive: true,
          replacedById: existingAsset ? existingAsset.id : null,
          uploadedById: userId,
        },
      });

      if (existingAsset) {
        await tx.centreMediaAsset.update({
          where: { id: existingAsset.id },
          data: { replacedById: newAsset.id },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          userEmail,
          action: existingAsset ? 'MEDIA_ASSET_REPLACED' : 'MEDIA_ASSET_UPLOADED',
          entity: 'CentreMediaAsset',
          entityId: newAsset.id,
          details: {
            centreId: resolvedCentreId,
            entityType: payload.entityType,
            entityId: payload.entityId,
            fieldKey: payload.fieldKey,
            version: nextVersion,
          },
        },
      });

      return newAsset;
    });
  }

  /**
   * Dedicated secure download endpoint for CentreMediaAsset (enforcing tenant ownership)
   */
  static async getMediaAssetDownload(userId: string, callerRole: string, assetId: string) {
    const asset = await prisma.centreMediaAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new Error('Media asset not found');
    }

    if (callerRole === 'CENTRE') {
      const centre = await this.resolveCentreForUser(userId);
      if (!centre || centre.id !== asset.centreId) {
        throw new Error('Access denied: You do not have permission to view this media asset');
      }
    }

    let downloadUrl = asset.fileUrl;
    if (asset.storageKey) {
      downloadUrl = await StorageService.getSignedUrl(asset.storageKey);
    }

    return {
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      downloadUrl,
      storageProvider: asset.storageProvider,
    };
  }

  /**
   * Dedicated secure download endpoint for CentreDocument (enforcing tenant ownership)
   */
  static async getDocumentDownload(userId: string, callerRole: string, docId: string) {
    const doc = await prisma.centreDocument.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      throw new Error('Document not found');
    }

    if (callerRole === 'CENTRE') {
      const centre = await this.resolveCentreForUser(userId);
      if (!centre || centre.id !== doc.centreId) {
        throw new Error('Access denied: You do not have permission to download this document');
      }
    }

    return {
      id: doc.id,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileUrl: doc.fileUrl,
      documentType: doc.documentType,
    };
  }

  /**
   * Deletes a supporting compliance document (enforcing tenant ownership)
   */
  static async deleteDocument(userId: string, callerRole: string, userEmail: string, docId: string) {
    const doc = await prisma.centreDocument.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      throw new Error('Document not found');
    }

    if (callerRole === 'CENTRE') {
      const centre = await this.resolveCentreForUser(userId);
      if (!centre || centre.id !== doc.centreId) {
        throw new Error('Access denied: You do not have permission to delete this document');
      }
    }

    await prisma.centreDocument.delete({
      where: { id: docId },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'DOCUMENT_DELETED',
        entity: 'CentreDocument',
        entityId: docId,
        details: {
          documentType: doc.documentType,
          fileName: doc.fileName,
        },
      },
    });

    return { id: docId, deleted: true };
  }

  /**
   * Submodule & Section Review State Machine
   * Allowed statuses: NOT_STARTED, DRAFT, SUBMITTED, UNDER_AUDIT, PM_REVIEW, REWORK_REQUIRED, VERIFIED
   * Rule: VERIFIED can ONLY be set by PM or ADMIN during final approval.
   */
  static async updateSubmoduleReview(
    callerUserId: string,
    callerRole: string,
    callerEmail: string,
    input: ReviewSubmoduleInput
  ) {
    let centreId = input.centreId;
    if (!centreId) {
      const centre = await this.resolveCentreForUser(callerUserId);
      if (!centre) {
        throw new Error('Centre profile not found.');
      }
      centreId = centre.id;
    }

    // Role Guard: Only PM or ADMIN can mark VERIFIED
    if (input.status === 'VERIFIED') {
      if (callerRole !== Role.PM && callerRole !== Role.ADMIN) {
        throw new Error('Only Project Managers or Administrators can verify submodules for final approval.');
      }
    }

    // Reason Guard: REWORK_REQUIRED must have a reason
    if (input.status === 'REWORK_REQUIRED') {
      if (!input.reworkReason || !input.reworkReason.trim()) {
        throw new Error('A detailed rework reason is required when flagging a section for rework.');
      }
    }

    const sectionKey = input.sectionKey || '';

    return prisma.$transaction(async (tx) => {
      const existing = await tx.centreSubmoduleReview.findUnique({
        where: {
          centreId_submoduleKey_sectionKey: {
            centreId: centreId!,
            submoduleKey: input.submoduleKey,
            sectionKey,
          },
        },
      });

      let updatedReview: any;
      const now = new Date();

      if (existing) {
        updatedReview = await tx.centreSubmoduleReview.update({
          where: { id: existing.id },
          data: {
            status: input.status,
            reworkReason: input.status === 'REWORK_REQUIRED' ? input.reworkReason : null,
            reviewedById: callerUserId,
            reviewedAt: now,
            pmApprovedById: input.status === 'VERIFIED' ? callerUserId : undefined,
            pmApprovedAt: input.status === 'VERIFIED' ? now : undefined,
          },
        });
      } else {
        updatedReview = await tx.centreSubmoduleReview.create({
          data: {
            centreId: centreId!,
            submoduleKey: input.submoduleKey,
            sectionKey,
            status: input.status,
            reworkReason: input.status === 'REWORK_REQUIRED' ? input.reworkReason : null,
            reviewedById: callerUserId,
            reviewedAt: now,
            pmApprovedById: input.status === 'VERIFIED' ? callerUserId : null,
            pmApprovedAt: input.status === 'VERIFIED' ? now : null,
          },
        });
      }

      // If rework required, update Centre status to Rework Required
      if (input.status === 'REWORK_REQUIRED') {
        await tx.centre.update({
          where: { id: centreId },
          data: {
            centreStatus: 'Rework Required',
            rejectionReason: `[${input.submoduleKey}${sectionKey ? `:${sectionKey}` : ''}] ${input.reworkReason}`,
          },
        });
      }

      // Audit Trail
      await tx.auditLog.create({
        data: {
          userId: callerUserId,
          userEmail: callerEmail,
          action: 'SUBMODULE_REVIEW_UPDATED',
          entity: 'CentreSubmoduleReview',
          entityId: updatedReview.id,
          details: {
            centreId,
            submoduleKey: input.submoduleKey,
            sectionKey,
            status: input.status,
            reworkReason: input.reworkReason || null,
          },
        },
      });

      return updatedReview;
    });
  }

  /**
   * Retrieves all submodule & section review states for a centre
   */
  static async getSubmoduleReviews(callerUserId: string, callerRole: string, targetCentreId?: string) {
    let centreId = targetCentreId;
    if (!centreId || callerRole === 'CENTRE') {
      const centre = await this.resolveCentreForUser(callerUserId);
      if (!centre) return [];
      centreId = centre.id;
    }

    return prisma.centreSubmoduleReview.findMany({
      where: { centreId },
      orderBy: [{ submoduleKey: 'asc' }, { sectionKey: 'asc' }],
    });
  }

  /**
   * Final submission of Centre Registration Application
   * Performs full business rule, bank duplicate check, and transitions status
   */
  static async submitRegistration(userId: string, userEmail: string) {
    const centre = await this.resolveCentreForUser(userId);
    if (!centre) {
      throw new Error('Registration record not found.');
    }

    const fullCentre = await prisma.centre.findUnique({
      where: { id: centre.id },
      include: {
        contacts: true,
        capacity: true,
        documents: true,
        infrastructure: true,
        bankAccount: true,
      },
    });

    if (!fullCentre) {
      throw new Error('Registration record not found.');
    }

    if (fullCentre.centreStatus === 'Ready to Book' || fullCentre.centreStatus === 'Approved') {
      throw new Error('This centre application is already approved and active.');
    }

    // 0. Bank Account Duplicate Check (Section 14.9)
    if (fullCentre.bankAccount?.accountNumber) {
      const duplicateBank = await prisma.centreBankAccount.findFirst({
        where: {
          accountNumber: fullCentre.bankAccount.accountNumber,
          centreId: { not: fullCentre.id },
        },
        include: { centre: { select: { centreName: true, centreCode: true } } },
      });

      if (duplicateBank) {
        throw new Error(
          `This bank account is already associated with another centre (${duplicateBank.centre.centreName} - ${duplicateBank.centre.centreCode}). Please contact the OEMP support team.`
        );
      }
    }

    // 1. Step 1 Validation: Basic Information
    if (!fullCentre.centreName?.trim()) {
      throw new Error('Step 1: Centre Name (As per Document) is required.');
    }
    if (!fullCentre.centreCategory) {
      throw new Error('Step 1: Centre Category is required.');
    }
    if (!fullCentre.centreAddress?.trim()) {
      throw new Error('Step 1: Centre Address is required.');
    }
    if (!fullCentre.stateName || !fullCentre.cityName) {
      throw new Error('Step 1: State and City are required.');
    }
    if (!fullCentre.pincode || !/^\d{6}$/.test(fullCentre.pincode.trim())) {
      throw new Error('Step 1: A valid 6-digit PIN code is required.');
    }
    if (!fullCentre.capacity || fullCentre.capacity.examNodes <= 0) {
      throw new Error('Step 1: Declared Total Nodes (capacity) is required.');
    }
    if (fullCentre.previousExamConducted && !fullCentre.previousEduExam?.trim()) {
      throw new Error('Step 1: Previous Examination details are required when Previous Exam Conducted is Yes.');
    }

    // 2. Step 2 Validation: Personnel Details
    const owner = fullCentre.contacts.find((c) => c.personType === 'Owner' || c.personType === 'OWNER');
    if (!owner || !owner.fullName?.trim() || !owner.contactNumber?.trim()) {
      throw new Error('Step 2: Owner Name and Contact Number are required.');
    }

    // 3. Step 3 Validation: Mandatory Documents
    const uploadedDocTypes = new Set(fullCentre.documents.map((d) => d.documentType.toLowerCase()));
    const missingDocs: string[] = [];

    if (!uploadedDocTypes.has('current_electricity_bill') && !uploadedDocTypes.has('electricity_bill')) {
      missingDocs.push('Current Electricity Bill');
    }
    if (!uploadedDocTypes.has('cancelled_cheque')) {
      missingDocs.push('Cancelled Cheque');
    }
    if (!uploadedDocTypes.has('centre_pan')) {
      missingDocs.push('Centre PAN');
    }
    if (!uploadedDocTypes.has('gst_document') && !uploadedDocTypes.has('gst_certificate')) {
      missingDocs.push('GST Document');
    }

    if (fullCentre.organizationType === 'Trust' || fullCentre.organizationType === 'Society') {
      if (
        !uploadedDocTypes.has('trust_society_certificate') &&
        !uploadedDocTypes.has('trust_deed') &&
        !uploadedDocTypes.has('society_certificate')
      ) {
        missingDocs.push('Trust Deed / Society Certificate');
      }
    }
    if (fullCentre.organizationType === 'Partnership') {
      if (!uploadedDocTypes.has('partnership_deed')) {
        missingDocs.push('Partnership Deed');
      }
    }

    if (missingDocs.length > 0) {
      throw new Error(`Step 3: Missing required document(s): ${missingDocs.join(', ')}.`);
    }

    // 4. Step 7 Validation: Bank Account Details
    const bank = fullCentre.bankAccount;
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

    const hasBankProof =
      Boolean(bank.cancelledChequeUrl) ||
      Boolean(bank.passbookUrl) ||
      uploadedDocTypes.has('cancelled_cheque') ||
      uploadedDocTypes.has('bank_passbook');

    if (!hasBankProof) {
      throw new Error('Step 7: At least one bank proof must be uploaded (Cancelled Cheque or Bank Passbook).');
    }

    const benName = bank.accountName.toLowerCase().trim();
    const cName = fullCentre.centreName.toLowerCase().trim();
    const oName = (owner?.fullName || '').toLowerCase().trim();
    const isMatch = Boolean(
      benName.includes(cName) ||
        cName.includes(benName) ||
        (oName && (benName.includes(oName) || oName.includes(benName)))
    );

    // 5. Transition Status in Transaction
    return prisma.$transaction(
      async (tx) => {
        const updatedCentre = await tx.centre.update({
          where: { id: fullCentre.id },
          data: {
            centreStatus: 'Registered',
            rejectionReason: null,
          },
        });

        await tx.centreBankAccount.update({
          where: { centreId: fullCentre.id },
          data: {
            verificationStatus: 'Pending Verification',
            beneficiaryMatched: isMatch,
          },
        });

        // Set submodules to SUBMITTED if currently NOT_STARTED, DRAFT, or REWORK_REQUIRED
        const submodules = ['BASIC_INFO', 'PERSONNEL', 'DOCUMENTS', 'BUILDING_INFRA', 'POWER_NETWORK', 'BANK_DETAILS'];
        for (const sm of submodules) {
          const rev = await tx.centreSubmoduleReview.findUnique({
            where: {
              centreId_submoduleKey_sectionKey: {
                centreId: fullCentre.id,
                submoduleKey: sm,
                sectionKey: '',
              },
            },
          });

          if (!rev || rev.status !== 'VERIFIED') {
            await tx.centreSubmoduleReview.upsert({
              where: {
                centreId_submoduleKey_sectionKey: {
                  centreId: fullCentre.id,
                  submoduleKey: sm,
                  sectionKey: '',
                },
              },
              create: {
                centreId: fullCentre.id,
                submoduleKey: sm,
                sectionKey: '',
                status: 'SUBMITTED',
              },
              update: {
                status: 'SUBMITTED',
                reworkReason: null,
              },
            });
          }
        }

        await tx.auditLog.create({
          data: {
            userId,
            userEmail,
            action: 'CENTRE_APPLICATION_SUBMITTED',
            entity: 'Centre',
            entityId: fullCentre.id,
            details: {
              centreCode: fullCentre.centreCode,
              status: 'Registered',
              totalNodes: fullCentre.capacity?.examNodes,
              beneficiaryMatched: isMatch,
            },
          },
        });

        return {
          success: true,
          message: 'Your Centre Registration application has been submitted successfully for verification.',
          centre: updatedCentre,
        };
      },
      {
        timeout: 25000,
        maxWait: 10000,
      }
    );
  }

  /**
   * Tracks application status and review milestones with lean document queries
   */
  static async getApplicationStatus(userId: string) {
    const centre = await this.resolveCentreForUser(userId);
    if (!centre) {
      return { hasApplied: false, status: 'Not Started' };
    }

    const [documents, bankAccount, audits, submoduleReviews] = await Promise.all([
      prisma.centreDocument.findMany({
        where: { centreId: centre.id },
        select: {
          documentType: true,
          documentName: true,
          status: true,
          rejectionReason: true,
        },
      }),
      prisma.centreBankAccount.findUnique({
        where: { centreId: centre.id },
        select: {
          verificationStatus: true,
          isPaymentEligible: true,
          rejectionReason: true,
        },
      }),
      prisma.auditAssignment.findMany({
        where: { centreId: centre.id },
        select: {
          assignmentCode: true,
          status: true,
          auditDate: true,
        },
        take: 1,
      }),
      prisma.centreSubmoduleReview.findMany({
        where: { centreId: centre.id },
        select: {
          submoduleKey: true,
          sectionKey: true,
          status: true,
          reworkReason: true,
        },
      }),
    ]);

    const totalDocs = documents.length;
    const verifiedDocs = documents.filter((d) => d.status === 'Verified').length;
    const rejectedDocs = documents.filter((d) => d.status === 'Rejected');

    const totalSubmodules = 6;
    const verifiedSubmodules = submoduleReviews.filter((r) => r.status === 'VERIFIED').length;
    const reworkSubmodules = submoduleReviews.filter((r) => r.status === 'REWORK_REQUIRED');

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
        status: bankAccount?.verificationStatus || 'Not Submitted',
        isPaymentEligible: Boolean(bankAccount?.isPaymentEligible),
        rejectionReason: bankAccount?.rejectionReason || null,
      },
      submodules: {
        total: totalSubmodules,
        verified: verifiedSubmodules,
        reworkRequired: reworkSubmodules.length,
        reworkItems: reworkSubmodules,
      },
      audit: audits[0] || null,
    };
  }
}
