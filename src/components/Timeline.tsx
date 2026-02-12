import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, format, startOfDay } from 'date-fns';

export type TimelineZoom = 15 | 30 | 60;

type TimelineBlock = {
  id: string;
  label: string;
  start: string;
  end: string;
  color: string;
  subLabel?: string;
};

type TimelineUi = {
  startHour: number;
  endHour: number;
  zoomMinutes: TimelineZoom;
  showGrid: boolean;
};

type Props = {
  title: string;
  blocks: TimelineBlock[];
  ui: TimelineUi;
  onUiChange?: (patch: Partial<TimelineUi>) => void;
  showControls?: boolean;
};

const pxPerHourByZoom: Record<TimelineZoom, number> = { 60: 120, 30: 240, 15: 480 };
const FALLBACK_START_OFFSET_MS = 60 * 60 * 1000;

const clampHour = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const isFiniteTime = (value: number) => Number.isFinite(value);
const safeFormat = (timeMs: number) => (isFiniteTime(timeMs) ? format(new Date(timeMs), 'dd.MM HH:mm') : '--.-- --:--');

const normalizeUi = (ui: Partial<TimelineUi>): TimelineUi => {
  const startHour = clampHour(Number(ui.startHour ?? 6), 0, 23);
  const endHour = Math.max(startHour + 1, clampHour(Number(ui.endHour ?? 22), 1, 24));
  const zoomMinutes = ui.zoomMinutes === 15 || ui.zoomMinutes === 30 || ui.zoomMinutes === 60 ? ui.zoomMinutes : 30;
  return { startHour, endHour, zoomMinutes, showGrid: ui.showGrid ?? true };
};

const sanitizeBlocks = (blocks: TimelineBlock[]) =>
  blocks
    .map((block) => ({ ...block, startMs: new Date(block.start).getTime(), endMs: new Date(block.end).getTime() }))
    .filter((block) => isFiniteTime(block.startMs) && isFiniteTime(block.endMs) && block.endMs > block.startMs);

export function Timeline({ title, blocks, ui, onUiChange, showControls = false }: Props) {
  const normalizedUi = normalizeUi(ui);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const preparedBlocks = useMemo(() => sanitizeBlocks(blocks), [blocks]);

  const { startMs, endMs, durationMs, widthPx } = useMemo(() => {
    const dayStart = startOfDay(new Date());
    const start = new Date(dayStart);
    start.setHours(normalizedUi.startHour, 0, 0, 0);

    const endDay = normalizedUi.endHour <= normalizedUi.startHour ? addDays(dayStart, 1) : dayStart;
    const end = new Date(endDay);
    end.setHours(normalizedUi.endHour, 0, 0, 0);

    const minBlockStart = preparedBlocks.length ? Math.min(...preparedBlocks.map((block) => block.startMs)) : start.getTime();
    const maxBlockEnd = preparedBlocks.length ? Math.max(...preparedBlocks.map((block) => block.endMs)) : end.getTime();

    const computedStart = Math.min(start.getTime(), minBlockStart);
    const computedEnd = Math.max(end.getTime(), maxBlockEnd);
    const fallbackStart = Date.now() - FALLBACK_START_OFFSET_MS;

    const startMs = isFiniteTime(computedStart) ? computedStart : fallbackStart;
    const safeEnd = isFiniteTime(computedEnd) ? computedEnd : startMs + FALLBACK_START_OFFSET_MS;
    const endMs = Math.max(startMs + 1, safeEnd);
    const durationMs = endMs - startMs;

    const pxPerHour = pxPerHourByZoom[normalizedUi.zoomMinutes] ?? pxPerHourByZoom[30];
    const widthPx = Math.max(900, Math.round((durationMs / (1000 * 60 * 60)) * pxPerHour));

    return { startMs, endMs, durationMs, widthPx };
  }, [normalizedUi, preparedBlocks]);

  const jumpToNow = () => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const nowX = ((now.getTime() - startMs) / durationMs) * widthPx;
    el.scrollTo({ left: Math.max(0, nowX - el.clientWidth / 2), behavior: 'smooth' });
  };

  const patchUi = (patch: Partial<TimelineUi>) => {
    if (!onUiChange) {
      return;
    }
    const nextStart = patch.startHour ?? normalizedUi.startHour;
    const nextEnd = patch.endHour ?? normalizedUi.endHour;
    if (nextEnd <= nextStart) {
      if (patch.startHour !== undefined) {
        onUiChange({ ...patch, endHour: Math.min(24, nextStart + 1) });
      } else {
        onUiChange({ ...patch, startHour: Math.max(0, nextEnd - 1) });
      }
      return;
    }
    onUiChange(patch);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-lg font-bold">{title}</h4>
        <button type="button" onClick={jumpToNow} className="min-h-[40px] rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-500">
          Springe zu jetzt
        </button>
      </div>

      {showControls ? (
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Startstunde</span>
            <input type="number" min={0} max={23} value={normalizedUi.startHour} onChange={(event) => patchUi({ startHour: clampHour(Number(event.target.value), 0, 23) })} className="rounded-lg border border-slate-300 px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Endstunde</span>
            <input type="number" min={1} max={24} value={normalizedUi.endHour} onChange={(event) => patchUi({ endHour: clampHour(Number(event.target.value), 1, 24) })} className="rounded-lg border border-slate-300 px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Zoom</span>
            <select value={normalizedUi.zoomMinutes} onChange={(event) => patchUi({ zoomMinutes: Number(event.target.value) as TimelineZoom })} className="rounded-lg border border-slate-300 px-2 py-1">
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={normalizedUi.showGrid} onChange={(event) => patchUi({ showGrid: event.target.checked })} />
            Raster anzeigen
          </label>
        </div>
      ) : null}

      <div ref={scrollRef} className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50">
        <div className="relative h-28 p-2" style={{ width: `${widthPx}px` }}>
          {normalizedUi.showGrid
            ? Array.from({ length: Math.ceil(durationMs / (normalizedUi.zoomMinutes * 60_000)) + 1 }).map((_, index) => {
                const x = (index * normalizedUi.zoomMinutes * 60_000 * widthPx) / durationMs;
                return <div key={`grid-${index}`} className="absolute inset-y-0 w-px bg-slate-200" style={{ left: x }} />;
              })
            : null}

          {preparedBlocks.map((block) => {
            const left = ((block.startMs - startMs) / durationMs) * widthPx;
            const width = Math.max(24, ((block.endMs - block.startMs) / durationMs) * widthPx);
            return (
              <div key={block.id} className={`absolute top-4 h-16 rounded-xl px-3 py-2 text-white shadow ${block.color}`} style={{ left: `${left}px`, width: `${width}px` }}>
                <p className="truncate text-base font-semibold">{block.label}</p>
                {block.subLabel ? <p className="truncate text-sm">{block.subLabel}</p> : null}
              </div>
            );
          })}

          {now.getTime() >= startMs && now.getTime() <= endMs ? (
            <div className="absolute inset-y-0 z-20 w-0.5 bg-red-500" style={{ left: `${((now.getTime() - startMs) / durationMs) * widthPx}px` }} />
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-600">
        <span>{safeFormat(startMs)}</span>
        <span>{safeFormat(endMs)}</span>
      </div>
    </section>
  );
}
