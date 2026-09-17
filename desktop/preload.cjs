const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('vezora', Object.freeze({
  connection: () => ipcRenderer.invoke('vezora:connection')
}));
