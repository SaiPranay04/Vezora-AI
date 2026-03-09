/**
 * PostgreSQL Database Configuration
 * Handles connection pooling and query execution
 */

import pg from 'pg';
const { Pool } = pg;

let pool = null;

/**
 * Initialize database connection pool
 */
export function initializePool() {
  if (pool) {
    return pool;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('   Please set DATABASE_URL in your .env file');
    console.error('   Example: DATABASE_URL=postgresql://user:password@localhost:5432/vezora_dev');
    return null;
  }

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false // Required for Render PostgreSQL
      } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 60000, // Return an error after 60 seconds if connection could not be established
      statement_timeout: 30000, // Query timeout (30 seconds)
    });

    pool.on('connect', () => {
      console.log('✅ PostgreSQL client connected');
    });

    pool.on('error', (err) => {
      console.error('❌ Unexpected PostgreSQL error', err);
    });

    console.log('✅ PostgreSQL connection pool initialized');
    return pool;
  } catch (error) {
    console.error('❌ Failed to initialize database pool:', error.message);
    return null;
  }
}

/**
 * Get the database pool instance
 */
export function getPool() {
  if (!pool) {
    return initializePool();
  }
  return pool;
}

/**
 * Execute a SQL query
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
export async function query(text, params) {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 100));
    }
    
    return result;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    console.error('   Query:', text.substring(0, 100));
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient() {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return await pool.connect();
}

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as now');
    console.log('✅ Database connection test successful');
    console.log('   Server time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

/**
 * Close all database connections
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database pool closed');
  }
}

/**
 * Helper: Check if a table exists
 */
export async function tableExists(tableName) {
  try {
    const result = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    );
    return result.rows[0].exists;
  } catch (error) {
    console.error(`❌ Error checking if table ${tableName} exists:`, error.message);
    return false;
  }
}

export default {
  initializePool,
  getPool,
  query,
  getClient,
  testConnection,
  closePool,
  tableExists
};
