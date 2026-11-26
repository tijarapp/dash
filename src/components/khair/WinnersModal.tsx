'use client';

import { useState } from 'react';
import { inputClass } from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import WinnerPicker, { normalizeDigits } from './WinnerPicker';
import {
  btn,
  InlineAlert,
  khairApi,
  Pill,
  type KhairCard,
  type KhairRound,
  type KhairWinner,
  type RunAction,
} from './shared';

type Selection = Pick<KhairWinner, 'userId' | 'userName' | 'referralCode' | 'paidAt'> & { amount: string };
type Edit = { cardId: string; userId: string; selection: Selection | null };
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

function prizeLabel(amount: number) {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 20 }) + ' د.ع';
}

const winnerKey = (cardId: string, userId: string) => cardId + '/' + userId;
const amountId = (key: string) => 'khair-prize-' + key;

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
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [visibilityDraft, setVisibility] = useState<KhairRound['winnersVisibility']>();
  const [invalidKey, setInvalidKey] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState<ReadonlySet<string>>(new Set());
  const visibility = visibilityDraft ?? round.winnersVisibility ?? 'auto';
  const saved = new Map((round.winners ?? []).map((winner) => [winnerKey(winner.cardId, winner.userId), winner]));
  const cardRows = cards.map((card) => {
    const rows = new Map<string, Selection>();
    for (const winner of saved.values()) {
      if (winner.cardId === card.id) rows.set(winner.userId, { ...winner, amount: String(winner.amount) });
    }
    for (const { cardId, userId, selection } of Object.values(edits)) {
      if (card.id !== cardId || rows.get(userId)?.paidAt) continue;
      if (selection) rows.set(userId, selection);
      else rows.delete(userId);
    }
    return { card, rows: [...rows.values()] };
  });
  const selectedCount = cardRows.reduce((count, { rows }) => count + rows.length, 0);
  const total = cardRows.reduce((sum, { rows }) => sum + rows.reduce((subtotal, row) => {
    const amount = readAmount(row.amount);
    return amount > 0 && amount <= 1_000_000_000 ? subtotal + amount : subtotal;
  }, 0), 0);

  function update(cardId: string, userId: string, selection: Selection | null) {
    const key = winnerKey(cardId, userId);
    setEdits((previous) => ({ ...previous, [key]: { cardId, userId, selection } }));
    if (invalidKey === key) setInvalidKey(null);
    if (confirmKey === key) setConfirmKey(null);
  }

  async function save() {
    const winnerChanges: { cardId: string; userId: string; amount: number | null }[] = [];
    for (const [key, { cardId, userId, selection }] of Object.entries(edits)) {
      const original = saved.get(key);
      if (!selection) {
        if (original) winnerChanges.push({ cardId, userId, amount: null });
        continue;
      }
      const amount = readAmount(selection.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
        setInvalidKey(key);
        document.getElementById(amountId(key))?.focus();
        return;
      }
      if (original?.amount !== amount) winnerChanges.push({ cardId, userId, amount });
    }
    setInvalidKey(null);
    setConfirmKey(null);
    const ok = await run(
      () => khairApi('', { action: 'saveWinners', roundId: round.id, visibility, winnerChanges }),
      'تم حفظ الفائزين',
    );
    if (ok) {
      setEdits({});
      setVisibility(undefined);
      setOpenPicker(null);
    }
  }

  async function pay(winner: KhairWinner, key: string) {
    const ok = await run(
      () => khairApi('', {
        action: 'payWinner', roundId: round.id, cardId: winner.cardId, userId: winner.userId, amount: winner.amount,
      }),
      'تم إيداع الجائزة في المحفظة',
    );
    if (ok) {
      setJustPaid((previous) => new Set(previous).add(key));
      setConfirmKey(null);
    }
  }

  return (
    <Modal
      open
      title={'فائزو «' + round.title + '»'}
      description="اختر فائزًا واحدًا أو أكثر لكل بطاقة. احفظ المبالغ أولًا، ثم اصرف كل جائزة إلى محفظة الفائز."
      onClose={onClose}
      closeDisabled={busy}
      footer={
        <>
          <button type="button" className={btn.secondary} onClick={onClose} disabled={busy}>إغلاق</button>
          <button
            type="button"
            className={btn.primary}
            onClick={save}
            disabled={busy || (visibility === (round.winnersVisibility ?? 'auto') && Object.keys(edits).length === 0)}
          >
            حفظ الفائزين
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <InlineAlert tone="error">{error}</InlineAlert>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-900">الفائزون حسب البطاقة</h3>
          <p className="text-xs font-medium tabular-nums text-gray-600">
            العدد <bdi>{selectedCount}</bdi> · إجمالي الجوائز <bdi>{prizeLabel(total)}</bdi>
          </p>
        </div>
        <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200">
          {cardRows.map(({ card, rows }) => {
            const pickerOpen = openPicker === card.id;
            return (
              <section key={card.id} aria-labelledby={'winner-card-' + card.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 id={'winner-card-' + card.id} className="font-bold text-gray-900">{card.name}</h4>
                  <button
                    type="button"
                    className={btn.secondary}
                    disabled={busy}
                    aria-expanded={pickerOpen}
                    aria-controls={pickerOpen ? 'winner-picker-' + card.id : undefined}
                    aria-label={(pickerOpen ? 'إغلاق بحث ' : 'إضافة فائز إلى ') + card.name}
                    onClick={() => {
                      setConfirmKey(null);
                      setOpenPicker(pickerOpen ? null : card.id);
                    }}
                  >
                    {pickerOpen ? 'إغلاق البحث' : 'إضافة فائز'}
                  </button>
                </div>
                {pickerOpen && (
                  <WinnerPicker
                    card={card}
                    roundId={round.id}
                    selectedIds={new Set(rows.map(({ userId }) => userId))}
                    disabled={busy}
                    onSelect={({ userId, userName, referralCode }) => {
                      const key = winnerKey(card.id, userId);
                      const original = saved.get(key);
                      update(card.id, userId, {
                        userId, userName, referralCode, amount: original ? String(original.amount) : '',
                      });
                      setOpenPicker(null);
                      requestAnimationFrame(() => document.getElementById(amountId(key))?.focus());
                    }}
                  />
                )}
                {!rows.length && !pickerOpen && <p className="text-xs text-gray-600">لم يُضف أي فائز لهذه البطاقة.</p>}
                {rows.length > 0 && (
                  <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                    {rows.map((row) => {
                      const key = winnerKey(card.id, row.userId);
                      const winner = saved.get(key);
                      const paid = Boolean(row.paidAt) || justPaid.has(key);
                      const name = row.userName || 'بدون اسم';
                      const canPay = winner && winner.amount === readAmount(row.amount) && !paid;
                      return (
                        <li key={key} className="space-y-2 p-3">
                          <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto]">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold text-gray-900">{name}</p>
                              {row.referralCode && (
                                <p className="text-xs text-gray-600">الإحالة <bdi>{row.referralCode}</bdi></p>
                              )}
                            </div>
                            {paid ? (
                              <bdi className="text-sm font-semibold tabular-nums text-gray-900">{prizeLabel(readAmount(row.amount))}</bdi>
                            ) : (
                              <div>
                                <label htmlFor={amountId(key)} className="block text-xs text-gray-600">الجائزة (د.ع)</label>
                                <input
                                  id={amountId(key)}
                                  type="text"
                                  inputMode="decimal"
                                  aria-label={'مبلغ جائزة ' + name + ' في ' + card.name}
                                  aria-invalid={invalidKey === key}
                                  aria-describedby={invalidKey === key ? amountId(key) + '-error' : undefined}
                                  value={row.amount}
                                  placeholder="أدخل المبلغ"
                                  disabled={busy}
                                  onChange={(event) => update(card.id, row.userId, { ...row, amount: event.target.value })}
                                  className={inputClass + ' mt-1 tabular-nums'}
                                />
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              {paid ? <Pill tone="green">تم الصرف</Pill> : (
                                <>
                                  {canPay ? (
                                    <button
                                      type="button"
                                      className={btn.secondary}
                                      disabled={busy || confirmKey === key}
                                      onClick={() => {
                                        setOpenPicker(null);
                                        setConfirmKey(key);
                                      }}
                                    >
                                      صرف الجائزة
                                    </button>
                                  ) : <Pill tone="gray">بانتظار الحفظ</Pill>}
                                  <button
                                    type="button"
                                    className={btn.dangerGhost}
                                    disabled={busy}
                                    aria-label={'إزالة ' + name + ' من ' + card.name}
                                    onClick={() => update(card.id, row.userId, null)}
                                  >
                                    إزالة
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {invalidKey === key && (
                            <p id={amountId(key) + '-error'} role="alert" className="text-xs text-red-700">
                              أدخل مبلغًا أكبر من صفر وحتى مليار دينار.
                            </p>
                          )}
                          {confirmKey === key && canPay && (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 p-3">
                              <p className="text-sm text-amber-900">
                                إيداع <bdi>{prizeLabel(winner.amount)}</bdi> في محفظة «{name}»؟
                              </p>
                              <div className="flex gap-2">
                                <button type="button" className={btn.small} disabled={busy} onClick={() => setConfirmKey(null)}>إلغاء</button>
                                <button type="button" className={btn.primary} disabled={busy} onClick={() => void pay(winner, key)}>
                                  {busy ? 'جارٍ الصرف…' : 'تأكيد الصرف'}
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
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
