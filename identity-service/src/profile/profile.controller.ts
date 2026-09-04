import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('profiles')
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Create a user profile' })
  @ApiResponse({ status: 201, description: 'Profile created' })
  @ApiResponse({ status: 400, description: 'Profile already exists or invalid data' })
  @HttpCode(HttpStatus.CREATED)
  createProfile(@Body() dto: CreateProfileDto) {
    return this.profileService.createProfile(dto);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get profile by username' })
  @ApiResponse({ status: 200, description: 'Returns profile data' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  getByUsername(@Param('username') username: string) {
    return this.profileService.getProfileByUsername(username);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get profile by user ID' })
  @ApiResponse({ status: 200, description: 'Returns profile data' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  getByUserId(@Param('userId') userId: string) {
    return this.profileService.getProfileByUserId(userId);
  }

  @Patch('user/:userId')
  @ApiOperation({ summary: 'Update profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  updateProfile(@Param('userId') userId: string, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(userId, dto);
  }
}
