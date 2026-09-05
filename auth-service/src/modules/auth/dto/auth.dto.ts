import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * RegisterDto: Supports 2 registration flows
 * Flow A (Email): { email, password, username, displayName }
 * Flow B (Phone): { phoneNumber, otp, username, displayName, password? }
 */
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+84912345678', required: false })
  @IsOptional()
  @Matches(/^\+\d{1,15}$/, {
    message: 'Số điện thoại phải ở định dạng E.164 (ví dụ: +84912345678)',
  })
  phoneNumber?: string;

  @ApiProperty({ example: '123456', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'Mã OTP phải là 6 chữ số',
  })
  otp?: string;

  @ApiProperty({ example: 'password123', minLength: 8, required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  displayName!: string;
}

/**
 * LoginDto: Supports 3 login flows
 * Flow A (Email + Password): { email, password }
 * Flow B (Phone + Password): { phoneNumber, password }
 * Flow C (Phone + OTP): { phoneNumber, otp }
 */
export class LoginDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+84912345678', required: false })
  @IsOptional()
  @Matches(/^\+\d{1,15}$/, {
    message: 'Số điện thoại phải ở định dạng E.164 (ví dụ: +84912345678)',
  })
  phoneNumber?: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: '123456', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'Mã OTP phải là 6 chữ số',
  })
  otp?: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '+84912345678' })
  @Matches(/^\+\d{1,15}$/, {
    message: 'Số điện thoại phải ở định dạng E.164 (ví dụ: +84912345678)',
  })
  phoneNumber!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}
