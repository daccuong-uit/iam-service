import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticationService } from '../services/authentication.service';
import { LoginDto, RefreshTokenDto, RegisterDto, SendOtpDto } from '../dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for phone number' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authenticationService.sendOtp(dto.phoneNumber);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authenticationService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get tokens' })
  login(@Body() dto: LoginDto) {
    return this.authenticationService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authenticationService.refresh(dto.refreshToken);
  }

  @Get('accounts/:id')
  @ApiResponse({ status: 200, description: 'Returns account details' })
  getAccount(@Param('id', ParseUUIDPipe) id: string) {
    return this.authenticationService.getAccount(id);
  }
}