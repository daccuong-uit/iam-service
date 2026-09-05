import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, refreshToken: string, expiresAt: Date) {
    return this.prisma.session.create({
      data: { userId, refreshTokenHash: this.hash(refreshToken), expiresAt },
    });
  }

  async findActive(refreshToken: string) {
    return this.prisma.session.findUnique({
      where: { refreshTokenHash: this.hash(refreshToken) },
    });
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}