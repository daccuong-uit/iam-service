import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-auth';
import { createLogger } from '@platform/logger';

const logger = createLogger({ service: 'auth-service:prisma' });

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    logger.info('Database connection established');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    logger.info('Database connection closed');
  }
}
