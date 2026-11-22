import { randomBytes } from 'crypto';
import { Pool } from 'pg';

export interface IsolatedPostgresDatabase {
  schemaName: string;
  pool: Pool;
  close: () => Promise<void>;
}

export async function createIsolatedPostgresDatabase(connectionString: string): Promise<IsolatedPostgresDatabase> {
  const databaseName = decodeURIComponent(new URL(connectionString).pathname.slice(1));
  if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
    throw new Error('TEST_DATABASE_URL must point to a database with "test" in its name.');
  }

  const schemaName = `todo_test_${randomBytes(8).toString('hex')}`;
  const adminPool = new Pool({ connectionString });
  let testPool: Pool | undefined;

  try {
    await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
    const pool = new Pool({ connectionString, options: `-c search_path=${schemaName}` });
    testPool = pool;
    await pool.query(`
      CREATE TYPE task_status AS ENUM ('ACTIVE', 'COMPLETED');
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        username varchar(100) NOT NULL UNIQUE,
        password_hash varchar(255) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        name varchar(150),
        age integer,
        profession varchar(150),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(50) NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        task_name varchar(255) NOT NULL,
        description text,
        status task_status NOT NULL DEFAULT 'ACTIVE',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE refresh_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash varchar(255) NOT NULL,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
  } catch (error) {
    await testPool?.end();
    await adminPool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await adminPool.end();
    throw error;
  }

  if (!testPool) throw new Error('Failed to initialize isolated PostgreSQL pool.');
  return {
    schemaName,
    pool: testPool,
    close: async () => {
      await testPool?.end();
      await adminPool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      await adminPool.end();
    },
  };
}
