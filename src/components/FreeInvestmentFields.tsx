'use client';

import { useId, useState } from 'react';
import type { CategoryRow } from '@/lib/data';
import { freeTermsFromMonthlyReturn } from '@/lib/categoryProfit';
import { inputClass } from '@/components/ui/FormField';

const money = (value: number) => value.toLocaleString('ar-IQ', { maximumFractionDigits: 2 });

/** Fields of a free (trial) investment: no price, a fixed amount paid every month. */
export default function FreeInvestmentFields({ category }: { category?: CategoryRow }) {
  const id = useId();
  const [monthlyReturn, setMonthlyReturn] = useState(String(category?.monthlyReturn ?? ''));
  const [months, setMonths] = useState(String(category?.durationMonths ?? ''));
  const complete = monthlyReturn.trim() !== '' && months.trim() !== '';
  let total = 0;
  let error: string | null = null;
  try {
    total = freeTermsFromMonthlyReturn(Number(monthlyReturn), Number(months)).expectedTotalReturn;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'أدخل البيانات بشكل صحيح';
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm leading-6 text-green-800">
        استثمار مجاني: الاشتراك بدون أي مبلغ، ويستلم المشترك العائد الشهري الذي تحدده كل شهر طوال المدة. لا يوجد رأس مال يُعاد.
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label htmlFor={`${id}-return`} className="mb-1.5 block text-sm font-medium text-gray-700">العائد الشهري (د.ع)</label>
          <input id={`${id}-return`} name="monthlyReturn" type="number" min="0.01" step="0.01" required value={monthlyReturn} onChange={(e) => setMonthlyReturn(e.target.value)} className={inputClass} placeholder="مثال: 150" /></div>
        <div><label htmlFor={`${id}-months`} className="mb-1.5 block text-sm font-medium text-gray-700">المدة بالأشهر</label>
          <input id={`${id}-months`} name="durationMonths" type="number" min="1" max="120" step="1" required value={months} onChange={(e) => setMonths(e.target.value)} className={inputClass} placeholder="مثال: 3" /></div>
      </div>
      {complete && error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {complete && !error && <p className="text-sm font-medium text-brand-blue" aria-live="polite">
        إجمالي ما يربحه المشترك خلال {months} شهر: {money(total)} د.ع
      </p>}
    </div>
  );
}
