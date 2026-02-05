/**
 * Memory Controller - Manage user memory storage
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = process.env.DATA_DIR || './data';
const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');
const MAX_MEMORY_ITEMS = parseInt(process.env.MAX_MEMORY_ITEMS) || 100;

// In-memory cache
let memoryCache = {};

/**
 * Load memory from file
 */
async function loadMemoryFromFile() {
  try {
    const data = await fs.readFile(MEMORY_FILE, 'utf8');
    memoryCache = JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      memoryCache = {};
      await saveMemoryToFile();
    } else {
      console.error('❌ Failed to load memory:', error);
    }
  }
}

/**
 * Save memory to file
 */
async function saveMemoryToFile() {
  try {
    await fs.writeFile(MEMORY_FILE, JSON.stringify(memoryCache, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Failed to save memory:', error);
    throw error;
  }
}

/**
 * Get memory for a user
 */
export async function getMemory(userId = 'default') {
  if (!memoryCache[userId]) {
    await loadMemoryFromFile();
  }
  return memoryCache[userId] || [];
}

/**
 * Add memory item
 */
export async function addMemory(userId = 'default', memoryData) {
  if (!memoryCache[userId]) {
    memoryCache[userId] = [];
  }

  const newMemory = {
    id: uuidv4(),
    ...memoryData,
    createdAt: new Date().toISOString(),
    userId
  };

  memoryCache[userId].push(newMemory);

  // Limit memory items per user
  if (memoryCache[userId].length > MAX_MEMORY_ITEMS) {
    memoryCache[userId] = memoryCache[userId].slice(-MAX_MEMORY_ITEMS);
  }

  await saveMemoryToFile();
  return newMemory;
}

/**
 * Update memory item
 */
export async function updateMemory(userId = 'default', memoryId, updates) {
  if (!memoryCache[userId]) {
    return null;
  }

  const index = memoryCache[userId].findIndex(m => m.id === memoryId);
  if (index === -1) {
    return null;
  }

  memoryCache[userId][index] = {
    ...memoryCache[userId][index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await saveMemoryToFile();
  return memoryCache[userId][index];
}

/**
 * Delete memory item
 */
export async function deleteMemory(userId = 'default', memoryId) {
  if (!memoryCache[userId]) {
    return false;
  }

  const initialLength = memoryCache[userId].length;
  memoryCache[userId] = memoryCache[userId].filter(m => m.id !== memoryId);

  if (memoryCache[userId].length === initialLength) {
    return false;
  }

  await saveMemoryToFile();
  return true;
}

/**
 * Clear all memory for a user
 */
export async function clearMemory(userId = 'default') {
  memoryCache[userId] = [];
  await saveMemoryToFile();
}

// Initialize memory on module load
loadMemoryFromFile();
