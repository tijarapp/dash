import NavAnchor from '@/components/NavAnchor';
import type { WithdrawRow } from '@/lib/data';
import { WithdrawApproveReject } from '@/components/WithdrawApproveReject';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function WithdrawCard({
  request,
  userName,
}: {
  request: WithdrawRow;
  userName: string;
}) {
  const isPending = request.status === 'pending';

  return (
    <Card
      className={`transition hover:shadow-md ${isPending ? 'border-amber-200 bg-amber-50/30' : ''}`}
    >
      <div className="flex flex-wrap items-start gap-4">
        <NavAnchor href={`/users/${request.userId}`}>
          <Avatar name={userName} />
        </NavAnchor>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <NavAnchor
              href={`/users/${request.userId}`}
              className="font-semibold text-gray-900 hover:text-brand-blue"
            >
              {userName}
            </NavAnchor>
            <Badge status={request.status} />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-400">صاحب البطاقة</p>
              <p className="font-medium">{request.cardHolder || '—'}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-400">رقم البطاقة</p>
              <p className="font-mono text-sm">{request.cardNumber || '—'}</p>
            </div>
            {request.swift && (
              <div className="rounded-lg bg-gray-50 px-3 py-2 sm:col-span-2">
                <p className="text-xs text-gray-400">SWIFT</p>
                <p className="font-mono text-sm">{request.swift}</p>
              </div>
            )}
          </div>

          <p className="mt-2 text-xs text-gray-400">{formatDate(request.createdAt)}</p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-left">
            <p className="text-2xl font-bold text-red-600">
              {request.amount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">دينار</p>
          </div>

          {isPending ? (
            <div className="flex flex-col items-end gap-2">
              <WithdrawApproveReject requestId={request.id} />
              <NavAnchor
                href={`/requests/${request.id}/edit`}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                تعديل
              </NavAnchor>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <span className="text-sm text-gray-400">تمت المعالجة</span>
              <NavAnchor
                href={`/requests/${request.id}/edit`}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                تعديل
              </NavAnchor>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function WithdrawRequestList({
  requests,
  userMap,
}: {
  requests: WithdrawRow[];
  userMap: Map<string, string>;
}) {
  if (requests.length === 0) {
    return (
      <Card>
        <EmptyState message="لا توجد طلبات سحب" />
      </Card>
    );
  }

  const pending = requests.filter((r) => r.status === 'pending');
  const processed = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
            طلبات معلقة
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-700">
              {pending.length}
            </span>
          </h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <WithdrawCard
                key={r.id}
                request={r}
                userName={userMap.get(r.userId) ?? r.userId.slice(0, 10)}
              />
            ))}
          </div>
        </section>
      )}

      {processed.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-gray-900">طلبات سابقة</h2>
          <div className="space-y-3">
            {processed.map((r) => (
              <WithdrawCard
                key={r.id}
                request={r}
                userName={userMap.get(r.userId) ?? r.userId.slice(0, 10)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
