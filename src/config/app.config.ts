import 'dotenv/config';
import { loadConfig, BaseEnvSchema } from '@daccuong-uit/platform-config';
import { z } from 'zod';

const IamEnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
}).transform((data) => ({ ...data, PORT: data.PORT }));

export const appConfig = loadConfig(IamEnvSchema);
export type AppConfig = typeof appConfig;