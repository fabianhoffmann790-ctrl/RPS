import { FormEvent, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OrderCreateCard } from '../components/OrderCreateCard';
import { Timeline } from '../components/Timeline';
import { useAppStore } from '../store/store';
import { formatDateTime } from '../utils/time';

function SortableOrderCard({ orderId }: { orderId: string }) {
  const order = useAppStore((s) => s.orders.find((o) => o.id === orderId));
  const product = useAppStore((s) => s.masterData.products.find((p) => p.productId === order?.productId));
  const rwAssignment = useAppStore((s) => s.assignments.find((a) => a.orderId === orderId));
  const stirrer = useAppStore((s) => s.masterData.stirrers.find((rw) => rw.rwId === rwAssignment?.rwId));
  const deleteOrder = useAppStore((s) => s.deleteOrder);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: orderId });
  if (!order) return null;

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="rounded-2xl bg-slate-50 p-4 shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-bold">{order.orderNo}</h4>
          <p className="text-base font-semibold">{product?.name}</p>
          <p className="text-sm">{order.amountL} L · {order.packSizeMl} ml</p>
          <p className="text-sm">{formatDateTime(order.fillStart)} - {formatDateTime(order.fillEnd)}</p>
          <p className="text-sm">RW: {stirrer?.name ?? 'Nicht zugewiesen'}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            {...attributes}
            {...listeners}
            className="min-h-[48px] rounded-xl bg-slate-200 px-3 text-base font-semibold"
          >
            Verschieben
          </button>
          <button
            className="min-h-[48px] rounded-xl bg-rose-500 px-3 text-base font-semibold text-white"
            onClick={() => deleteOrder(order.id)}
          >
            Löschen
          </button>
        </div>
      </div>
    </article>
  );
}

function LineColumn({ lineId }: { lineId: string }) {
  const line = useAppStore((s) => s.masterData.lines.find((item) => item.lineId === lineId));
  const orders = useAppStore((s) => s.orders.filter((o) => o.lineId === lineId));
  const lineOrderMap = useAppStore((s) => s.lineOrderMap[lineId] ?? []);
  const orderIds = useMemo(() => {
    const existing = lineOrderMap.filter((id) => orders.some((order) => order.id === id));
    const missing = orders.filter((order) => !existing.includes(order.id)).map((order) => order.id);
    return [...existing, ...missing];
  }, [lineOrderMap, orders]);

  const blocks = orderIds
    .map((id) => orders.find((order) => order.id === id))
    .filter((order): order is NonNullable<typeof order> => Boolean(order))
    .map((order) => ({
      id: order.id,
      label: order.orderNo,
      start: order.fillStart,
      end: order.fillEnd,
      color: 'bg-indigo-600',
      subLabel: `${order.amountL} L`,
    }));

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-2xl font-bold">{line?.name ?? lineId}</h3>
      <Timeline blocks={blocks} />
      <div className="mt-4 space-y-3">
        <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
          {orderIds.map((orderId) => (
            <SortableOrderCard key={orderId} orderId={orderId} />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}

function RWCard({ rwId }: { rwId: string }) {
  const rw = useAppStore((s) => s.masterData.stirrers.find((item) => item.rwId === rwId));
  const assignments = useAppStore((s) => s.assignments.filter((a) => a.rwId === rwId));
  const orders = useAppStore((s) => s.orders);
  const lines = useAppStore((s) => s.masterData.lines);
  const products = useAppStore((s) => s.masterData.products);
  const assignRW = useAppStore((s) => s.assignRW);
  const removeAssignment = useAppStore((s) => s.removeAssignment);
  const updateIst = useAppStore((s) => s.updateIst);
  const splitOrder = useAppStore((s) => s.splitOrder);

  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState<'läuft' | 'pausiert' | 'fertig'>('läuft');
  const [remainingL, setRemainingL] = useState<number>(0);
  const [filledL, setFilledL] = useState<number>(0);
  const [message, setMessage] = useState<string>();
  const [splitType, setSplitType] = useState<'parts' | 'amounts'>('parts');
  const [parts, setParts] = useState(2);
  const [amountList, setAmountList] = useState('');

  const assignedOrders = assignments
    .map((a) => orders.find((o) => o.id === a.orderId))
    .filter((order): order is NonNullable<typeof order> => Boolean(order));

  const blocks = assignedOrders.map((order) => ({
    id: order.id,
    label: order.orderNo,
    start: order.makeStart,
    end: order.fillEnd,
    color: 'bg-emerald-600',
    subLabel: `${formatDateTime(order.makeStart)} - ${formatDateTime(order.fillEnd)}`,
  }));

  const unassignedOrders = orders.filter((o) => !useAppStore.getState().assignments.some((a) => a.orderId === o.id));

  const onAssign = () => {
    if (!orderId) return;
    const result = assignRW(orderId, rwId);
    setMessage(result.ok ? 'Zugewiesen.' : result.error);
  };

  const onIst = (event: FormEvent) => {
    event.preventDefault();
    if (!orderId) {
      setMessage('Bitte Auftrag wählen.');
      return;
    }
    const result = updateIst({ rwId, orderId, status, remainingL, filledL });
    setMessage(result.ok ? 'IST aktualisiert.' : result.error);
  };

  const onSplit = (targetOrderId: string) => {
    const result =
      splitType === 'parts'
        ? splitOrder({ orderId: targetOrderId, type: 'parts', parts })
        : splitOrder({
            orderId: targetOrderId,
            type: 'amounts',
            amounts: amountList
              .split(',')
              .map((value) => Number(value.trim()))
              .filter((value) => !Number.isNaN(value)),
          });
    setMessage(result.ok ? `Split erstellt (${result.createdCount}).` : result.error);
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-bold">{rw?.name ?? rwId}</h3>
      <div className="mt-3">
        <Timeline blocks={blocks} />
      </div>
      <div className="mt-4 grid gap-3">
        <label className="flex flex-col gap-2">
          <span className="font-semibold">Auftrag zuweisen</span>
          <select
            className="min-h-[48px] rounded-xl border border-slate-300 px-3"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
          >
            <option value="">Bitte wählen</option>
            {unassignedOrders.map((order) => {
              const product = products.find((p) => p.productId === order.productId);
              return (
                <option key={order.id} value={order.id}>
                  {order.orderNo} - {product?.name}
                </option>
              );
            })}
          </select>
        </label>
        <button
          onClick={onAssign}
          className="min-h-[48px] rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white"
        >
          RW zuweisen
        </button>

        <form onSubmit={onIst} className="space-y-2 rounded-xl bg-slate-100 p-4">
          <h4 className="text-lg font-bold">IST aktualisieren</h4>
          <select
            className="min-h-[48px] w-full rounded-xl border border-slate-300 px-3"
            value={status}
            onChange={(event) => setStatus(event.target.value as 'läuft' | 'pausiert' | 'fertig')}
          >
            <option value="läuft">läuft</option>
            <option value="pausiert">pausiert</option>
            <option value="fertig">fertig</option>
          </select>
          <input
            type="number"
            placeholder="Restmenge (L)"
            className="min-h-[48px] w-full rounded-xl border border-slate-300 px-3"
            value={remainingL}
            onChange={(event) => setRemainingL(Number(event.target.value))}
          />
          <input
            type="number"
            placeholder="Bereits abgefüllt (L)"
            className="min-h-[48px] w-full rounded-xl border border-slate-300 px-3"
            value={filledL}
            onChange={(event) => setFilledL(Number(event.target.value))}
          />
          <button className="min-h-[48px] w-full rounded-xl bg-indigo-600 text-white">IST speichern</button>
        </form>
      </div>
      <div className="mt-4 space-y-3">
        {assignedOrders.map((order) => {
          const line = lines.find((item) => item.lineId === order.lineId);
          return (
            <div key={order.id} className="rounded-xl bg-slate-100 p-4">
              <p className="font-bold">{order.orderNo}</p>
              <p>{line?.name} · {order.amountL} L</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className="min-h-[48px] rounded-xl bg-slate-300 px-3"
                  onClick={() => removeAssignment(order.id)}
                >
                  Zuweisung entfernen
                </button>
                <button
                  className="min-h-[48px] rounded-xl bg-amber-500 px-3 text-white"
                  onClick={() => onSplit(order.id)}
                >
                  Auftrag splitten
                </button>
              </div>
            </div>
          );
        })}
        <div className="rounded-xl bg-slate-100 p-4">
          <h4 className="text-lg font-bold">Split-Einstellungen</h4>
          <select
            className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3"
            value={splitType}
            onChange={(event) => setSplitType(event.target.value as 'parts' | 'amounts')}
          >
            <option value="parts">N Teile</option>
            <option value="amounts">Mengenliste (comma)</option>
          </select>
          {splitType === 'parts' ? (
            <input
              type="number"
              min={2}
              className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3"
              value={parts}
              onChange={(event) => setParts(Number(event.target.value))}
            />
          ) : (
            <input
              className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3"
              value={amountList}
              onChange={(event) => setAmountList(event.target.value)}
              placeholder="z.B. 300,700"
            />
          )}
        </div>
      </div>
      {message ? <p className="mt-3 rounded-xl bg-slate-100 p-3">{message}</p> : null}
    </section>
  );
}

export function DashboardPage() {
  const lines = useAppStore((s) => s.masterData.lines);
  const stirrers = useAppStore((s) => s.masterData.stirrers);
  const lineOrderMap = useAppStore((s) => s.lineOrderMap);
  const reorderLineOrders = useAppStore((s) => s.reorderLineOrders);
  const conflictMessage = useAppStore((s) => s.conflictMessage);
  const clearConflict = useAppStore((s) => s.clearConflict);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const lineId = lines.find((line) => (lineOrderMap[line.lineId] ?? []).includes(String(active.id)))?.lineId;
    if (!lineId) return;
    const items = lineOrderMap[lineId] ?? [];
    const oldIndex = items.indexOf(String(active.id));
    const newIndex = items.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    reorderLineOrders(lineId, arrayMove(items, oldIndex, newIndex));
  };

  return (
    <div className="space-y-6">
      {conflictMessage ? (
        <div className="rounded-2xl bg-rose-100 p-4 text-rose-800">
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold">{conflictMessage}</p>
            <button className="min-h-[48px] rounded-xl bg-rose-500 px-3 text-white" onClick={clearConflict}>
              Schließen
            </button>
          </div>
        </div>
      ) : null}
      <OrderCreateCard />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <section className="grid gap-4 xl:grid-cols-4">
          {lines.map((line) => (
            <LineColumn key={line.lineId} lineId={line.lineId} />
          ))}
        </section>
      </DndContext>

      <section className="grid gap-4 lg:grid-cols-2">
        {stirrers.map((rw) => (
          <RWCard key={rw.rwId} rwId={rw.rwId} />
        ))}
      </section>
    </div>
  );
}
