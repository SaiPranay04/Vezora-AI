/**
 * Files Controller - File system operations
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import open from 'open';

// Allowed file operations directory (security)
const ALLOWED_DIRECTORIES = [
  process.env.HOME || process.env.USERPROFILE,
  process.cwd()
];

/**
 * Validate file path (security check)
 */
function validatePath(filePath) {
  const resolvedPath = path.resolve(filePath);

  // Check if path is within allowed directories
  const isAllowed = ALLOWED_DIRECTORIES.some(dir =>
    resolvedPath.startsWith(path.resolve(dir))
  );

  if (!isAllowed) {
    throw new Error('Access to this path is not allowed');
  }

  return resolvedPath;
}

/**
 * Open a file with default application
 */
export async function openFile(filePath) {
  const validPath = validatePath(filePath);

  if (!existsSync(validPath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    await open(validPath);
    console.log(`📂 Opened file: ${validPath}`);
    return { success: true, path: validPath };
  } catch (error) {
    console.error(`❌ Failed to open file:`, error);
    throw new Error(`Could not open file: ${error.message}`);
  }
}

/**
 * Save content to a file
 */
export async function saveFile(filePath, content, encoding = 'utf8') {
  const validPath = validatePath(filePath);

  try {
    // Ensure directory exists
    const dir = path.dirname(validPath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(validPath, content, encoding);

    console.log(`💾 Saved file: ${validPath}`);
    return { success: true, path: validPath, size: content.length };
  } catch (error) {
    console.error(`❌ Failed to save file:`, error);
    throw new Error(`Could not save file: ${error.message}`);
  }
}

/**
 * Read file contents
 */
export async function readFile(filePath, encoding = 'utf8') {
  const validPath = validatePath(filePath);

  if (!existsSync(validPath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    const content = await fs.readFile(validPath, encoding);
    console.log(`📖 Read file: ${validPath}`);
    return content;
  } catch (error) {
    console.error(`❌ Failed to read file:`, error);
    throw new Error(`Could not read file: ${error.message}`);
  }
}

/**
 * List directory contents
 */
export async function listDirectory(dirPath) {
  const validPath = validatePath(dirPath);

  if (!existsSync(validPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  try {
    const entries = await fs.readdir(validPath, { withFileTypes: true });

    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(validPath, entry.name);
        let stats = null;

        try {
          stats = await fs.stat(fullPath);
        } catch {
          // Ignore stat errors
        }

        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
          size: stats?.size || 0,
          modified: stats?.mtime || null
        };
      })
    );

    return files;
  } catch (error) {
    console.error(`❌ Failed to list directory:`, error);
    throw new Error(`Could not list directory: ${error.message}`);
  }
}
