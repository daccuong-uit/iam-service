import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { EventModule } from '../../common/events/event.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';

@Module({
  imports: [PrismaModule, EventModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
