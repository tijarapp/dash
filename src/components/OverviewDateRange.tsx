'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';
import type { DashboardPeriod, DashboardRange } from '@/lib/dashboardOverview';

export const periodLabels: Record<DashboardPeriod, string> = { 1: 'اليوم', 7: 'آخر 7 أيام', 14: 'آخر 14 يومًا', 30: 'آخر 30 يومًا', 90: 'آخر 90 يومًا' };
export function rangeLabel(range: DashboardRange) {
  if (typeof range === 'number') return periodLabels[range];
  const date = new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${date.format(new Date(`${range.start}T12:00:00Z`))} – ${date.format(new Date(`${range.end}T12:00:00Z`))}`;
}

export default function OverviewDateRange({ value, onChange, min, max }: {
  value: DashboardRange; onChange: (range: DashboardRange) => void; min: string; max: string;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [start, setStart] = useState(min);
  const [end, setEnd] = useState(max);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const valid = start >= min && end <= max && start <= end;

  function close(restore = false) {
    setOpen(false);
    if (restore) trigger.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    const target = custom ? panel.current?.querySelector<HTMLElement>('input') : (panel.current?.querySelector<HTMLElement>('[aria-pressed="true"]') ?? panel.current?.querySelector<HTMLElement>('button'));
    target?.focus();
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open, custom]);

  return <div ref={root} className="relative" onBlur={(event) => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }} onKeyDown={(event) => {
    if (event.key === 'Escape' && open) { event.preventDefault(); close(true); }
    if (!custom && open && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const items = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  }}>
    <button ref={trigger} type="button" className="overview-control" aria-expanded={open} aria-controls={id} aria-haspopup="dialog" onClick={() => { setCustom(false); setOpen(!open); }}>
      <Icon name="calendar" size={15} /><span>{rangeLabel(value)}</span><Icon name="chevron-down" size={13} />
    </button>
    {open && <div ref={panel} id={id} role="dialog" aria-label="اختر فترة النشاط" className="absolute end-0 top-full z-40 mt-2 w-[240px] max-w-[calc(100vw-2rem)] rounded-2xl border border-stone-100 bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      {!custom ? <>
        {([1, 7, 14, 30, 90] as const).map((period) => <button key={period} type="button" aria-pressed={value === period} className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-start text-sm transition-colors hover:bg-stone-100 ${value === period ? 'bg-stone-100 font-semibold' : ''}`} onClick={() => { onChange(period); close(true); }}>
          {periodLabels[period]}{value === period && <Icon name="check" size={15} className="text-stone-500" />}
        </button>)}
        <div className="my-1 border-t border-stone-100" />
        <button type="button" className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-start text-sm hover:bg-stone-100" onClick={() => {
          setStart(typeof value === 'number' ? min : value.start); setEnd(typeof value === 'number' ? max : value.end); setCustom(true);
        }}>فترة مخصصة…<Icon name="chevron-left" size={15} /></button>
      </> : <form className="space-y-3 p-2" onSubmit={(event) => { event.preventDefault(); if (valid) { onChange({ start, end }); close(true); } }}>
        <p className="text-sm font-semibold">فترة مخصصة</p>
        <p className="text-xs leading-5 text-stone-500">اختر فترة ضمن آخر 90 يومًا المتاحة.</p>
        <label className="block text-xs">من<input required type="date" value={start} min={min} max={end || max} onChange={(event) => setStart(event.target.value)} className="mt-1 block min-h-10 w-full rounded-lg border border-stone-200 bg-white px-2 text-sm" /></label>
        <label className="block text-xs">إلى<input required type="date" value={end} min={start || min} max={max} onChange={(event) => setEnd(event.target.value)} className="mt-1 block min-h-10 w-full rounded-lg border border-stone-200 bg-white px-2 text-sm" /></label>
        <div className="flex gap-2"><button type="submit" disabled={!valid} className="min-h-10 flex-1 rounded-lg bg-stone-800 px-3 text-xs text-white disabled:opacity-50">تطبيق</button><button type="button" onClick={() => setCustom(false)} className="min-h-10 rounded-lg px-3 text-xs hover:bg-stone-100">رجوع</button></div>
      </form>}
    </div>}
  </div>;
}
