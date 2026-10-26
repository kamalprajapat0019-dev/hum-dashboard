import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/hasher.js';
import { generateToken, verifyToken } from '../src/utils/jwt.js';
import { Role } from '@prisma/client';
import { loginSchema } from '../src/modules/auth/auth.schemas.js';
import { createUserSchema } from '../src/modules/admin/admin.schemas.js';

describe('Password Hashing Utility', () => {
  it('should hash passwords with salt and verify successfully', async () => {
    const raw = 'SecureSecretPassword123!';
    const hashed = await hashPassword(raw);

    expect(hashed).not.toBe(raw);
    expect(hashed.startsWith('$2')).toBe(true);

    const isMatch = await verifyPassword(raw, hashed);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword('WrongPassword', hashed);
    expect(isWrongMatch).toBe(false);
  });
});

describe('JWT Token Utility', () => {
  it('should generate and verify JWT token correctly', () => {
    const payload = {
      userId: 'usr_12345',
      email: 'admin@oemportal.in',
      role: Role.ADMIN,
      name: 'Rajesh Kumar',
    };

    const token = generateToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.name).toBe(payload.name);
  });
});

describe('Input Validation Schemas', () => {
  it('should validate login credentials schema correctly', () => {
    const valid = loginSchema.safeParse({
      email: 'admin@oemportal.in',
      password: 'mypassword123',
    });
    expect(valid.success).toBe(true);

    const invalidEmail = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password',
    });
    expect(invalidEmail.success).toBe(false);

    const missingPassword = loginSchema.safeParse({
      email: 'admin@oemportal.in',
      password: '',
    });
    expect(missingPassword.success).toBe(false);
  });

  it('should validate user creation schema correctly', () => {
    const validUser = createUserSchema.safeParse({
      email: 'newpm@oemportal.in',
      password: 'StrongPassword123',
      name: 'Priya Sharma',
      role: Role.PM,
    });
    expect(validUser.success).toBe(true);

    const shortPassword = createUserSchema.safeParse({
      email: 'newpm@oemportal.in',
      password: 'short',
      name: 'Priya',
      role: Role.PM,
    });
    expect(shortPassword.success).toBe(false);
  });
});
