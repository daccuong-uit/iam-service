import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateProfileDto, UpdateProfileDto } from '../dto/profile.dto';
import { UsersService } from '../services/users.service';

@ApiTags('profiles')
@Controller('profiles')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user profile' })
  createProfile(@Body() dto: CreateProfileDto) {
    return this.usersService.createProfile(dto);
  }

  @Get('username/:username')
  @ApiResponse({ status: 200, description: 'Returns profile data' })
  getByUsername(@Param('username') username: string) {
    return this.usersService.getProfileByUsername(username);
  }

  @Get('user/:userId')
  getByUserId(@Param('userId') userId: string) {
    return this.usersService.getProfileByUserId(userId);
  }

  @Patch('user/:userId')
  updateProfile(@Param('userId') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }
}