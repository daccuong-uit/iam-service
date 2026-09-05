import { Module } from '@nestjs/common';
import { AuthorizationService } from './services/authorization.service';

@Module({ providers: [AuthorizationService], exports: [AuthorizationService] })
export class AuthorizationModule {}