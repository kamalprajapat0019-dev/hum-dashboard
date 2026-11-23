import { z } from 'zod';

export const saveDraftSchema = z
  .object({
    centreName: z.string().optional(),
    centreCategory: z.string().nullable().optional(),
    regionId: z.string().nullable().optional(),
    stateId: z.string().nullable().optional(),
    cityId: z.string().nullable().optional(),
    stateName: z.string().nullable().optional(),
    cityName: z.string().nullable().optional(),
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
    capacity: z.record(z.unknown()).optional(),
    contacts: z.array(z.record(z.unknown())).optional(),
    infrastructure: z.record(z.unknown()).optional(),
    bankAccount: z.record(z.unknown()).optional(),
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
  role: z.string().optional().default('CENTRE'),
  centreId: z.string().optional(),
  scope: z.record(z.unknown()).optional(),
});

export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type InviteCentreUserInput = z.infer<typeof inviteCentreUserSchema>;
