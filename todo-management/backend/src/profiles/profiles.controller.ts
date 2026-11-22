import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './profile.dto';
import { ProfileResponseDto } from '../common/api-response.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@ApiTags('Profile')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'))
@Controller('profile')
export class ProfilesController {
  constructor(private profiles: ProfilesService) {}

  @ApiOperation({
    summary: 'Get current profile',
    description: 'Returns the profile belonging to the authenticated user.',
  })
  @ApiOkResponse({
    description: 'Current profile.',
    type: ProfileResponseDto,
    example: {
      name: 'Taylor Example',
      age: 30,
      profession: 'Designer',
      username: 'padma_test',
    },
  })
  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.profiles.get(user.sub);
  }

  @ApiOperation({
    summary: 'Update current profile',
    description:
      'Partially updates the authenticated user’s profile. Omit fields you do not want to change.',
  })
  @ApiBody({
    type: UpdateProfileDto,
    description:
      'All fields are optional. Age, when supplied, must be an integer from 1 to 150.',
  })
  @ApiOkResponse({
    description: 'Updated profile.',
    type: ProfileResponseDto,
    example: {
      name: 'Taylor Example',
      age: 30,
      profession: 'Designer',
      username: 'padma_test',
    },
  })
  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.profiles.update(user.sub, dto);
  }
}
