import 'dotenv/config';
import { loadConfig, BaseEnvSchema } from '@platform/config';
import { z } from 'zod';

const AuthEnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().default(3001),
  AUTH_SERVICE_PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  IDENTITY_SERVICE_URL: z.string().url().default('http://localhost:3002'),
}).transform((data) => ({
  ...data,
  PORT: data.AUTH_SERVICE_PORT || data.PORT,
}));

export const appConfig = loadConfig(AuthEnvSchema);
export type AppConfig = typeof appConfig;
