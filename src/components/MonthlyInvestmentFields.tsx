'use client';

import { useId, useState } from 'react';
import type { CategoryRow } from '@/lib/data';
import { buildMonthlySchedule, monthlyProfitRate, monthlyTermsFromProfit } from '@/lib/categoryProfit';
import { inputClass } from '@/components/ui/FormField';

const money = (value: number) => value.toLocaleString('ar-IQ', { maximumFractionDigits: 2 });

export default function MonthlyInvestmentFields({ category }: { category?: CategoryRow }) {
  const id = useId();
  const [capital, setCapital] = useState(String(category?.minInvestment ?? ''));
  const [months, setMonths] = useState(String(category?.durationMonths ?? ''));
  const [profit, setProfit] = useState(category?.expectedTotalReturn === undefined ? '' :
    String((Math.round(category.expectedTotalReturn * 100) - Math.round(category.minInvestment * 100)) / 100));
  let total = 0;
  let error: string | null = null;
  try {
    total = monthlyTermsFromProfit(Number(capital), Number(months), Number(profit)).expectedTotalReturn;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'أدخل بيانات الاستثمار بشكل صحيح';
  }
  const complete = capital.trim() !== '' && months.trim() !== '' && profit.trim() !== '';
  const schedule = error || !complete ? [] : buildMonthlySchedule(Number(capital), Number(months), total);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div><label htmlFor={`${id}-capital`} className="mb-1.5 block text-sm font-medium text-gray-700">مبلغ الاستثمار</label>
          <input id={`${id}-capital`} name="minInvestment" type="number" min="0.01" step="0.01" required value={capital} onChange={(e) => setCapital(e.target.value)} className={inputClass} /></div>
        <div><label htmlFor={`${id}-months`} className="mb-1.5 block text-sm font-medium text-gray-700">المدة بالأشهر</label>
          <input id={`${id}-months`} name="durationMonths" type="number" min="1" max="120" step="1" required value={months} onChange={(e) => setMonths(e.target.value)} className={inputClass} /></div>
        <div><label htmlFor={`${id}-profit`} className="mb-1.5 block text-sm font-medium text-gray-700">صافي الربح المتوقع لكامل المدة</label>
          <input id={`${id}-profit`} name="expectedProfit" type="number" min="0" step="0.01" required value={profit} onChange={(e) => setProfit(e.target.value)} aria-describedby={`${id}-profit-hint`} className={inputClass} />
          <p id={`${id}-profit-hint`} className="mt-1 text-xs text-gray-500">الربح فقط، بدون رأس المال، عن المدة كاملة.</p></div>
      </div>
      <p className="text-sm text-gray-600">تُعاد أجزاء رأس المال شهرياً مع الربح المعتمد. الأرباح المعروضة توقعات غير مضمونة ولا تُضاف تلقائياً للمحفظة.</p>
      {complete && error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {schedule.length > 0 && <div className="space-y-3" aria-live="polite">
        <p className="text-sm font-medium text-brand-blue">الإجمالي المتوقع شامل رأس المال: {money(total)} — النسبة الشهرية التقديرية من رأس المال الأصلي: {money(monthlyProfitRate(Number(capital), Number(months), total))}%</p>
        <details className="rounded-xl border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-medium">جدول الدفعات الشهرية المتوقع ({schedule.length})</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full whitespace-nowrap text-right text-sm">
              <caption className="mb-2 text-right text-xs text-gray-500">تُسوّى فروقات التقريب في الدفعة الأخيرة. الربح الفعلي يُعتمد بشكل منفصل.</caption>
              <thead><tr>{['الشهر', 'رأس المال المعاد', 'الربح المتوقع', 'الدفعة المتوقعة', 'رأس المال المتبقي'].map((label) => <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
              <tbody>{schedule.map((row) => <tr key={row.month} className="border-t border-gray-100"><td className="p-2">{row.month}</td><td className="p-2">{money(row.principal)}</td><td className="p-2">{money(row.expectedProfit)}</td><td className="p-2">{money(row.expectedPayment)}</td><td className="p-2">{money(row.remainingCapital)}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </div>}
    </div>
  );
}
