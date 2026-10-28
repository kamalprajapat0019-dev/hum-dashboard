import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    API_PREFIX: z.string().default('/api/v1'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),

    // Remote MySQL Configuration
    DB_HOST: z.string().default('82.29.160.161'),
    DB_PORT: z.string().default('3306').transform((val) => parseInt(val, 10)),
    DB_NAME: z.string().default('hum_database'),
    DB_USER: z.string().default('admin_user'),
    DB_PASSWORD: z.string().default(''),

    // Prisma DATABASE_URL (derived from DB_* if not explicitly defined)
    DATABASE_URL: z.string().optional(),

    // JWT Authentication
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
    JWT_EXPIRES_IN: z.string().default('8h'),

    // Initial Admin Setup Seed
    INITIAL_ADMIN_EMAIL: z.string().email().default('admin@oemportal.in'),
    INITIAL_ADMIN_PASSWORD: z.string().min(6).default('admin_secure_pass_123'),
    INITIAL_ADMIN_NAME: z.string().default('Rajesh Kumar'),
  })
  .transform((data) => {
    // Construct database URL with properly encoded credentials (prevent double-encoding)
    const safeUser = encodeURIComponent(decodeURIComponent(data.DB_USER));
    const safePass = encodeURIComponent(decodeURIComponent(data.DB_PASSWORD));
    const databaseUrl =
      data.DATABASE_URL &&
      data.DATABASE_URL.length > 0 &&
      !data.DATABASE_URL.includes('/hum_databse') &&
      !data.DATABASE_URL.includes('admin_user:@')
        ? data.DATABASE_URL
        : `mysql://${safeUser}:${safePass}@${data.DB_HOST}:${data.DB_PORT}/${data.DB_NAME}`;

    // Ensure DATABASE_URL is in process.env for Prisma
    process.env.DATABASE_URL = databaseUrl;

    return {
      ...data,
      DATABASE_URL: databaseUrl,
    };
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Sanitize errors so credentials/passwords are never printed
  console.error('❌ Invalid environment variables configuration');
  throw new Error('Environment configuration validation failed.');
}

export const env = parsed.data;

