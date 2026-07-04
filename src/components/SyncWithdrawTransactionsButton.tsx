'use client';

import { syncWithdrawTransactionsWithRequests } from '@/lib/actions';
import FormPendingOverlay from '@/components/ui/FormPendingOverlay';
import SubmitButton from '@/components/ui/SubmitButton';

export default function SyncWithdrawTransactionsButton() {
  return (
    <form action={syncWithdrawTransactionsWithRequests} className="relative">
      <FormPendingOverlay message="جاري المزامنة..." />
      <SubmitButton pendingText="جاري المزامنة..." className="!px-4 !py-2">
        مزامنة المعاملات
      </SubmitButton>
    </form>
  );
}
