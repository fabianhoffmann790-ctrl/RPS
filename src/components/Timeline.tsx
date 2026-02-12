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

type PositionedBlock = TimelineBlock & {
  startMs: number;
  endMs: number;
};

const pxPerHourByZoom: Record<TimelineZoom, number> = {
  60: 120,
  30: 240,
  15: 480,
};

const clampHour = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const normalizeUi = (ui: Partial<TimelineUi>): TimelineUi => {
  const startHour = clampHour(Number.isFinite(ui.startHour) ? (ui.startHour as number) : 6, 0, 23);
  const rawEnd = Number.isFinite(ui.endHour) ? (ui.endHour as number) : 22;
  const endHour = Math.max(startHour + 1, clampHour(rawEnd, 1, 24));
  const zoomMinutes = ui.zoomMinutes === 15 || ui.zoomMinutes === 30 || ui.zoomMinutes === 60 ? ui.zoomMinutes : 30;

  return {
    startHour,
    endHour,
    zoomMinutes,
    showGrid: ui.showGrid ?? true,
  };
};

export function Timeline({ title, blocks, ui, onUiChange, showControls = false }: Props) {
  const normalizedUi = normalizeUi(ui);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const positionedBlocks = useMemo<PositionedBlock[]>(
    () =>
      blocks
        .map((block) => {
          const startMs = new Date(block.start).getTime();
          const endMs = new Date(block.end).getTime();
          return { ...block, startMs, endMs };
        })
        .filter((block) => Number.isFinite(block.startMs) && Number.isFinite(block.endMs) && block.endMs > block.startMs),
    [blocks],
  );

  const { windowStart, windowEnd, durationMs, widthPx } = useMemo(() => {
    const baseline = startOfDay(new Date());
    const start = new Date(baseline);
    start.setHours(normalizedUi.startHour, 0, 0, 0);

    const endBaseline = normalizedUi.endHour <= normalizedUi.startHour ? addDays(baseline, 1) : baseline;
    const end = new Date(endBaseline);
    end.setHours(normalizedUi.endHour, 0, 0, 0);

    const minBlockStart = positionedBlocks.length
      ? Math.min(...positionedBlocks.map((block) => block.startMs))
      : undefined;
    const maxBlockEnd = positionedBlocks.length ? Math.max(...positionedBlocks.map((block) => block.endMs)) : undefined;

    const windowStart = minBlockStart !== undefined ? Math.min(start.getTime(), minBlockStart) : start.getTime();
    const windowEnd = maxBlockEnd !== undefined ? Math.max(end.getTime(), maxBlockEnd) : end.getTime();
    const durationMs = Math.max(1, windowEnd - windowStart);
    const hours = durationMs / (1000 * 60 * 60);
    const widthPx = Math.max(900, Math.round(hours * pxPerHourByZoom[normalizedUi.zoomMinutes]));

    return { windowStart, windowEnd, durationMs, widthPx };
  }, [normalizedUi.endHour, normalizedUi.startHour, normalizedUi.zoomMinutes, positionedBlocks]);

  const jumpToNow = () => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    const nowX = ((now.getTime() - windowStart) / durationMs) * widthPx;
    const target = nowX - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-lg font-bold">{title}</h4>
        <button
          type="button"
          onClick={jumpToNow}
          className="min-h-[40px] rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Springe zu jetzt
        </button>
      </div>

      {showControls ? (
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Startstunde</span>
            <input
              type="number"
              min={0}
              max={23}
              value={normalizedUi.startHour}
              onChange={(event) => onUiChange?.({ startHour: clampHour(Number(event.target.value), 0, 23) })}
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Endstunde</span>
            <input
              type="number"
              min={1}
              max={24}
              value={normalizedUi.endHour}
              onChange={(event) => onUiChange?.({ endHour: clampHour(Number(event.target.value), 1, 24) })}
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Zoom</span>
            <select
              value={normalizedUi.zoomMinutes}
              onChange={(event) => onUiChange?.({ zoomMinutes: Number(event.target.value) as TimelineZoom })}
              className="rounded-lg border border-slate-300 px-2 py-1"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={normalizedUi.showGrid}
              onChange={(event) => onUiChange?.({ showGrid: event.target.checked })}
            />
            Raster anzeigen
          </label>
        </div>
      ) : null}

      <div ref={scrollRef} className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50">
        <div className="relative h-28 p-2" style={{ width: `${widthPx}px` }}>
          {normalizedUi.showGrid
            ? Array.from({ length: Math.ceil(durationMs / (normalizedUi.zoomMinutes * 60_000)) + 1 }).map((_, index) => {
                const x = (index * normalizedUi.zoomMinutes * 60_000 * widthPx) / durationMs;
                return <div key={`grid-${index}`} className="absolute bottom-0 top-0 w-px bg-slate-200" style={{ left: x }} />;
              })
            : null}

          {positionedBlocks.map((block) => {
            const left = ((block.startMs - windowStart) / durationMs) * widthPx;
            const width = Math.max(24, ((block.endMs - block.startMs) / durationMs) * widthPx);
            return (
              <div
                key={block.id}
                className={`absolute top-4 h-16 rounded-xl px-3 py-2 text-white shadow ${block.color}`}
                style={{ left: `${left}px`, width: `${width}px` }}
              >
                <p className="truncate text-base font-semibold">{block.label}</p>
                {block.subLabel ? <p className="truncate text-sm">{block.subLabel}</p> : null}
              </div>
            );
          })}

          {now.getTime() >= windowStart && now.getTime() <= windowEnd ? (
            <div
              className="absolute bottom-0 top-0 z-20 w-0.5 bg-red-500"
              style={{ left: `${((now.getTime() - windowStart) / durationMs) * widthPx}px` }}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-600">
        <span>{format(new Date(windowStart), 'dd.MM HH:mm')}</span>
        <span>{format(new Date(windowEnd), 'dd.MM HH:mm')}</span>
      </div>
    </section>
  );
}
