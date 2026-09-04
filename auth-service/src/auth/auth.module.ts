import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventModule } from '../events/event.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [PrismaModule, EventModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
