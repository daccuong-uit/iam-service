import { Module } from '@nestjs/common';
import { EventBusService } from '@platform/common';

/**
 * Event Bus Module for Auth Service
 * Provides EventBusService for publishing domain events
 */
@Module({
  providers: [
    {
      provide: EventBusService,
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL || 
          `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
        return new EventBusService(redisUrl);
      },
    },
  ],
  exports: [EventBusService],
})
export class EventModule {}
