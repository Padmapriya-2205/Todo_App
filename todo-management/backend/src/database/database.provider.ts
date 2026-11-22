import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { getDatabaseUrl } from '../config/environment';

export const DATABASE = 'DATABASE';

export const databaseProvider = {
  provide: DATABASE,
  useFactory: () => {
    const pool = new Pool({ connectionString: getDatabaseUrl() });
    return drizzle(pool, { schema });
  },
};
