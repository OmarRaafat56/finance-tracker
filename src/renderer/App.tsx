import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import EntryList from './components/EntryList';
import ToastContainer from './components/Toast';
import CurrencySelector from './components/CurrencySelector';
import { useFinanceStore } from './stores/useFinanceStore';

export default function App() {
  const loadEntries = useFinanceStore((s) => s.loadEntries);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      <aside className="w-72 shrink-0 border-r border-line px-5 py-6 flex flex-col gap-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Entries</h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-sm font-medium text-accent hover:text-ink transition-colors"
          >
            {showForm ? 'Close' : '+ Add entry'}
          </button>
        </div>
        <EntryList />
      </aside>

      <main className="flex-1 px-10 py-8 space-y-8 overflow-y-auto max-w-5xl">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Finance Tracker</h1>
          <CurrencySelector />
        </div>
        {showForm && <EntryForm onClose={() => setShowForm(false)} />}
        <Dashboard />
      </main>

      <ToastContainer />
    </div>
  );
}
