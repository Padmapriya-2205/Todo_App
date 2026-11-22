export interface UserFixture {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export function createUserFixture(overrides: Partial<UserFixture> = {}): UserFixture {
  return {
    id: '59ca8ad4-6a6f-4f25-9a7f-d25b725c0d10',
    username: 'testuser',
    passwordHash: 'stored-hash',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export interface RefreshSessionFixture {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export function createRefreshSessionFixture(overrides: Partial<RefreshSessionFixture> = {}): RefreshSessionFixture {
  return {
    id: '4c2b0901-e326-4cb0-998d-7a98f6381c9a',
    userId: '59ca8ad4-6a6f-4f25-9a7f-d25b725c0d10',
    tokenHash: 'stored-token-hash',
    expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
