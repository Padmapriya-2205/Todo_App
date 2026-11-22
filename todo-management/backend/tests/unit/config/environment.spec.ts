import { getDatabaseUrl } from '../../../src/config/environment';

describe('backend environment configuration', () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  });

  it('returns a configured PostgreSQL URL', () => {
    // ARRANGE
    process.env.DATABASE_URL = 'postgresql://todo:password@localhost:5433/todo';

    // ACT
    const url = getDatabaseUrl();

    // ASSERT
    expect(url).toBe(process.env.DATABASE_URL);
  });

  it('fails with setup guidance when the database URL is missing', () => {
    // ARRANGE
    delete process.env.DATABASE_URL;

    // ACT / ASSERT
    expect(() => getDatabaseUrl()).toThrow('DATABASE_URL is required');
  });

  it('rejects a URL without a password when a PostgreSQL username is set', () => {
    // ARRANGE
    process.env.DATABASE_URL = 'postgresql://todo@localhost:5433/todo';

    // ACT / ASSERT
    expect(() => getDatabaseUrl()).toThrow('no password');
  });

  it('rejects invalid URLs and non-PostgreSQL protocols', () => {
    // ARRANGE
    process.env.DATABASE_URL = 'not-a-url';
    expect(() => getDatabaseUrl()).toThrow('valid PostgreSQL connection URL');

    process.env.DATABASE_URL = 'mysql://todo:password@localhost:3306/todo';
    expect(() => getDatabaseUrl()).toThrow('postgres:// or postgresql://');
  });
});
