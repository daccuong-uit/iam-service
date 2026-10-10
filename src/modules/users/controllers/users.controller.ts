import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public, type UserPrincipal } from '@daccuong-uit/backend-auth';
import { CreateProfileDto, UpdateProfileDto } from '../dto/profile.dto';
import { UsersService } from '../services/users.service';

@ApiTags('profiles')
@Controller('profiles')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user profile' })
  createProfile(@Body() dto: CreateProfileDto, @CurrentUser() user: UserPrincipal) {
    return this.usersService.createProfile({
      userId: user.sub,
      email: user.email,
      username: user.username,
      displayName: dto.displayName,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get or create the authenticated user profile' })
  getMyProfile(@CurrentUser() user: UserPrincipal) {
    return this.usersService.createProfile({
      userId: user.sub,
      email: user.email,
      username: user.username,
    });
  }

  @Public()
  @Get('username/:username')
  @ApiResponse({ status: 200, description: 'Returns profile data' })
  getByUsername(@Param('username') username: string) {
    return this.usersService.getProfileByUsername(username);
  }

  @Public()
  @Get('user/:userId')
  getByUserId(@Param('userId') userId: string) {
    return this.usersService.getProfileByUserId(userId);
  }

  @Patch('user/:userId')
  updateProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: UserPrincipal,
  ) {
    if (userId !== user.sub) throw new ForbiddenException('Cannot update another user profile');
    return this.usersService.updateProfile(userId, dto);
  }
}