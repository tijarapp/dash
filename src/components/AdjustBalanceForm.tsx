'use client';

import { adjustUserBalance } from '@/lib/actions';
import FormField, { inputClass } from '@/components/ui/FormField';
import FormPendingOverlay from '@/components/ui/FormPendingOverlay';
import SubmitButton from '@/components/ui/SubmitButton';

export default function AdjustBalanceForm({ userId }: { userId: string }) {
  return (
    <form action={adjustUserBalance} className="relative flex flex-wrap items-end gap-3">
      <FormPendingOverlay message="جاري تعديل الرصيد..." />
      <input type="hidden" name="userId" value={userId} />
      <FormField label="المبلغ (+/-)" hint="موجب للإضافة، سالب للخصم" className="w-48">
        <input name="amount" type="number" required placeholder="مثال: 500" className={inputClass} />
      </FormField>
      <SubmitButton pendingText="جاري التطبيق..." className="!px-5">
        تطبيق
      </SubmitButton>
    </form>
  );
}
