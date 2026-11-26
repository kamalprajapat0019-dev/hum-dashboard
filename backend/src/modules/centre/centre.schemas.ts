import { z } from 'zod';

export const SUBMODULE_KEYS = [
  'BASIC_INFO',
  'PERSONNEL',
  'DOCUMENTS',
  'BUILDING_INFRA',
  'POWER_NETWORK',
  'BANK_DETAILS',
] as const;

export const SUBMODULE_STATUSES = [
  'NOT_STARTED',
  'DRAFT',
  'SUBMITTED',
  'UNDER_AUDIT',
  'PM_REVIEW',
  'REWORK_REQUIRED',
  'VERIFIED',
] as const;

export const labDraftSchema = z
  .object({
    id: z.string().optional(),
    labOrder: z.coerce.number().optional().default(1),
    labName: z.string().min(1, 'Lab Name is required'),
    labType: z.string().optional().default('Dedicated CBT Lab'),
    customLabType: z.string().nullable().optional(),
    totalNodes: z.coerce.number().optional().default(0),
    examNodes: z.coerce.number().optional().default(0),
    workingNodes: z.coerce.number().optional().default(0),
    pwdSuitable: z.boolean().optional().default(false),
    adjacentComputerDistanceFt: z.coerce.number().nullable().optional(),
    partitionAvailable: z.boolean().optional().default(false),
    partitionType: z.string().nullable().optional(),
    systemOwnership: z.string().optional().default('Owned'),
    systemOwnershipRemarks: z.string().nullable().optional(),
    renovationPlanned: z.boolean().optional().default(false),
    renovationStartDate: z.string().nullable().optional(),
    renovationEndDate: z.string().nullable().optional(),
    renovationRemarks: z.string().nullable().optional(),
    canFormatSystems: z.boolean().optional().default(false),
    canChangeIp: z.boolean().optional().default(false),
    canChangeSystemNames: z.boolean().optional().default(false),
    internetAvailable: z.boolean().optional().default(false),
    upsAvailable: z.boolean().optional().default(false),
    upsCapacityKva: z.coerce.number().nullable().optional(),
    printerAvailable: z.boolean().optional().default(false),
    biometricAvailable: z.boolean().optional().default(false),
    cctvAvailable: z.boolean().optional().default(false),
    cctvCount: z.coerce.number().optional().default(0),
    jammerInstallable: z.boolean().optional().default(false),
    seatingType: z.string().nullable().optional(),
    candidateDeskAvailable: z.boolean().optional().default(false),
    candidateChairAvailable: z.boolean().optional().default(false),
    invigilatorSeatAvailable: z.boolean().optional().default(false),
    whiteboardAvailable: z.boolean().optional().default(false),
    fireExtinguisherAvailable: z.boolean().optional().default(false),
    emergencyExitAvailable: z.boolean().optional().default(false),
    emergencySignageAvailable: z.boolean().optional().default(false),
    firstAidAvailable: z.boolean().optional().default(false),
  })
  .passthrough();

export const floorDraftSchema = z
  .object({
    id: z.string().optional(),
    floorOrder: z.coerce.number().optional().default(1),
    floorName: z.string().min(1, 'Floor Name is required'),
    noOfLabs: z.coerce.number().optional().default(1),
    washroomsAvailable: z.boolean().optional().default(false),
    totalWashrooms: z.coerce.number().optional().default(0),
    maleWashrooms: z.coerce.number().optional().default(0),
    femaleWashrooms: z.coerce.number().optional().default(0),
    drinkingWaterAvailable: z.boolean().optional().default(false),
    acAvailable: z.boolean().optional().default(false),
    sufficientFans: z.boolean().optional().default(false),
    fireExtinguisherAvailable: z.boolean().optional().default(false),
    cctvCoverage: z.boolean().optional().default(false),
    pwdAccessible: z.boolean().optional().default(false),
    rampOrLiftAccess: z.boolean().optional().default(false),
    pwdWashroomAvailable: z.boolean().optional().default(false),
    labs: z.array(labDraftSchema).optional().default([]),
  })
  .passthrough();

export const buildingDraftSchema = z
  .object({
    id: z.string().optional(),
    buildingOrder: z.coerce.number().optional().default(1),
    buildingName: z.string().min(1, 'Building Name is required'),
    noOfFloors: z.coerce.number().optional().default(1),
    entryGateCount: z.coerce.number().optional().default(1),
    exitGateCount: z.coerce.number().optional().default(1),
    receptionPresent: z.boolean().optional().default(false),
    waitingAreaPresent: z.boolean().optional().default(false),
    drinkingWaterAvailable: z.boolean().optional().default(false),
    liftAvailable: z.boolean().optional().default(false),
    noOfLifts: z.coerce.number().optional().default(0),
    floors: z.array(floorDraftSchema).optional().default([]),
  })
  .passthrough();

export const saveDraftSchema = z
  .object({
    centreName: z.string().optional(),
    centreCategory: z.string().nullable().optional(),
    customCentreCategory: z.string().nullable().optional(),
    regionId: z.string().nullable().optional(),
    stateId: z.string().nullable().optional(),
    cityId: z.string().nullable().optional(),
    stateName: z.string().nullable().optional(),
    cityName: z.string().nullable().optional(),
    district: z.string().nullable().optional(),
    taluka: z.string().nullable().optional(),
    centreAddress: z.string().optional(),
    pincode: z.string().optional(),
    eduCode: z.string().nullable().optional(),
    tcCode: z.string().nullable().optional(),
    venueStatus: z.string().optional(),
    previousExamConducted: z.boolean().optional(),
    previousEduExam: z.string().nullable().optional(),
    officialEmail: z.string().optional(),
    officialMobile: z.string().nullable().optional(),
    alternateMobile: z.string().nullable().optional(),
    phoneStd: z.string().nullable().optional(),
    googleMapLink: z.string().nullable().optional(),
    remarks: z.string().nullable().optional(),
    organizationType: z.string().optional(),
    totalNodes: z.union([z.number(), z.string()]).optional(),
    actualNodes: z.coerce.number().optional(),
    examNodes: z.coerce.number().optional(),
    bufferNodes: z.coerce.number().optional(),
    capacity: z.record(z.unknown()).optional(),
    contacts: z.array(z.record(z.unknown())).optional(),
    infrastructure: z.record(z.unknown()).optional(),
    bankAccount: z.record(z.unknown()).optional(),
    buildings: z.array(buildingDraftSchema).optional(),
  })
  .passthrough();

export const uploadDocumentSchema = z.object({
  documentType: z.string().min(1, 'Document type is required'),
  documentName: z.string().optional(),
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().min(1, 'File URL or content is required'),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
});

export const inviteCentreUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
  role: z.string().optional().default('CENTRE'),
  centreId: z.string().optional(),
  scope: z.record(z.unknown()).optional(),
});

export const reviewSubmoduleSchema = z.object({
  submoduleKey: z.enum(SUBMODULE_KEYS, {
    errorMap: () => ({ message: `Invalid submodule key. Allowed: ${SUBMODULE_KEYS.join(', ')}` }),
  }),
  sectionKey: z.string().optional().default(''),
  status: z.enum(SUBMODULE_STATUSES, {
    errorMap: () => ({ message: `Invalid status. Allowed: ${SUBMODULE_STATUSES.join(', ')}` }),
  }),
  reworkReason: z.string().optional().nullable(),
  centreId: z.string().optional(),
});

export const uploadMediaAssetSchema = z.object({
  entityType: z.enum([
    'CENTRE',
    'CONTACT',
    'DOCUMENT',
    'BUILDING',
    'FLOOR',
    'LAB',
    'POWER_NETWORK',
    'BANK',
  ]),
  entityId: z.string().min(1, 'entityId is required'),
  fieldKey: z.string().min(1, 'fieldKey is required'),
  assetCategory: z.enum(['PHOTO', 'DOCUMENT']).optional().default('PHOTO'),
  fileName: z.string().min(1, 'fileName is required'),
  fileUrl: z.string().min(1, 'fileUrl (Base64 payload or URL) is required'),
  fileSize: z.number().optional(),
  mimeType: z.string().min(1, 'mimeType is required'),
  centreId: z.string().optional(),
});

export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type InviteCentreUserInput = z.infer<typeof inviteCentreUserSchema>;
export type ReviewSubmoduleInput = z.infer<typeof reviewSubmoduleSchema>;
export type UploadMediaAssetInput = z.infer<typeof uploadMediaAssetSchema>;
