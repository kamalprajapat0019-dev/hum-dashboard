import { z } from 'zod';
import { Role, UserStatus } from '@prisma/client';

export const paginationSchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 20)),
  search: z.string().optional(),
});

export const userQuerySchema = paginationSchema.extend({
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.nativeEnum(Role),
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
  role: z.nativeEnum(Role).optional(),
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

export const projectQuerySchema = paginationSchema.extend({
  status: z.string().optional(),
  stage: z.string().optional(),
  clientId: z.string().optional(),
});

export const createProjectSchema = z.object({
  projectCode: z.string().min(3),
  name: z.string().min(3),
  clientId: z.string().min(1),
  examType: z.string().min(2),
  stage: z.string().default('Setup'),
  status: z.string().default('Active'),
  examDate: z.string().optional(),
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
