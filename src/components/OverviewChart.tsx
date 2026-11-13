'use client';

import { useId, useState } from 'react';

export interface ChartPoint {
  date: string;
  value: number;
}

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const dateLabel = new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const tooltipDate = new Intl.DateTimeFormat('ar', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const formatDate = (date: string) => dateLabel.format(new Date(`${date}T12:00:00Z`));

export default function OverviewChart({
  title,
  points,
  unit,
  incomplete = false,
}: {
  title: string;
  points: ChartPoint[];
  unit?: string;
  incomplete?: boolean;
}) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const highest = Math.max(1, ...points.map((point) => point.value));
  const magnitude = 10 ** Math.floor(Math.log10(highest));
  const roundedMax = Math.ceil(highest / magnitude) * magnitude;
  const max = unit ? roundedMax : Math.max(2, Math.ceil(roundedMax / 2) * 2);
  const left = 48;
  const right = 480;
  const top = 16;
  const bottom = 133;
  const coords = points.map((point, index) => ({
    x: points.length === 1 ? (left + right) / 2 : left + (index / (points.length - 1)) * (right - left),
    y: bottom - (point.value / max) * (bottom - top),
  }));
  // Midpoint control points keep each curve within its actual data range.
  const line = coords.map((point, index) => {
    if (!index) return `M ${point.x} ${point.y}`;
    const previous = coords[index - 1];
    const middle = (previous.x + point.x) / 2;
    return `C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`;
  }).join(' ');
  const selected = active === null ? null : points[active];
  const selectedCoords = active === null ? null : coords[active];
  const ticks = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  return (
    <article className="overview-chart">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--dashboard-text)]">{title}</h3>
        <span className="text-xs text-[var(--dashboard-muted)]">
          <bdi className="tabular-nums">{number.format(total)}</bdi> {unit ?? 'إجمالي'}
          {incomplete ? ' · متاح' : ''}
        </span>
      </div>
      <div className="relative mt-3" dir="ltr">
        <svg
          viewBox="0 0 500 166"
          className="block w-full rounded-md outline-offset-4"
          tabIndex={0}
          role="group"
          aria-label={`${title}، ${number.format(total)} ${unit ?? 'إجمالي'}. استخدم السهمين لاستعراض القيم اليومية.`}
          aria-describedby={`${id}-value`}
          onPointerMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - box.left) / box.width) * 500;
            setActive(Math.max(0, Math.min(points.length - 1, Math.round(((x - left) / (right - left)) * (points.length - 1)))));
          }}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(points.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              const step = event.key === 'ArrowLeft' ? -1 : 1;
              setActive((index) => Math.max(0, Math.min(points.length - 1, (index ?? points.length - 1) + step)));
            } else if (event.key === 'Home' || event.key === 'End') {
              event.preventDefault();
              setActive(event.key === 'Home' ? 0 : points.length - 1);
            } else if (event.key === 'Escape') {
              setActive(null);
            }
          }}
        >
          {[0, 0.5, 1].map((fraction) => {
            const y = bottom - fraction * (bottom - top);
            return (
              <g key={fraction} aria-hidden="true">
                <line x1={left} x2={right} y1={y} y2={y} stroke="var(--dashboard-line)" strokeDasharray={fraction === 0 ? undefined : '3 5'} />
                <text x={left - 10} y={y + 4} textAnchor="end" fill="var(--dashboard-muted)" fontSize="14">{compact.format(max * fraction)}</text>
              </g>
            );
          })}
          {coords.length > 1 && <>
            <path d={`${line} L ${right} ${bottom} L ${left} ${bottom} Z`} fill="var(--dashboard-chart-fill)" />
            <path d={line} fill="none" stroke="var(--dashboard-chart)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>}
          {coords.length === 1 && <circle cx={coords[0].x} cy={coords[0].y} r="4" fill="var(--dashboard-chart)" />}
          {ticks.map((index) => points[index] && (
            <text key={index} x={coords[index].x} y="157" textAnchor={points.length === 1 ? 'middle' : index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} fill="var(--dashboard-muted)" fontSize="14" aria-hidden="true">
              {formatDate(points[index].date)}
            </text>
          ))}
          {selectedCoords && <g aria-hidden="true">
            <line x1={selectedCoords.x} x2={selectedCoords.x} y1={top} y2={bottom} stroke="var(--dashboard-chart)" strokeDasharray="3 3" />
            <circle cx={selectedCoords.x} cy={selectedCoords.y} r="4" fill="var(--dashboard-chart)" stroke="white" strokeWidth="2" />
          </g>}
        </svg>
        <div id={`${id}-value`} role="status" className={selected ? 'overview-chart-tooltip' : 'sr-only'} dir="rtl"
          style={selectedCoords ? { left: `clamp(0px, calc(${selectedCoords.x / 5}% - 90px), calc(100% - 180px))`, top: `${Math.max(0, selectedCoords.y - 75) / 166 * 100}%` } : undefined}>
          {selected ? <>
            <p className="text-[11px] font-semibold text-stone-700">{tooltipDate.format(new Date(`${selected.date}T12:00:00Z`))}</p>
            <div className="mt-2 flex items-center gap-2 text-xs"><span className="h-2 w-2 shrink-0 rounded-full bg-[var(--dashboard-chart)]" aria-hidden="true" /><span className="text-stone-500">{unit ?? 'العدد'}</span><bdi className="ms-auto font-semibold tabular-nums text-stone-800">{number.format(selected.value)}</bdi></div>
          </> : `${title}: ${number.format(total)} ${unit ?? ''}`}
        </div>
      </div>
      {total === 0 && <p className="mt-1 text-xs text-[var(--dashboard-muted)]">{incomplete ? 'لا توجد حركة في السجل المتاح لهذه الفترة' : 'لا توجد حركة مسجلة خلال هذه الفترة'}</p>}
    </article>
  );
}
