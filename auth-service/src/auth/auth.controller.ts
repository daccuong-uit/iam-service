import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, SendOtpDto } from './dto/auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/send-otp
   * Send OTP to phone number
   */
  @Post('send-otp')
  @ApiOperation({ summary: 'Request OTP for phone number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  /**
   * POST /auth/register
   * Creates a new account and returns a token pair.
   * Supports 2 flows:
   *   - Email + Password: { email, password, username, displayName }
   *   - Phone + OTP: { phoneNumber, otp, username, displayName, password? }
   */
  @Post('register')
  @ApiOperation({ summary: 'Register a new account (Email or Phone+OTP)' })
  @ApiResponse({ status: 200, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or missing required fields' })
  @ApiResponse({ status: 409, description: 'Email, phone, or username already exists' })
  @HttpCode(HttpStatus.OK)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   * Login and get tokens.
   * Supports 3 flows:
   *   - Email + Password: { email, password }
   *   - Phone + Password: { phoneNumber, password }
   *   - Phone + OTP: { phoneNumber, otp }
   */
  @Post('login')
  @ApiOperation({ summary: 'Login and get tokens (Email+Password, Phone+Password, or Phone+OTP)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Invalid input or invalid request combination' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or OTP' })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'New access token generated' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get account info (Internal)' })
  @ApiResponse({ status: 200, description: 'Returns account details' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  getAccount(@Param('id', ParseUUIDPipe) id: string) {
    return this.authService.getAccount(id);
  }
}
