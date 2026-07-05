'use client';

import { approveWithdraw, rejectWithdraw } from '@/lib/actions';
import ConfirmForm from '@/components/ui/ConfirmForm';
import SubmitButton, { ActionButton } from '@/components/ui/SubmitButton';

export function WithdrawApproveReject({ requestId }: { requestId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ConfirmForm
        action={approveWithdraw.bind(null, requestId)}
        title="تأكيد قبول السحب"
        message="هل تريد قبول طلب السحب؟ لن يتم خصم الرصيد مرة أخرى لأن المبلغ خُصم عند إنشاء الطلب."
        confirmLabel="نعم، قبول الطلب"
      >
        <SubmitButton
          pendingText="جاري القبول..."
          variant="success"
          className="!px-4 !py-2"
        >
          قبول
        </SubmitButton>
      </ConfirmForm>

      <ConfirmForm
        action={rejectWithdraw}
        title="تأكيد رفض السحب"
        message="سيتم رفض الطلب وإعادة المبلغ إلى رصيد المستخدم. اكتب سبب الرفض ليظهر للمستخدم في الإشعار."
        confirmLabel="نعم، رفض الطلب"
        danger
        noteField={{
          name: 'adminNote',
          label: 'سبب الرفض للمستخدم',
          placeholder: 'مثال: بيانات البطاقة غير صحيحة',
          required: true,
        }}
      >
        <input type="hidden" name="id" value={requestId} />
        <ActionButton pendingText="جاري الرفض..." variant="danger" className="!px-4 !py-2">
          رفض
        </ActionButton>
      </ConfirmForm>
    </div>
  );
}
