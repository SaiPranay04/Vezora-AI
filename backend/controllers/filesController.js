import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { approvedPath } from '../security/paths.js';
const LIMIT = 1024 * 1024;
async function validate(input, create = false) {
  if (!config().files) throw new Error('File system access disabled');
  const parts = String(input).split(/[\\/]/);
  if (parts.some(part => ['.ssh','.git','.aws','.azure'].includes(part.toLowerCase()) || part.toLowerCase().startsWith('.env')) || /(?:credentials|tokens?)\.json$|\.(?:key|pem|pfx|p12|db|sqlite3?)$/i.test(input)) throw new Error('Private file access denied');
  return approvedPath(input, config().roots, { create });
}
export async function readFile(input, encoding = 'utf8') {
  if (encoding !== 'utf8') throw new Error('Only UTF-8 text is supported');
  const file = await validate(input);
  const handle = await fs.open(file, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > LIMIT) throw new Error('File is not bounded text');
    await validate(input);
    const buffer = Buffer.alloc(LIMIT+1);
    const { bytesRead } = await handle.read(buffer,0,buffer.length,0);
    if (bytesRead > LIMIT || buffer.subarray(0,bytesRead).includes(0)) throw new Error('File is too large or binary');
    return buffer.subarray(0,bytesRead).toString('utf8');
  } finally { await handle.close(); }
}
export async function saveFile() { throw new Error('File writes temporarily disabled pending race-safe Windows file handles'); }
export async function openFile() { throw new Error('OS file opening disabled pending race-safe Windows handles'); }
export async function listDirectory(input) {
  const dir = await validate(input);
  const entries = await fs.readdir(dir,{ withFileTypes: true });
  if (entries.length > 2000) throw new Error('Directory listing too large');
  return entries.filter(e => !e.isSymbolicLink() && !e.name.startsWith('.')).map(e => ({ name:e.name,path:path.join(dir,e.name),isDirectory:e.isDirectory(),isFile:e.isFile(),size:0,modified:null }));
}
