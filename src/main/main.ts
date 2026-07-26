import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import {
  initDatabase,
  getEntries,
  addEntry,
  deleteEntry,
  getSnapshots,
  saveSnapshot,
} from '../db/database';
import { IPC } from '../shared/ipc';

const isDev = !app.isPackaged;

function createWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.js');

  // Fail loudly instead of silently shipping a window with no financeAPI bridge.
  if (!fs.existsSync(preloadPath)) {
    console.error(`[main] preload script not found at ${preloadPath}. Did the main-process build finish?`);
  }

  const win = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#FAFAF9',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // If the preload script throws, this fires with the actual error - otherwise
  // it fails silently and window.financeAPI just never gets defined.
  win.webContents.on('preload-error', (_event, preloadScriptPath, error) => {
    console.error(`[main] preload script error at ${preloadScriptPath}:`, error);
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle(IPC.GET_ENTRIES, () => getEntries());

  ipcMain.handle(IPC.ADD_ENTRY, (_event, entry) => addEntry(entry));

  ipcMain.handle(IPC.DELETE_ENTRY, (_event, id: string) => deleteEntry(id));

  ipcMain.handle(IPC.GET_SNAPSHOTS, () => getSnapshots());

  ipcMain.handle(IPC.SAVE_SNAPSHOT, (_event, snapshot) => saveSnapshot(snapshot));
}

app.whenReady().then(async () => {
  await initDatabase();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
