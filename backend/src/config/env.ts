import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('printopay/documents'),
  CLIENT_ORIGIN: z.string().default('*'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(50),
  KEEP_ALIVE_URL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined),
    z.string().url().startsWith('https://', 'KEEP_ALIVE_URL must use https').optional()
  ),
  KEEP_ALIVE_INTERVAL_MS: z.coerce.number().int().positive().default(10 * 60 * 1000),
  JWT_SECRET: z.string().min(24, 'JWT_SECRET must be at least 24 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ADMIN_SETUP_KEY: z.string().min(12, 'ADMIN_SETUP_KEY must be at least 12 characters'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
