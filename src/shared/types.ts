export type Category = 'investment' | 'income' | 'expense';
export type Direction = 'inflow' | 'outflow';
export type RecurrenceType = 'once' | 'monthly' | 'forever';

export interface Entry {
  id: string;
  name: string;
  category: Category;
  principal_cents: number | null;
  rate_bps: number | null; // basis points, e.g. 1700 = 17%
  direction: Direction;
  amount_cents: number | null; // null if derived from principal * rate
  recurrence_type: RecurrenceType;
  frequency_months: number; // recurs every N months (1 = every month). Ignored for 'once'.
  start_date: string; // ISO date YYYY-MM-DD
  end_date: string | null; // null for 'forever' and 'once'
  created_at: number;
}

export type NewEntry = Omit<Entry, 'id' | 'created_at'>;

export interface Snapshot {
  month: string; // YYYY-MM
  balance_cents: number;
  inflow_cents: number;
  outflow_cents: number;
}

export interface TimelinePoint {
  month: string; // YYYY-MM
  balance: number; // cents
  inflow: number; // cents
  outflow: number; // cents
  net: number; // cents
  isProjected: boolean;
}
