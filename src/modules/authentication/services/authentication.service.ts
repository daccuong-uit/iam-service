import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { EventBusService } from '@daccuong-uit/platform-event-bus';
import { UserCreatedEvent } from '@daccuong-uit/contracts-events';
import { JwtService } from '@daccuong-uit/platform-security-sdk';
import { createLogger } from '@daccuong-uit/platform-logger';
import { appConfig } from '../../../config/app.config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { SessionsService } from '../../sessions/services/sessions.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import {
  createOtpData,
  generateOtp,
  generateOtpKey,
  isOtpExpired,
  sendOtpSms,
  validatePhoneNumber,
} from '../utils/phone-otp.util';

const logger = createLogger({ service: 'iam-service:authentication' });
const jwtService = new JwtService({
  accessTokenSecret: appConfig.JWT_ACCESS_SECRET,
  refreshTokenSecret: appConfig.JWT_REFRESH_SECRET,
  accessTokenExpiresIn: appConfig.JWT_ACCESS_EXPIRES_IN,
  refreshTokenExpiresIn: appConfig.JWT_REFRESH_EXPIRES_IN,
});

@Injectable()
export class AuthenticationService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly sessions: SessionsService,
  ) {
    this.redis = new Redis(appConfig.REDIS_URL, { enableAutoPipelining: true, maxRetriesPerRequest: 3 });
  }

  async sendOtp(phoneNumber: string) {
    if (!validatePhoneNumber(phoneNumber)) {
      throw new BadRequestException('Số điện thoại không hợp lệ');
    }
    const otp = generateOtp();
    await this.redis.setex(generateOtpKey(phoneNumber), 300, JSON.stringify(createOtpData(phoneNumber, otp)));
    await sendOtpSms(phoneNumber, otp);
    return { message: 'Mã OTP đã được gửi thành công!' };
  }

  private async validateOtp(phoneNumber: string, otp: string) {
    const key = generateOtpKey(phoneNumber);
    const stored = await this.redis.get(key);
    if (!stored) throw new UnauthorizedException('Mã OTP đã hết hạn hoặc không tồn tại');
    const data = JSON.parse(stored) as ReturnType<typeof createOtpData>;
    if (isOtpExpired(data) || data.otp !== otp) {
      await this.redis.del(key);
      throw new UnauthorizedException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }
    await this.redis.del(key);
  }

  async register(dto: RegisterDto) {
    if ((!dto.email && !dto.phoneNumber) || (dto.email && dto.phoneNumber)) {
      throw new BadRequestException('Vui lòng cung cấp chính xác email hoặc số điện thoại');
    }
    if (dto.phoneNumber && !dto.otp) {
      throw new BadRequestException('Vui lòng cung cấp mã OTP khi đăng ký bằng số điện thoại');
    }
    if (dto.email && !dto.password) {
      throw new BadRequestException('Vui lòng cung cấp mật khẩu khi đăng ký bằng email');
    }
    if (dto.phoneNumber) await this.validateOtp(dto.phoneNumber, dto.otp!);

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, ...(dto.email ? [{ email: dto.email }] : []), ...(dto.phoneNumber ? [{ phoneNumber: dto.phoneNumber }] : [])] },
    });
    if (existing) throw new ConflictException('Thông tin tài khoản đã tồn tại');

    const passwordHash = dto.password ? await argon2.hash(dto.password) : null;
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          username: dto.username,
          preferredContactMethod: dto.email ? 'EMAIL' : 'PHONE',
          status: 'ACTIVE',
          profile: { create: { displayName: dto.displayName } },
          ...(passwordHash ? { credentials: { create: { type: 'PASSWORD', passwordHash } } } : {}),
        },
        include: { profile: true },
      });
      return createdUser;
    });

    await this.publishUserCreated(user);
    const tokens = jwtService.signTokenPair(user.id, user.email || user.phoneNumber || user.username, randomUUID());
    await this.sessions.create(user.id, tokens.refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    return { message: 'Đăng ký tài khoản thành công', accountId: user.id, ...tokens };
  }

  async login(dto: LoginDto) {
    if (!dto.email && !dto.phoneNumber) throw new BadRequestException('Yêu cầu đăng nhập không hợp lệ');
    if (dto.phoneNumber && dto.otp) await this.validateOtp(dto.phoneNumber, dto.otp);
    else if (!dto.password) throw new BadRequestException('Vui lòng cung cấp mật khẩu hoặc mã OTP');

    const user = await this.prisma.user.findUnique({
      where: dto.email ? { email: dto.email } : { phoneNumber: dto.phoneNumber },
      include: { credentials: { where: { type: 'PASSWORD' } } },
    });
    if (!user || user.status === 'BANNED') throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    if (dto.password) {
      const credential = user.credentials[0];
      if (!credential?.passwordHash || !(await argon2.verify(credential.passwordHash, dto.password))) {
        throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
      }
    }
    const tokens = jwtService.signTokenPair(user.id, user.email || user.phoneNumber || user.username, randomUUID());
    await this.sessions.create(user.id, tokens.refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    return { message: 'Đăng nhập thành công', accountId: user.id, ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwtService.verifyRefreshToken(refreshToken);
      const session = await this.sessions.findActive(refreshToken);
      if (!session || session.revokedAt || session.expiresAt <= new Date()) {
        throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
      }
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new NotFoundException('Tài khoản không tồn tại');
      if (user.status === 'BANNED') throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
      const tokens = jwtService.signTokenPair(user.id, user.email || user.phoneNumber || user.username, randomUUID());
      await this.sessions.rotate(session.id, tokens.refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      return { message: 'Làm mới token thành công', ...tokens };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token xác thực không hợp lệ hoặc đã hết hạn');
    }
  }

  async getAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');
    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      username: user.username,
      displayName: user.profile?.displayName,
      status: user.status,
      preferredContactMethod: user.preferredContactMethod,
      createdAt: user.createdAt,
    };
  }

  private async publishUserCreated(user: Prisma.UserGetPayload<{ include: { profile: true } }>) {
    try {
      const event: UserCreatedEvent = {
        event_id: randomUUID(),
        event_name: 'user.created.v1',
        trace_id: randomUUID(),
        occurred_at: new Date().toISOString(),
        producer: 'iam-service',
        payload: {
          userId: user.id,
          email: user.email ?? undefined,
          phoneNumber: user.phoneNumber ?? undefined,
          username: user.username,
          displayName: user.profile?.displayName ?? user.username,
          preferredContactMethod: user.preferredContactMethod as 'EMAIL' | 'PHONE',
        },
      };
      await this.eventBus.publish(event);
    } catch (error) {
      logger.warn('Failed to publish user.created event', { userId: user.id, error });
    }
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}