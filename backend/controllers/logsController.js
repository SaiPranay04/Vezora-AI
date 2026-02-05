/**
 * Logs Controller - System activity logging
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = process.env.DATA_DIR || './data';
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const MAX_LOG_ENTRIES = parseInt(process.env.MAX_LOG_ENTRIES) || 500;

// In-memory cache
let logsCache = {};

/**
 * Load logs from file
 */
async function loadLogsFromFile() {
  try {
    const data = await fs.readFile(LOGS_FILE, 'utf8');
    logsCache = JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      logsCache = {};
      await saveLogsToFile();
    } else {
      console.error('❌ Failed to load logs:', error);
    }
  }
}

/**
 * Save logs to file
 */
async function saveLogsToFile() {
  try {
    await fs.writeFile(LOGS_FILE, JSON.stringify(logsCache, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Failed to save logs:', error);
  }
}

/**
 * Get logs for a user
 */
export async function getLogs(userId = 'default', options = {}) {
  if (!logsCache[userId]) {
    await loadLogsFromFile();
  }

  let logs = logsCache[userId] || [];

  // Filter by type if specified
  if (options.type) {
    logs = logs.filter(log => log.type === options.type);
  }

  // Sort by timestamp (newest first)
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Apply pagination
  const offset = options.offset || 0;
  const limit = options.limit || 100;
  logs = logs.slice(offset, offset + limit);

  return logs;
}

/**
 * Add log entry
 */
export async function addLog(logData) {
  const userId = logData.userId || 'default';

  if (!logsCache[userId]) {
    logsCache[userId] = [];
  }

  const newLog = {
    id: uuidv4(),
    ...logData,
    timestamp: new Date().toISOString()
  };

  logsCache[userId].push(newLog);

  // Limit log entries per user
  if (logsCache[userId].length > MAX_LOG_ENTRIES) {
    logsCache[userId] = logsCache[userId].slice(-MAX_LOG_ENTRIES);
  }

  // Don't await - log in background
  saveLogsToFile().catch(err => console.error('❌ Log save error:', err));

  return newLog;
}

/**
 * Clear logs for a user
 */
export async function clearLogs(userId = 'default') {
  logsCache[userId] = [];
  await saveLogsToFile();
}

// Initialize logs on module load
loadLogsFromFile();
