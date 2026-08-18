import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string().pipe(z.coerce.number().int().positive()).default('3000'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().pipe(z.coerce.number().int()).default('5432'),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
});

export const env = envSchema.parse(process.env);
