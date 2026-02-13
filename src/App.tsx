import { useState } from 'react';

type Page = 'dashboard' | 'masterdata' | 'history' | 'export-import';

const menuItems: Array<{ key: Page; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'masterdata', label: 'Stammdaten' },
  { key: 'history', label: 'Historie' },
  { key: 'export-import', label: 'Export-Import' },
];

export function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-6">
      <header className="mb-6 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
        <nav className="flex flex-wrap items-center gap-3">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`min-h-12 rounded-xl border px-6 py-3 text-lg font-semibold transition ${
                page === item.key
                  ? 'border-indigo-700 bg-indigo-700 text-white'
                  : 'border-slate-300 bg-white hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main>{renderPage(page)}</main>
    </div>
  );
}

function renderPage(page: Page) {
  switch (page) {
    case 'dashboard':
      return (
        <section className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Tile title="Auftrag anlegen" subtitle="Schneller Start für neue Aufträge" />
            <Tile title="Linie 1–4" subtitle="Linienübersicht folgt im nächsten Milestone" />
            <Tile title="RW-Kacheln" subtitle="RW-Zeitstrahl + IST folgen im nächsten Milestone" />
          </div>
        </section>
      );
    case 'masterdata':
      return <PagePanel title="Stammdaten" text="Stammdaten-Formulare folgen in Milestone 8." />;
    case 'history':
      return <PagePanel title="Historie" text="Änderungshistorie folgt in Milestone 8." />;
    case 'export-import':
      return <PagePanel title="Export-Import" text="JSON Export/Import folgt in Milestone 8." />;
    default:
      return null;
  }
}

function Tile({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <article className="min-h-48 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-2xl font-bold">{title}</h2>
      <p className="text-lg text-slate-600">{subtitle}</p>
    </article>
  );
}

function PagePanel({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
      <h1 className="mb-3 text-3xl font-bold">{title}</h1>
      <p className="text-lg text-slate-600">{text}</p>
    </section>
  );
}
