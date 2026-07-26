import { useMemo, useState } from 'react';
import { format, differenceInCalendarMonths } from 'date-fns';
import { useFinanceStore } from '../stores/useFinanceStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { dollarsToCents, centsToDollars, formatCurrency, type CurrencyCode } from '../../domain/money';
import type { Category, Direction, RecurrenceType, NewEntry } from '../../shared/types';

const STEPS = ['Basics', 'Financials', 'Recurrence'] as const;
type AmountType = 'fixed' | 'percentage';

const FREQUENCY_PRESETS: { label: string; months: number }[] = [
  { label: 'Monthly', months: 1 },
  { label: 'Quarterly', months: 3 },
  { label: 'Semi-annual', months: 6 },
  { label: 'Annual', months: 12 },
  { label: 'Custom', months: -1 },
];

interface FormState {
  name: string;
  category: Category;
  amountType: AmountType;
  principal: string;
  rate: string;
  amount: string;
  recurrenceType: RecurrenceType;
  frequencyMonths: number;
  customFrequency: string;
  startDate: string;
  endDate: string;
}

const initialState: FormState = {
  name: '',
  category: 'income',
  amountType: 'fixed',
  principal: '',
  rate: '',
  amount: '',
  recurrenceType: 'monthly',
  frequencyMonths: 1,
  customFrequency: '',
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: '',
};

function directionFor(category: Category): Direction {
  return category === 'expense' ? 'outflow' : 'inflow';
}

function segmentedButtonClass(active: boolean): string {
  return `px-3 py-2 rounded text-sm capitalize transition-colors border ${
    active
      ? 'bg-accent-soft border-accent text-accent font-medium'
      : 'bg-surface border-line text-muted hover:border-line-strong hover:text-ink'
  }`;
}

const inputClass =
  'w-full bg-surface border border-line rounded px-3 py-2 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors';

export default function EntryForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const addEntry = useFinanceStore((s) => s.addEntry);
  const currency = useSettingsStore((s) => s.currency) as CurrencyCode;

  const direction = directionFor(form.category);
  const isPercentage = form.amountType === 'percentage';

  const effectiveFrequency = form.frequencyMonths === -1
    ? Math.max(1, parseInt(form.customFrequency, 10) || 1)
    : form.frequencyMonths;

  const perOccurrenceCents = useMemo(() => {
    if (isPercentage) {
      const principal = dollarsToCents(parseFloat(form.principal) || 0);
      const rateBps = Math.round((parseFloat(form.rate) || 0) * 100);
      return Math.round((principal * rateBps * effectiveFrequency) / 12 / 10000);
    }
    return dollarsToCents(parseFloat(form.amount) || 0);
  }, [form.principal, form.rate, form.amount, isPercentage, effectiveFrequency]);

  const monthsCount = useMemo(() => {
    if (form.recurrenceType !== 'monthly') return null;
    if (!form.startDate || !form.endDate) return null;
    return Math.max(1, differenceInCalendarMonths(new Date(form.endDate), new Date(form.startDate)) + 1);
  }, [form.recurrenceType, form.startDate, form.endDate]);

  function frequencyLabel(): string {
    if (effectiveFrequency === 1) return 'monthly';
    if (effectiveFrequency === 3) return 'quarterly';
    if (effectiveFrequency === 6) return 'semi-annually';
    if (effectiveFrequency === 12) return 'annually';
    return `every ${effectiveFrequency} months`;
  }

  function previewText(): string {
    const verb = direction === 'inflow' ? 'receive' : 'pay';
    const amountText = formatCurrency(centsToDollars(perOccurrenceCents), currency);
    if (form.recurrenceType === 'once') {
      return `You will ${verb} ${amountText} once on ${form.startDate || '—'}.`;
    }
    if (form.recurrenceType === 'forever') {
      return `You will ${verb} ${amountText} ${frequencyLabel()}, indefinitely.`;
    }
    if (monthsCount) {
      return `You will ${verb} ${amountText} ${frequencyLabel()} for ${monthsCount} month${monthsCount === 1 ? '' : 's'}.`;
    }
    return `You will ${verb} ${amountText} ${frequencyLabel()}.`;
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function canGoNext(): boolean {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) {
      return isPercentage ? form.principal !== '' && form.rate !== '' : form.amount !== '';
    }
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    const entry: NewEntry = {
      name: form.name.trim(),
      category: form.category,
      principal_cents: isPercentage ? dollarsToCents(parseFloat(form.principal) || 0) : null,
      rate_bps: isPercentage ? Math.round((parseFloat(form.rate) || 0) * 100) : null,
      direction,
      amount_cents: isPercentage ? null : dollarsToCents(parseFloat(form.amount) || 0),
      recurrence_type: form.recurrenceType,
      frequency_months: form.recurrenceType === 'once' ? 1 : effectiveFrequency,
      start_date: form.startDate,
      end_date: form.recurrenceType === 'monthly' ? form.endDate || null : null,
    };
    await addEntry(entry);
    setSubmitting(false);
    setForm(initialState);
    setStep(0);
    onClose();
  }

  return (
    <div className="bg-surface border border-line rounded-lg p-6 space-y-6">
      <div className="flex items-center gap-3">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex items-center gap-2.5 flex-1">
            <span
              className={`text-xs font-medium tabular-nums ${
                idx <= step ? 'text-accent' : 'text-subtle'
              }`}
            >
              0{idx + 1}
            </span>
            <span className={`text-sm ${idx === step ? 'text-ink font-medium' : 'text-subtle'}`}>{label}</span>
            {idx < STEPS.length - 1 && <div className="flex-1 h-px bg-line" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Name</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Salary, Rent, Index Fund"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {(['investment', 'income', 'expense'] as Category[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      category: cat,
                      // Default investment to percentage; income/expense to fixed. User can still override.
                      amountType: cat === 'investment' ? 'percentage' : 'fixed',
                    }))
                  }
                  className={segmentedButtonClass(form.category === cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Amount type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => update('amountType', 'fixed')}
                className={segmentedButtonClass(form.amountType === 'fixed')}
              >
                Fixed amount
              </button>
              <button
                type="button"
                onClick={() => update('amountType', 'percentage')}
                className={segmentedButtonClass(form.amountType === 'percentage')}
              >
                % of an amount
              </button>
            </div>
          </div>

          {isPercentage ? (
            <>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Amount ({currency})</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.principal}
                  onChange={(e) => update('principal', e.target.value)}
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Rate (%/year)</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={form.rate}
                  onChange={(e) => update('rate', e.target.value)}
                  placeholder="4.5"
                />
              </div>
              <p className="text-xs text-subtle">
                Direction: {direction} — the annual rate is applied to the amount and paid out at
                whatever frequency you choose in the next step.
              </p>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Amount ({currency})</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.amount}
                  onChange={(e) => update('amount', e.target.value)}
                  placeholder="2500"
                />
              </div>
              <p className="text-xs text-subtle">
                Direction: {direction} ({form.category === 'expense' ? 'money out' : 'money in'})
              </p>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Recurrence</label>
            <div className="grid grid-cols-3 gap-2">
              {(['monthly', 'forever', 'once'] as RecurrenceType[]).map((rt) => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => update('recurrenceType', rt)}
                  className={segmentedButtonClass(form.recurrenceType === rt)}
                >
                  {rt}
                </button>
              ))}
            </div>
          </div>

          {form.recurrenceType !== 'once' && (
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Frequency</label>
              <div className="grid grid-cols-5 gap-2">
                {FREQUENCY_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => update('frequencyMonths', preset.months)}
                    className={`px-2 py-2 rounded text-xs transition-colors border ${
                      form.frequencyMonths === preset.months
                        ? 'bg-accent-soft border-accent text-accent font-medium'
                        : 'bg-surface border-line text-muted hover:border-line-strong hover:text-ink'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {form.frequencyMonths === -1 && (
                <div className="mt-2">
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={form.customFrequency}
                    onChange={(e) => update('customFrequency', e.target.value)}
                    placeholder="Every how many months?"
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Start date</label>
              <input
                type="date"
                className={inputClass}
                value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)}
              />
            </div>
            {form.recurrenceType === 'monthly' && (
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">End date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.endDate}
                  onChange={(e) => update('endDate', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="bg-paper border border-line rounded p-3.5">
            <p className="text-sm text-muted">{previewText()}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2 border-t border-line -mx-6 px-6 pb-0">
        <button
          type="button"
          onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
          className="text-sm text-muted hover:text-ink transition-colors mt-4"
        >
          {step === 0 ? 'Cancel' : '← Back'}
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canGoNext()}
            onClick={() => setStep((s) => s + 1)}
            className="mt-4 px-4 py-2 rounded bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="mt-4 px-4 py-2 rounded bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-40 transition-colors"
          >
            {submitting ? 'Saving…' : 'Save entry'}
          </button>
        )}
      </div>
    </div>
  );
}
