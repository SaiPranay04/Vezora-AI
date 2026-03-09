import { query } from './config/database.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const sql = fs.readFileSync('./migrations/003_fix_vector_indexes.sql', 'utf8');

console.log('🔧 Fixing vector indexes...\n');

query(sql)
  .then(() => {
    console.log('✅ Indexes fixed successfully!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
