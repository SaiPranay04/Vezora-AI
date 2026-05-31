/**
 * Database Utilities - SQLite setup (optional enhancement)
 */

import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';

import Database from 'better-sqlite3';

let db;

export async function initializeDatabase() {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    const dbPath = path.join(DATA_DIR, 'vezora.db');
    db = new Database(dbPath);

    // Create tables with enhanced fields
    db.exec(`
      CREATE TABLE IF NOT EXISTS memory (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT,
        category TEXT,
        importance_score INTEGER DEFAULT 5,
        metadata TEXT,
        embedding TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        last_accessed TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        user_id TEXT PRIMARY KEY,
        settings TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        avatar_url TEXT,
        created_at TEXT NOT NULL,
        last_login TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        name TEXT,
        bio TEXT,
        email TEXT,
        occupation TEXT,
        location TEXT,
        timezone TEXT,
        interests TEXT,
        preferences TEXT
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        category TEXT,
        subcategory TEXT,
        embedding TEXT,
        deadline TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        updated_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_memory_user ON memory(user_id);
      CREATE INDEX IF NOT EXISTS idx_memory_category ON memory(category);
      CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `);

    console.log('✅ SQLite database initialized (Local-First Mode)');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized! Call initializeDatabase() first.');
  }
  return db;
}
