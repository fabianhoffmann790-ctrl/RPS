import { Timeline } from '../components/Timeline';
import { OrderCreateCard } from '../components/OrderCreateCard';
import { useAppStore } from '../store/store';

export function DashboardPage() {
  const { lines, stirrers, products } = useAppStore((s) => s.masterData);
  const orders = useAppStore((s) => s.orders);
  const assignments = useAppStore((s) => s.assignments);
  const timelineUi = useAppStore((s) => s.meta.ui);
  const setTimelineUi = useAppStore((s) => s.setTimelineUi);

  return (
    <div className="grid gap-6">
      <OrderCreateCard />

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-bold">Linien (L1–L4)</h3>
        <div className="mt-4 grid gap-4">
          {lines.map((line, index) => {
            const lineBlocks = orders
              .filter((order) => order.lineId === line.lineId)
              .map((order) => {
                const productName = products.find((product) => product.productId === order.productId)?.name;
                return {
                  id: order.id,
                  label: order.orderNo,
                  subLabel: productName,
                  start: order.fillStart,
                  end: order.fillEnd,
                  color: 'bg-indigo-600',
                };
              });

            return (
              <Timeline
                key={line.lineId}
                title={line.name}
                blocks={lineBlocks}
                ui={timelineUi}
                onUiChange={setTimelineUi}
                showControls={index === 0}
              />
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-bold">Rührwerke (RW)</h3>
        <div className="mt-4 grid gap-4">
          {stirrers.map((rw) => {
            const rwBlocks = assignments
              .filter((assignment) => assignment.rwId === rw.rwId)
              .map((assignment) => {
                const order = orders.find((item) => item.id === assignment.orderId);
                return {
                  id: `${rw.rwId}-${assignment.orderId}`,
                  label: order?.orderNo ?? assignment.orderId,
                  subLabel: rw.name,
                  start: assignment.rwStart,
                  end: assignment.rwEnd,
                  color: 'bg-emerald-600',
                };
              });

            return <Timeline key={rw.rwId} title={rw.name} blocks={rwBlocks} ui={timelineUi} />;
          })}
        </div>
      </section>
    </div>
  );
}
