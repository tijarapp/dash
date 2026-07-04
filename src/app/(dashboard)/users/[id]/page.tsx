import NavAnchor from '@/components/NavAnchor';
import UserDetailLists from '@/components/UserDetailLists';
import { notFound } from 'next/navigation';
import { getUserDetail } from '@/lib/data';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-3 sm:px-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-base font-bold sm:text-lg ${accent ?? 'text-gray-900'}`}>{value}</p>
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

      <Card>
        <div className="flex flex-wrap items-start gap-4 sm:gap-5">
          <Avatar name={user.name || user.phone || '?'} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{user.name || '—'}</h1>
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
            <p className="mt-1 break-all font-mono text-xs text-gray-400">
              كود الإحالة: {user.referralCode || '—'}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatBox label="رصيد الذهب" value={user.goldBalance.toLocaleString()} accent="text-brand-gold" />
          <StatBox label="رصيد الدينار" value={user.dinarBalance.toLocaleString()} />
          <StatBox label="عدد الاستثمارات" value={stats.investmentCount.toLocaleString()} />
          <StatBox label="إجمالي المستثمر" value={stats.totalInvested.toLocaleString()} />
          <StatBox label="إجمالي الأرباح" value={stats.totalProfit.toLocaleString()} accent="text-green-600" />
          <StatBox label="المعاملات" value={stats.transactionCount.toLocaleString()} />
        </div>
      </Card>

      <UserDetailLists
        investments={investments}
        withdrawRequests={withdrawRequests}
        transactions={transactions}
      />
    </div>
  );
}
