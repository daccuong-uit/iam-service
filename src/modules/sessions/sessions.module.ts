import { Module } from '@nestjs/common';
import { SessionsService } from './services/sessions.service';

@Module({ providers: [SessionsService], exports: [SessionsService] })
export class SessionsModule {}