import { z } from 'zod';
import { Role, UserStatus } from '@prisma/client';

export const paginationSchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 20)),
  search: z.string().optional(),
});

export const roleSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const map: Record<string, Role> = {
      admin: Role.ADMIN,
      ADMIN: Role.ADMIN,
      project_manager: Role.PM,
      pm: Role.PM,
      PM: Role.PM,
      auditor_it: Role.AUDITOR,
      auditor: Role.AUDITOR,
      AUDITOR: Role.AUDITOR,
      operations_executive: Role.OPERATIONS,
      operations: Role.OPERATIONS,
      ops: Role.OPERATIONS,
      OPERATIONS: Role.OPERATIONS,
      accounts_finance: Role.FINANCE,
      finance: Role.FINANCE,
      FINANCE: Role.FINANCE,
      centre_user: Role.CENTRE,
      centre: Role.CENTRE,
      CENTRE: Role.CENTRE,
    };
    return map[val] || val;
  }
  return val;
}, z.nativeEnum(Role));

export const userQuerySchema = paginationSchema.extend({
  role: roleSchema.optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .optional()
    .default('TempPass@2026'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  role: roleSchema,
  status: z.nativeEnum(UserStatus).default(UserStatus.Active),
  scope: z
    .object({
      clients: z.array(z.string()).default(['all']),
      projects: z.array(z.string()).default(['all']),
      centres: z.array(z.string()).default(['all']),
    })
    .optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: roleSchema.optional(),
  status: z.nativeEnum(UserStatus).optional(),
  password: z.string().min(8).optional(),
  scope: z
    .object({
      clients: z.array(z.string()).optional(),
      projects: z.array(z.string()).optional(),
      centres: z.array(z.string()).optional(),
    })
    .optional(),
});

export const analyticsQuerySchema = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  examTypeId: z.string().optional(),
  examId: z.string().optional(),
});

export const updateClientStatusSchema = z.object({
  status: z.enum(['Active', 'Inactive']).optional(),
  isActive: z.boolean().optional(),
});

export const updateProjectStatusSchema = z.object({
  status: z.enum(['Active', 'OnHold', 'Completed', 'Closed']),
});

export const examTypeQuerySchema = paginationSchema.extend({
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export const createExamTypeSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  examCode: z.string().min(2, 'Exam code must be at least 2 characters'),
  examTypeName: z.string().min(2, 'Exam type name must be at least 2 characters'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateExamTypeSchema = createExamTypeSchema.partial();

export const updateExamTypeStatusSchema = z.object({
  isActive: z.boolean(),
});

export const examQuerySchema = paginationSchema.extend({
  examTypeId: z.string().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  status: z.string().optional(),
});

export const createExamSchema = z.object({
  examTypeId: z.string().min(1, 'Exam Type ID is required'),
  examCode: z.string().min(2, 'Exam code must be at least 2 characters'),
  examName: z.string().min(2, 'Exam name must be at least 2 characters'),
  examYear: z.number().int().min(2020).max(2100).default(new Date().getFullYear()),
  description: z.string().optional(),
  status: z.enum(['Scheduled', 'InProgress', 'Completed', 'Cancelled']).default('Scheduled'),
});

export const updateExamSchema = createExamSchema.partial();

export const createExamDateSchema = z.object({
  examDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date format'),
  reportingTime: z.string().optional(),
  status: z.enum(['Scheduled', 'Completed', 'Postponed', 'Cancelled']).default('Scheduled'),
});

export const createExamShiftSchema = z.object({
  shiftName: z.string().min(2, 'Shift name is required'),
  shiftNumber: z.number().int().positive().default(1),
  startTime: z.string().min(2, 'Start time is required'),
  endTime: z.string().min(2, 'End time is required'),
  reportingTime: z.string().optional(),
  status: z.enum(['Scheduled', 'InProgress', 'Completed', 'Cancelled']).default('Scheduled'),
});

export const clientQuerySchema = paginationSchema.extend({
  status: z.string().optional(),
});

export const createClientSchema = z.object({
  code: z.string().min(2).optional(),
  name: z.string().min(2, 'Client name must be at least 2 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  contactEmail: z.string().email(),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

export const updateClientSchema = createClientSchema.partial();

export const projectExamDateItemSchema = z.object({
  id: z.string().optional(),
  examDate: z.string().min(1, 'Exam date is required'),
  shift: z.string().min(1).default('Shift 1'),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
});

export const calendarQuerySchema = z.object({
  year: z.string().optional().transform((v) => (v ? parseInt(v, 10) : new Date().getFullYear())),
  month: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  clientId: z.string().optional(),
  agency: z.string().optional(),
  date: z.string().optional(),
});

export const projectQuerySchema = paginationSchema.extend({
  status: z.string().optional(),
  stage: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  examTypeId: z.string().optional(),
});

export const createProjectSchema = z.object({
  projectCode: z.string().min(3),
  name: z.string().min(3),
  clientId: z.string().min(1),
  examType: z.string().min(2),
  description: z.string().optional(),
  stage: z.string().default('Setup'),
  status: z.string().default('Active'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  examDate: z.string().optional(),
  examDates: z.array(projectExamDateItemSchema).optional(),
  citiesCount: z.number().int().nonnegative().default(0),
  candidateTarget: z.number().int().nonnegative().default(0),
  centreTarget: z.number().int().nonnegative().default(0),
  pmId: z.string().optional(),
  slaHealth: z.enum(['OnTrack', 'AtRisk', 'Delayed', 'Completed']).default('OnTrack'),
});

export const updateProjectSchema = createProjectSchema.partial();

export const centreQuerySchema = paginationSchema.extend({
  regionId: z.string().optional(),
  stateId: z.string().optional(),
  cityId: z.string().optional(),
  status: z.string().optional(),
  eligibilityStatus: z.string().optional(),
});

export const createCentreSchema = z.object({
  centreCode: z.string().min(3),
  centreName: z.string().min(3),
  centreAddress: z.string().min(5),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
  regionId: z.string().optional(),
  stateId: z.string().optional(),
  cityId: z.string().optional(),
  stateName: z.string().optional(),
  cityName: z.string().optional(),
  eduCode: z.string().optional(),
  tcCode: z.string().optional(),
  venueStatus: z.enum(['New', 'Old']).default('Old'),
  previousEduExam: z.string().optional(),
  officialEmail: z.string().email().optional(),
  googleMapLink: z.string().url().optional().or(z.literal('')),
  remarks: z.string().optional(),
  organizationType: z.enum(['Individual', 'Trust', 'Society', 'Partnership', 'Company', 'Other']).default('Trust'),
  centreStatus: z.enum(['Draft', 'Active', 'Approved', 'Rejected', 'Inactive']).default('Draft'),
});

export const updateCentreSchema = createCentreSchema.partial();

export const updateCentreStatusSchema = z.object({
  status: z.enum(['Draft', 'Active', 'Approved', 'Rejected', 'Inactive']),
  reason: z.string().optional(),
});

export const blacklistCentreSchema = z.object({
  centreId: z.string().min(1),
  reason: z.string().min(5, 'A detailed justification must be provided for blacklisting'),
});

export const overrideEligibilitySchema = z.object({
  centreId: z.string().min(1),
  eligibilityStatus: z.enum(['Eligible', 'ConditionallyEligible', 'Ineligible', 'Blacklisted']),
  overrideReason: z.string().min(5, 'A documented justification is mandatory for eligibility override'),
});

export const updateConfigSchema = z.object({
  value: z.record(z.unknown()),
  category: z.string().optional(),
});
