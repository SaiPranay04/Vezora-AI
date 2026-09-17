import fs from 'node:fs/promises';
import path from 'node:path';
export function contained(root, target) {
  const relative = path.relative(root,target);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('..' + path.sep));
}
export async function approvedPath(input, roots, { create = false } = {}) {
  if (typeof input !== 'string' || !path.isAbsolute(input) || input.includes('\0') || input.split(/[\\/]/).includes('..')) throw new Error('Absolute non-traversing path required');
  if (process.platform === 'win32' && (input.startsWith('\\\\') || input.slice(2).includes(':') || /[. ]([\\/]|$)/.test(input))) throw new Error('Unsupported Windows path');
  const target = path.resolve(input);
  for (const proposed of roots) {
    const root = await fs.realpath(proposed);
    if (!contained(root,target)) continue;
    let cursor = root;
    const parts = path.relative(root,target).split(path.sep).filter(Boolean);
    for (let i=0;i<parts.length;i++) {
      cursor = path.join(cursor,parts[i]);
      let stat;
      try { stat = await fs.lstat(cursor); } catch (error) {
        if (create && i === parts.length-1 && error.code === 'ENOENT') return target;
        throw error;
      }
      // Deny links/junctions even when they currently point inside the root.
      if (stat.isSymbolicLink() || !contained(root,await fs.realpath(cursor))) throw new Error('Linked path is not allowed');
    }
    return target;
  }
  throw new Error('Path is outside approved roots');
}
