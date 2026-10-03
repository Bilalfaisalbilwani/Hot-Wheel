import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _primarySupabasePool: Pool | undefined;
}

export const getSupabaseDatabaseUrl = (): string | null => {
  const envUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (envUrl && !envUrl.includes('[YOUR') && !envUrl.includes('your-project-ref') && !envUrl.includes('[PASSWORD]')) {
    return envUrl;
  }
  return null;
};

/**
 * Creates the Primary Production Supabase PostgreSQL Connection Pool.
 * If DATABASE_URL is not set, a dummy pool is returned so queries fail cleanly to fallback store.
 */
export const createPool = (): Pool => {
  if (global._primarySupabasePool) {
    return global._primarySupabasePool;
  }

  const databaseUrl = getSupabaseDatabaseUrl();

  if (!databaseUrl) {
    console.warn('[Database Notice] No production DATABASE_URL configured in environment. Database queries will safely use local fallback store.');
    // Inactive pool for environments without PostgreSQL configured
    global._primarySupabasePool = new Pool({
      connectionString: 'postgresql://localhost:5432/not_configured',
      connectionTimeoutMillis: 1000,
    });
    global._primarySupabasePool.on('error', () => {
      // Suppress noisy idle warnings when running in local fallback mode
    });
    return global._primarySupabasePool;
  }

  global._primarySupabasePool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false, // Required for Supabase SSL connections
    },
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });

  global._primarySupabasePool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL pool client:', err.message);
  });

  console.log('[Database] Connected to PostgreSQL Database via DATABASE_URL.');
  return global._primarySupabasePool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle ORM with the Supabase pool and schema.
export const db = drizzle(pool, { schema });
