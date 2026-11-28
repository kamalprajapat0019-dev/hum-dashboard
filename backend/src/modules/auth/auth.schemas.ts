import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const validateInviteSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
});

export const registerFromInviteSchema = z
  .object({
    token: z.string().min(1, 'Invitation token is required'),
    centreName: z.string().min(2, 'Centre Name must be at least 2 characters'),
    name: z.string().optional(),
    mobile: z.string().min(10, 'Mobile number must be at least 10 digits').optional(),
    mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits').optional(),
    phone: z.string().min(10, 'Mobile number must be at least 10 digits').optional(),
    email: z.string().email('Valid email is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter (A-Z)')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter (a-z)')
      .regex(/[0-9]/, 'Password must contain at least one number (0-9)')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&*)'),
    confirmPassword: z.string().min(8, 'Confirm password is required'),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
  })
  .refine((data) => !!(data.mobile || data.mobileNumber || data.phone), {
    message: 'Valid 10-digit mobile number is required',
    path: ['mobileNumber'],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password and Confirm Password must match exactly',
    path: ['confirmPassword'],
  })
  .transform((data) => {
    const resolvedMobile = (data.mobile || data.mobileNumber || data.phone || '').trim();
    return {
      ...data,
      mobile: resolvedMobile,
      mobileNumber: resolvedMobile,
      phone: resolvedMobile,
    };
  });

export const verifyOtpSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  otpType: z.enum(['EMAIL', 'MOBILE']),
  otpCode: z.string().min(4, 'OTP code is required'),
});

export const resendInviteOtpSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  otpType: z.enum(['EMAIL', 'MOBILE']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ValidateInviteInput = z.infer<typeof validateInviteSchema>;
export type RegisterFromInviteInput = z.infer<typeof registerFromInviteSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendInviteOtpInput = z.infer<typeof resendInviteOtpSchema>;
