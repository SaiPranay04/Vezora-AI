import { app, BrowserWindow, ipcMain, utilityProcess, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { awaitBackend, trustedFrame } from './desktop/lifecycle.js';
const base = path.dirname(fileURLToPath(import.meta.url));
let window, backend, connection, expectedURL;
let quitting = false, stopped = false;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance',() => { window?.restore(); window?.focus(); });
  app.whenReady().then(async () => {
    try {
      const backendDir = app.isPackaged ? path.join(process.resourcesPath,'backend') : path.join(base,'backend');
      const dataDir = app.isPackaged ? path.join(app.getPath('userData'),'data') : path.join(backendDir,'data');
      fs.mkdirSync(dataDir,{ recursive: true });
      const token = randomBytes(48).toString('hex');
      const env = { ...process.env, PORT:'0', DATA_DIR:dataDir, VEZORA_TRANSPORT_TOKEN:token,
        VEZORA_ENV_FILE: app.isPackaged ? path.join(app.getPath('userData'),'.env') : path.join(backendDir,'.env') };
      delete env.NODE_OPTIONS; delete env.ELECTRON_RUN_AS_NODE;
      backend = utilityProcess.fork(path.join(backendDir,'bootstrap.js'),[],{ cwd:backendDir, env, stdio:'pipe', serviceName:'Vezora local backend' });
      // Drain legacy logs without persisting private prompts/tokens or exposing them to the renderer.
      backend.stdout?.resume(); backend.stderr?.resume();
      backend.on('exit',() => { stopped = true; if (!quitting) { dialog.showErrorBox('Vezora backend stopped','Restart Vezora. No automatic action replay will occur.'); app.quit(); } });
      const port = await awaitBackend(backend);
      connection = Object.freeze({ url:'http://127.0.0.1:'+port, token });
      expectedURL = app.isPackaged ? pathToFileURL(path.join(base,'dist','index.html')).href : 'http://localhost:5173/';
      window = new BrowserWindow({ width:1280,height:800,minWidth:900,minHeight:600,autoHideMenuBar:true,
        webPreferences:{ preload:path.join(base,'desktop','preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true } });
      window.webContents.setWindowOpenHandler(() => ({ action:'deny' }));
      window.webContents.on('will-navigate',(event,url) => { if (url !== expectedURL) event.preventDefault(); });
      window.webContents.on('will-attach-webview',event => event.preventDefault());
      window.webContents.session.setPermissionRequestHandler((contents,permission,callback,details) => callback(contents === window?.webContents && contents.getURL() === expectedURL && permission === 'media' && !details.mediaTypes?.includes('video')));
      window.webContents.session.setPermissionCheckHandler((contents,permission) => contents === window?.webContents && contents.getURL() === expectedURL && permission === 'media');
      window.webContents.session.webRequest.onHeadersReceived((details,callback) => callback({ responseHeaders:{ ...details.responseHeaders,
        'Content-Security-Policy':["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' "+connection.url+(app.isPackaged?'':" ws://localhost:5173")+"; object-src 'none'; frame-src 'none'; base-uri 'none'"] } }));
      await window.loadURL(expectedURL);
    } catch { dialog.showErrorBox('Vezora could not start','Backend configuration, native dependencies or readiness failed. Check the Phase 1 setup guide.'); app.quit(); }
  });
  ipcMain.handle('vezora:connection',event => {
    if (!trustedFrame(event,window,expectedURL) || !connection || stopped) throw new Error('Untrusted IPC sender');
    return connection;
  });
  app.on('window-all-closed',() => app.quit());
  app.on('before-quit',event => {
    quitting = true;
    if (backend && !stopped) {
      event.preventDefault();
      backend.once('exit',() => { stopped=true; app.quit(); });
      backend.postMessage({ type:'shutdown' });
      setTimeout(() => { if (!stopped) backend.kill(); },3500).unref();
    }
  });
}
