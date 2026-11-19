import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
  tokenType?: 'access' | 'refresh';
}

export function generateToken(payload: TokenPayload): string {
  // @ts-expect-error jsonwebtoken types mismatch on expiresIn string
  return jwt.sign({ ...payload, tokenType: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, tokenType: 'refresh' }, env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  if (decoded.tokenType && decoded.tokenType !== 'refresh') {
    throw new Error('Invalid token type for refresh operation');
  }
  return decoded;
}
