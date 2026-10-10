import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { createAuthGuard, JwtVerifier } from '@daccuong-uit/backend-auth';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './modules/users/users.module';

const KeycloakAuthGuard = createAuthGuard(new JwtVerifier({
  jwksUri: process.env.AUTH_JWKS_URI ?? 'http://keycloak:8080/realms/reals/protocol/openid-connect/certs',
  issuer: process.env.AUTH_ISSUER ?? 'http://localhost:8080/realms/reals',
  audience: process.env.AUTH_AUDIENCE ?? 'account',
  clientId: process.env.AUTH_CLIENT_ID ?? 'account',
}));

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: KeycloakAuthGuard }],
})
export class AppModule {}