import 'dotenv/config';
import { loadConfig, BaseEnvSchema } from '@platform/config';
import { z } from 'zod';

const IdentityEnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().default(3002),
  IDENTITY_SERVICE_PORT: z.coerce.number().default(3002),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default('*'),
}).transform((data) => ({
  ...data,
  PORT: data.IDENTITY_SERVICE_PORT || data.PORT,
}));

export const appConfig = loadConfig(IdentityEnvSchema);
export type AppConfig = typeof appConfig;
