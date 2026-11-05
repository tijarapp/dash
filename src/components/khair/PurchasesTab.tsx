'use client';

import { Fragment, useMemo, useState } from 'react';
import { KHAIR_CARDS } from '@/lib/khairCards';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { inputClass } from '@/components/ui/FormField';
import {
  btn,
  formatBaghdad,
  formatIqd,
  khairCallable,
  PAYMENT_LABEL,
  Pill,
  PURCHASE_STATUS,
  relativeTime,
  RoundStatusPill,
  type KhairData,
  type KhairPurchase,
  type KhairRound,
  type RunAction,
} from './shared';

const LEGACY = { id: 'legacy', name: 'بطاقات سابقة', color: '#6B7280' };
type View = 'buyers' | 'purchases';

function cardMeta(cardId: string) {
  return KHAIR_CARDS.find((c) => c.id === cardId) ?? LEGACY;
}
function cardKey(p: KhairPurchase) {
  return KHAIR_CARDS.some((c) => c.id === p.cardId) ? p.cardId : LEGACY.id;
}
function sum(rows: KhairPurchase[], field: 'cost' | 'chances') {
  return rows.reduce((total, p) => total + (p[field] ?? 0), 0);
}
const isActive = (p: KhairPurchase) => p.status === 'active';

export default function PurchasesTab({
  data,
  busy,
  run,
  roundId,
  onRoundChange,
  onLoadMore,
}: {
  data: KhairData;
  busy: boolean;
  run: RunAction;
  roundId: string;
  onRoundChange: (id: string) => void;
  onLoadMore: () => void;
}) {
  const [view, setView] = useState<View>('buyers');
  const [cardFilter, setCardFilter] = useState('');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cancel, setCancel] = useState<KhairPurchase | null>(null);
  const [reason, setReason] = useState('');

  const roundsById = useMemo(() => new Map(data.rounds.map((r) => [r.id, r])), [data.rounds]);
  const round = roundId ? roundsById.get(roundId) : undefined;
  const allRounds = !roundId;
  const roundTitle = (id: string) => roundsById.get(id)?.title ?? id ?? '—';

  // Everything except the card filter — used for the per-card breakdown tiles.
  const baseRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.purchases.filter(
      (p) =>
        (!status || p.status === status) &&
        (!payment || p.paymentMethod === payment) &&
        (!q || `${p.userName} ${p.userPhone}`.toLowerCase().includes(q)),
    );
  }, [data.purchases, status, payment, search]);

  const rows = useMemo(
    () => (cardFilter ? baseRows.filter((p) => cardKey(p) === cardFilter) : baseRows),
    [baseRows, cardFilter],
  );

  const cardTiles = useMemo(() => {
    const tiles = data.cards.map((c) => ({ ...c, rows: baseRows.filter((p) => p.cardId === c.id) }));
    const legacy = baseRows.filter((p) => cardKey(p) === LEGACY.id);
    return legacy.length ? [...tiles, { ...LEGACY, cost: 0, chances: 0, rows: legacy }] : tiles;
  }, [baseRows, data.cards]);

  const buyers = useMemo(() => {
    const map = new Map<string, { key: string; name: string; phone: string; roundId: string; rows: KhairPurchase[] }>();
    for (const p of rows) {
      const user = p.userId || p.userPhone || p.userName;
      const key = allRounds ? `${p.roundId}::${user}` : user;
      const entry = map.get(key) ?? { key, name: p.userName, phone: p.userPhone, roundId: p.roundId, rows: [] };
      entry.rows.push(p);
      map.set(key, entry);
    }
    return [...map.values()]
      .map((b) => {
        const active = b.rows.filter(isActive);
        return {
          ...b,
          chances: sum(active, 'chances'),
          paid: sum(active, 'cost'),
          last: b.rows.reduce((max, p) => (p.createdAt > max ? p.createdAt : max), ''),
        };
      })
      .sort((a, b) => b.chances - a.chances || b.last.localeCompare(a.last));
  }, [rows, allRounds]);

  const activeRows = rows.filter(isActive);
  const totals = {
    buyers: new Set(activeRows.map((p) => `${p.roundId}::${p.userId || p.userPhone}`)).size,
    purchases: activeRows.length,
    chances: sum(activeRows, 'chances'),
    amount: sum(activeRows, 'cost'),
  };
  const filtered = !!(status || payment || search || cardFilter);

  function clearFilters() {
    setStatus('');
    setPayment('');
    setSearch('');
    setCardFilter('');
  }

  function exportCsv() {
    const escape = (value: unknown) =>
      `"${String(value ?? '')
        .replace(/^[=+@\-\t\r]/, "'$&")
        .replace(/"/g, '""')}"`;
    const csv = [
      ['المعرف', 'الجولة', 'الاسم', 'الهاتف', 'البطاقة', 'المبلغ', 'الفرص', 'الدفع', 'الحالة', 'سبب الإلغاء', 'الوقت (بغداد)'],
      ...rows.map((p) => [
        p.id,
        roundTitle(p.roundId),
        p.userName,
        p.userPhone,
        p.cardName,
        p.cost,
        p.chances,
        PAYMENT_LABEL[p.paymentMethod] ?? p.paymentMethod,
        PURCHASE_STATUS[p.status]?.label ?? p.status,
        p.cancelReason ?? '',
        formatBaghdad(p.createdAt),
      ]),
    ]
      .map((row) => row.map(escape).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `khair-purchases-${round ? round.title.replace(/[^\p{L}\p{N}]+/gu, '-') : 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function askCancel(p: KhairPurchase) {
    setReason('');
    setCancel(p);
  }

  return (
    <div className="space-y-4">
      {/* 1 — Which round */}
      <RoundHeader
        rounds={data.rounds}
        round={round}
        roundId={roundId}
        currentRoundId={data.settings.currentRoundId}
        onRoundChange={(id) => {
          setExpanded(null);
          setCardFilter('');
          onRoundChange(id);
        }}
        totals={totals}
        filtered={filtered}
      />

      {/* 2 — Breakdown per card (click to filter) */}
      <div className="grid gap-3 sm:grid-cols-3">
        {cardTiles.map((tile) => {
          const active = tile.rows.filter(isActive);
          const selected = cardFilter === tile.id;
          return (
            <button
              key={tile.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setCardFilter(selected ? '' : tile.id)}
              className={`relative overflow-hidden rounded-2xl border bg-white p-4 text-right shadow-sm transition hover:shadow ${
                selected ? 'ring-2' : 'border-gray-100'
              } ${cardFilter && !selected ? 'opacity-60' : ''}`}
              style={selected ? { borderColor: tile.color, ['--tw-ring-color' as string]: `${tile.color}55` } : undefined}
            >
              <span className="absolute inset-y-0 right-0 w-1.5" style={{ backgroundColor: tile.color }} />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold" style={{ color: tile.color }}>
                    {tile.name}
                  </p>
                  {tile.cost ? (
                    <p className="text-xs text-gray-500">
                      {formatIqd(tile.cost)} · {tile.chances === 1 ? 'فرصة واحدة' : `${tile.chances} فرص`}
                    </p>
                  ) : null}
                </div>
                {selected ? <Pill tone="blue">✓ مُفلترة</Pill> : null}
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900">{active.length}</span>
                <span className="text-sm text-gray-500">مشترٍ</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {formatIqd(sum(active, 'cost'))} · {sum(active, 'chances').toLocaleString('en-US')} فرصة
                {tile.rows.length > active.length ? ` · ${tile.rows.length - active.length} ملغاة` : ''}
              </p>
            </button>
          );
        })}
      </div>

      {/* 3 — View switch + secondary filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="flex shrink-0 rounded-xl bg-gray-100 p-1 text-sm" role="tablist" aria-label="طريقة العرض">
          {(
            [
              ['buyers', `حسب المشترين (${buyers.length})`],
              ['purchases', `كل العمليات (${rows.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition ${
                view === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid flex-1 gap-2 sm:grid-cols-3">
          <input
            aria-label="بحث بالاسم أو الهاتف"
            className={inputClass}
            placeholder="🔍 الاسم أو الهاتف"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select aria-label="الحالة" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="active">فعالة</option>
            <option value="cancelled">ملغاة ومستردة</option>
          </select>
          <select aria-label="طريقة الدفع" className={inputClass} value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="">كل طرق الدفع</option>
            <option value="balance">المحفظة</option>
            <option value="points">النقاط (قديم)</option>
          </select>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {filtered ? (
            <button type="button" className="text-sm text-brand-blue hover:underline" onClick={clearFilters}>
              مسح الفلاتر
            </button>
          ) : null}
          <button type="button" className={btn.secondary} onClick={exportCsv} disabled={!rows.length}>
            ⬇ CSV
          </button>
        </div>
      </div>

      {/* 4 — Results */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {view === 'buyers' ? (
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <Th>المشتري</Th>
                  {allRounds ? <Th>الجولة</Th> : null}
                  <Th>البطاقات المشتراة</Th>
                  <Th>الفرص في السحب</Th>
                  <Th>المدفوع</Th>
                  <Th>آخر شراء</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {buyers.map((b) => {
                  const open = expanded === b.key;
                  return (
                    <Fragment key={b.key}>
                      <tr className={`transition hover:bg-gray-50/60 ${open ? 'bg-gray-50/60' : ''}`}>
                        <td className="px-4 py-3">
                          <UserCell name={b.name} phone={b.phone} />
                        </td>
                        {allRounds ? <td className="px-4 py-3 text-gray-700">{roundTitle(b.roundId)}</td> : null}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {b.rows.map((p) => (
                              <CardChip key={p.id} purchase={p} />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-base font-bold text-gray-900">{b.chances}</span>
                          {totals.chances > 0 && b.chances > 0 ? (
                            <span className="mr-1 text-xs text-gray-400">
                              ({Math.round((b.chances / totals.chances) * 1000) / 10}%)
                            </span>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{formatIqd(b.paid)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500" title={formatBaghdad(b.last)}>
                          {relativeTime(b.last)}
                        </td>
                        <td className="px-4 py-3 text-left">
                          <button
                            type="button"
                            className={btn.small}
                            aria-expanded={open}
                            onClick={() => setExpanded(open ? null : b.key)}
                          >
                            {open ? 'إخفاء ▲' : 'التفاصيل ▼'}
                          </button>
                        </td>
                      </tr>
                      {open ? (
                        <tr className="bg-gray-50/60">
                          <td colSpan={allRounds ? 7 : 6} className="px-4 pb-4">
                            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
                              {b.rows.map((p) => (
                                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <CardChip purchase={p} />
                                    <span className="text-sm text-gray-700">
                                      {formatIqd(p.cost)} · {p.chances} فرصة · {PAYMENT_LABEL[p.paymentMethod] ?? p.paymentMethod}
                                    </span>
                                    <span className="text-xs text-gray-400">{formatBaghdad(p.createdAt)}</span>
                                    <StatusCell purchase={p} />
                                  </div>
                                  {isActive(p) ? (
                                    <button type="button" className={btn.dangerGhost} disabled={busy} onClick={() => askCancel(p)}>
                                      إلغاء واسترداد
                                    </button>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <Th>الوقت</Th>
                  <Th>المشتري</Th>
                  {allRounds ? <Th>الجولة</Th> : null}
                  <Th>البطاقة</Th>
                  <Th>المبلغ</Th>
                  <Th>الفرص</Th>
                  <Th>الدفع</Th>
                  <Th>الحالة</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((p) => (
                  <tr key={p.id} className="transition hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{formatBaghdad(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <UserCell name={p.userName} phone={p.userPhone} />
                    </td>
                    {allRounds ? <td className="px-4 py-3 text-gray-700">{roundTitle(p.roundId)}</td> : null}
                    <td className="px-4 py-3">
                      <CardChip purchase={p} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{formatIqd(p.cost)}</td>
                    <td className="px-4 py-3 text-gray-700">{p.chances}</td>
                    <td className="px-4 py-3 text-gray-700">{PAYMENT_LABEL[p.paymentMethod] ?? p.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <StatusCell purchase={p} />
                    </td>
                    <td className="px-4 py-3 text-left">
                      {isActive(p) ? (
                        <button type="button" className={btn.dangerGhost} disabled={busy} onClick={() => askCancel(p)}>
                          إلغاء واسترداد
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!rows.length ? (
          <EmptyState
            message={
              filtered
                ? 'لا توجد مشتريات مطابقة للفلاتر'
                : round
                  ? `لم يشترِ أحد في جولة «${round.title}» بعد`
                  : 'لا توجد مشتريات بعد'
            }
          />
        ) : null}
      </div>

      {data.hasMore ? (
        <div className="flex flex-col items-center gap-1">
          <button type="button" className={btn.secondary} disabled={busy} onClick={onLoadMore}>
            {busy ? 'جاري التحميل...' : 'تحميل المزيد'}
          </button>
          <p className="text-xs text-gray-400">
            الأرقام والبحث والتصدير تشمل أحدث {data.purchases.length} عملية محمّلة فقط.
          </p>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!cancel}
        title="إلغاء الشراء واسترداد المبلغ"
        message={
          cancel
            ? `سيتم إلغاء شراء ${cancel.userName} لـ«${cancel.cardName}» في جولة «${roundTitle(cancel.roundId)}» وإعادة ${formatIqd(cancel.cost)} إلى ${
                cancel.paymentMethod === 'points' ? 'رصيد النقاط' : 'رصيدي الذهب والدينار'
              }.`
            : ''
        }
        confirmLabel="تأكيد الإلغاء والاسترداد"
        cancelLabel="تراجع"
        danger
        pending={busy}
        noteField={{ label: 'سبب الإلغاء', placeholder: 'يظهر في سجل العملية', required: true }}
        noteValue={reason}
        onNoteChange={setReason}
        onCancel={() => setCancel(null)}
        onConfirm={() => {
          if (!cancel) return;
          void run(
            () => khairCallable('adminCancelKhairPurchase', { purchaseId: cancel.id, reason: reason.trim() }),
            'تم إلغاء الشراء واسترداد المبلغ',
          ).then((ok) => {
            if (ok) setCancel(null);
          });
        }}
      />
    </div>
  );
}

function RoundHeader({
  rounds,
  round,
  roundId,
  currentRoundId,
  onRoundChange,
  totals,
  filtered,
}: {
  rounds: KhairRound[];
  round?: KhairRound;
  roundId: string;
  currentRoundId?: string | null;
  onRoundChange: (id: string) => void;
  totals: { buyers: number; purchases: number; chances: number; amount: number };
  filtered: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <label className="block text-xs font-medium text-gray-500" htmlFor="khair-round-picker">
            الجولة
          </label>
          <select
            id="khair-round-picker"
            className={`${inputClass} min-w-[18rem] font-semibold`}
            value={roundId}
            onChange={(e) => onRoundChange(e.target.value)}
          >
            <option value="">كل الجولات</option>
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
                {r.id === currentRoundId ? ' 📱' : ''}
              </option>
            ))}
          </select>
          {round ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <RoundStatusPill status={round.status} />
              {round.id === currentRoundId ? <Pill tone="blue">📱 معروضة في التطبيق</Pill> : null}
              <span>
                {formatBaghdad(round.startsAt)} ← {formatBaghdad(round.endsAt)}
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-500">عرض المشتريات من جميع الجولات — اختر جولة لمتابعة مشتريها.</p>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[32rem]">
          <Kpi label="المشترون" value={totals.buyers.toLocaleString('en-US')} />
          <Kpi label="البطاقات المباعة" value={totals.purchases.toLocaleString('en-US')} />
          <Kpi label="الفرص" value={totals.chances.toLocaleString('en-US')} />
          <Kpi label="المبلغ" value={formatIqd(totals.amount)} />
        </dl>
      </div>
      {filtered ? (
        <p className="mt-3 text-xs text-amber-700">الأرقام أعلاه حسب الفلاتر الحالية (المشتريات الفعالة فقط).</p>
      ) : null}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-bold text-gray-900">{value}</dd>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 font-medium">{children}</th>;
}

function UserCell({ name, phone }: { name: string; phone: string }) {
  return (
    <>
      <p className="font-medium text-gray-900">{name || '—'}</p>
      <p dir="ltr" className="text-right text-xs text-gray-500">
        {phone}
      </p>
    </>
  );
}

function CardChip({ purchase }: { purchase: KhairPurchase }) {
  const meta = cardMeta(purchase.cardId);
  const cancelled = !isActive(purchase);
  return (
    <span
      title={cancelled ? 'ملغاة ومستردة' : `${purchase.chances} فرصة`}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
        cancelled ? 'bg-gray-100 text-gray-400 line-through' : ''
      }`}
      style={cancelled ? undefined : { backgroundColor: `${meta.color}1a`, color: meta.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cancelled ? '#9CA3AF' : meta.color }} />
      {purchase.cardName.replace(/^بطاقة\s*/, '')}
    </span>
  );
}

function StatusCell({ purchase }: { purchase: KhairPurchase }) {
  const meta = PURCHASE_STATUS[purchase.status];
  return (
    <div>
      <Pill tone={meta?.tone}>{meta?.label ?? purchase.status}</Pill>
      {purchase.cancelReason ? (
        <p className="mt-1 max-w-[14rem] text-xs text-gray-500" title={purchase.cancelReason}>
          {purchase.cancelReason}
        </p>
      ) : null}
    </div>
  );
}
