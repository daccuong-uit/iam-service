import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './health/health.module';
import { EventModule } from './common/events/event.module';

@Module({
  imports: [
    EventModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
