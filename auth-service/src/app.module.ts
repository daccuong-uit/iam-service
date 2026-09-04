import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { EventModule } from './events/event.module';

@Module({
  imports: [
    EventModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
