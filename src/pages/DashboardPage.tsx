const linePlaceholders = ['L1', 'L2', 'L3', 'L4'];
const rwPlaceholders = ['RW1', 'RW2'];

export function DashboardPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-bold">Auftrag anlegen</h2>
        <p className="mt-3 text-lg text-slate-700">Placeholder für die Auftragserfassung in späteren Milestones.</p>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-bold">Linien (L1–L4)</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {linePlaceholders.map((line) => (
            <article key={line} className="min-h-[48px] rounded-2xl bg-slate-100 p-6">
              <p className="text-lg font-semibold">{line}</p>
              <p className="mt-2 text-lg text-slate-600">Placeholder-Grid für Linienplanung.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-bold">Rührwerke (RW)</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {rwPlaceholders.map((rw) => (
            <article key={rw} className="min-h-[48px] rounded-2xl bg-slate-100 p-6">
              <p className="text-lg font-semibold">{rw}</p>
              <p className="mt-2 text-lg text-slate-600">Placeholder-Grid für Rührwerkssteuerung.</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
