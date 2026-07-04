import NavAnchor from '@/components/NavAnchor';
import type { TransactionRow } from '@/lib/data';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

const typeLabels: Record<string, string> = {
  charge: 'شحن',
  withdraw: 'سحب',
  profit: 'ربح',
  invest: 'استثمار',
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
  const typeClass = typeColors[transaction.type] ?? 'bg-gray-100 text-gray-600';

  return (
    <Card className="transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <NavAnchor href={`/users/${transaction.userId}`}>
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
            <p className="mt-1 text-sm text-gray-500">{transaction.note}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">{formatDate(transaction.createdAt)}</p>
        </div>
        <div className="text-left">
          <p
            className={`text-lg font-bold ${transaction.dinarAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {transaction.dinarAmount >= 0 ? '+' : ''}
            {transaction.dinarAmount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">دينار</p>
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
  userMap: Map<string, string>;
}) {
  if (transactions.length === 0) {
    return (
      <Card>
        <EmptyState message="لا توجد معاملات مسجلة" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((t) => (
        <TransactionCard
          key={t.id}
          transaction={t}
          userName={userMap.get(t.userId) ?? t.userId.slice(0, 10)}
        />
      ))}
    </div>
  );
}
