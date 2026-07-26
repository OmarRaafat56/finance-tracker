import { create } from 'zustand';
import { format, addMonths, subMonths } from 'date-fns';
import '../../shared/ipc'; // registers the global Window.financeAPI type
import type { Entry, NewEntry, TimelinePoint } from '../../shared/types';
import { generateTimeline as buildTimeline } from '../../domain/timeline';
import { useToastStore } from './useToastStore';

const HORIZON_PAST_MONTHS = 12;
const HORIZON_FUTURE_MONTHS = 24;
const INITIAL_BALANCE_CENTS = 0;

interface FinanceState {
  entries: Entry[];
  timeline: TimelinePoint[];
  selectedMonth: string;
  isLoading: boolean;
  loadEntries: () => Promise<void>;
  addEntry: (entry: NewEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  setSelectedMonth: (month: string) => void;
  recalculateTimeline: () => void;
}

function computeRange(): { start: string; end: string } {
  const now = new Date();
  const start = format(subMonths(now, HORIZON_PAST_MONTHS), 'yyyy-MM');
  const end = format(addMonths(now, HORIZON_FUTURE_MONTHS), 'yyyy-MM');
  return { start, end };
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  entries: [],
  timeline: [],
  selectedMonth: format(new Date(), 'yyyy-MM'),
  isLoading: false,

  loadEntries: async () => {
    set({ isLoading: true });
    try {
      const entries = await window.financeAPI.getEntries();
      set({ entries });
      get().recalculateTimeline();
    } catch (err) {
      useToastStore.getState().push('Failed to load entries', 'error');
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  addEntry: async (entry) => {
    try {
      await window.financeAPI.addEntry(entry);
      await get().loadEntries();
      useToastStore.getState().push('Entry added', 'success');
    } catch (err) {
      useToastStore.getState().push('Failed to add entry', 'error');
      console.error(err);
    }
  },

  deleteEntry: async (id) => {
    try {
      await window.financeAPI.deleteEntry(id);
      await get().loadEntries();
      useToastStore.getState().push('Entry deleted', 'success');
    } catch (err) {
      useToastStore.getState().push('Failed to delete entry', 'error');
      console.error(err);
    }
  },

  setSelectedMonth: (month) => set({ selectedMonth: month }),

  recalculateTimeline: () => {
    const { entries } = get();
    const { start, end } = computeRange();
    const timeline = buildTimeline(entries, start, end, INITIAL_BALANCE_CENTS);
    set({ timeline });
  },
}));
