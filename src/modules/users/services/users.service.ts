import { Injectable, NotFoundException } from '@nestjs/common';
import { createLogger } from '@daccuong-uit/platform-logger';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateProfileDto, UpdateProfileDto } from '../dto/profile.dto';

const logger = createLogger({ service: 'iam-service:users' });

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(dto: CreateProfileDto & { userId: string; email?: string; username?: string }) {
    const username = dto.username || dto.userId.replaceAll('-', '');
    const displayName = dto.displayName ?? username;
    const user = await this.prisma.user.upsert({
      where: { id: dto.userId },
      create: {
        id: dto.userId,
        email: dto.email,
        username,
        profile: { create: { displayName } },
      },
      update: {
        email: dto.email,
        username,
        profile: {
          upsert: {
            create: { displayName },
            update: dto.displayName ? { displayName } : {},
          },
        },
      },
      include: { profile: true },
    });
    const profile = user.profile!;
    logger.info('Profile synchronized', { profileId: profile.id, userId: user.id });
    return { message: 'Hồ sơ đã được đồng bộ', ...profile, username: user.username };
  }

  async getProfileByUsername(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username }, include: { profile: true } });
    if (!user?.profile) throw new NotFoundException(`Không tìm thấy hồ sơ của @${username}`);
    return { ...user.profile, username: user.username };
  }

  async getProfileByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user?.profile) throw new NotFoundException('Hồ sơ người dùng không tồn tại');
    return { ...user.profile, username: user.username };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user?.profile) throw new NotFoundException('Hồ sơ người dùng không tồn tại');
    const profile = await this.prisma.profile.update({ where: { userId }, data: dto });
    logger.info('Profile updated', { profileId: profile.id, userId });
    return { message: 'Cập nhật hồ sơ thành công', ...profile, username: user.username };
  }
}