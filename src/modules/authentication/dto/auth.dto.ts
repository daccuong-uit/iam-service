import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+84912345678', required: false })
  @IsOptional()
  @Matches(/^\+\d{1,15}$/)
  phoneNumber?: string;

  @ApiProperty({ example: '123456', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/)
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

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+84912345678', required: false })
  @IsOptional()
  @Matches(/^\+\d{1,15}$/)
  phoneNumber?: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: '123456', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/)
  otp?: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '+84912345678' })
  @Matches(/^\+\d{1,15}$/)
  phoneNumber!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}