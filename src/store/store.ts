import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addMinutes } from 'date-fns';
import {
  AppMeta,
  HistoryEntry,
  ISTUpdate,
  Line,
  MasterData,
  Order,
  PackSizeMl,
  Product,
  ProductionStatus,
  RWAssignment,
  Stirrer,
} from './types';
import { overlap } from '../utils/time';

type TimelineUiPatch = Partial<AppMeta['ui']>;

type CreateOrderInput = {
  productId: string;
  amountL: number;
  packSizeMl: PackSizeMl;
  lineId: string;
  fillStart: string;
  orderNo?: string;
  optionalOrderRef?: string;
  parentOrderId?: string;
};

type SplitInput = {
  orderId: string;
  type: 'parts' | 'amounts';
  parts?: number;
  amounts?: number[];
};

type MasterDataInput = {
  products: Product[];
  lines: Line[];
  stirrers: Stirrer[];
};

type AppState = {
  masterData: MasterData;
  orders: Order[];
  assignments: RWAssignment[];
  istUpdates: ISTUpdate[];
  history: HistoryEntry[];
  meta: AppMeta;
  lineOrderMap: Record<string, string[]>;
  nav: 'dashboard' | 'masterdata' | 'history' | 'export-import';
  conflictMessage?: string;
  setNav: (nav: AppState['nav']) => void;
  upsertMasterData: (input: MasterDataInput) => void;
  createOrder: (input: CreateOrderInput) => { ok: boolean; error?: string; order?: Order };
  updateOrder: (orderId: string, patch: Partial<Order>) => { ok: boolean; error?: string };
  deleteOrder: (orderId: string) => void;
  reorderLineOrders: (lineId: string, orderIds: string[]) => void;
  splitOrder: (input: SplitInput) => { ok: boolean; error?: string; createdCount?: number };
  assignRW: (orderId: string, rwId: string) => { ok: boolean; error?: string };
  removeAssignment: (orderId: string) => void;
  updateIst: (input: {
    rwId: string;
    orderId: string;
    status: ProductionStatus;
    remainingL?: number;
    filledL?: number;
  }) => { ok: boolean; error?: string };
  exportState: () => string;
  importState: (json: string) => { ok: boolean; error?: string };
  clearConflict: () => void;
  setTimelineUi: (patch: TimelineUiPatch) => void;
};

type ImportPayload = Partial<Omit<AppState, 'createOrder' | 'updateOrder' | 'deleteOrder' | 'reorderLineOrders' | 'splitOrder' | 'assignRW' | 'removeAssignment' | 'updateIst' | 'exportState' | 'importState' | 'setNav' | 'upsertMasterData' | 'clearConflict' | 'setTimelineUi'>> & {
  usedOrderNumbers?: string[];
};

const defaultMasterData: MasterData = {
  products: [
    {
      productId: 'P-100',
      name: 'Basisreiniger Blau',
      articleNo: 'BR-100',
      makeTimeMinPerL: 0.8,
      fillFactor: 1,
    },
  ],
  lines: [
    {
      lineId: 'L1',
      name: 'Linie L1',
      fillRates: { 250: 4, 500: 6, 1000: 10, 5000: 20 },
    },
    {
      lineId: 'L2',
      name: 'Linie L2',
      fillRates: { 250: 3.5, 500: 5.5, 1000: 9.5, 5000: 18 },
    },
    {
      lineId: 'L3',
      name: 'Linie L3',
      fillRates: { 250: 3, 500: 5, 1000: 8, 5000: 16 },
    },
    {
      lineId: 'L4',
      name: 'Linie L4',
      fillRates: { 250: 4.5, 500: 6.5, 1000: 11, 5000: 21 },
    },
  ],
  stirrers: [
    { rwId: 'RW1', name: 'Rührwerk 1' },
    { rwId: 'RW2', name: 'Rührwerk 2' },
  ],
};

const defaultMeta: AppMeta = {
  usedOrderNumbers: [],
  ui: {
    startHour: 6,
    endHour: 22,
    zoomMinutes: 30,
    showGrid: true,
  },
  config: {},
};

const addHistory = (state: AppState, type: HistoryEntry['type'], message: string, payload?: Record<string, unknown>) => {
  state.history.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    message,
    payload,
  });
};

const makeOrderNumber = (used: string[]): string => {
  let i = 1;
  while (used.includes(`ORD-${String(i).padStart(5, '0')}`)) {
    i += 1;
  }
  return `ORD-${String(i).padStart(5, '0')}`;
};

const calcTimings = (product: Product, line: Line, amountL: number, packSizeMl: PackSizeMl, fillStart: string) => {
  const fillRate = line.fillRates[packSizeMl];
  const fillFactor = product.fillFactor ?? 1;
  const fillDurationMin = amountL / (fillRate * fillFactor);
  const makeDurationMin = amountL * product.makeTimeMinPerL;
  const fillEnd = addMinutes(new Date(fillStart), fillDurationMin).toISOString();
  const makeStart = addMinutes(new Date(fillStart), -makeDurationMin).toISOString();
  return {
    fillDurationMin,
    makeDurationMin,
    fillEnd,
    makeStart,
    makeEnd: fillStart,
  };
};

const ensureLineMap = (orders: Order[], lineMap: Record<string, string[]>) => {
  const out: Record<string, string[]> = { ...lineMap };
  orders.forEach((order) => {
    if (!out[order.lineId]) {
      out[order.lineId] = [];
    }
    if (!out[order.lineId].includes(order.id)) {
      out[order.lineId].push(order.id);
    }
  });
  return out;
};


const normalizeTimelineUi = (ui: Partial<AppMeta['ui']> & { workWindowHours?: number; zoomLevel?: number } = {}) => {
  const startHour = Math.max(0, Math.min(23, ui.startHour ?? 6));
  const endHour = Math.max(startHour + 1, Math.min(24, ui.endHour ?? 22));
  const zoomMinutes = ui.zoomMinutes === 15 || ui.zoomMinutes === 30 || ui.zoomMinutes === 60
    ? ui.zoomMinutes
    : ui.zoomLevel === 2
      ? 15
      : ui.zoomLevel === 0.5
        ? 60
        : 30;
  const showGrid = ui.showGrid ?? true;
  return { startHour, endHour, zoomMinutes, showGrid };
};

const findRWConflict = (assignments: RWAssignment[], orders: Order[]): string | undefined => {
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const byRw = assignments.reduce<Record<string, RWAssignment[]>>((acc, assignment) => {
    if (!acc[assignment.rwId]) {
      acc[assignment.rwId] = [];
    }
    acc[assignment.rwId].push(assignment);
    return acc;
  }, {});

  for (const [rwId, rwAssignments] of Object.entries(byRw)) {
    const sorted = [...rwAssignments].sort(
      (a, b) => new Date(a.rwStart).getTime() - new Date(b.rwStart).getTime(),
    );
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (overlap(current.rwStart, current.rwEnd, next.rwStart, next.rwEnd)) {
        const currentOrderNo = orderById.get(current.orderId)?.orderNo ?? current.orderId;
        const nextOrderNo = orderById.get(next.orderId)?.orderNo ?? next.orderId;
        return `RW-Konflikt: Überschneidung zwischen Auftrag ${currentOrderNo} und ${nextOrderNo} auf ${rwId}`;
      }
    }
  }

  return undefined;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      masterData: defaultMasterData,
      orders: [],
      assignments: [],
      istUpdates: [],
      history: [],
      meta: defaultMeta,
      lineOrderMap: {},
      nav: 'dashboard',
      conflictMessage: undefined,

      setNav: (nav) => set({ nav }),
      clearConflict: () => set({ conflictMessage: undefined }),
      setTimelineUi: (patch) =>
        set((state) => ({
          meta: {
            ...state.meta,
            ui: normalizeTimelineUi({
              ...state.meta.ui,
              ...patch,
            }),
          },
        })),

      upsertMasterData: (input) =>
        set((state) => {
          const next = { ...state, masterData: input };
          addHistory(next, 'masterdata', 'Stammdaten geändert');
          return next;
        }),

      createOrder: (input) => {
        const state = get();
        const product = state.masterData.products.find((p) => p.productId === input.productId);
        const line = state.masterData.lines.find((l) => l.lineId === input.lineId);
        if (!product || !line) {
          return { ok: false, error: 'Produkt oder Linie nicht gefunden.' };
        }

        const requestedOrderNo = input.orderNo?.trim();
        const orderNo = requestedOrderNo || makeOrderNumber(state.meta.usedOrderNumbers);
        if (state.meta.usedOrderNumbers.includes(orderNo)) {
          return { ok: false, error: `Auftragsnummer ${orderNo} wurde bereits verwendet.` };
        }

        const timing = calcTimings(product, line, input.amountL, input.packSizeMl, input.fillStart);
        const now = new Date().toISOString();
        const order: Order = {
          id: crypto.randomUUID(),
          orderNo,
          productId: input.productId,
          amountL: input.amountL,
          packSizeMl: input.packSizeMl,
          lineId: input.lineId,
          fillStart: input.fillStart,
          fillEnd: timing.fillEnd,
          makeStart: timing.makeStart,
          makeEnd: timing.makeEnd,
          parentOrderId: input.parentOrderId,
          optionalOrderRef: input.optionalOrderRef,
          createdAt: now,
          updatedAt: now,
        };

        set((prev) => {
          const next = {
            ...prev,
            orders: [...prev.orders, order],
            meta: {
              ...prev.meta,
              usedOrderNumbers: [...prev.meta.usedOrderNumbers, orderNo],
            },
            lineOrderMap: ensureLineMap([...prev.orders, order], prev.lineOrderMap),
          };
          addHistory(next, 'create', `Auftrag ${order.orderNo} erstellt`, { orderId: order.id });
          return next;
        });

        return { ok: true, order };
      },

      updateOrder: (orderId, patch) => {
        const state = get();
        const existing = state.orders.find((o) => o.id === orderId);
        if (!existing) {
          return { ok: false, error: 'Auftrag nicht gefunden.' };
        }
        const productId = patch.productId ?? existing.productId;
        const lineId = patch.lineId ?? existing.lineId;
        const amountL = patch.amountL ?? existing.amountL;
        const packSizeMl = patch.packSizeMl ?? existing.packSizeMl;
        const fillStart = patch.fillStart ?? existing.fillStart;
        const product = state.masterData.products.find((p) => p.productId === productId);
        const line = state.masterData.lines.find((l) => l.lineId === lineId);
        if (!product || !line) {
          return { ok: false, error: 'Produkt/Linie ungültig.' };
        }
        const timing = calcTimings(product, line, amountL, packSizeMl, fillStart);

        const updated: Order = {
          ...existing,
          ...patch,
          productId,
          lineId,
          amountL,
          packSizeMl,
          fillStart,
          fillEnd: timing.fillEnd,
          makeStart: timing.makeStart,
          makeEnd: timing.makeEnd,
          updatedAt: new Date().toISOString(),
        };

        set((prev) => {
          const nextOrders = prev.orders.map((o) => (o.id === orderId ? updated : o));
          const next = {
            ...prev,
            orders: nextOrders,
            lineOrderMap: ensureLineMap(nextOrders, prev.lineOrderMap),
          };
          addHistory(next, 'edit', `Auftrag ${updated.orderNo} geändert`, { orderId });
          return next;
        });

        return { ok: true };
      },

      deleteOrder: (orderId) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          const next = {
            ...state,
            orders: state.orders.filter((o) => o.id !== orderId),
            assignments: state.assignments.filter((a) => a.orderId !== orderId),
            lineOrderMap: Object.fromEntries(
              Object.entries(state.lineOrderMap).map(([lineId, ids]) => [
                lineId,
                ids.filter((id) => id !== orderId),
              ]),
            ),
          };
          if (order) {
            addHistory(next, 'delete', `Auftrag ${order.orderNo} gelöscht`, { orderId });
          }
          return next;
        }),

      reorderLineOrders: (lineId, orderIds) =>
        set((state) => {
          const line = state.masterData.lines.find((entry) => entry.lineId === lineId);
          const ordersById = new Map(state.orders.map((order) => [order.id, order]));
          const updatedOrders = new Map<string, Order>();
          const reflowedOrderIds: string[] = [];
          const now = new Date().toISOString();
          let previousFillEnd: string | undefined;

          if (line) {
            orderIds.forEach((orderId) => {
              const order = ordersById.get(orderId);
              if (!order || order.lineId !== lineId) {
                return;
              }
              const product = state.masterData.products.find((entry) => entry.productId === order.productId);
              if (!product) {
                return;
              }
              const fillStart = previousFillEnd ?? order.fillStart;
              const timing = calcTimings(product, line, order.amountL, order.packSizeMl, fillStart);
              updatedOrders.set(orderId, {
                ...order,
                fillStart,
                fillEnd: timing.fillEnd,
                makeStart: timing.makeStart,
                makeEnd: timing.makeEnd,
                updatedAt: now,
              });
              previousFillEnd = timing.fillEnd;
              reflowedOrderIds.push(orderId);
            });
          }

          const nextOrders = state.orders.map((order) => updatedOrders.get(order.id) ?? order);
          const nextAssignments = state.assignments.map((assignment) => {
            const order = updatedOrders.get(assignment.orderId);
            if (!order) {
              return assignment;
            }
            return {
              ...assignment,
              rwStart: order.makeStart,
              rwEnd: order.fillEnd,
            };
          });
          const conflictMessage = findRWConflict(nextAssignments, nextOrders);
          const next = {
            ...state,
            orders: nextOrders,
            assignments: nextAssignments,
            conflictMessage,
            lineOrderMap: { ...state.lineOrderMap, [lineId]: orderIds },
          };
          addHistory(next, 'move', `Linie ${lineId} Reihenfolge geändert und zeitlich neu berechnet`, {
            lineId,
            orderIds,
            reflowedOrderIds,
          });
          return next;
        }),

      splitOrder: (input) => {
        const state = get();
        const original = state.orders.find((o) => o.id === input.orderId);
        if (!original) {
          return { ok: false, error: 'Originalauftrag nicht gefunden.' };
        }
        const childAmounts =
          input.type === 'parts'
            ? Array.from({ length: input.parts ?? 0 }, () => original.amountL / (input.parts ?? 1))
            : input.amounts ?? [];
        const sum = childAmounts.reduce((acc, curr) => acc + curr, 0);
        if (childAmounts.length < 2 || childAmounts.some((a) => a <= 0)) {
          return { ok: false, error: 'Ungültige Split-Werte.' };
        }
        if (Math.abs(sum - original.amountL) > 0.01) {
          return { ok: false, error: 'Teilmengen ergeben nicht die Originalmenge.' };
        }

        const created: Order[] = [];
        const nextUsed = [...state.meta.usedOrderNumbers];
        childAmounts.forEach((amount) => {
          const autoNo = makeOrderNumber(nextUsed);
          nextUsed.push(autoNo);
          const line = state.masterData.lines.find((l) => l.lineId === original.lineId)!;
          const product = state.masterData.products.find((p) => p.productId === original.productId)!;
          const timing = calcTimings(product, line, amount, original.packSizeMl, original.fillStart);
          const now = new Date().toISOString();
          created.push({
            id: crypto.randomUUID(),
            orderNo: autoNo,
            productId: original.productId,
            amountL: amount,
            packSizeMl: original.packSizeMl,
            lineId: original.lineId,
            fillStart: original.fillStart,
            fillEnd: timing.fillEnd,
            makeStart: timing.makeStart,
            makeEnd: timing.makeEnd,
            parentOrderId: original.id,
            optionalOrderRef: original.optionalOrderRef,
            createdAt: now,
            updatedAt: now,
          });
        });

        set((prev) => {
          const withoutOriginal = prev.orders.filter((o) => o.id !== original.id);
          const orders = [...withoutOriginal, ...created];
          const nextLineMap = ensureLineMap(orders, prev.lineOrderMap);
          nextLineMap[original.lineId] = [
            ...(nextLineMap[original.lineId] ?? []).filter((id) => id !== original.id),
            ...created.map((c) => c.id),
          ];
          const next = {
            ...prev,
            orders,
            meta: {
              ...prev.meta,
              usedOrderNumbers: nextUsed,
            },
            assignments: prev.assignments.filter((a) => a.orderId !== original.id),
            lineOrderMap: nextLineMap,
          };
          addHistory(next, 'split', `Auftrag ${original.orderNo} in ${created.length} Teilaufträge gesplittet`, {
            orderId: original.id,
            childOrderIds: created.map((c) => c.id),
          });
          return next;
        });
        return { ok: true, createdCount: created.length };
      },

      assignRW: (orderId, rwId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) {
          return { ok: false, error: 'Auftrag nicht gefunden.' };
        }
        const nextAssignment: RWAssignment = {
          orderId,
          rwId,
          rwStart: order.makeStart,
          rwEnd: order.fillEnd,
        };
        const conflict = state.assignments.find(
          (a) =>
            a.rwId === rwId &&
            a.orderId !== orderId &&
            overlap(a.rwStart, a.rwEnd, nextAssignment.rwStart, nextAssignment.rwEnd),
        );
        if (conflict) {
          const msg = `RW-Konflikt: Überschneidung mit Auftrag ${
            state.orders.find((o) => o.id === conflict.orderId)?.orderNo ?? conflict.orderId
          }`;
          set({ conflictMessage: msg });
          return { ok: false, error: msg };
        }

        set((prev) => {
          const nextAssignments = prev.assignments.filter((a) => a.orderId !== orderId);
          nextAssignments.push(nextAssignment);
          const next = { ...prev, assignments: nextAssignments, conflictMessage: undefined };
          addHistory(next, 'assign', `Auftrag ${order.orderNo} -> ${rwId} zugewiesen`, {
            orderId,
            rwId,
          });
          return next;
        });
        return { ok: true };
      },

      removeAssignment: (orderId) =>
        set((state) => {
          const next = {
            ...state,
            assignments: state.assignments.filter((a) => a.orderId !== orderId),
          };
          addHistory(next, 'assign', `RW-Zuordnung für Auftrag ${orderId} entfernt`, { orderId });
          return next;
        }),

      updateIst: ({ rwId, orderId, status, remainingL, filledL }) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        const assignment = state.assignments.find((a) => a.orderId === orderId && a.rwId === rwId);
        if (!order || !assignment) {
          return { ok: false, error: 'Auftrag oder Zuordnung nicht gefunden.' };
        }

        const line = state.masterData.lines.find((l) => l.lineId === order.lineId);
        const product = state.masterData.products.find((p) => p.productId === order.productId);
        if (!line || !product) {
          return { ok: false, error: 'Stammdaten fehlen.' };
        }
        const rate = line.fillRates[order.packSizeMl] * (product.fillFactor ?? 1);
        const amountDone = filledL ?? Math.max(0, order.amountL - (remainingL ?? 0));
        const remaining = remainingL ?? Math.max(0, order.amountL - amountDone);
        const now = new Date();
        const newFillEnd = addMinutes(now, remaining / rate).toISOString();

        const updatedOrder: Order = {
          ...order,
          fillEnd: newFillEnd,
          updatedAt: now.toISOString(),
        };
        const updatedAssignment: RWAssignment = {
          ...assignment,
          rwEnd: newFillEnd,
        };

        set((prev) => {
          const next = {
            ...prev,
            orders: prev.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
            assignments: prev.assignments.map((a) =>
              a.orderId === orderId && a.rwId === rwId ? updatedAssignment : a,
            ),
            istUpdates: [
              {
                id: crypto.randomUUID(),
                orderId,
                rwId,
                status,
                remainingL: remaining,
                filledL: amountDone,
                timestamp: now.toISOString(),
              },
              ...prev.istUpdates,
            ],
          };
          addHistory(next, 'ist', `IST-Update für Auftrag ${order.orderNo} (${status})`, {
            orderId,
            rwId,
            remaining,
            filled: amountDone,
          });
          return next;
        });

        return { ok: true };
      },

      exportState: () => {
        const state = get();
        return JSON.stringify(
          {
            masterData: state.masterData,
            orders: state.orders,
            assignments: state.assignments,
            istUpdates: state.istUpdates,
            history: state.history,
            meta: state.meta,
            lineOrderMap: state.lineOrderMap,
          },
          null,
          2,
        );
      },

      importState: (json) => {
        try {
          const parsed = JSON.parse(json) as ImportPayload;
          if (!parsed.masterData || !parsed.orders) {
            return { ok: false, error: 'JSON unvollständig.' };
          }

          const importedMeta: AppMeta = {
            ...defaultMeta,
            ...(parsed.meta ?? {}),
            usedOrderNumbers: parsed.meta?.usedOrderNumbers ?? parsed.usedOrderNumbers ?? [],
            ui: normalizeTimelineUi(parsed.meta?.ui as Partial<AppMeta['ui']> & { workWindowHours?: number; zoomLevel?: number }),
            config: {
              ...defaultMeta.config,
              ...(parsed.meta?.config ?? {}),
            },
          };

          set((state) => {
            const next = {
              ...state,
              masterData: parsed.masterData as MasterData,
              orders: parsed.orders as Order[],
              assignments: (parsed.assignments as RWAssignment[]) ?? [],
              istUpdates: (parsed.istUpdates as ISTUpdate[]) ?? [],
              history: (parsed.history as HistoryEntry[]) ?? [],
              meta: importedMeta,
              lineOrderMap: ensureLineMap(parsed.orders as Order[], (parsed.lineOrderMap as Record<string, string[]>) ?? {}),
            };
            addHistory(next, 'import', 'Daten per JSON importiert');
            return next;
          });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: `Import fehlgeschlagen: ${(error as Error).message}` };
        }
      },
    }),
    {
      name: 'rms-light-state',
      version: 2,
      migrate: (persistedState: unknown) => {
        const state = persistedState as {
          meta?: AppMeta;
          usedOrderNumbers?: string[];
        };
        return {
          ...(state as Record<string, unknown>),
          meta: {
            ...defaultMeta,
            ...(state.meta ?? {}),
            usedOrderNumbers: state.meta?.usedOrderNumbers ?? state.usedOrderNumbers ?? [],
            ui: normalizeTimelineUi(state.meta?.ui as Partial<AppMeta['ui']> & { workWindowHours?: number; zoomLevel?: number }),
            config: {
              ...defaultMeta.config,
              ...(state.meta?.config ?? {}),
            },
          },
        } as AppState;
      },
    },
  ),
);
