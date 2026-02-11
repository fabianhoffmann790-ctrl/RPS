import { format } from 'date-fns';

type TimelineBlock = {
  id: string;
  label: string;
  start: string;
  end: string;
  color: string;
  subLabel?: string;
};

type Props = {
  blocks: TimelineBlock[];
};

const minMax = (blocks: TimelineBlock[]) => {
  if (!blocks.length) {
    const now = Date.now();
    return { min: now - 60 * 60 * 1000, max: now + 60 * 60 * 1000 };
  }
  const starts = blocks.map((b) => new Date(b.start).getTime());
  const ends = blocks.map((b) => new Date(b.end).getTime());
  return { min: Math.min(...starts), max: Math.max(...ends) };
};

export function Timeline({ blocks }: Props) {
  const { min, max } = minMax(blocks);
  const span = Math.max(1, max - min);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="relative h-28 rounded-lg bg-slate-100 p-2">
        {blocks.map((block) => {
          const start = new Date(block.start).getTime();
          const end = new Date(block.end).getTime();
          const left = ((start - min) / span) * 100;
          const width = Math.max(8, ((end - start) / span) * 100);
          return (
            <div
              key={block.id}
              className={`absolute top-4 h-16 rounded-xl px-3 py-2 text-white shadow ${block.color}`}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <p className="truncate text-base font-semibold">{block.label}</p>
              {block.subLabel ? <p className="truncate text-sm">{block.subLabel}</p> : null}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-600">
        <span>{format(new Date(min), 'dd.MM HH:mm')}</span>
        <span>{format(new Date(max), 'dd.MM HH:mm')}</span>
      </div>
    </div>
  );
}
