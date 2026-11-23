/* Sycamore Row — the small, safe bridge between the game and the Windows shell. */
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('native', {
  isDesktop: true,
  setFullscreen: (on) => ipcRenderer.invoke('fs:set', !!on),
  getFullscreen: () => ipcRenderer.invoke('fs:get'),
  onFullscreen: (cb) => ipcRenderer.on('fs:changed', (_e, v) => cb(!!v)),
  quit: () => ipcRenderer.send('app:quit'),
});
