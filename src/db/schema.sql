CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK(category IN ('investment','income','expense')),
  principal_cents INTEGER,
  rate_bps INTEGER,           -- basis points (1700 = 17%)
  direction TEXT CHECK(direction IN ('inflow','outflow')),
  amount_cents INTEGER,       -- null if derived from principal*rate
  recurrence_type TEXT CHECK(recurrence_type IN ('once','monthly','forever')),
  frequency_months INTEGER DEFAULT 1, -- recurs every N months (1 = every month)
  start_date TEXT,            -- ISO date
  end_date TEXT,               -- null for forever
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS snapshots (
  month TEXT PRIMARY KEY,
  balance_cents INTEGER,
  inflow_cents INTEGER,
  outflow_cents INTEGER
);

CREATE INDEX IF NOT EXISTS idx_entries_start_date ON entries(start_date);
