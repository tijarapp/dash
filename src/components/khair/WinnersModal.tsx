'use client';

import { useState } from 'react';
import { inputClass } from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import WinnerPicker, { normalizeDigits } from './WinnerPicker';
import {
  btn,
  formatIqd,
  InlineAlert,
  khairApi,
  Pill,
  type KhairCard,
  type KhairRound,
  type KhairWinner,
  type RunAction,
} from './shared';

type Selection = Pick<KhairWinner, 'userId' | 'userName' | 'referralCode'> & { amount: string };
const VISIBILITY = [
  { value: 'auto', label: 'تلقائي', help: 'تظهر القائمة عند نهاية الجولة وتختفي عند بدء جولة جديدة.' },
  { value: 'shown', label: 'إظهار الآن', help: 'تظهر القائمة في التطبيق فوراً حتى لو لم تنتهِ الجولة.' },
  { value: 'hidden', label: 'إخفاء', help: 'تبقى القائمة مخفية في التطبيق.' },
] as const;

function readAmount(value: string) {
  const normalized = normalizeDigits(value).trim().replace(/٫/g, '.').replace(/٬/g, ',');
  return /^(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)
    ? Number(normalized.replace(/,/g, ''))
    : NaN;
}

export default function WinnersModal({
  round,
  cards,
  busy,
  run,
  error,
  onClose,
}: {
  round: KhairRound;
  cards: KhairCard[];
  busy: boolean;
  run: RunAction;
  error: string;
  onClose: () => void;
}) {
  const [drafts, setDrafts] = useState<Partial<Record<string, Selection | null>>>({});
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [visibility, setVisibility] = useState(round.winnersVisibility ?? 'auto');
  const [invalidCardId, setInvalidCardId] = useState<string | null>(null);

  const cardRows = cards.map((card) => {
    const saved = (round.winners ?? []).filter((winner) => winner.cardId === card.id);
    const previous = saved.length === 1 ? { ...saved[0], amount: String(saved[0].amount) } : null;
    const draft = drafts[card.id];
    return { card, saved, selection: draft === undefined ? previous : draft, edited: draft !== undefined };
  });
  const selectedCount = cardRows.filter(({ selection }) => selection).length;
  const total = cardRows.reduce((sum, { selection, saved, edited }) => {
    if (!edited) return sum + saved.reduce((subtotal, winner) => subtotal + winner.amount, 0);
    const amount = readAmount(selection?.amount ?? '');
    return Number.isFinite(amount) && amount > 0 && amount <= 1_000_000_000 ? sum + amount : sum;
  }, 0);

  function update(cardId: string, selection: Selection | null | undefined) {
    setDrafts((previous) => ({ ...previous, [cardId]: selection }));
    if (invalidCardId === cardId) setInvalidCardId(null);
  }

  function save() {
    const winnerChanges: { cardId: string; userId: string | null; amount?: number }[] = [];
    for (const { card, selection, edited, saved } of cardRows) {
      if (!edited) continue;
      if (!selection) {
        if (saved.length) winnerChanges.push({ cardId: card.id, userId: null });
        continue;
      }
      const amount = readAmount(selection.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
        setInvalidCardId(card.id);
        document.getElementById('winner-amount-' + card.id)?.focus();
        return;
      }
      if (saved.length === 1 && saved[0].userId === selection.userId && saved[0].amount === amount) continue;
      winnerChanges.push({ cardId: card.id, userId: selection.userId, amount });
    }
    setInvalidCardId(null);
    void run(
      () => khairApi('', { action: 'saveWinners', roundId: round.id, visibility, winnerChanges }),
      'تم حفظ الفائزين',
    ).then((ok) => {
      if (ok) onClose();
    });
  }

  return (
    <Modal
      open
      title={'فائزو «' + round.title + '»'}
      description="اختر فائزًا واحدًا لكل بطاقة وحدّد مبلغ جائزته بالدينار العراقي."
      onClose={onClose}
      closeDisabled={busy}
      footer={
        <>
          <button type="button" className={btn.secondary} onClick={onClose} disabled={busy}>
            إلغاء
          </button>
          <button type="button" className={btn.primary} onClick={save} disabled={busy}>
            {busy ? 'جاري الحفظ...' : 'حفظ الفائزين'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <InlineAlert tone="error">{error}</InlineAlert>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-900">الفائزون حسب البطاقة</h3>
          <span className="text-xs font-medium tabular-nums text-gray-600">
            {selectedCount} من {cards.length} بطاقات لها فائز واحد
          </span>
        </div>
        <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200">
          {cardRows.map(({ card, selection, saved, edited }) => {
            const amountId = 'winner-amount-' + card.id;
            const invalid = invalidCardId === card.id;
            const legacy = saved.length > 1;
            const pickerOpen = openPicker === card.id;

            function select({ userId, userName, referralCode }: Omit<Selection, 'amount'>) {
              const previous = saved.find((item) => item.userId === userId);
              const amount = selection?.userId === userId
                ? selection.amount
                : previous ? String(previous.amount) : '';
              update(card.id, { userId, userName, referralCode, amount });
              setOpenPicker(null);
              requestAnimationFrame(() => document.getElementById(amountId)?.focus());
            }

            return (
              <section key={card.id} aria-labelledby={'winner-card-' + card.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 id={'winner-card-' + card.id} className="font-bold text-gray-900">{card.name}</h4>
                  {legacy && !edited
                    ? <Pill tone="amber">{saved.length} فائزين سابقين</Pill>
                    : <Pill tone={selection ? 'green' : 'gray'}>{selection ? 'تم الاختيار' : 'بانتظار الاختيار'}</Pill>}
                </div>

                {legacy && !edited && (
                  <details className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                    <summary className="cursor-pointer text-xs font-semibold leading-6">عرض الفائزين السابقين</summary>
                    <p className="mt-2 text-xs leading-5">
                      لهذه البطاقة أكثر من فائز محفوظ. اختر واحدًا منهم أو ابحث عن فائز آخر لتحديث النتيجة.
                    </p>
                    <ul className="mt-2 space-y-1">
                      {saved.map((winner) => (
                        <li key={winner.userId} className="flex flex-wrap items-center justify-between gap-2 py-1">
                          <span className="min-w-0 break-words text-sm text-gray-900">
                            {winner.userName || 'بدون اسم'} · {winner.amount.toLocaleString('en-US', { maximumFractionDigits: 20 })} د.ع
                          </span>
                          <button type="button" className={btn.small} disabled={busy} onClick={() => select(winner)}>
                            اختيار {winner.userName || 'هذا الفائز'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                  <div className="min-w-0">
                    <p className="mb-1.5 text-xs font-medium text-gray-600">الفائز</p>
                    <div className="flex min-h-11 flex-wrap items-center gap-2">
                      {selection && (
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-semibold text-gray-900">{selection.userName || 'بدون اسم'}</p>
                          {selection.referralCode && (
                            <p className="text-xs text-gray-600">الإحالة <bdi>{selection.referralCode}</bdi></p>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        className={selection ? btn.secondary : btn.primary}
                        disabled={busy}
                        aria-expanded={pickerOpen}
                        aria-controls={pickerOpen ? 'winner-picker-' + card.id : undefined}
                        aria-label={(pickerOpen ? 'إغلاق بحث ' : selection ? 'تغيير فائز ' : 'اختيار فائز ') + card.name}
                        onClick={() => setOpenPicker(pickerOpen ? null : card.id)}
                      >
                        {pickerOpen ? 'إغلاق البحث' : selection ? 'تغيير' : 'اختيار فائز'}
                      </button>
                      {selection && !legacy && (
                        <button
                          type="button"
                          className={btn.dangerGhost}
                          disabled={busy}
                          onClick={() => update(card.id, null)}
                          aria-label={'إزالة فائز ' + card.name}
                        >
                          إزالة
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor={amountId} className="mb-1.5 block text-xs font-medium text-gray-600">الجائزة (د.ع)</label>
                    <input
                      id={amountId}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      aria-label={'مبلغ جائزة ' + card.name + ' بالدينار العراقي'}
                      aria-invalid={invalid}
                      aria-describedby={invalid ? amountId + '-error' : undefined}
                      value={selection?.amount ?? ''}
                      disabled={busy || !selection}
                      onChange={(event) => {
                        if (selection) update(card.id, { ...selection, amount: event.target.value });
                      }}
                      className={inputClass + ' tabular-nums disabled:opacity-60'}
                    />
                    {invalid && (
                      <p id={amountId + '-error'} role="alert" className="mt-1 text-xs leading-5 text-red-700">
                        أدخل مبلغًا أكبر من صفر وحتى مليار دينار.
                      </p>
                    )}
                  </div>
                </div>
                {legacy && edited && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <p>عند الحفظ، سيُعتمد هذا الفائز وحده لهذه البطاقة.</p>
                    <button type="button" className={btn.small} disabled={busy} onClick={() => update(card.id, undefined)}>
                      تراجع عن الاختيار
                    </button>
                  </div>
                )}
                {pickerOpen && (
                  <WinnerPicker
                    card={card}
                    roundId={round.id}
                    selectedId={selection?.userId}
                    disabled={busy}
                    onSelect={select}
                  />
                )}
              </section>
            );
          })}
          {!cards.length && <p className="p-4 text-sm text-gray-600">لا توجد بطاقات لهذه الجولة.</p>}
        </div>
        {total > 0 && (
          <p className="text-sm text-gray-700">إجمالي الجوائز <bdi className="font-semibold">{formatIqd(total)}</bdi></p>
        )}
        <div className="grid items-end gap-2 rounded-xl bg-gray-50 p-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <label className="text-xs font-medium text-gray-700">
            ظهور القائمة في التطبيق
            <select
              value={visibility}
              disabled={busy}
              onChange={(event) => {
                const option = VISIBILITY.find((item) => item.value === event.target.value);
                if (option) setVisibility(option.value);
              }}
              aria-describedby="winner-visibility-help"
              className={inputClass + ' mt-1.5 bg-white'}
            >
              {VISIBILITY.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <p id="winner-visibility-help" className="pb-1.5 text-xs leading-5 text-gray-600">
            {VISIBILITY.find((option) => option.value === visibility)?.help}
          </p>
        </div>
      </div>
    </Modal>
  );
}
