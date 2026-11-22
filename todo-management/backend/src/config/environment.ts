import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

export function loadBackendEnvironment(): void {
  const localEnvPath = resolve(process.cwd(), '.env');
  const workspaceEnvPath = resolve(process.cwd(), 'backend', '.env');
  const envPath = existsSync(localEnvPath) ? localEnvPath : workspaceEnvPath;
  if (existsSync(envPath)) loadEnvFile(envPath);
}

export function getDatabaseUrl(): string {
  loadBackendEnvironment();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required. Copy backend/.env.example to backend/.env and configure it.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }

  if (parsedUrl.protocol !== 'postgres:' && parsedUrl.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must use the postgres:// or postgresql:// protocol.');
  }
  if (parsedUrl.username && !parsedUrl.password) {
    throw new Error('DATABASE_URL has a PostgreSQL username but no password. Check backend/.env.');
  }

  return databaseUrl;
}
