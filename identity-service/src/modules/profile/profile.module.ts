import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
