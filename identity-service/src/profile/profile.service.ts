import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { createLogger } from '@platform/logger';

const logger = createLogger({ service: 'identity-service:profile' });

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(dto: CreateProfileDto) {
    const [existingUser, existingUsername] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId: dto.userId } }),
      this.prisma.profile.findUnique({ where: { username: dto.username } }),
    ]);

    if (existingUser) {
      throw new ConflictException('Hồ sơ người dùng đã tồn tại');
    }
    if (existingUsername) {
      throw new ConflictException('Tên người dùng đã được sử dụng');
    }

    const profile = await this.prisma.profile.create({
      data: {
        userId: dto.userId,
        username: dto.username,
        displayName: dto.displayName ?? dto.username,
      },
    });

    logger.info('Profile created', { profileId: profile.id, userId: dto.userId });
    return { message: 'Tạo hồ sơ thành công', ...profile };
  }

  async getProfileByUsername(username: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { username },
    });

    if (!profile) {
      throw new NotFoundException(`Không tìm thấy hồ sơ của @${username}`);
    }

    return profile;
  }

  async getProfileByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Hồ sơ người dùng không tồn tại');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Hồ sơ người dùng không tồn tại');
    }

    const updated = await this.prisma.profile.update({
      where: { userId },
      data: dto,
    });

    logger.info('Profile updated', { profileId: updated.id });
    return { message: 'Cập nhật hồ sơ thành công', ...updated };
  }
}
