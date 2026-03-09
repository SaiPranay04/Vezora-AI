/**
 * Run Vector Migration
 * Enables pgvector and adds embedding columns
 */

import { initializePool, query } from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function runVectorMigration() {
  console.log('\n🚀 Running Vector Migration...\n');

  try {
    // Initialize database pool
    const pool = initializePool();
    if (!pool) {
      throw new Error('Failed to initialize database pool');
    }

    console.log('✅ Database pool initialized');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '002_add_vector_support.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Running migration: 002_add_vector_support.sql\n');

    // Execute migration
    await query(sql);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Vector search is now enabled:');
    console.log('   - pgvector extension installed');
    console.log('   - embedding columns added to memories and tasks');
    console.log('   - HNSW indexes created for fast similarity search');
    console.log('\n🎯 Ready for semantic search!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.message.includes('extension "vector" is not available')) {
      console.log('\n🔧 Fix: pgvector extension is not installed on your PostgreSQL');
      console.log('   Solution for Render:');
      console.log('   1. Go to your Render dashboard');
      console.log('   2. Find your PostgreSQL instance');
      console.log('   3. Go to "Extensions" tab');
      console.log('   4. Enable "pgvector" extension');
      console.log('   5. Run this migration again\n');
    }
    
    process.exit(1);
  }
}

runVectorMigration();
