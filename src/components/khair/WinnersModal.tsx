'use client';

import { useEffect, useState } from 'react';
import { inputClass } from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import {
  btn,
  formatIqd,
  InlineAlert,
  khairApi,
  type KhairCard,
  type KhairRound,
  type KhairWinner,
  type RunAction,
} from './shared';

type Purchaser = { userId: string; userName: string; userPhone: string; referralCode: string; chances: number };
type Row = { cardId: string; userId: string; userName: string; referralCode: string; amount: string };

const VISIBILITY = [
  { value: 'auto', label: 'تلقائي', help: 'تظهر القائمة عند نهاية الجولة وتختفي عند بدء جولة جديدة.' },
  { value: 'shown', label: 'إظهار الآن', help: 'تظهر القائمة في التطبيق فوراً حتى لو لم تنتهِ الجولة.' },
  { value: 'hidden', label: 'إخفاء', help: 'لا تظهر القائمة في التطبيق.' },
] as const;

function toRows(winners: KhairWinner[] = []): Row[] {
  return winners.map((w) => ({
    cardId: w.cardId,
    userId: w.userId,
    userName: w.userName,
    referralCode: w.referralCode,
    amount: String(w.amount),
  }));
}

/** Lets the admin choose the winners of each card for one round and control when the app shows them. */
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
  const [rows, setRows] = useState<Row[]>(() => toRows(round.winners));
  const [visibility, setVisibility] = useState<'auto' | 'shown' | 'hidden'>(round.winnersVisibility ?? 'auto');
  const [localError, setLocalError] = useState('');

  function save() {
    setLocalError('');
    for (const row of rows) {
      const amount = Number(row.amount);
      if (!Number.isFinite(amount) || amount <= 0) return setLocalError(`أدخل مبلغ الفوز لـ «${row.userName}»`);
    }
    void run(
      () =>
        khairApi('', {
          action: 'saveWinners',
          roundId: round.id,
          visibility,
          winners: rows.map((row) => ({ cardId: row.cardId, userId: row.userId, amount: Number(row.amount) })),
        }),
      'تم حفظ الفائزين',
    ).then((ok) => {
      if (ok) onClose();
    });
  }

  const shownError = localError || error;

  return (
    <Modal
      open
      title={`فائزو «${round.title}»`}
      description="اختر فائزاً أو أكثر لكل بطاقة، مع المبلغ الذي فاز به. لا يمكن تكرار نفس الشخص في نفس البطاقة."
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
      <div className="space-y-6">
        {shownError ? <InlineAlert tone="error">{shownError}</InlineAlert> : null}

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">ظهور القائمة في التطبيق</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {VISIBILITY.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  visibility === option.value ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="winnersVisibility"
                  checked={visibility === option.value}
                  onChange={() => setVisibility(option.value)}
                  className="mt-1 accent-brand-blue"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{option.label}</span>
                  <span className="block text-xs leading-5 text-gray-500">{option.help}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {cards.map((card) => (
          <CardWinners
            key={card.id}
            card={card}
            roundId={round.id}
            rows={rows.filter((row) => row.cardId === card.id)}
            disabled={busy}
            onAdd={(purchaser) =>
              setRows((previous) => [
                ...previous,
                {
                  cardId: card.id,
                  userId: purchaser.userId,
                  userName: purchaser.userName,
                  referralCode: purchaser.referralCode,
                  amount: '',
                },
              ])
            }
            onChange={(userId, amount) =>
              setRows((previous) =>
                previous.map((row) => (row.cardId === card.id && row.userId === userId ? { ...row, amount } : row)),
              )
            }
            onRemove={(userId) =>
              setRows((previous) => previous.filter((row) => !(row.cardId === card.id && row.userId === userId)))
            }
          />
        ))}

        {rows.length ? (
          <p className="text-sm font-medium text-gray-700">
            إجمالي الجوائز: {formatIqd(rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0))}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

function CardWinners({
  card,
  roundId,
  rows,
  disabled,
  onAdd,
  onChange,
  onRemove,
}: {
  card: KhairCard;
  roundId: string;
  rows: Row[];
  disabled: boolean;
  onAdd: (purchaser: Purchaser) => void;
  onChange: (userId: string, amount: string) => void;
  onRemove: (userId: string) => void;
}) {
  const [purchasers, setPurchasers] = useState<Purchaser[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [pick, setPick] = useState('');

  useEffect(() => {
    let active = true;
    khairApi(`?purchasersRoundId=${encodeURIComponent(roundId)}&cardId=${encodeURIComponent(card.id)}`)
      .then((result) => {
        if (active) setPurchasers(result.purchasers as Purchaser[]);
      })
      .catch((e) => {
        if (active) setLoadError(e instanceof Error ? e.message : 'فشل تحميل المشترين');
      });
    return () => {
      active = false;
    };
  }, [roundId, card.id]);

  const available = (purchasers ?? []).filter((p) => !rows.some((row) => row.userId === p.userId));

  return (
    <section className="rounded-xl border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="font-bold text-gray-900">{card.name}</h4>
        <span className="text-xs text-gray-500">
          {purchasers ? `${purchasers.length} مشترٍ في هذه الجولة` : 'جاري تحميل المشترين...'}
        </span>
      </div>

      {rows.length === 0 ? <p className="mb-3 text-sm text-gray-500">لا يوجد فائزون لهذه البطاقة بعد.</p> : null}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.userId} className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{row.userName || 'بدون اسم'}</p>
              <p className="text-xs text-gray-500">رقم الإحالة: {row.referralCode || '—'}</p>
            </div>
            <input
              type="number"
              min="1"
              step="any"
              inputMode="decimal"
              aria-label={`مبلغ فوز ${row.userName}`}
              placeholder="المبلغ (د.ع)"
              value={row.amount}
              disabled={disabled}
              onChange={(e) => onChange(row.userId, e.target.value)}
              className={`${inputClass} !w-36`}
            />
            <button type="button" className={btn.dangerGhost} disabled={disabled} onClick={() => onRemove(row.userId)}>
              حذف
            </button>
          </li>
        ))}
      </ul>

      {loadError ? <p className="mt-3 text-sm text-red-600">{loadError}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          className={`${inputClass} !w-auto min-w-[14rem] flex-1`}
          value={pick}
          disabled={disabled || !available.length}
          onChange={(e) => setPick(e.target.value)}
          aria-label={`اختر فائزاً لـ ${card.name}`}
        >
          <option value="">{available.length ? 'اختر فائزاً من المشترين...' : 'لا يوجد مشترون متبقون'}</option>
          {available.map((p) => (
            <option key={p.userId} value={p.userId}>
              {p.userName || 'بدون اسم'} — {p.userPhone} — {p.chances} فرصة
            </option>
          ))}
        </select>
        <button
          type="button"
          className={btn.small}
          disabled={disabled || !pick}
          onClick={() => {
            const purchaser = available.find((p) => p.userId === pick);
            if (purchaser) onAdd(purchaser);
            setPick('');
          }}
        >
          + إضافة فائز
        </button>
      </div>
    </section>
  );
}
