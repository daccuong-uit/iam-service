import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '@daccuong-uit/platform-logger';

const logger = createLogger({ service: 'iam-service:prisma' });

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