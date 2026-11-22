import { createHash } from 'crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../src/database/schema';
import { AuthRepository } from '../../src/auth/auth.repository';
import { createIsolatedPostgresDatabase, IsolatedPostgresDatabase } from './postgres-test-database';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithTestDatabase = databaseUrl ? describe : describe.skip;

describeWithTestDatabase('AuthRepository PostgreSQL integration', () => {
  let database: IsolatedPostgresDatabase;
  let repository: AuthRepository;

  beforeAll(async () => {
    if (!databaseUrl) throw new Error('TEST_DATABASE_URL is required for repository integration tests.');
    database = await createIsolatedPostgresDatabase(databaseUrl);
    repository = new AuthRepository(drizzle(database.pool, { schema }) as never);
  });

  afterAll(async () => {
    await database?.close();
  });

  it('creates a user and profile atomically and retrieves the stored identity', async () => {
    // ARRANGE
    const username = 'integration-user';

    // ACT
    const created = await repository.createUserWithProfile(username, 'password-hash');
    const found = await repository.findByUsername(username);
    const identity = await repository.findIdentityById(created.id);
    const profile = await database.pool.query('SELECT user_id FROM profiles WHERE user_id = $1', [created.id]);

    // ASSERT
    expect(found).toMatchObject({ id: created.id, username, passwordHash: 'password-hash' });
    expect(identity).toEqual({ id: created.id, username });
    expect(profile.rowCount).toBe(1);
  });

  it('rolls back user insertion if profile creation fails inside the transaction', async () => {
    // ARRANGE
    await database.pool.query(`
      CREATE FUNCTION fail_profile_insert() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'intentional profile failure';
      END;
      $$;
      CREATE TRIGGER fail_profile_insert_trigger
      BEFORE INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION fail_profile_insert();
    `);

    // ACT / ASSERT
    try {
      await expect(repository.createUserWithProfile('rolled-back-user', 'password-hash'))
        .rejects.toThrow('intentional profile failure');
      const userCount = await database.pool.query('SELECT id FROM users WHERE username = $1', ['rolled-back-user']);
      expect(userCount.rowCount).toBe(0);
    } finally {
      // CLEANUP
      await database.pool.query('DROP TRIGGER IF EXISTS fail_profile_insert_trigger ON profiles');
      await database.pool.query('DROP FUNCTION IF EXISTS fail_profile_insert()');
    }
  });

  it('stores, validates, rotates, and deletes hashed refresh sessions', async () => {
    // ARRANGE
    const user = await repository.createUserWithProfile('refresh-user', 'password-hash');
    const token = 'never-store-this-token';
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60_000);

    // ACT
    await repository.createRefreshSession(user.id, tokenHash, expiresAt);
    const valid = await repository.findValidRefreshSession(tokenHash, new Date());
    const expired = await repository.findValidRefreshSession(tokenHash, new Date(Date.now() + 120_000));
    const stored = await database.pool.query('SELECT token_hash FROM refresh_tokens WHERE user_id = $1', [user.id]);
    if (valid) await repository.deleteRefreshSessionById(valid.id);

    // ASSERT
    expect(valid).toMatchObject({ userId: user.id, tokenHash });
    expect(expired).toBeNull();
    expect(stored.rows[0].token_hash).not.toBe(token);
    await expect(repository.findValidRefreshSession(tokenHash, new Date())).resolves.toBeNull();

    // ACT
    await repository.createRefreshSession(user.id, tokenHash, expiresAt);
    await repository.deleteRefreshSessionByTokenHash(tokenHash);

    // ASSERT
    const remaining = await database.pool.query('SELECT id FROM refresh_tokens WHERE user_id = $1', [user.id]);
    expect(remaining.rowCount).toBe(0);
  });

  it('enforces unique usernames and cascades user deletion to profiles and refresh sessions', async () => {
    // ARRANGE
    const user = await repository.createUserWithProfile('unique-user', 'password-hash');
    await repository.createRefreshSession(user.id, 'refresh-hash', new Date(Date.now() + 60_000));

    // ACT / ASSERT
    await expect(repository.createUserWithProfile('unique-user', 'another-hash'))
      .rejects.toMatchObject({ code: '23505' });
    await database.pool.query('DELETE FROM users WHERE id = $1', [user.id]);
    const relatedRows = await database.pool.query(
      'SELECT (SELECT count(*) FROM profiles WHERE user_id = $1) AS profiles, (SELECT count(*) FROM refresh_tokens WHERE user_id = $1) AS sessions',
      [user.id],
    );
    expect(relatedRows.rows[0]).toEqual({ profiles: '0', sessions: '0' });
  });
});
