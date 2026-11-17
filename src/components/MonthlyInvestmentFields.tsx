'use client';

import { useId, useState } from 'react';
import type { CategoryRow } from '@/lib/data';
import {
  MAX_PROFIT_PERCENT,
  MIN_PROFIT_PERCENT,
  PROFIT_PERCENT_STEP,
  buildMonthlySchedule,
  clampProfitPercent,
  monthlyTermsFromPercent,
  percentFromTotal,
} from '@/lib/categoryProfit';
import { inputClass } from '@/components/ui/FormField';

const money = (value: number) => value.toLocaleString('ar-IQ', { maximumFractionDigits: 2 });

export default function MonthlyInvestmentFields({ category }: { category?: CategoryRow }) {
  const id = useId();
  const [capital, setCapital] = useState(String(category?.minInvestment ?? ''));
  const [months, setMonths] = useState(String(category?.durationMonths ?? ''));
  // Older categories may hold a percentage outside today's range (e.g. 0%); open on the nearest allowed value.
  const [percent, setPercent] = useState(() =>
    category?.profitPercent !== undefined
      ? clampProfitPercent(category.profitPercent)
      : percentFromTotal(category?.minInvestment ?? 0, category?.expectedTotalReturn),
  );
  const complete = capital.trim() !== '' && months.trim() !== '';
  let total = 0;
  let error: string | null = null;
  try {
    total = monthlyTermsFromPercent(Number(capital), Number(months), percent).expectedTotalReturn;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'أدخل بيانات الاستثمار بشكل صحيح';
  }
  const schedule = error || !complete ? [] : buildMonthlySchedule(Number(capital), Number(months), percent);
  const profit = schedule.length > 0 ? (Math.round(total * 100) - Math.round(Number(capital) * 100)) / 100 : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label htmlFor={`${id}-capital`} className="mb-1.5 block text-sm font-medium text-gray-700">مبلغ الاستثمار</label>
          <input id={`${id}-capital`} name="minInvestment" type="number" min="0.01" step="0.01" required value={capital} onChange={(e) => setCapital(e.target.value)} className={inputClass} /></div>
        <div><label htmlFor={`${id}-months`} className="mb-1.5 block text-sm font-medium text-gray-700">المدة بالأشهر</label>
          <input id={`${id}-months`} name="durationMonths" type="number" min="1" max="120" step="1" required value={months} onChange={(e) => setMonths(e.target.value)} className={inputClass} /></div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={`${id}-percent`} className="text-sm font-medium text-gray-700">نسبة الربح لكامل المدة</label>
          <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-lg font-bold text-brand-blue" dir="ltr">{percent}%</span>
        </div>
        <div className="space-y-3" dir="ltr">
          <input
            id={`${id}-percent`}
            name="profitPercent"
            type="range"
            min={MIN_PROFIT_PERCENT}
            max={MAX_PROFIT_PERCENT}
            step={PROFIT_PERCENT_STEP}
            value={percent}
            onChange={(event) => setPercent(Number(event.target.value))}
            aria-describedby={`${id}-percent-hint`}
            className="daily-profit-slider w-full cursor-pointer"
          />
          <div className="flex justify-between text-xs font-medium text-gray-500">
            <span>{MIN_PROFIT_PERCENT}%</span>
            <span>{MAX_PROFIT_PERCENT}%</span>
          </div>
        </div>
        <p id={`${id}-percent-hint`} className="mt-3 text-xs leading-5 text-gray-500">
          النسبة من رأس المال عن المدة كاملة. عند تغييرها تُطبَّق النسبة الجديدة من لحظة الحفظ على جميع الاستثمارات النشطة في هذه الفئة، وتبقى الأيام السابقة على نسبتها القديمة.
        </p>
      </div>

      <p className="text-sm text-gray-600">يستلم المستثمر دفعته كل شهر من التطبيق: جزء من رأس المال مع ربح ذلك الشهر.</p>
      {complete && error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {schedule.length > 0 && <div className="space-y-3" aria-live="polite">
        <p className="text-sm font-medium text-brand-blue">الربح لكامل المدة: {money(profit)} — الإجمالي شامل رأس المال: {money(total)}</p>
        <details className="rounded-xl border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-medium">جدول الدفعات الشهرية ({schedule.length})</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full whitespace-nowrap text-right text-sm">
              <caption className="mb-2 text-right text-xs text-gray-500">الجدول محسوب على النسبة الحالية. تُسوّى فروقات التقريب تلقائياً.</caption>
              <thead><tr>{['الشهر', 'رأس المال المعاد', 'الربح', 'الدفعة', 'رأس المال المتبقي'].map((label) => <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
              <tbody>{schedule.map((row) => <tr key={row.month} className="border-t border-gray-100"><td className="p-2">{row.month}</td><td className="p-2">{money(row.principal)}</td><td className="p-2">{money(row.expectedProfit)}</td><td className="p-2">{money(row.expectedPayment)}</td><td className="p-2">{money(row.remainingCapital)}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </div>}
    </div>
  );
}
