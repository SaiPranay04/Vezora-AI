import path from 'node:path';
import { randomBytes } from 'node:crypto';
export function validateConfig(env) {
  const port = Number(env.PORT ?? 5000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT');
  if (!env.VEZORA_TRANSPORT_TOKEN || env.VEZORA_TRANSPORT_TOKEN.length < 32) throw new Error('VEZORA_TRANSPORT_TOKEN must have at least 32 characters');
  if (env.JWT_SECRET && (env.JWT_SECRET.length < 32 || /your-secret|change-in-production/i.test(env.JWT_SECRET))) throw new Error('JWT_SECRET must be a strong random secret (32+ characters)');
  for (const key of ['ENABLE_FILE_SYSTEM', 'ENABLE_APP_LAUNCH']) {
    if (env[key] !== undefined && !['true','false'].includes(env[key])) throw new Error('Invalid boolean: ' + key);
  }
  let roots;
  try { roots = JSON.parse(env.VEZORA_APPROVED_ROOTS || '[]'); } catch { throw new Error('VEZORA_APPROVED_ROOTS must be a JSON array'); }
  if (!Array.isArray(roots) || roots.some(p => typeof p !== 'string' || !path.isAbsolute(p))) throw new Error('Approved roots must be absolute paths');
  return Object.freeze({ port, host: '127.0.0.1', token: env.VEZORA_TRANSPORT_TOKEN,
    jwtSecret: env.JWT_SECRET || randomBytes(48).toString('hex'),
    dataDir: path.resolve(env.DATA_DIR || './data'), roots: Object.freeze(roots),
    files: env.ENABLE_FILE_SYSTEM === 'true', apps: env.ENABLE_APP_LAUNCH === 'true' });
}
let current;
export function initializeConfig(env = process.env) { current = validateConfig(env); return current; }
export function config() { if (!current) throw new Error('Configuration not initialized'); return current; }
