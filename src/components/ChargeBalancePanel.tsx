'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { chargeUserBalance, type FormActionState } from '@/lib/actions';
import type { UserRow } from '@/lib/data';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import ConfirmForm from '@/components/ui/ConfirmForm';
import FormField, { inputClass } from '@/components/ui/FormField';
import SubmitButton from '@/components/ui/SubmitButton';

import { CHARGE_REASONS } from '@/lib/chargeReasons';
import { phoneSearchPrefixes } from '@/lib/phoneSearch';

const initialState: FormActionState = { error: null };

function matchesQuery(user: UserRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return false;

  let phoneMatches = false;
  try {
    phoneMatches = phoneSearchPrefixes(query).some((prefix) =>
      user.phone.startsWith(prefix),
    );
  } catch {
    /* Short text searches still match names and codes. */
  }
  return (
    phoneMatches ||
    user.name.toLowerCase().includes(q) ||
    user.phone.toLowerCase().includes(q) ||
    user.referralCode.toLowerCase().includes(q)
  );
}

export default function ChargeBalancePanel({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('wallet_top_up');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState('');
  const [state, formAction] = useActionState(chargeUserBalance, initialState);
  const pendingAmount = useRef(0);
  const handledState = useRef(state);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return users.filter((user) => matchesQuery(user, query)).slice(0, 12);
  }, [users, query]);

  useEffect(() => {
    if (state === handledState.current) return;
    handledState.current = state;

    if (state.error) {
      setSuccess('');
      return;
    }

    if (!selected || pendingAmount.current <= 0) return;

    const charged = pendingAmount.current;
    pendingAmount.current = 0;

    setSelected((current) =>
      current
        ? {
            ...current,
            goldBalance: current.goldBalance + charged,
            dinarBalance: current.dinarBalance + charged,
          }
        : current,
    );
    setAmount('');
    setSuccess(`تم شحن الرصيد بمبلغ ${charged.toLocaleString('ar')} بنجاح`);
  }, [state, selected]);

  function selectUser(user: UserRow) {
    setSelected(user);
    setQuery('');
    setReason('wallet_top_up');
    setNote('');
    setAmount('');
    setSuccess('');
  }

  function clearSelection() {
    setSelected(null);
    setAmount('');
    setSuccess('');
  }

  function handleSubmit(formData: FormData) {
    pendingAmount.current = Number(formData.get('amount') ?? 0);
    setSuccess('');
    return formAction(formData);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-1 font-semibold text-gray-900">البحث عن مستخدم</h2>
        <p className="mb-4 text-sm text-gray-500">
          ابحث بالاسم أو رقم الهاتف أو كود الإحالة
        </p>

        <FormField label="بحث">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="مثال: أحمد، 07، REF123"
            className={inputClass}
            autoComplete="off"
          />
        </FormField>

        <div className="mt-4 space-y-2">
          {query.trim() && results.length === 0 ? (
            <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
              لا توجد نتائج مطابقة
            </p>
          ) : null}

          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectUser(user)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-right transition hover:border-brand-blue hover:bg-brand-blue/5 ${
                selected?.id === user.id
                  ? 'border-brand-blue bg-brand-blue/5'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Avatar name={user.name || user.phone || '?'} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{user.name || '—'}</p>
                <p className="text-sm text-gray-500">{user.phone || '—'}</p>
                <p className="font-mono text-xs text-gray-400">
                  {user.referralCode || '—'}
                </p>
              </div>
              <div className="shrink-0 text-left text-xs text-gray-500">
                <p className="font-semibold text-brand-gold">
                  {user.goldBalance.toLocaleString()}
                </p>
                <p>{user.dinarBalance.toLocaleString()} د.ع</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-gray-900">شحن الرصيد</h2>
        <p className="mb-4 text-sm text-gray-500">
          اختر مستخدماً ثم أدخل المبلغ المراد تحويله
        </p>

        {!selected ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
            اختر مستخدماً من نتائج البحث أولاً
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={selected.name || selected.phone || '?'}
                  size="md"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {selected.name || '—'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selected.phone || '—'}
                  </p>
                  <p className="font-mono text-xs text-gray-400">
                    كود الإحالة: {selected.referralCode || '—'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="text-sm text-gray-500 transition hover:text-gray-800"
              >
                تغيير
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 px-3 py-2">
                <p className="text-xs text-gray-400">رصيد الذهب</p>
                <p className="mt-1 font-semibold text-brand-gold">
                  {selected.goldBalance.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 px-3 py-2">
                <p className="text-xs text-gray-400">رصيد الدينار</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selected.dinarBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {state.error ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {state.error}
              </p>
            ) : null}
            {success && !state.error ? (
              <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </p>
            ) : null}

            <ConfirmForm
              action={handleSubmit}
              title="تأكيد شحن الرصيد"
              message={`هل تريد شحن رصيد ${selected.name || selected.phone || 'المستخدم'} بمبلغ ${Number(amount || 0).toLocaleString('ar')}؟ السبب: ${CHARGE_REASONS.find((item) => item.value === reason)?.label}${note.trim() ? ` — ${note.trim()}` : ''}`}
              confirmLabel="نعم، شحن الرصيد"
              className="space-y-4"
            >
              <input type="hidden" name="userId" value={selected.id} />
              <FormField
                label="مبلغ الشحن"
                hint="سيتم إضافة المبلغ إلى رصيد الذهب والدينار"
              >
                <input
                  name="amount"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="مثال: 500"
                  className={inputClass}
                />
              </FormField>
              <FormField
                label="سبب شحن الرصيد"
                hint="يظهر هذا السبب في إشعار المستخدم وسجل المعاملات"
              >
                <select
                  name="chargeReason"
                  className={inputClass}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  required
                >
                  {CHARGE_REASONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                label="تفاصيل السبب"
                hint="تظهر للمستخدم في الإشعار — مطلوبة عند اختيار سبب آخر"
              >
                <textarea
                  name="chargeNote"
                  className={inputClass}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  required={reason === 'other'}
                  maxLength={500}
                />
              </FormField>
              <div className="flex justify-end">
                <SubmitButton pendingText="جاري الشحن...">
                  شحن الرصيد
                </SubmitButton>
              </div>
            </ConfirmForm>
          </div>
        )}
      </Card>
    </div>
  );
}
