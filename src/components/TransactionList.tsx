'use client';

import { transactionAmount, khairTransactionLabels } from '@/lib/transactionDisplay';

import NavAnchor from '@/components/NavAnchor';
import type { TransactionRow } from '@/lib/data';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';

const typeLabels: Record<string, string> = {
  charge: 'شحن',
  withdraw: 'سحب',
  profit: 'ربح',
  monthly_payout: 'دفعة شهرية (رأس مال وربح)',
  referral_bonus: 'مكافأة دعوة صديق',
  invest: 'استثمار',
  ...khairTransactionLabels,
};

const typeColors: Record<string, string> = {
  charge: 'bg-blue-50 text-blue-700',
  withdraw: 'bg-red-50 text-red-700',
  profit: 'bg-green-50 text-green-700',
  invest: 'bg-amber-50 text-amber-700',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar');
}

function TransactionCard({
  transaction,
  userName,
}: {
  transaction: TransactionRow;
  userName: string;
}) {
  const amount = transactionAmount(transaction);
  const typeClass = typeColors[transaction.type] ?? 'bg-gray-100 text-gray-600';

  return (
    <Card className="transition hover:shadow-md">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <NavAnchor href={`/users/${transaction.userId}`} className="shrink-0">
          <Avatar name={userName} size="sm" />
        </NavAnchor>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <NavAnchor
              href={`/users/${transaction.userId}`}
              className="font-semibold text-gray-900 hover:text-brand-blue"
            >
              {userName}
            </NavAnchor>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeClass}`}>
              {typeLabels[transaction.type] ?? transaction.type}
            </span>
            <Badge status={transaction.status} />
          </div>
          {transaction.note && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{transaction.note}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">{formatDate(transaction.createdAt)}</p>
        </div>
        <div className="shrink-0 text-left">
          <p
            className={`text-base font-bold sm:text-lg ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {amount >= 0 ? '+' : ''}
            {amount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">{transaction.paymentMethod === 'points' ? 'نقطة خير' : 'دينار'}</p>
        </div>
      </div>
    </Card>
  );
}

export default function TransactionList({
  transactions,
  userMap,
}: {
  transactions: TransactionRow[];
  userMap: Record<string, string>;
}) {
  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(transactions);

  if (transactions.length === 0) {
    return (
      <Card>
        <EmptyState message="لا توجد معاملات مسجلة" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {pageItems.map((t) => (
        <TransactionCard
          key={t.id}
          transaction={t}
          userName={userMap[t.userId] ?? t.userId.slice(0, 10)}
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
  );
}
