import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { app } from 'electron';
import type { Entry, NewEntry, Snapshot } from '../shared/types';

// sql.js is a pure WebAssembly build of SQLite - no native compiler needed
// on the host machine. The tradeoff is that it's an in-memory database that
// we explicitly persist to disk after every write.

let db: Database;
let dbFilePath: string;

function locateWasmFile(): string {
  // Resolve sql.js's main entry file to reliably find its dist folder,
  // regardless of whether we're running from source or a packaged app.
  const mainEntryPath = require.resolve('sql.js');
  return path.join(path.dirname(mainEntryPath), 'sql-wasm.wasm');
}

function persist(): void {
  const data = db.export();
  fs.writeFileSync(dbFilePath, Buffer.from(data));
}

function queryAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params as never);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

function run(sql: string, params: unknown[] = []): void {
  db.run(sql, params as never);
}

export async function initDatabase(): Promise<void> {
  const userDataPath = app.getPath('userData');
  fs.mkdirSync(userDataPath, { recursive: true });
  dbFilePath = path.join(userDataPath, 'finance.sqlite');

  const SQL: SqlJsStatic = await initSqlJs({ locateFile: () => locateWasmFile() });

  db = fs.existsSync(dbFilePath) ? new SQL.Database(fs.readFileSync(dbFilePath)) : new SQL.Database();

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.run(schema);

  seedIfEmpty();
  persist();
}

function insertEntry(entry: NewEntry): string {
  const id = randomUUID();
  run(
    `INSERT INTO entries
      (id, name, category, principal_cents, rate_bps, direction, amount_cents, recurrence_type, frequency_months, start_date, end_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      entry.name,
      entry.category,
      entry.principal_cents,
      entry.rate_bps,
      entry.direction,
      entry.amount_cents,
      entry.recurrence_type,
      entry.frequency_months || 1,
      entry.start_date,
      entry.end_date,
      Date.now(),
    ]
  );
  return id;
}

function seedIfEmpty(): void {
  const [{ count }] = queryAll<{ count: number }>('SELECT COUNT(*) as count FROM entries');
  if (count > 0) return;

  const seedEntries: NewEntry[] = [
    {
      name: 'Software Engineer Salary',
      category: 'income',
      principal_cents: null,
      rate_bps: null,
      direction: 'inflow',
      amount_cents: 850000,
      recurrence_type: 'forever',
      frequency_months: 1,
      start_date: '2024-01-01',
      end_date: null,
    },
    {
      name: 'Rent',
      category: 'expense',
      principal_cents: null,
      rate_bps: null,
      direction: 'outflow',
      amount_cents: 220000,
      recurrence_type: 'forever',
      frequency_months: 1,
      start_date: '2024-01-01',
      end_date: null,
    },
    {
      name: 'Groceries',
      category: 'expense',
      principal_cents: null,
      rate_bps: null,
      direction: 'outflow',
      amount_cents: 60000,
      recurrence_type: 'forever',
      frequency_months: 1,
      start_date: '2024-01-01',
      end_date: null,
    },
    {
      name: 'High-Yield Savings',
      category: 'investment',
      principal_cents: 5000000,
      rate_bps: 450,
      direction: 'inflow',
      amount_cents: null,
      recurrence_type: 'forever',
      frequency_months: 1,
      start_date: '2024-01-01',
      end_date: null,
    },
    {
      name: 'Car Loan',
      category: 'expense',
      principal_cents: null,
      rate_bps: null,
      direction: 'outflow',
      amount_cents: 45000,
      recurrence_type: 'monthly',
      frequency_months: 1,
      start_date: '2024-01-01',
      end_date: '2027-06-01',
    },
    {
      name: 'Annual Bonus',
      category: 'income',
      principal_cents: null,
      rate_bps: null,
      direction: 'inflow',
      amount_cents: 500000,
      recurrence_type: 'once',
      frequency_months: 1,
      start_date: '2026-12-01',
      end_date: null,
    },
    {
      name: 'Brokerage Dividend',
      category: 'income',
      principal_cents: 2000000,
      rate_bps: 280,
      direction: 'inflow',
      amount_cents: null,
      recurrence_type: 'forever',
      frequency_months: 3,
      start_date: '2024-01-01',
      end_date: null,
    },
  ];

  for (const item of seedEntries) insertEntry(item);
}

export function getEntries(): Entry[] {
  return queryAll<Entry>('SELECT * FROM entries ORDER BY created_at ASC');
}

export function addEntry(entry: NewEntry): string {
  const id = insertEntry(entry);
  persist();
  return id;
}

export function deleteEntry(id: string): void {
  run('DELETE FROM entries WHERE id = ?', [id]);
  persist();
}

export function getSnapshots(): Snapshot[] {
  return queryAll<Snapshot>('SELECT * FROM snapshots ORDER BY month ASC');
}

export function saveSnapshot(snapshot: Snapshot): void {
  run(
    `INSERT OR REPLACE INTO snapshots (month, balance_cents, inflow_cents, outflow_cents)
     VALUES (?, ?, ?, ?)`,
    [snapshot.month, snapshot.balance_cents, snapshot.inflow_cents, snapshot.outflow_cents]
  );
  persist();
}
