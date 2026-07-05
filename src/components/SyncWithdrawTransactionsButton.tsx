'use client';

import { syncWithdrawTransactionsWithRequests } from '@/lib/actions';
import ConfirmForm from '@/components/ui/ConfirmForm';
import FormPendingOverlay from '@/components/ui/FormPendingOverlay';
import SubmitButton from '@/components/ui/SubmitButton';

export default function SyncWithdrawTransactionsButton() {
  return (
    <ConfirmForm
      action={syncWithdrawTransactionsWithRequests}
      title="تأكيد مزامنة المعاملات"
      message="هل تريد مزامنة معاملات السحب المعلقة مع حالة طلبات السحب؟"
      confirmLabel="نعم، مزامنة"
      className="relative"
    >
      <FormPendingOverlay message="جاري المزامنة..." />
      <SubmitButton pendingText="جاري المزامنة..." className="!px-4 !py-2">
        مزامنة المعاملات
      </SubmitButton>
    </ConfirmForm>
  );
}
