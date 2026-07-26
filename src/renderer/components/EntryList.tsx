import { useFinanceStore } from '../stores/useFinanceStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { formatCurrency, centsToDollars, type CurrencyCode } from '../../domain/money';
import type { Entry } from '../../shared/types';

function describeAmount(entry: Entry, currency: CurrencyCode): string {
  if (entry.principal_cents != null && entry.rate_bps != null) {
    return `${formatCurrency(centsToDollars(entry.principal_cents), currency)} @ ${(entry.rate_bps / 100).toFixed(2)}%`;
  }
  return formatCurrency(centsToDollars(entry.amount_cents ?? 0), currency);
}

function describeRecurrence(entry: Entry): string {
  if (entry.recurrence_type === 'once') return `Once · ${entry.start_date}`;
  const freq = entry.frequency_months || 1;
  const interval = freq === 1 ? 'Monthly' : `Every ${freq}mo`;
  if (entry.recurrence_type === 'forever') return `${interval} from ${entry.start_date}`;
  return `${interval} · ${entry.start_date} → ${entry.end_date ?? '—'}`;
}

export default function EntryList() {
  const entries = useFinanceStore((s) => s.entries);
  const deleteEntry = useFinanceStore((s) => s.deleteEntry);
  const currency = useSettingsStore((s) => s.currency) as CurrencyCode;

  if (entries.length === 0) {
    return <p className="text-sm text-subtle">No entries yet.</p>;
  }

  return (
    <div className="flex flex-col">
      {entries.map((entry, idx) => (
        <div
          key={entry.id}
          className={`group py-3 ${idx !== 0 ? 'border-t border-line' : ''}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{entry.name}</p>
              <p className="text-xs text-subtle capitalize">{entry.category}</p>
            </div>
            <button
              onClick={() => deleteEntry(entry.id)}
              className="text-xs text-subtle hover:text-negative transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              aria-label={`Delete ${entry.name}`}
            >
              Remove
            </button>
          </div>
          <p className={`text-sm tabular-nums mt-1 ${entry.direction === 'inflow' ? 'text-positive' : 'text-negative'}`}>
            {entry.direction === 'inflow' ? '+' : '−'}{describeAmount(entry, currency)}
          </p>
          <p className="text-xs text-subtle mt-0.5">{describeRecurrence(entry)}</p>
        </div>
      ))}
    </div>
  );
}
