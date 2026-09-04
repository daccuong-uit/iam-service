import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-identity';
import { createLogger } from '@platform/logger';

const logger = createLogger({ service: 'identity-service:prisma' });

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
