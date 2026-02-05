/**
 * Settings Controller - User preferences management
 */

import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Default settings
const DEFAULT_SETTINGS = {
  language: 'en-US',
  theme: 'dark',
  personality: 'friendly',
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  voiceLanguage: 'en-US',
  voiceCallEnabled: false,
  temperature: 0.7,
  maxTokens: 512,
  privacyMode: false,
  dataCollection: false,
  notifications: true,
  autoLaunch: false,
  wakeWord: 'hey vezora'
};

// In-memory cache
let settingsCache = {};

/**
 * Load settings from file
 */
async function loadSettingsFromFile() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    settingsCache = JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      settingsCache = {};
      await saveSettingsToFile();
    } else {
      console.error('❌ Failed to load settings:', error);
    }
  }
}

/**
 * Save settings to file
 */
async function saveSettingsToFile() {
  try {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settingsCache, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Failed to save settings:', error);
    throw error;
  }
}

/**
 * Get settings for a user
 */
export async function getSettings(userId = 'default') {
  if (!settingsCache[userId]) {
    await loadSettingsFromFile();
  }

  return {
    ...DEFAULT_SETTINGS,
    ...settingsCache[userId],
    userId
  };
}

/**
 * Update settings for a user
 */
export async function updateSettings(userId = 'default', newSettings) {
  if (!settingsCache[userId]) {
    settingsCache[userId] = {};
  }

  settingsCache[userId] = {
    ...settingsCache[userId],
    ...newSettings,
    updatedAt: new Date().toISOString()
  };

  await saveSettingsToFile();
  return await getSettings(userId);
}

// Initialize settings on module load
loadSettingsFromFile();
