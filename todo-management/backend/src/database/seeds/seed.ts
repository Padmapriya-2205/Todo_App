import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { categories } from '../schema/categories.schema';
import { getDatabaseUrl } from '../../config/environment';

async function seed() {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  const db = drizzle(pool);
  await db.insert(categories).values([{ name: 'Work' }, { name: 'Personal' }]).onConflictDoNothing();
  await pool.end();
  console.log('Seeded Work and Personal categories');
}
seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
