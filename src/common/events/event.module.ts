import { Module } from '@nestjs/common';
import { EventBusService } from '@daccuong-uit/platform-event-bus';

@Module({
  providers: [
    {
      provide: EventBusService,
      useFactory: () => new EventBusService(process.env.REDIS_URL ?? 'redis://localhost:6379'),
    },
  ],
  exports: [EventBusService],
})
export class EventModule {}