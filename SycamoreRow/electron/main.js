/* Sycamore Row — Windows desktop shell (Electron main process). */
'use strict';
const { app, BrowserWindow, ipcMain, Menu, screen, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const STATE_FILE = () => path.join(app.getPath('userData'), 'window-state.json');
let win = null;

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE(), 'utf8')); } catch (e) { return {}; }
}
function saveState() {
  if (!win || win.isDestroyed()) return;
  const state = { fullscreen: win.isFullScreen(), maximized: win.isMaximized() };
  // remember the windowed size; while fullscreen/maximized keep the last windowed bounds
  Object.assign(state, !state.fullscreen && !state.maximized ? win.getContentBounds() : pick(loadState(), ['x', 'y', 'width', 'height']));
  try { fs.writeFileSync(STATE_FILE(), JSON.stringify(state)); } catch (e) { /* not fatal */ }
}
function pick(o, keys) { const r = {}; keys.forEach((k) => { if (o[k] != null) r[k] = o[k]; }); return r; }
function onScreen(b) {
  return screen.getAllDisplays().some((d) => { const a = d.workArea; return b.x < a.x + a.width && b.x + b.width > a.x && b.y < a.y + a.height && b.y + b.height > a.y; });
}

function createWindow() {
  const st = loadState();
  const work = screen.getPrimaryDisplay().workAreaSize;
  const width = Math.min(st.width || 1600, work.width); const height = Math.min(st.height || 900, work.height);
  const opts = {
    width, height, minWidth: 1024, minHeight: 640, useContentSize: true,
    backgroundColor: '#080708', title: 'Sycamore Row', show: false, autoHideMenuBar: true,
    icon: fs.existsSync(path.join(__dirname, '..', 'assets', 'icon.png')) ? path.join(__dirname, '..', 'assets', 'icon.png') : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true,
      autoplayPolicy: 'no-user-gesture-required', spellcheck: false, devTools: !app.isPackaged,
    },
  };
  if (st.x != null && st.y != null && onScreen({ x: st.x, y: st.y, width, height })) { opts.x = st.x; opts.y = st.y; }
  win = new BrowserWindow(opts);
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '..', 'index.html'));
  win.once('ready-to-show', () => { if (st.maximized) win.maximize(); if (st.fullscreen) win.setFullScreen(true); win.show(); win.focus(); });
  const notify = () => { if (win && !win.isDestroyed()) win.webContents.send('fs:changed', win.isFullScreen()); };
  win.on('enter-full-screen', notify); win.on('leave-full-screen', notify);
  win.on('close', saveState);
  // keep the game self-contained: no navigation away, no pop-ups
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) { e.preventDefault(); } });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
}

ipcMain.handle('fs:set', (_e, on) => { if (win) win.setFullScreen(!!on); return !!on; });
ipcMain.handle('fs:get', () => (win ? win.isFullScreen() : false));
ipcMain.on('app:quit', () => { saveState(); app.quit(); });

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
