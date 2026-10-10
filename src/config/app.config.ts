import 'dotenv/config';
import { loadConfig, BaseEnvSchema } from '@daccuong-uit/platform-config';
import { z } from 'zod';

const IamEnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  AUTH_JWKS_URI: z.string().url().default('http://localhost:8080/realms/reals/protocol/openid-connect/certs'),
  AUTH_ISSUER: z.string().url().default('http://localhost:8080/realms/reals'),
  AUTH_AUDIENCE: z.string().default('account'),
  AUTH_CLIENT_ID: z.string().default('account'),
  CORS_ORIGIN: z.string().default('*'),
}).transform((data) => ({ ...data, PORT: data.PORT }));

export const appConfig = loadConfig(IamEnvSchema);
export type AppConfig = typeof appConfig;