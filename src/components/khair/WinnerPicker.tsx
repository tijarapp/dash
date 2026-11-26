'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { inputClass } from '@/components/ui/FormField';
import { btn, khairApi, type KhairCard } from './shared';

type Purchaser = {
  userId: string;
  userName: string;
  userPhone: string;
  referralCode: string;
  chances: number;
};

const PAGE_SIZE = 6;

export function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0));
}

function normalizeSearch(value: string) {
  return normalizeDigits(value)
    .normalize('NFKD')
    .replace(/[\p{M}ـ]/gu, '')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

const digitsOnly = (value: string) => normalizeDigits(value).replace(/\D/g, '');

export default function WinnerPicker({
  card,
  roundId,
  selectedIds,
  disabled,
  onSelect,
}: {
  card: KhairCard;
  roundId: string;
  selectedIds: ReadonlySet<string>;
  disabled: boolean;
  onSelect: (purchaser: Purchaser) => void;
}) {
  const [purchasers, setPurchasers] = useState<Purchaser[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const cardId = card.id;

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ purchasersRoundId: roundId, cardId });
    khairApi('?' + params)
      .then((result) => {
        if (active) setPurchasers(result.purchasers);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => { active = false; };
  }, [roundId, cardId, attempt]);

  const indexed = useMemo(() => (purchasers ?? [])
    .map((purchaser) => ({
      purchaser,
      name: normalizeSearch(purchaser.userName),
      referral: normalizeSearch(String(purchaser.referralCode)),
      phone: digitsOnly(String(purchaser.userPhone)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ar') || a.purchaser.userId.localeCompare(b.purchaser.userId)),
  [purchasers]);

  const search = normalizeSearch(query);
  const phoneQuery = /^[+\d\s().-]+$/.test(search)
    ? digitsOnly(search).replace(/^(?:(?:00964|964|0)(?=7))/, '')
    : '';
  const matches = indexed.filter(({ name, referral, phone }) =>
    name.includes(search) || referral.includes(search) || (phoneQuery && phone.includes(phoneQuery)));
  const pageCount = Math.ceil(matches.length / PAGE_SIZE);

  return (
    <div id={'winner-picker-' + cardId} className="space-y-2 rounded-xl border border-blue-100 bg-brand-blue/5 p-3">
      <label htmlFor={'winner-search-' + cardId} className="block text-xs font-semibold text-gray-700">
        البحث بين مشترِي هذه البطاقة
      </label>
      <input
        ref={searchRef}
        id={'winner-search-' + cardId}
        type="search"
        dir="auto"
        placeholder="الاسم، رقم الهاتف، أو رقم الإحالة"
        value={query}
        disabled={disabled}
        className={inputClass + ' bg-white'}
        onChange={(event) => {
          setQuery(event.target.value);
          setPage(0);
        }}
      />
      {failed ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-red-700" role="alert">
          تعذّر تحميل المشترين.
          <button type="button" className={btn.small} disabled={disabled} onClick={() => {
            setFailed(false);
            setAttempt((previous) => previous + 1);
          }}>
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <p role="status" className="text-xs leading-5 text-gray-600">
          {!purchasers ? 'جاري تحميل المشترين…'
            : !purchasers.length ? 'لا يوجد مشترون مؤهلون لهذه البطاقة في الجولة.'
            : !matches.length ? 'لا توجد نتائج مطابقة. جرّب اسمًا أو رقمًا آخر.'
            : matches.length.toLocaleString('ar-IQ') + ' نتيجة'}
        </p>
      )}
      {matches.length > 0 && (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
          {matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(({ purchaser }) => (
            <li key={purchaser.userId}>
              <button
                type="button"
                disabled={disabled || selectedIds.has(purchaser.userId)}
                onClick={() => onSelect(purchaser)}
                className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-start hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="block break-words text-sm font-semibold text-gray-900">{purchaser.userName || 'بدون اسم'}</span>
                  <span className="flex flex-wrap gap-x-2 text-xs text-gray-600">
                    {purchaser.userPhone && <bdi>{purchaser.userPhone}</bdi>}
                    {purchaser.referralCode && <span>الإحالة <bdi>{purchaser.referralCode}</bdi></span>}
                    <span>{purchaser.chances} فرصة</span>
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-blue-800">
                  {selectedIds.has(purchaser.userId) ? 'تم الاختيار' : 'إضافة'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {pageCount > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
          <button type="button" className={btn.small} disabled={disabled || page === 0} onClick={() => setPage(page - 1)}>السابق</button>
          <span role="status">صفحة {page + 1} من {pageCount}</span>
          <button type="button" className={btn.small} disabled={disabled || page + 1 === pageCount} onClick={() => setPage(page + 1)}>التالي</button>
        </div>
      )}
    </div>
  );
}
