import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createLogger } from '@daccuong-uit/platform-logger';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateProfileDto, UpdateProfileDto } from '../dto/profile.dto';

const logger = createLogger({ service: 'iam-service:users' });

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(dto: CreateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId }, include: { profile: true } });
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');
    if (user.username !== dto.username) throw new ConflictException('Username không khớp với tài khoản');
    if (user.profile) throw new ConflictException('Hồ sơ người dùng đã tồn tại');

    const profile = await this.prisma.profile.create({
      data: { userId: user.id, displayName: dto.displayName ?? user.username },
    });
    logger.info('Profile created', { profileId: profile.id, userId: user.id });
    return { message: 'Tạo hồ sơ thành công', ...profile, username: user.username };
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