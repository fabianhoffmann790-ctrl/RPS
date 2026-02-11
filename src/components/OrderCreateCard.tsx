import { FormEvent, useMemo, useState } from 'react';
import { addMinutes, formatISO } from 'date-fns';
import { useAppStore } from '../store/store';
import { PackSizeMl } from '../store/types';

const packs: PackSizeMl[] = [250, 500, 1000, 5000];

export function OrderCreateCard() {
  const { products, lines } = useAppStore((s) => s.masterData);
  const createOrder = useAppStore((s) => s.createOrder);

  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.productId ?? '');
  const [amountL, setAmountL] = useState(1000);
  const [packSizeMl, setPackSizeMl] = useState<PackSizeMl>(1000);
  const [lineId, setLineId] = useState(lines[0]?.lineId ?? 'L1');
  const [startTime, setStartTime] = useState(formatISO(addMinutes(new Date(), 30), { representation: 'complete' }).slice(0, 16));
  const [orderNo, setOrderNo] = useState('');
  const [optionalOrderRef, setOptionalOrderRef] = useState('');
  const [message, setMessage] = useState<string>();

  const matches = useMemo(() => {
    const lower = search.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(lower) || product.articleNo.toLowerCase().includes(lower),
    );
  }, [products, search]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = createOrder({
      productId: selectedProductId,
      amountL,
      packSizeMl,
      lineId,
      fillStart: new Date(startTime).toISOString(),
      orderNo: orderNo || undefined,
      optionalOrderRef: optionalOrderRef || undefined,
    });
    setMessage(result.ok ? `Auftrag ${result.order?.orderNo} gespeichert.` : result.error);
    if (result.ok) {
      setOrderNo('');
      setOptionalOrderRef('');
    }
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold">Auftrag anlegen</h2>
      <form onSubmit={onSubmit} className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-semibold">Produkt suchen</span>
          <input
            className="min-h-[48px] rounded-xl border border-slate-300 px-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name oder Artikelnummer"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-semibold">Produkt</span>
          <select
            className="min-h-[48px] rounded-xl border border-slate-300 px-4"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            {matches.map((product) => (
              <option value={product.productId} key={product.productId}>
                {product.name} ({product.articleNo})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-semibold">Menge (L)</span>
          <input
            type="number"
            className="min-h-[48px] rounded-xl border border-slate-300 px-4"
            value={amountL}
            min={1}
            onChange={(e) => setAmountL(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-semibold">Gebindegröße (ml)</span>
          <select
            className="min-h-[48px] rounded-xl border border-slate-300 px-4"
            value={packSizeMl}
            onChange={(e) => setPackSizeMl(Number(e.target.value) as PackSizeMl)}
          >
            {packs.map((pack) => (
              <option key={pack} value={pack}>
                {pack}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-semibold">Linie</span>
          <select
            className="min-h-[48px] rounded-xl border border-slate-300 px-4"
            value={lineId}
            onChange={(e) => setLineId(e.target.value)}
          >
            {lines.map((line) => (
              <option value={line.lineId} key={line.lineId}>
                {line.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-semibold">Startzeit</span>
          <input
            type="datetime-local"
            className="min-h-[48px] rounded-xl border border-slate-300 px-4"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-semibold">Auftragsnummer (optional)</span>
          <input
            className="min-h-[48px] rounded-xl border border-slate-300 px-4"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-semibold">Interne Referenz (optional)</span>
          <input
            className="min-h-[48px] rounded-xl border border-slate-300 px-4"
            value={optionalOrderRef}
            onChange={(e) => setOptionalOrderRef(e.target.value)}
          />
        </label>
        <button className="min-h-[48px] rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-500 lg:col-span-2">
          Auftrag speichern
        </button>
      </form>
      {message ? <p className="mt-4 rounded-xl bg-slate-100 p-3 font-semibold">{message}</p> : null}
    </section>
  );
}
