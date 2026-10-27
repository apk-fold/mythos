const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mythosNative', {
  saveFile: (name, b64) => ipcRenderer.invoke('save-file', name, b64),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  listDir: (folder) => ipcRenderer.invoke('list-dir', folder),
  readText: (folder, name) => ipcRenderer.invoke('read-text', folder, name),
  writeText: (folder, name, text) => ipcRenderer.invoke('write-text', folder, name, text),
});
