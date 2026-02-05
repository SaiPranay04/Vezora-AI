/**
 * Apps Controller - Launch desktop applications
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';

const execPromise = promisify(exec);

// Common application mappings by platform
const APP_MAPPINGS = {
  win32: {
    'chrome': 'start chrome',
    'firefox': 'start firefox',
    'edge': 'start msedge',
    'vscode': 'code',
    'code': 'code',
    'notepad': 'notepad',
    'calculator': 'calc',
    'explorer': 'explorer',
    'cmd': 'cmd',
    'powershell': 'powershell',
    'terminal': 'wt', // Windows Terminal
    'paint': 'mspaint',
    'outlook': 'outlook',
    'excel': 'excel',
    'word': 'winword',
    'spotify': 'spotify'
  },
  darwin: { // macOS
    'chrome': 'open -a "Google Chrome"',
    'firefox': 'open -a Firefox',
    'safari': 'open -a Safari',
    'vscode': 'open -a "Visual Studio Code"',
    'code': 'open -a "Visual Studio Code"',
    'terminal': 'open -a Terminal',
    'finder': 'open -a Finder',
    'spotify': 'open -a Spotify',
    'notes': 'open -a Notes',
    'calculator': 'open -a Calculator'
  },
  linux: {
    'chrome': 'google-chrome',
    'firefox': 'firefox',
    'vscode': 'code',
    'code': 'code',
    'terminal': 'gnome-terminal',
    'files': 'nautilus',
    'calculator': 'gnome-calculator',
    'gedit': 'gedit',
    'spotify': 'spotify'
  }
};

/**
 * Launch an application
 */
export async function launchApplication(appName, args = []) {
  const os = platform();
  const normalizedName = appName.toLowerCase().trim();

  // Get command for this platform
  let command = APP_MAPPINGS[os]?.[normalizedName];

  if (!command) {
    // Try direct execution
    command = normalizedName;
  }

  try {
    // Add arguments if provided
    const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command;

    console.log(`🚀 Launching: ${fullCommand}`);

    // Execute command
    const result = await execPromise(fullCommand, {
      windowsHide: false,
      timeout: 5000
    });

    return {
      success: true,
      app: appName,
      command: fullCommand,
      output: result.stdout
    };
  } catch (error) {
    console.error(`❌ Failed to launch ${appName}:`, error.message);
    throw new Error(`Could not launch ${appName}: ${error.message}`);
  }
}

/**
 * Get list of commonly installed applications
 */
export async function getInstalledApps() {
  const os = platform();
  const apps = APP_MAPPINGS[os] || {};

  return Object.keys(apps).map(name => ({
    name,
    displayName: capitalize(name),
    command: apps[name],
    platform: os
  }));
}

/**
 * Check if an application is installed/accessible
 */
export async function isAppInstalled(appName) {
  try {
    const os = platform();
    const command = APP_MAPPINGS[os]?.[appName.toLowerCase()];

    if (!command) return false;

    // Try to check if command exists
    if (os === 'win32') {
      await execPromise(`where ${command.split(' ')[0]}`, { timeout: 2000 });
    } else {
      await execPromise(`which ${command.split(' ')[0]}`, { timeout: 2000 });
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
