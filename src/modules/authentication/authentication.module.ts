import { Module } from '@nestjs/common';
import { EventModule } from '../../common/events/event.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AuthenticationController } from './controllers/authentication.controller';
import { AuthenticationService } from './services/authentication.service';

@Module({
  imports: [EventModule, SessionsModule],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
})
export class AuthenticationModule {}