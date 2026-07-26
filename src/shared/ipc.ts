import type { Entry, NewEntry, Snapshot } from './types';

export const IPC = {
  GET_ENTRIES: 'db:getEntries',
  ADD_ENTRY: 'db:addEntry',
  DELETE_ENTRY: 'db:deleteEntry',
  GET_SNAPSHOTS: 'db:getSnapshots',
  SAVE_SNAPSHOT: 'db:saveSnapshot',
} as const;

export interface FinanceAPI {
  getEntries: () => Promise<Entry[]>;
  addEntry: (entry: NewEntry) => Promise<string>;
  deleteEntry: (id: string) => Promise<void>;
  getSnapshots: () => Promise<Snapshot[]>;
  saveSnapshot: (snapshot: Snapshot) => Promise<void>;
}

declare global {
  interface Window {
    financeAPI: FinanceAPI;
  }
}
