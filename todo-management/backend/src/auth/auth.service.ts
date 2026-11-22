import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository, private readonly jwt: JwtService) {}
  private hashRefresh(token: string) { return createHash('sha256').update(token).digest('hex'); }
  private  signAccess(user: { id: string; username: string }) {
    return this.jwt.sign({ sub: user.id, username: user.username }, {
      secret: process.env.JWT_ACCESS_SECRET || 'development-access-secret',
      expiresIn: '1d',
    });
  }

  async register(username: string, password: string) {
    const existing = await this.authRepository.findByUsername(username);
    if (existing) throw new ConflictException('Username already exists');
    const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 12));
    const created = await this.authRepository.createUserWithProfile(username, passwordHash);
    return { id: created.id, username: created.username };
  }

  async login(username: string, password: string) {
    const user = await this.authRepository.findByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid username or password');
    return this.issueSession(user);
  }

  private async issueSession(user: { id: string; username: string }) {
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await this.authRepository.createRefreshSession(user.id, this.hashRefresh(refreshToken), expiresAt);
    return {
      accessToken: this.signAccess(user),
      refreshToken,
      user: { id: user.id, username: user.username },
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token is required');
    const tokenHash = this.hashRefresh(refreshToken);
    const stored = await this.authRepository.findValidRefreshSession(tokenHash, new Date());
    if (!stored) throw new UnauthorizedException('Refresh token is invalid or expired');
    const user = await this.authRepository.findById(stored.userId);
    if (!user) throw new UnauthorizedException('User no longer exists');
    await this.authRepository.deleteRefreshSessionById(stored.id);
    return this.issueSession(user);
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      await this.authRepository.deleteRefreshSessionByTokenHash(this.hashRefresh(refreshToken));
    }
  }

  async me(userId: string) {
    const user = await this.authRepository.findIdentityById(userId);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
