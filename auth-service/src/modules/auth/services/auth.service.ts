import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import Redis from 'ioredis';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { JwtService } from '@daccuong-uit/platform-security-sdk';
import { AuthErrorCode } from '@daccuong-uit/platform-security-sdk';
import { appConfig } from '../../../config/app.config';
import { RegisterDto, LoginDto, SendOtpDto } from '../dto/auth.dto';
import { createLogger } from '@daccuong-uit/platform-logger';
import { EventBusService } from '@daccuong-uit/platform-event-bus';
import { UserCreatedEvent } from '@daccuong-uit/contracts-events';
import {
  generateOtp,
  validatePhoneNumber,
  generateOtpKey,
  createOtpData,
  isOtpExpired,
  sendOtpSms,
} from '../utils/phone-otp.util';

const logger = createLogger({ service: 'auth-service:auth' });

const jwtService = new JwtService({
  accessTokenSecret: appConfig.JWT_ACCESS_SECRET,
  refreshTokenSecret: appConfig.JWT_REFRESH_SECRET,
  accessTokenExpiresIn: appConfig.JWT_ACCESS_EXPIRES_IN,
  refreshTokenExpiresIn: appConfig.JWT_REFRESH_EXPIRES_IN,
});

@Injectable()
export class AuthService {
  private redis: Redis;
  private eventBus: EventBusService;

  constructor(private readonly prisma: PrismaService) {
    // Initialize Redis client for OTP storage
    const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
    this.redis = new Redis(redisUrl, {
      enableAutoPipelining: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    // Initialize Event Bus
    this.eventBus = new EventBusService(redisUrl);
  }

  /**
   * Send OTP to phone number
   * Generates a 6-digit OTP, stores in Redis with 5-min TTL, and sends via SMS
   */
  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const { phoneNumber } = dto;

    // Validate phone format
    if (!validatePhoneNumber(phoneNumber)) {
      throw new BadRequestException('Số điện thoại không hợp lệ (định dạng E.164 ví dụ: +84912345678)');
    }

    // Generate OTP
    const otp = generateOtp();
    const otpData = createOtpData(phoneNumber, otp);
    const otpKey = generateOtpKey(phoneNumber);

    // Store OTP in Redis with 5-minute expiry
    const ttlSeconds = 5 * 60;
    await this.redis.setex(otpKey, ttlSeconds, JSON.stringify(otpData));

    // Send OTP via SMS (mock for now)
    await sendOtpSms(phoneNumber, otp);

    logger.info('OTP sent', { phoneNumber });
    return { message: 'Mã OTP đã được gửi thành công!' };
  }

  /**
   * Validate OTP from Redis
   */
  private async validateOtpFromStorage(phoneNumber: string, otp: string): Promise<void> {
    const otpKey = generateOtpKey(phoneNumber);
    const storedData = await this.redis.get(otpKey);

    if (!storedData) {
      throw new UnauthorizedException('Mã OTP đã hết hạn hoặc không tồn tại');
    }

    const otpData = JSON.parse(storedData);

    if (isOtpExpired(otpData)) {
      await this.redis.del(otpKey);
      throw new UnauthorizedException('Mã OTP đã hết hạn');
    }

    if (otpData.otp !== otp) {
      throw new UnauthorizedException('Mã OTP không chính xác');
    }

    // Delete OTP after successful validation
    await this.redis.del(otpKey);
  }

  /**
   * Register: Support 2 flows
   * Flow A: Email + Password
   * Flow B: Phone + OTP + optional Password
   */
  async register(dto: RegisterDto) {
    // Validate that either email or phoneNumber is provided
    if (!dto.email && !dto.phoneNumber) {
      throw new BadRequestException('Vui lòng cung cấp email hoặc số điện thoại');
    }

    // Validate username uniqueness
    const existingUsername = await this.prisma.account.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Tên người dùng đã tồn tại');
    }

    // Flow A: Email + Password registration
    if (dto.email && !dto.phoneNumber) {
      if (!dto.password) {
        throw new BadRequestException('Vui lòng cung cấp mật khẩu khi đăng ký bằng email');
      }

      const existingEmail = await this.prisma.account.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email đã tồn tại trong hệ thống');
      }

      const passwordHash = await argon2.hash(dto.password);
      const account = await this.prisma.account.create({
        data: {
          email: dto.email,
          username: dto.username,
          displayName: dto.displayName,
          passwordHash,
          preferredContactMethod: 'EMAIL',
          status: 'ACTIVE',
        },
      });

      logger.info('Account registered via email', { accountId: account.id, email: dto.email });

      // Publish user.created event
      try {
        const event: UserCreatedEvent = {
          event_id: randomUUID(),
          event_name: 'user.created.v1',
          trace_id: randomUUID(),
          occurred_at: new Date().toISOString(),
          producer: 'auth-service',
          payload: {
            userId: account.id,
            email: account.email ?? undefined,
            username: account.username,
            displayName: account.displayName,
            preferredContactMethod: account.preferredContactMethod as 'EMAIL' | 'PHONE',
          },
        };
        await this.eventBus.publish(event);
      } catch (err) {
        logger.warn('Failed to publish user.created event', { accountId: account.id, error: err });
        // Don't throw - continue with response even if event publishing fails
      }

      const tokens = jwtService.signTokenPair(
        account.id,
        account.email || account.phoneNumber || account.username,
        randomUUID(),
      );
      return {
        message: 'Đăng ký tài khoản thành công',
        accountId: account.id,
        ...tokens,
      };
    }

    // Flow B: Phone + OTP registration
    if (dto.phoneNumber && !dto.email) {
      if (!dto.otp) {
        throw new BadRequestException('Vui lòng cung cấp mã OTP khi đăng ký bằng số điện thoại');
      }

      // Validate phone format
      if (!validatePhoneNumber(dto.phoneNumber)) {
        throw new BadRequestException('Số điện thoại không hợp lệ');
      }

      // Validate OTP
      try {
        await this.validateOtpFromStorage(dto.phoneNumber, dto.otp);
      } catch (err: unknown) {
        // For registration flow, invalid or expired OTP should be treated as Bad Request (400)
        if (err instanceof UnauthorizedException) {
          throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
        }
        throw err;
      }

      // Check phone number uniqueness
      const existingPhone = await this.prisma.account.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã được đăng ký');
      }

      // For phone registration, password is optional
      // If provided, hash it; otherwise leave as null
      let passwordHash: string | null = null;
      if (dto.password) {
        passwordHash = await argon2.hash(dto.password);
      }

      const account = await this.prisma.account.create({
        data: {
          phoneNumber: dto.phoneNumber,
          username: dto.username,
          displayName: dto.displayName,
          passwordHash,
          preferredContactMethod: 'PHONE',
          status: 'ACTIVE',
        },
      });

      logger.info('Account registered via phone', { accountId: account.id, phoneNumber: dto.phoneNumber });

      // Publish user.created event
      try {
        const event: UserCreatedEvent = {
          event_id: randomUUID(),
          event_name: 'user.created.v1',
          trace_id: randomUUID(),
          occurred_at: new Date().toISOString(),
          producer: 'auth-service',
          payload: {
            userId: account.id,
            phoneNumber: account.phoneNumber ?? undefined,
            username: account.username,
            displayName: account.displayName,
            preferredContactMethod: account.preferredContactMethod as 'EMAIL' | 'PHONE',
          },
        };
        await this.eventBus.publish(event);
      } catch (err) {
        logger.warn('Failed to publish user.created event', { accountId: account.id, error: err });
        // Don't throw - continue with response even if event publishing fails
      }

      const tokens = jwtService.signTokenPair(
        account.id,
        account.phoneNumber || account.email || account.username,
        randomUUID(),
      );
      return {
        message: 'Đăng ký tài khoản thành công',
        accountId: account.id,
        ...tokens,
      };
    }

    throw new BadRequestException('Yêu cầu đăng ký không hợp lệ');
  }

  /**
   * Login: Support 3 flows
   * Flow A: Email + Password
   * Flow B: Phone + Password
   * Flow C: Phone + OTP
   */
  async login(dto: LoginDto) {
    if (dto.email) {
      const account = await this.prisma.account.findUnique({
        where: { email: dto.email },
      });

      if (!account) {
        throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
      }

      if (account.status === 'BANNED') {
        throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
      }

      if (!account.passwordHash) {
        throw new UnauthorizedException('Tài khoản này không hỗ trợ đăng nhập bằng mật khẩu');
      }

      const isValid = await argon2.verify(account.passwordHash, dto.password || '');
      if (!isValid) {
        throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
      }

      logger.info('Account logged in via email+password', { accountId: account.id });

      const tokens = jwtService.signTokenPair(
        account.id,
        account.email || account.phoneNumber || account.username,
        randomUUID(),
      );
      return { message: 'Đăng nhập thành công', accountId: account.id, ...tokens };
    }

    if (dto.phoneNumber) {
      if (!validatePhoneNumber(dto.phoneNumber)) {
        throw new BadRequestException('Số điện thoại không hợp lệ');
      }

      const account = await this.prisma.account.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });

      if (!account) {
        throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không chính xác');
      }

      if (account.status === 'BANNED') {
        throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
      }

      if (dto.password) {
        if (!account.passwordHash) {
          throw new UnauthorizedException('Tài khoản này không hỗ trợ đăng nhập bằng mật khẩu');
        }

        const isValid = await argon2.verify(account.passwordHash, dto.password);
        if (!isValid) {
          throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không chính xác');
        }

        logger.info('Account logged in via phone+password', { accountId: account.id });

        const tokens = jwtService.signTokenPair(
          account.id,
          account.phoneNumber || account.email || account.username,
          randomUUID(),
        );
        return { message: 'Đăng nhập thành công', accountId: account.id, ...tokens };
      }

      if (dto.otp) {
        await this.validateOtpFromStorage(dto.phoneNumber, dto.otp);

        logger.info('Account logged in via phone+otp', { accountId: account.id });

        const tokens = jwtService.signTokenPair(
          account.id,
          account.phoneNumber || account.email || account.username,
          randomUUID(),
        );
        return { message: 'Đăng nhập thành công', accountId: account.id, ...tokens };
      }

      throw new BadRequestException('Vui lòng cung cấp mật khẩu hoặc mã OTP');
    }

    throw new BadRequestException('Yêu cầu đăng nhập không hợp lệ. Vui lòng kiểm tra dữ liệu đầu vào');
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwtService.verifyRefreshToken(refreshToken);

      const account = await this.prisma.account.findUnique({
        where: { id: payload.sub },
      });

      if (!account) {
        throw new NotFoundException('Tài khoản không tồn tại');
      }

      if (account.status === 'BANNED') {
        throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
      }

      const tokens = jwtService.signTokenPair(
        account.id,
        account.email || account.phoneNumber || account.username,
        randomUUID(),
      );
      return { message: 'Làm mới token thành công', ...tokens };
    } catch (err: unknown) {
      if (
        err instanceof ConflictException ||
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      throw new UnauthorizedException('Token xác thực không hợp lệ hoặc đã hết hạn');
    }
  }

  async getAccount(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        username: true,
        displayName: true,
        status: true,
        preferredContactMethod: true,
        createdAt: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    return account;
  }

  onModuleDestroy() {
    // Close Redis connection gracefully
    this.redis?.disconnect();
  }
}
