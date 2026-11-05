'use client';

import { useActionState } from 'react';
import { approveMonthlyPayout } from '@/lib/monthlyPayouts';
import { inputClass } from './ui/FormField';
import SubmitButton from './ui/SubmitButton';
import ConfirmForm from './ui/ConfirmForm';

export default function MonthlyPayoutForm({ id, month, isDue }: { id: string; month: number; isDue: boolean }) {
  const [state, action, pending] = useActionState(approveMonthlyPayout, { error: null });
  return <ConfirmForm action={action} title="اعتماد وصرف الدفعة الشهرية" message="سيُضاف جزء رأس المال والربح الفعلي الذي أدخلته إلى محفظة المشترك. هل تؤكد الصرف؟" className="mt-4 space-y-3">
    <input type="hidden" name="investmentId" value={id} />
    <input type="hidden" name="month" value={month} />
    <div className="grid grid-cols-2 gap-3">
      <label className="text-sm font-medium text-gray-700">الربح الفعلي للشهر
        <input name="actualProfit" type="number" min="0" step="0.01" required disabled={!isDue || pending} className={`${inputClass} mt-1`} placeholder="0" />
      </label>
      <label className="text-sm font-medium text-gray-700">ملاحظة <span className="font-normal text-gray-400">(اختياري)</span>
        <input name="note" disabled={!isDue || pending} className={`${inputClass} mt-1`} />
      </label>
    </div>
    {state.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
    <SubmitButton pendingText="جاري الصرف..." disabled={!isDue} variant="success" className="w-full">اعتماد وصرف الدفعة</SubmitButton>
  </ConfirmForm>;
}
