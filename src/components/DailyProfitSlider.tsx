'use client';

import { useState } from 'react';
import FormField, { inputClass } from '@/components/ui/FormField';
import {
  CATEGORY_DURATION_MONTHS,
  clampDailyProfitRate,
  DEFAULT_DAILY_PROFIT_RATE,
  MAX_DAILY_PROFIT_RATE,
  MIN_DAILY_PROFIT_RATE,
} from '@/lib/categoryProfit';

export default function DailyProfitSlider({
  defaultValue = DEFAULT_DAILY_PROFIT_RATE,
}: {
  defaultValue?: number;
}) {
  const [rate, setRate] = useState(() => clampDailyProfitRate(defaultValue));

  function updateRate(value: number) {
    if (!Number.isFinite(value)) return;
    setRate(clampDailyProfitRate(Math.round(value * 100) / 100));
  }

  return (
    <div className="space-y-5 sm:col-span-2">
      <input type="hidden" name="durationMonths" value={CATEGORY_DURATION_MONTHS} />
      <input type="hidden" name="dailyProfitRate" value={rate} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="نسبة الربح اليومي %" hint="حرّك الشريط لاختيار النسبة">
          <div className={`${inputClass} flex items-center justify-between bg-white font-semibold text-brand-blue`}>
            <span>{rate.toFixed(2)}</span>
            <span className="text-gray-400">%</span>
          </div>
        </FormField>

        <FormField label="مدة الاستثمار" hint="ثابتة لجميع الفئات">
          <div className={`${inputClass} flex items-center bg-gray-100 text-gray-700`}>
            سنة واحدة ({CATEGORY_DURATION_MONTHS} شهراً)
          </div>
        </FormField>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">نطاق الربح اليومي</h4>
            <p className="mt-1 text-xs text-gray-500">
              المسموح: {MIN_DAILY_PROFIT_RATE}% — {MAX_DAILY_PROFIT_RATE}%
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            ✓ ضمن النطاق المسموح
          </span>
        </div>

        <div className="space-y-3" dir="ltr">
          <input
            type="range"
            min={MIN_DAILY_PROFIT_RATE}
            max={MAX_DAILY_PROFIT_RATE}
            step={0.01}
            value={rate}
            onChange={(event) => updateRate(Number(event.target.value))}
            className="daily-profit-slider w-full cursor-pointer"
            aria-label="شريط نسبة الربح اليومي"
          />

          <div className="flex justify-between text-xs font-medium text-gray-500">
            <span>{MIN_DAILY_PROFIT_RATE}%</span>
            <span className="text-sm font-bold text-brand-blue">{rate.toFixed(2)}%</span>
            <span>{MAX_DAILY_PROFIT_RATE}%</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          الحد الأدنى يضمن استرداد رأس المال خلال 10 أشهر، والحد الأقصى خلال 6 أشهر.
        </p>
      </div>
    </div>
  );
}
