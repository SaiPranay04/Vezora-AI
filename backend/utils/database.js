/**
 * Database Utilities - SQLite setup (optional enhancement)
 */

import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';

/**
 * Initialize database
 * For now, using JSON files. Can be upgraded to SQLite later.
 */
export async function initializeDatabase() {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Initialize JSON files if they don't exist
    const files = ['memory.json', 'settings.json', 'logs.json'];

    for (const file of files) {
      const filePath = path.join(DATA_DIR, file);
      try {
        await fs.access(filePath);
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(filePath, '{}', 'utf8');
        console.log(`✅ Created: ${file}`);
      }
    }

    console.log('✅ Database initialized (JSON storage)');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Future: Migrate to SQLite
 * Uncomment when ready to use SQLite instead of JSON
 */

// import Database from 'better-sqlite3';
//
// let db;
//
// export function initializeSQLite() {
//   const dbPath = path.join(DATA_DIR, 'vezora.db');
//   db = new Database(dbPath);
//
//   // Create tables
//   db.exec(`
//     CREATE TABLE IF NOT EXISTS memory (
//       id TEXT PRIMARY KEY,
//       user_id TEXT NOT NULL,
//       content TEXT NOT NULL,
//       type TEXT,
//       metadata TEXT,
//       created_at TEXT NOT NULL,
//       updated_at TEXT
//     );
//
//     CREATE TABLE IF NOT EXISTS settings (
//       user_id TEXT PRIMARY KEY,
//       settings TEXT NOT NULL,
//       updated_at TEXT
//     );
//
//     CREATE TABLE IF NOT EXISTS logs (
//       id TEXT PRIMARY KEY,
//       user_id TEXT NOT NULL,
//       type TEXT NOT NULL,
//       data TEXT NOT NULL,
//       timestamp TEXT NOT NULL
//     );
//
//     CREATE INDEX IF NOT EXISTS idx_memory_user ON memory(user_id);
//     CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id);
//     CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
//   `);
//
//   console.log('✅ SQLite database initialized');
//   return db;
// }
//
// export function getDatabase() {
//   return db;
// }
