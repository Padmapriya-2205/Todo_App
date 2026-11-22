import { and, eq, gt } from 'drizzle-orm';
import * as schema from '../../../src/database/schema';
import { AuthRepository } from '../../../src/auth/auth.repository';
import { createUserFixture } from '../../fixtures/user.fixture';

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  and: jest.fn((...conditions: unknown[]) => ({ operator: 'and', conditions })),
  eq: jest.fn((column: unknown, value: unknown) => ({ operator: 'eq', column, value })),
  gt: jest.fn((column: unknown, value: unknown) => ({ operator: 'gt', column, value })),
}));

describe('AuthRepository', () => {
  const user = createUserFixture({ passwordHash: 'hash' });
  let db: { select: jest.Mock; insert: jest.Mock; delete: jest.Mock; transaction: jest.Mock };
  let repository: AuthRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    db = { select: jest.fn(), insert: jest.fn(), delete: jest.fn(), transaction: jest.fn() };
    repository = new AuthRepository(db as never);
  });

  function selectBuilder(result: unknown[]) {
    const builder = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(result),
    };
    db.select.mockReturnValue(builder);
    return builder;
  }

  it('finds a user by username', async () => {
    // ARRANGE
    selectBuilder([user]);

    // ACT
    const result = await repository.findByUsername(user.username);

    // ASSERT
    expect(eq).toHaveBeenCalledWith(schema.users.username, user.username);
    expect(result).toEqual(user);
  });

  it('creates a user and profile in a single transaction', async () => {
    // ARRANGE
    const userInsert = { values: jest.fn().mockReturnThis(), returning: jest.fn().mockResolvedValue([user]) };
    const profileInsert = { values: jest.fn().mockResolvedValue(undefined) };
    const tx = {
      insert: jest.fn().mockReturnValueOnce(userInsert).mockReturnValueOnce(profileInsert),
    };
    db.transaction.mockImplementation((callback: (transaction: typeof tx) => unknown) => callback(tx));

    // ACT
    const result = await repository.createUserWithProfile(user.username, user.passwordHash);

    // ASSERT
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(userInsert.values).toHaveBeenCalledWith({ username: user.username, passwordHash: user.passwordHash });
    expect(profileInsert.values).toHaveBeenCalledWith({ userId: user.id });
    expect(result).toEqual(user);
  });

  it('stores the supplied refresh token hash and expiration', async () => {
    // ARRANGE
    const insert = { values: jest.fn().mockResolvedValue(undefined) };
    db.insert.mockReturnValue(insert);
    const expiresAt = new Date();

    // ACT
    await repository.createRefreshSession(user.id, 'hashed-refresh-token', expiresAt);

    // ASSERT
    expect(insert.values).toHaveBeenCalledWith({
      userId: user.id,
      tokenHash: 'hashed-refresh-token',
      expiresAt,
    });
  });

  it('finds a refresh session only when its hash matches and expiration is in the future', async () => {
    // ARRANGE
    const session = { id: 'refresh-id', userId: user.id, tokenHash: 'hash', expiresAt: new Date() };
    selectBuilder([session]);
    const now = new Date();

    // ACT
    const result = await repository.findValidRefreshSession('hash', now);

    // ASSERT
    expect(eq).toHaveBeenCalledWith(schema.refreshTokens.tokenHash, 'hash');
    expect(gt).toHaveBeenCalledWith(schema.refreshTokens.expiresAt, now);
    expect(and).toHaveBeenCalled();
    expect(result).toEqual(session);
  });

  it('deletes refresh sessions by ID or token hash', async () => {
    // ARRANGE
    const remove = { where: jest.fn().mockResolvedValue(undefined) };
    db.delete.mockReturnValue(remove);

    // ACT
    await repository.deleteRefreshSessionById('session-id');
    await repository.deleteRefreshSessionByTokenHash('hashed-token');

    // ASSERT
    expect(eq).toHaveBeenCalledWith(schema.refreshTokens.id, 'session-id');
    expect(eq).toHaveBeenCalledWith(schema.refreshTokens.tokenHash, 'hashed-token');
    expect(remove.where).toHaveBeenCalledTimes(2);
  });

  it('finds users and returns only safe identity fields', async () => {
    // ARRANGE
    const userBuilder = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([user]),
    };
    const identity = { id: user.id, username: user.username };
    const identityBuilder = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([identity]),
    };
    db.select.mockReturnValueOnce(userBuilder).mockReturnValueOnce(identityBuilder);

    // ACT
    const foundUser = await repository.findById(user.id);
    const safeIdentity = await repository.findIdentityById(user.id);

    // ASSERT
    expect(eq).toHaveBeenCalledWith(schema.users.id, user.id);
    expect(safeIdentity).toEqual(identity);
    expect(safeIdentity).not.toHaveProperty('passwordHash');
    expect(foundUser).toEqual(user);
  });
});
