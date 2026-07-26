import { addMonths, format, isAfter, parseISO, startOfMonth } from 'date-fns';
import type { Entry, TimelinePoint } from '../shared/types';

const YM_FORMAT = 'yyyy-MM';

/** Extracts the YYYY-MM portion of an ISO date string. */
function toYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** Number of whole months between two YYYY-MM strings (to - from). */
function monthsBetween(fromYearMonth: string, toYearMonth: string): number {
  const [fy, fm] = fromYearMonth.split('-').map(Number);
  const [ty, tm] = toYearMonth.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

/**
 * Returns how many times an entry occurs in the given month.
 * - 'once': 1 if start_date falls in this month, else 0
 * - 'monthly': 1 if start_date <= month <= end_date AND the month is a
 *   multiple of frequency_months away from start_date, else 0
 * - 'forever': same interval check as 'monthly', but with no end_date
 */
export function getOccurrences(entry: Entry, yearMonth: string): number {
  const start = toYearMonth(entry.start_date);
  const frequency = Math.max(1, entry.frequency_months || 1);

  switch (entry.recurrence_type) {
    case 'once':
      return start === yearMonth ? 1 : 0;

    case 'monthly': {
      if (yearMonth < start) return 0;
      const end = entry.end_date ? toYearMonth(entry.end_date) : null;
      if (end && yearMonth > end) return 0;
      return monthsBetween(start, yearMonth) % frequency === 0 ? 1 : 0;
    }

    case 'forever':
      if (yearMonth < start) return 0;
      return monthsBetween(start, yearMonth) % frequency === 0 ? 1 : 0;

    default:
      return 0;
  }
}

/**
 * Calculates the total cents contributed by an entry in a given month.
 * If amount_cents is set, uses that directly (it's already a per-occurrence amount).
 * Otherwise derives from principal_cents * rate_bps, scaled by how much of a
 * year this entry's frequency covers (annual_amount * frequency_months / 12),
 * so the effective annual yield stays correct regardless of interval.
 * Returns 0 if the entry is not active in that month.
 */
export function calculateMonthlyAmount(entry: Entry, yearMonth: string): number {
  const occurrences = getOccurrences(entry, yearMonth);
  if (occurrences === 0) return 0;

  let perOccurrence: number;
  if (entry.amount_cents != null) {
    perOccurrence = entry.amount_cents;
  } else if (entry.principal_cents != null && entry.rate_bps != null) {
    const frequency = Math.max(1, entry.frequency_months || 1);
    perOccurrence = Math.round((entry.principal_cents * entry.rate_bps * frequency) / 12 / 10000);
  } else {
    perOccurrence = 0;
  }

  return perOccurrence * occurrences;
}

/**
 * Builds a month-by-month timeline between startMonth and endMonth (inclusive),
 * summing all entry amounts and tracking a running balance.
 * Months after the current calendar month are flagged isProjected = true.
 */
export function generateTimeline(
  entries: Entry[],
  startMonth: string,
  endMonth: string,
  initialBalanceCents: number
): TimelinePoint[] {
  const currentYearMonth = format(new Date(), YM_FORMAT);
  const timeline: TimelinePoint[] = [];

  let balance = initialBalanceCents;
  let cursor = startOfMonth(parseISO(`${startMonth}-01`));
  const end = startOfMonth(parseISO(`${endMonth}-01`));

  while (!isAfter(cursor, end)) {
    const yearMonth = format(cursor, YM_FORMAT);

    let inflow = 0;
    let outflow = 0;
    for (const entry of entries) {
      const amount = calculateMonthlyAmount(entry, yearMonth);
      if (amount === 0) continue;
      if (entry.direction === 'inflow') {
        inflow += amount;
      } else {
        outflow += amount;
      }
    }

    const net = inflow - outflow;
    balance += net;

    timeline.push({
      month: yearMonth,
      balance,
      inflow,
      outflow,
      net,
      isProjected: yearMonth > currentYearMonth,
    });

    cursor = addMonths(cursor, 1);
  }

  return timeline;
}
