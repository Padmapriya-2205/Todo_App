import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthRepository } from '../../../src/auth/auth.repository';
import { AuthService } from '../../../src/auth/auth.service';
import { createRefreshSessionFixture, createUserFixture } from '../../fixtures/user.fixture';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const user = createUserFixture();
  const validSession = createRefreshSessionFixture();
  let repository: jest.Mocked<AuthRepository>;
  let jwt: { sign: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    // ARRANGE
    jest.clearAllMocks();
    repository = {
      findByUsername: jest.fn(),
      createUserWithProfile: jest.fn(),
      createRefreshSession: jest.fn(),
      findValidRefreshSession: jest.fn(),
      deleteRefreshSessionById: jest.fn(),
      deleteRefreshSessionByTokenHash: jest.fn(),
      findById: jest.fn(),
      findIdentityById: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;
    jwt = { sign: jest.fn().mockReturnValue('signed-access-token') };
    service = new AuthService(repository, jwt as unknown as JwtService);
  });

  it('registers a user after checking uniqueness and hashing their password', async () => {
    // ARRANGE
    repository.findByUsername.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-password-hash');
    repository.createUserWithProfile.mockResolvedValue(user as never);

    // ACT
    const result = await service.register('testuser', 'Password123');

    // ASSERT
    expect(repository.findByUsername).toHaveBeenCalledWith('testuser');
    expect(bcrypt.hash).toHaveBeenCalledWith('Password123', expect.any(Number));
    expect(repository.createUserWithProfile).toHaveBeenCalledWith('testuser', 'new-password-hash');
    expect(result).toEqual({ id: user.id, username: user.username });
  });

  it('rejects duplicate usernames without hashing or creating an account', async () => {
    // ARRANGE
    repository.findByUsername.mockResolvedValue(user as never);

    // ACT / ASSERT
    await expect(service.register('testuser', 'Password123')).rejects.toThrow(ConflictException);
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(repository.createUserWithProfile).not.toHaveBeenCalled();
  });

  it('propagates repository failures during registration', async () => {
    // ARRANGE
    repository.findByUsername.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-password-hash');
    repository.createUserWithProfile.mockRejectedValue(new Error('database unavailable'));

    // ACT / ASSERT
    await expect(service.register('testuser', 'Password123')).rejects.toThrow('database unavailable');
  });

  it('logs in with valid credentials and stores only a hash of the refresh token', async () => {
    // ARRANGE
    repository.findByUsername.mockResolvedValue(user as never);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // ACT
    const result = await service.login('testuser', 'Password123');

    // ASSERT
    expect(result).toMatchObject({
      accessToken: 'signed-access-token',
      user: { id: user.id, username: user.username },
    });
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(repository.createRefreshSession).toHaveBeenCalledWith(
      user.id,
      createHash('sha256').update(result.refreshToken).digest('hex'),
      expect.any(Date),
    );
    const savedHash = repository.createRefreshSession.mock.calls[0][1];
    expect(savedHash).not.toBe(result.refreshToken);
    expect(jwt.sign).toHaveBeenCalledWith({ sub: user.id, username: user.username }, expect.objectContaining({
      secret: expect.any(String),
      expiresIn: '1d',
    }));
  });

  it('rejects unknown usernames and incorrect passwords', async () => {
    // ARRANGE
    repository.findByUsername.mockResolvedValue(null);

    // ACT / ASSERT
    await expect(service.login('missing-user', 'Password123')).rejects.toThrow(UnauthorizedException);
    expect(bcrypt.compare).not.toHaveBeenCalled();

    // ARRANGE
    repository.findByUsername.mockResolvedValue(user as never);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    // ACT / ASSERT
    await expect(service.login('testuser', 'wrong-password')).rejects.toThrow(UnauthorizedException);
    expect(repository.createRefreshSession).not.toHaveBeenCalled();
  });

  it('rotates a valid refresh session and returns a newly issued access token', async () => {
    // ARRANGE
    repository.findValidRefreshSession.mockResolvedValue(validSession as never);
    repository.findById.mockResolvedValue(user as never);
    repository.createRefreshSession.mockResolvedValue(undefined);

    // ACT
    const result = await service.refresh('presented-refresh-token');

    // ASSERT
    expect(repository.findValidRefreshSession).toHaveBeenCalledWith(
      createHash('sha256').update('presented-refresh-token').digest('hex'),
      expect.any(Date),
    );
    expect(repository.deleteRefreshSessionById).toHaveBeenCalledWith(validSession.id);
    expect(result.accessToken).toBe('signed-access-token');
    expect(result.refreshToken).not.toBe('presented-refresh-token');
    expect(repository.createRefreshSession).toHaveBeenCalledWith(user.id, expect.any(String), expect.any(Date));
  });

  it('rejects missing, invalid, or expired refresh tokens', async () => {
    // ARRANGE
    repository.findValidRefreshSession.mockResolvedValue(null);

    // ACT / ASSERT
    await expect(service.refresh('')).rejects.toThrow(UnauthorizedException);
    expect(repository.findValidRefreshSession).not.toHaveBeenCalled();

    await expect(service.refresh('invalid-refresh-token')).rejects.toThrow(UnauthorizedException);
    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.deleteRefreshSessionById).not.toHaveBeenCalled();
  });

  it('rejects refresh if the associated user no longer exists', async () => {
    // ARRANGE
    repository.findValidRefreshSession.mockResolvedValue(validSession as never);
    repository.findById.mockResolvedValue(null);

    // ACT / ASSERT
    await expect(service.refresh('valid-looking-token')).rejects.toThrow(UnauthorizedException);
    expect(repository.deleteRefreshSessionById).not.toHaveBeenCalled();
  });

  it('revokes a refresh session on logout without storing the raw token', async () => {
    // ARRANGE
    const refreshToken = 'refresh-token-to-revoke';

    // ACT
    await service.logout(refreshToken);

    // ASSERT
    expect(repository.deleteRefreshSessionByTokenHash).toHaveBeenCalledWith(
      createHash('sha256').update(refreshToken).digest('hex'),
    );
  });

  it('does not query the repository to revoke an absent refresh token', async () => {
    // ARRANGE / ACT
    await service.logout('');

    // ASSERT
    expect(repository.deleteRefreshSessionByTokenHash).not.toHaveBeenCalled();
  });

  it('returns only the current user identity without sensitive fields', async () => {
    // ARRANGE
    repository.findIdentityById.mockResolvedValue({ id: user.id, username: user.username });

    // ACT
    const result = await service.me(user.id);

    // ASSERT
    expect(repository.findIdentityById).toHaveBeenCalledWith(user.id);
    expect(result).toEqual({ id: user.id, username: user.username });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects current-user lookup when the user does not exist', async () => {
    // ARRANGE
    repository.findIdentityById.mockResolvedValue(null);

    // ACT / ASSERT
    await expect(service.me(user.id)).rejects.toThrow(UnauthorizedException);
  });
});
