import { defineConfig } from 'drizzle-kit';
import { getDatabaseUrl } from './src/config/environment';

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url: getDatabaseUrl() },
});
