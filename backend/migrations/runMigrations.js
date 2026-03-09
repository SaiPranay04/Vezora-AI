/**
 * Database Migration Runner
 * Run this script to set up the database schema
 * 
 * Usage:
 *   node backend/migrations/runMigrations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializePool, query, closePool, testConnection } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Run a single migration file
 */
async function runMigration(filePath) {
  try {
    console.log(`\n📄 Running migration: ${path.basename(filePath)}`);
    
    const sql = fs.readFileSync(filePath, 'utf8');
    await query(sql);
    
    console.log(`✅ Migration completed: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Migration failed: ${path.basename(filePath)}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Run all migrations in order
 */
async function runAllMigrations() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Vezora AI - Database Migration      ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // Initialize database pool
    console.log('🔌 Connecting to database...');
    initializePool();

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Database connection failed. Please check your DATABASE_URL.');
      process.exit(1);
    }

    // Get all migration files
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run in alphabetical order

    if (files.length === 0) {
      console.log('⚠️  No migration files found.');
      return;
    }

    console.log(`\n📋 Found ${files.length} migration file(s):\n`);
    files.forEach(file => console.log(`   - ${file}`));

    // Run each migration
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const success = await runMigration(filePath);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // Summary
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║        Migration Summary               ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`\n✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total: ${files.length}\n`);

    if (failCount > 0) {
      console.error('⚠️  Some migrations failed. Please check the errors above.');
      process.exit(1);
    } else {
      console.log('🎉 All migrations completed successfully!\n');
      console.log('📝 Next steps:');
      console.log('   1. Start your backend server: cd backend && node index.js');
      console.log('   2. Register a new user via POST /api/auth/register');
      console.log('   3. Use the returned JWT token for authenticated requests\n');
    }

  } catch (error) {
    console.error('\n❌ Migration process failed:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await closePool();
    console.log('🔌 Database connection closed.');
  }
}

// Run migrations
runAllMigrations();
