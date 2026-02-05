/**
 * File System Utilities
 */

import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';

/**
 * Ensure all required directories exist
 */
export async function ensureDataDirectories() {
  const directories = [
    DATA_DIR,
    path.join(DATA_DIR, 'audio'),
    path.join(DATA_DIR, 'logs'),
    path.join(DATA_DIR, 'temp')
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`❌ Failed to create directory ${dir}:`, error);
      }
    }
  }

  console.log('✅ Data directories ensured');
}

/**
 * Clean up old files
 */
export async function cleanupOldFiles(directory, maxAgeHours = 24) {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        console.log(`🗑️  Deleted old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}
