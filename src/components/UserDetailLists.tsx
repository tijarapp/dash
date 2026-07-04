'use client';

import type { InvestmentRow, TransactionRow, WithdrawRow } from '@/lib/data';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar');
}

const typeLabels: Record<string, string> = {
  charge: 'شحن',
  withdraw: 'سحب',
  profit: 'ربح',
  invest: 'استثمار',
};

function InvestmentList({ investments }: { investments: InvestmentRow[] }) {
  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(investments, 5);

  if (investments.length === 0) {
    return (
      <Card padding={false}>
        <EmptyState message="لا توجد استثمارات" />
      </Card>
    );
  }

  return (
    <Card padding={false}>
      <div className="divide-y divide-gray-100">
        {pageItems.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-medium text-gray-900">{inv.categoryTitle}</p>
              <p className="text-xs text-gray-400">{formatDate(inv.createdAt)}</p>
            </div>
            <div className="shrink-0 text-left">
              <p className="font-semibold text-brand-gold">{inv.amount.toLocaleString()}</p>
              <Badge status={inv.status} />
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          from={from}
          to={to}
          onPageChange={setPage}
        />
      </div>
    </Card>
  );
}

function WithdrawList({ withdrawRequests }: { withdrawRequests: WithdrawRow[] }) {
  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(withdrawRequests, 5);

  if (withdrawRequests.length === 0) {
    return (
      <Card padding={false}>
        <EmptyState message="لا توجد طلبات سحب" />
      </Card>
    );
  }

  return (
    <Card padding={false}>
      <div className="divide-y divide-gray-100">
        {pageItems.map((w) => (
          <div key={w.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-medium text-gray-900">{w.cardHolder}</p>
              <p className="text-xs text-gray-400">{formatDate(w.createdAt)}</p>
            </div>
            <div className="shrink-0 text-left">
              <p className="font-semibold text-red-600">{w.amount.toLocaleString()}</p>
              <Badge status={w.status} />
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          from={from}
          to={to}
          onPageChange={setPage}
        />
      </div>
    </Card>
  );
}

function TransactionHistory({ transactions }: { transactions: TransactionRow[] }) {
  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(transactions, 8);

  if (transactions.length === 0) {
    return (
      <Card padding={false}>
        <EmptyState message="لا توجد معاملات" />
      </Card>
    );
  }

  return (
    <Card padding={false}>
      <div className="divide-y divide-gray-100 sm:hidden">
        {pageItems.map((t) => (
          <div key={t.id} className="space-y-1 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-gray-900">
                {typeLabels[t.type] ?? t.type}
              </span>
              <span
                className={`font-semibold ${t.dinarAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {t.dinarAmount >= 0 ? '+' : ''}
                {t.dinarAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Badge status={t.status} />
              <span className="text-xs text-gray-400">{formatDate(t.createdAt)}</span>
            </div>
            {t.note ? <p className="text-xs text-gray-500">{t.note}</p> : null}
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[560px] text-right text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-3">النوع</th>
              <th className="p-3">المبلغ</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">ملاحظة</th>
              <th className="p-3">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((t) => (
              <tr key={t.id} className="border-t border-gray-100">
                <td className="p-3">{typeLabels[t.type] ?? t.type}</td>
                <td
                  className={`p-3 font-medium ${t.dinarAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {t.dinarAmount >= 0 ? '+' : ''}
                  {t.dinarAmount.toLocaleString()}
                </td>
                <td className="p-3">
                  <Badge status={t.status} />
                </td>
                <td className="p-3 text-gray-500">{t.note ?? '—'}</td>
                <td className="p-3 text-xs text-gray-400">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 pb-4">
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          from={from}
          to={to}
          onPageChange={setPage}
        />
      </div>
    </Card>
  );
}

export default function UserDetailLists({
  investments,
  withdrawRequests,
  transactions,
}: {
  investments: InvestmentRow[];
  withdrawRequests: WithdrawRow[];
  transactions: TransactionRow[];
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-bold">الاستثمارات</h2>
          <InvestmentList investments={investments} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">طلبات السحب</h2>
          <WithdrawList withdrawRequests={withdrawRequests} />
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">سجل المعاملات</h2>
        <TransactionHistory transactions={transactions} />
      </section>
    </>
  );
}
