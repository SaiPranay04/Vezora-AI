import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import isDev from 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess;

function startBackend() {
  const backendPath = path.join(__dirname, 'backend', 'index.js');
  console.log('Starting backend at:', backendPath);
  
  // Use spawn to start the backend
  backendProcess = spawn('node', [backendPath], {
    cwd: path.join(__dirname, 'backend'),
    env: { ...process.env, PORT: '5000' },
    stdio: 'inherit'
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend process.', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    // icon: path.join(__dirname, 'public', 'favicon.ico'),
    autoHideMenuBar: true,
  });

  if (isDev) {
    // In dev mode, wait for Vite to start and then load localhost
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built HTML file
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  
  // Wait a little bit for the backend to spin up before showing the UI
  setTimeout(createWindow, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up the backend process when the app quits
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
