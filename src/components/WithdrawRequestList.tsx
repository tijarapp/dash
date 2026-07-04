'use client';

import NavAnchor from '@/components/NavAnchor';
import type { WithdrawRow } from '@/lib/data';
import { WithdrawApproveReject } from '@/components/WithdrawApproveReject';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <NavAnchor href={`/users/${request.userId}`} className="shrink-0">
            <Avatar name={userName} />
          </NavAnchor>
          <div className="min-w-0 flex-1 sm:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <NavAnchor
                href={`/users/${request.userId}`}
                className="font-semibold text-gray-900 hover:text-brand-blue"
              >
                {userName}
              </NavAnchor>
              <Badge status={request.status} />
            </div>
            <p className="mt-1 text-lg font-bold text-red-600">
              {request.amount.toLocaleString()}{' '}
              <span className="text-xs font-normal text-gray-400">دينار</span>
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 hidden flex-wrap items-center gap-2 sm:flex">
            <NavAnchor
              href={`/users/${request.userId}`}
              className="font-semibold text-gray-900 hover:text-brand-blue"
            >
              {userName}
            </NavAnchor>
            <Badge status={request.status} />
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-400">صاحب البطاقة</p>
              <p className="font-medium">{request.cardHolder || '—'}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-400">رقم البطاقة</p>
              <p className="break-all font-mono text-sm">{request.cardNumber || '—'}</p>
            </div>
            {request.swift ? (
              <div className="rounded-lg bg-gray-50 px-3 py-2 sm:col-span-2">
                <p className="text-xs text-gray-400">SWIFT</p>
                <p className="break-all font-mono text-sm">{request.swift}</p>
              </div>
            ) : null}
          </div>

          <p className="mt-2 text-xs text-gray-400">{formatDate(request.createdAt)}</p>
        </div>

        <div className="flex flex-row items-center justify-between gap-3 border-t border-gray-100 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
          <div className="hidden text-left sm:block">
            <p className="text-2xl font-bold text-red-600">{request.amount.toLocaleString()}</p>
            <p className="text-xs text-gray-400">دينار</p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-col sm:items-end">
            {isPending ? <WithdrawApproveReject requestId={request.id} /> : (
              <span className="text-sm text-gray-400">تمت المعالجة</span>
            )}
            <NavAnchor
              href={`/requests/${request.id}/edit`}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              تعديل
            </NavAnchor>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PaginatedSection({
  title,
  badge,
  requests,
  userMap,
}: {
  title: string;
  badge?: number;
  requests: WithdrawRow[];
  userMap: Record<string, string>;
}) {
  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(requests);

  return (
    <section>
      <h2 className="mb-3 flex flex-wrap items-center gap-2 text-base font-bold text-gray-900 sm:text-lg">
        {title}
        {badge != null ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-700">
            {badge}
          </span>
        ) : null}
      </h2>
      <div className="space-y-3">
        {pageItems.map((r) => (
          <WithdrawCard
            key={r.id}
            request={r}
            userName={userMap[r.userId] ?? r.userId.slice(0, 10)}
          />
        ))}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          from={from}
          to={to}
          onPageChange={setPage}
        />
      </div>
    </section>
  );
}

export default function WithdrawRequestList({
  requests,
  userMap,
}: {
  requests: WithdrawRow[];
  userMap: Record<string, string>;
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
      {pending.length > 0 ? (
        <PaginatedSection
          title="طلبات معلقة"
          badge={pending.length}
          requests={pending}
          userMap={userMap}
        />
      ) : null}

      {processed.length > 0 ? (
        <PaginatedSection title="طلبات سابقة" requests={processed} userMap={userMap} />
      ) : null}
    </div>
  );
}
