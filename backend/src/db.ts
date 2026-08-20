import { Pool, PoolClient, QueryResult } from 'pg';

// Database connection pool configuration pulled from environment variables.
// The backend entrypoint (src/server.ts) already calls dotenv.config(),
// but callers can call it again safely if needed.

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'church_app',
  max: process.env.DB_MAX_CLIENTS ? Number(process.env.DB_MAX_CLIENTS) : 10,
  idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT_MS ? Number(process.env.DB_IDLE_TIMEOUT_MS) : 30000,
  connectionTimeoutMillis: process.env.DB_CONN_TIMEOUT_MS ? Number(process.env.DB_CONN_TIMEOUT_MS) : 2000,
});

pool.on('error', (err: Error) => {
  // This catches errors on idle clients in the pool.
  console.error('Unexpected idle client error', err);
});

/**
 * Run a parameterized query using the shared pool.
 * Returns the pg QueryResult<T> so callers can access rows, rowCount, etc.
 */
export async function query<T = any>(text: string, params: unknown[] = []) : Promise<QueryResult<T>> {
  try {
    return await pool.query<T>(text, params);
  } catch (error) {
    console.error('Database query failed', { text, params, error });
    throw error;
  }
}

/**
 * Acquire a dedicated client and run a callback within a transaction.
 * The callback receives the connected PoolClient to run queries.
 * Commits on success, rolls back on error, and always releases the client.
 */
export async function withClient<T>(cb: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await cb(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Error during transaction rollback', rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Gracefully close the pool. Useful for tests or application shutdown.
 */
export async function closePool(): Promise<void> {
  try {
    await pool.end();
  } catch (err) {
    console.error('Error closing database pool', err);
  }
}

export default pool;
