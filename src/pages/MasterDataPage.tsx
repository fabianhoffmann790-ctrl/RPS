import { useMemo, useState } from 'react';
import { useAppStore } from '../store/store';
import { Line, Product, Stirrer } from '../store/types';

export function MasterDataPage() {
  const { products, lines, stirrers } = useAppStore((s) => s.masterData);
  const upsertMasterData = useAppStore((s) => s.upsertMasterData);
  const exportState = useAppStore((s) => s.exportState);
  const importState = useAppStore((s) => s.importState);

  const [productText, setProductText] = useState(JSON.stringify(products, null, 2));
  const [lineText, setLineText] = useState(JSON.stringify(lines, null, 2));
  const [stirrerText, setStirrerText] = useState(JSON.stringify(stirrers, null, 2));
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<string>();

  const save = () => {
    try {
      const nextProducts = JSON.parse(productText) as Product[];
      const nextLines = JSON.parse(lineText) as Line[];
      const nextStirrers = JSON.parse(stirrerText) as Stirrer[];
      upsertMasterData({ products: nextProducts, lines: nextLines, stirrers: nextStirrers });
      setMessage('Stammdaten gespeichert.');
    } catch (error) {
      setMessage(`JSON Fehler: ${(error as Error).message}`);
    }
  };

  const exportJson = useMemo(() => exportState(), [exportState, products, lines, stirrers]);

  const onImport = () => {
    const result = importState(importText);
    setMessage(result.ok ? 'Import erfolgreich.' : result.error);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">Stammdaten</h2>
        <p className="mt-2 text-base">Bearbeitung als JSON (einfach & direkt).</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="font-semibold">Produkte</span>
            <textarea
              className="h-64 rounded-xl border border-slate-300 p-3 font-mono text-sm"
              value={productText}
              onChange={(event) => setProductText(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-semibold">Linien</span>
            <textarea
              className="h-64 rounded-xl border border-slate-300 p-3 font-mono text-sm"
              value={lineText}
              onChange={(event) => setLineText(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-semibold">Rührwerke</span>
            <textarea
              className="h-64 rounded-xl border border-slate-300 p-3 font-mono text-sm"
              value={stirrerText}
              onChange={(event) => setStirrerText(event.target.value)}
            />
          </label>
        </div>
        <button className="mt-4 min-h-[48px] rounded-xl bg-indigo-600 px-5 text-white" onClick={save}>
          Stammdaten speichern
        </button>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">Export / Import</h2>
        <label className="mt-3 flex flex-col gap-2">
          <span className="font-semibold">Export JSON</span>
          <textarea className="h-56 rounded-xl border border-slate-300 p-3 font-mono text-sm" readOnly value={exportJson} />
        </label>
        <label className="mt-4 flex flex-col gap-2">
          <span className="font-semibold">Import JSON</span>
          <textarea
            className="h-56 rounded-xl border border-slate-300 p-3 font-mono text-sm"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
          />
        </label>
        <button className="mt-4 min-h-[48px] rounded-xl bg-emerald-600 px-5 text-white" onClick={onImport}>
          JSON importieren
        </button>
      </section>

      {message ? <p className="rounded-xl bg-slate-100 p-4 font-semibold">{message}</p> : null}
    </div>
  );
}
