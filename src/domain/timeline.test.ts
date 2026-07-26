import { describe, it, expect } from 'vitest';
import { calculateMonthlyAmount, getOccurrences, generateTimeline } from './timeline';
import type { Entry } from '../shared/types';

function makeEntry(overrides: Partial<Entry>): Entry {
  return {
    id: 'test-id',
    name: 'Test Entry',
    category: 'income',
    principal_cents: null,
    rate_bps: null,
    direction: 'inflow',
    amount_cents: 100000,
    recurrence_type: 'forever',
    frequency_months: 1,
    start_date: '2024-01-01',
    end_date: null,
    created_at: 0,
    ...overrides,
  };
}

describe('getOccurrences', () => {
  it('once: only fires in the start month', () => {
    const entry = makeEntry({ recurrence_type: 'once', start_date: '2024-03-15' });
    expect(getOccurrences(entry, '2024-03')).toBe(1);
    expect(getOccurrences(entry, '2024-04')).toBe(0);
  });

  it('monthly: fires between start and end inclusive', () => {
    const entry = makeEntry({ recurrence_type: 'monthly', start_date: '2024-01-01', end_date: '2024-03-01' });
    expect(getOccurrences(entry, '2023-12')).toBe(0);
    expect(getOccurrences(entry, '2024-01')).toBe(1);
    expect(getOccurrences(entry, '2024-03')).toBe(1);
    expect(getOccurrences(entry, '2024-04')).toBe(0);
  });

  it('forever: fires from start date onward indefinitely', () => {
    const entry = makeEntry({ recurrence_type: 'forever', start_date: '2024-01-01' });
    expect(getOccurrences(entry, '2023-12')).toBe(0);
    expect(getOccurrences(entry, '2024-01')).toBe(1);
    expect(getOccurrences(entry, '2030-01')).toBe(1);
  });

  it('respects a custom frequency_months interval (e.g. quarterly)', () => {
    const entry = makeEntry({ recurrence_type: 'forever', start_date: '2024-01-01', frequency_months: 3 });
    expect(getOccurrences(entry, '2024-01')).toBe(1);
    expect(getOccurrences(entry, '2024-02')).toBe(0);
    expect(getOccurrences(entry, '2024-03')).toBe(0);
    expect(getOccurrences(entry, '2024-04')).toBe(1);
    expect(getOccurrences(entry, '2024-07')).toBe(1);
  });
});

describe('calculateMonthlyAmount', () => {
  it('uses amount_cents directly when present', () => {
    const entry = makeEntry({ amount_cents: 250000 });
    expect(calculateMonthlyAmount(entry, '2024-01')).toBe(250000);
  });

  it('derives amount from principal and rate', () => {
    const entry = makeEntry({
      amount_cents: null,
      principal_cents: 5000000,
      rate_bps: 1200,
    });
    // 5,000,000 * 1200 / 12 / 10000 = 50,000
    expect(calculateMonthlyAmount(entry, '2024-01')).toBe(50000);
  });

  it('returns 0 when not active in that month', () => {
    const entry = makeEntry({ recurrence_type: 'once', start_date: '2024-01-01' });
    expect(calculateMonthlyAmount(entry, '2024-02')).toBe(0);
  });
});

describe('generateTimeline', () => {
  it('accumulates balance across months', () => {
    const entries: Entry[] = [
      makeEntry({ id: '1', direction: 'inflow', amount_cents: 100000, recurrence_type: 'forever', start_date: '2024-01-01' }),
      makeEntry({ id: '2', direction: 'outflow', amount_cents: 40000, recurrence_type: 'forever', start_date: '2024-01-01' }),
    ];
    const timeline = generateTimeline(entries, '2024-01', '2024-03', 0);
    expect(timeline).toHaveLength(3);
    expect(timeline[0].net).toBe(60000);
    expect(timeline[0].balance).toBe(60000);
    expect(timeline[2].balance).toBe(180000);
  });

  it('marks future months as projected', () => {
    const timeline = generateTimeline([], '2020-01', '2099-01', 0);
    expect(timeline[0].isProjected).toBe(false);
    expect(timeline[timeline.length - 1].isProjected).toBe(true);
  });
});
