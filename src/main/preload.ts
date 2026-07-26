import { contextBridge, ipcRenderer } from 'electron';
import type { FinanceAPI } from '../shared/ipc';
import type { NewEntry, Snapshot } from '../shared/types';

// IMPORTANT: this file must not `require`/`import` any local project modules
// at runtime (only `import type`, which TypeScript erases). With
// `sandbox: true` on the BrowserWindow, the preload script runs in a
// restricted context where `require` only resolves Electron/Node built-ins -
// requiring '../shared/ipc' here would silently throw and prevent
// contextBridge.exposeInMainWorld from ever running.
const CHANNELS = {
  GET_ENTRIES: 'db:getEntries',
  ADD_ENTRY: 'db:addEntry',
  DELETE_ENTRY: 'db:deleteEntry',
  GET_SNAPSHOTS: 'db:getSnapshots',
  SAVE_SNAPSHOT: 'db:saveSnapshot',
} as const;

const financeAPI: FinanceAPI = {
  getEntries: () => ipcRenderer.invoke(CHANNELS.GET_ENTRIES),
  addEntry: (entry: NewEntry) => ipcRenderer.invoke(CHANNELS.ADD_ENTRY, entry),
  deleteEntry: (id: string) => ipcRenderer.invoke(CHANNELS.DELETE_ENTRY, id),
  getSnapshots: () => ipcRenderer.invoke(CHANNELS.GET_SNAPSHOTS),
  saveSnapshot: (snapshot: Snapshot) => ipcRenderer.invoke(CHANNELS.SAVE_SNAPSHOT, snapshot),
};

contextBridge.exposeInMainWorld('financeAPI', financeAPI);
