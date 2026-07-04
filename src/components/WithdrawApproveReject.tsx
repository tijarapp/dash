'use client';

import { approveWithdraw, rejectWithdraw } from '@/lib/actions';
import SubmitButton, { ActionButton } from '@/components/ui/SubmitButton';

export function WithdrawApproveReject({ requestId }: { requestId: string }) {
  return (
    <div className="flex gap-2">
      <form action={approveWithdraw.bind(null, requestId)}>
        <SubmitButton
          pendingText="جاري القبول..."
          variant="success"
          className="!px-4 !py-2"
        >
          قبول
        </SubmitButton>
      </form>
      <form action={rejectWithdraw.bind(null, requestId)}>
        <ActionButton pendingText="جاري الرفض..." variant="danger" className="!px-4 !py-2">
          رفض
        </ActionButton>
      </form>
    </div>
  );
}
