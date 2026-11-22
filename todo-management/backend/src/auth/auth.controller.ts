import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from './current-user.decorator';
import type { AuthUser } from './current-user.decorator';
import { AuthUserResponseDto } from '../common/api-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 3 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });
  }

  @ApiOperation({
    summary: 'Register a user',
    description: 'Public endpoint. Create an account before logging in.',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'Both username and password are required.',
  })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.username, dto.password);
  }

  @ApiOperation({
    summary: 'Log in',
    description:
      'Public endpoint. The accessToken is returned in the response body; copy its actual value into Authorize. The refresh token is set as an HTTP-only cookie.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Enter the username and password used during registration.',
  })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.login(dto.username, dto.password);
    this.setRefreshCookie(res, session.refreshToken);
    return { accessToken: session.accessToken, user: session.user };
  }

  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Public endpoint that rotates the refresh-token cookie and returns a new access token.',
  })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.refresh(req.cookies?.refreshToken);
    this.setRefreshCookie(res, session.refreshToken);
    return { accessToken: session.accessToken, user: session.user };
  }

  @ApiOperation({
    summary: 'Log out',
    description:
      'Public endpoint. Revokes the refresh-token cookie if supplied and clears it.',
  })
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.refreshToken);
    res.clearCookie('refreshToken', { path: '/auth' });
    return { message: 'Logged out' };
  }

  @ApiOperation({
    summary: 'Get current user',
    description: 'Returns the identity represented by the access token.',
  })
  @ApiBearerAuth('bearer')
  @ApiOkResponse({
    description:
      'Authenticated user identity; does not include password or other secrets.',
    type: AuthUserResponseDto,
    example: {
      id: '59ca8ad4-6a6f-4f25-9a7f-d25b725c0d10',
      username: 'padma_test',
    },
  })
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.sub);
  }
}
