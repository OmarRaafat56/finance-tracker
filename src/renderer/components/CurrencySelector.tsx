import { useSettingsStore } from '../stores/useSettingsStore';
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '../../domain/money';

export default function CurrencySelector() {
  const currency = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
      className="bg-surface border border-line rounded px-2.5 py-1.5 text-sm text-muted hover:text-ink hover:border-line-strong focus:outline-none focus:border-accent transition-colors"
      aria-label="Currency"
    >
      {SUPPORTED_CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.label}
        </option>
      ))}
    </select>
  );
}
