# Finance Tracker

A personal finance desktop app: track income, expenses, and investments, and see a
projected balance timeline (past + future) on a chart.

Built with Electron + React + TypeScript + SQLite (via [sql.js](https://sql.js.org), a WebAssembly
build of SQLite — no native compiler required to install) + Recharts + Zustand + Tailwind.

## Getting started

```bash
npm install
npm run dev
```

This starts the Vite dev server for the renderer, compiles the Electron main process in
watch mode, and launches the Electron window once both are ready. The app comes
pre-populated with sample entries (salary, rent, groceries, a savings account, a car
loan, and a one-time bonus) so the dashboard shows real projections immediately.

## Building a distributable

```bash
npm run build   # compiles renderer (Vite) + main process (tsc)
npm run pack    # builds and packages a desktop app with electron-builder
```

## Running tests

Domain logic (`src/domain/`) is pure and fully unit-tested with Vitest:

```bash
npm test
```

## Project structure

```
src/
  main/           Electron main process (window creation, IPC handlers) + preload
  renderer/       React frontend (components, hooks, zustand stores)
  shared/         Types and the typed IPC channel contract used by both processes
  domain/         Pure business logic — no React, no Electron, fully unit-testable
  db/             SQLite schema and all database queries (main process only)
```

## Data model

All money is stored as **integer cents** — never floating point. All dates are stored
as ISO strings (`YYYY-MM-DD`). An entry is either:

- A flat recurring/one-time amount (`amount_cents`), or
- A derived amount from a principal and an annual interest rate in basis points
  (`principal_cents` and `rate_bps`), computed monthly as
  `principal * rate_bps / 12 / 10000`.

Recurrence is one of `once`, `monthly` (with an end date), or `forever`.

## Database location

SQLite data lives in Electron's per-OS `userData` directory (not inside the project
folder), so it persists across rebuilds. Delete `finance.sqlite` there to reset the
seed data. Because sql.js runs the database in memory, the file is re-exported and
written to disk after every add/delete, so no writes are lost.

If you're upgrading from an earlier version of this project and see errors about a
missing `frequency_months` column, delete the existing `finance.sqlite` file (found
via `%APPDATA%\finance-tracker` on Windows) so it gets recreated with the current
schema and seed data.
