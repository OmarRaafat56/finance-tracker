import { useToastStore } from '../stores/useToastStore';

const styles: Record<string, string> = {
  error: 'bg-surface border-negative text-negative',
  success: 'bg-surface border-positive text-positive',
  info: 'bg-surface border-line text-ink',
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 space-y-2 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-lg border text-sm shadow-sm cursor-pointer ${styles[t.type]}`}
          onClick={() => dismiss(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
