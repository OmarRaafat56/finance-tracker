import { create } from 'zustand';
import type { CurrencyCode } from '../../domain/money';

const STORAGE_KEY = 'finance-tracker:currency';

function loadStoredCurrency(): CurrencyCode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return (stored as CurrencyCode) || 'USD';
  } catch {
    return 'USD';
  }
}

interface SettingsState {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: loadStoredCurrency(),
  setCurrency: (currency) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // localStorage unavailable - currency preference just won't persist across restarts
    }
    set({ currency });
  },
}));
