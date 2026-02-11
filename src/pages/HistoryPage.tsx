import { useAppStore } from '../store/store';
import { formatDateTime } from '../utils/time';

export function HistoryPage() {
  const history = useAppStore((s) => s.history);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold">Historie</h2>
      <div className="mt-4 space-y-3">
        {history.length === 0 ? <p>Noch keine Aktionen.</p> : null}
        {history.map((entry) => (
          <article key={entry.id} className="rounded-xl bg-slate-100 p-4">
            <p className="font-bold">{entry.type.toUpperCase()} · {formatDateTime(entry.timestamp)}</p>
            <p>{entry.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
