import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeConfig } from './config.js';
const base = path.dirname(fileURLToPath(import.meta.url));
// Packaged desktop explicitly selects its external, private config path.
dotenv.config({ path: process.env.VEZORA_ENV_FILE || path.join(base, '.env') });
process.env.DATA_DIR = path.resolve(base, process.env.DATA_DIR || 'data');
const settings = initializeConfig();
process.env.DATA_DIR = settings.dataDir;
await import('./index.js');
