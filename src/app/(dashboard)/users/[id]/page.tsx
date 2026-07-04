import NavAnchor from '@/components/NavAnchor';
import { notFound } from 'next/navigation';
import { getUserDetail } from '@/lib/data';
import AdjustBalanceForm from '@/components/AdjustBalanceForm';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

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

function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent ?? 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getUserDetail(id);
  if (!detail) notFound();

  const { user, isInvestor, investments, transactions, withdrawRequests, stats } = detail;

  return (
    <div className="space-y-6">
      <NavAnchor
        href={isInvestor ? '/investors' : '/users'}
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-brand-blue"
      >
        → رجوع
      </NavAnchor>

      {/* Profile Header */}
      <Card>
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={user.name || user.phone || '?'} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{user.name || '—'}</h1>
              {isInvestor ? (
                <span className="rounded-full bg-brand-gold/10 px-2.5 py-1 text-xs font-medium text-brand-gold">
                  مستثمر
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  مستخدم
                </span>
              )}
            </div>
            <p className="mt-1 text-gray-500">{user.phone || '—'}</p>
            <p className="mt-1 font-mono text-xs text-gray-400">كود الإحالة: {user.referralCode || '—'}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <StatBox label="رصيد الذهب" value={user.goldBalance.toLocaleString()} accent="text-brand-gold" />
          <StatBox label="رصيد الدينار" value={user.dinarBalance.toLocaleString()} />
          <StatBox label="عدد الاستثمارات" value={stats.investmentCount.toLocaleString()} />
          <StatBox label="إجمالي المستثمر" value={stats.totalInvested.toLocaleString()} />
          <StatBox label="إجمالي الأرباح" value={stats.totalProfit.toLocaleString()} accent="text-green-600" />
          <StatBox label="المعاملات" value={stats.transactionCount.toLocaleString()} />
        </div>
      </Card>

      {/* Balance Adjustment */}
      <Card>
        <h2 className="mb-4 font-semibold text-gray-900">تعديل الرصيد</h2>
        <AdjustBalanceForm userId={user.id} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Investments */}
        <section>
          <h2 className="mb-3 text-lg font-bold">الاستثمارات</h2>
          <Card padding={false}>
            {investments.length === 0 ? (
              <EmptyState message="لا توجد استثمارات" />
            ) : (
              <div className="divide-y divide-gray-100">
                {investments.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-gray-900">{inv.categoryTitle}</p>
                      <p className="text-xs text-gray-400">{formatDate(inv.createdAt)}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-brand-gold">{inv.amount.toLocaleString()}</p>
                      <Badge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Withdrawals */}
        <section>
          <h2 className="mb-3 text-lg font-bold">طلبات السحب</h2>
          <Card padding={false}>
            {withdrawRequests.length === 0 ? (
              <EmptyState message="لا توجد طلبات سحب" />
            ) : (
              <div className="divide-y divide-gray-100">
                {withdrawRequests.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-gray-900">{w.cardHolder}</p>
                      <p className="text-xs text-gray-400">{formatDate(w.createdAt)}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-red-600">{w.amount.toLocaleString()}</p>
                      <Badge status={w.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>

      {/* Transactions */}
      <section>
        <h2 className="mb-3 text-lg font-bold">سجل المعاملات</h2>
        <Card padding={false}>
          {transactions.length === 0 ? (
            <EmptyState message="لا توجد معاملات" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
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
                  {transactions.map((t) => (
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
          )}
        </Card>
      </section>
    </div>
  );
}
