import Link from 'next/link';
import DashboardTables from '@/components/DashboardTables';
import OverviewDashboard from '@/components/OverviewDashboard';
import Icon from '@/components/ui/Icon';
import { getDashboardData } from '@/lib/data';
import { DEMO_MODE } from '@/lib/demo';
import { khairTransactionLabels, transactionAmount } from '@/lib/transactionDisplay';
import { withdrawMethodLabel } from '@/lib/withdraw';

export const dynamic = 'force-dynamic';

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat('ar', { month: 'short', day: 'numeric', timeZone: 'Asia/Gaza' });
const typeLabels: Record<string, string> = {
  charge: 'شحن رصيد', withdraw: 'سحب', profit: 'أرباح', invest: 'استثمار',
  monthly_payout: 'دفعة شهرية', ...khairTransactionLabels,
};
const statusLabels: Record<string, string> = {
  completed: 'مكتملة', pending: 'معلقة', approved: 'معتمدة', rejected: 'مرفوضة', failed: 'فشلت',
};

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const [data, params] = await Promise.all([getDashboardData(), searchParams]);
  const { stats, investors, users, investments, recentTransactions, pendingWithdrawals, categories, activity } = data;
  const userMap = Object.fromEntries([...investors, ...users].map((user) => [user.id, user.name || user.phone || 'مستخدم']));

  if (params.view === 'details') {
    const categoryTotals = new Map<string, { count: number; total: number }>();
    for (const investment of investments) {
      const summary = categoryTotals.get(investment.categoryId) ?? { count: 0, total: 0 };
      summary.count += 1;
      summary.total += investment.amount;
      categoryTotals.set(investment.categoryId, summary);
    }
    return <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">تفاصيل لوحة التحكم</h1><p className="mt-2 text-sm text-stone-500">المستثمرون والاستثمارات والمعاملات في عرض تفصيلي.</p></div>
        <Link href="/" className="overview-control"><Icon name="overview" size={16} /> العودة إلى النظرة العامة</Link>
      </div>
      <DashboardTables investors={investors} users={users} investments={investments}
        categories={categories.map((category) => ({ ...category, ...(categoryTotals.get(category.id) ?? { count: 0, total: 0 }) }))}
        recentTransactions={recentTransactions} pendingWithdrawals={pendingWithdrawals} userMap={userMap} />
    </div>;
  }

  const active = investments.filter((investment) => investment.status === 'active');
  return (
    <div className="overview-page space-y-6">
      <OverviewDashboard stats={stats} activity={activity} activeInvestments={active.length}
        completedInvestments={investments.filter((investment) => investment.status === 'completed').length}
        activeCapital={active.reduce((sum, investment) => sum + investment.amount, 0)}
        investmentProfits={investments.reduce((sum, investment) => sum + investment.totalProfit, 0)} demoMode={DEMO_MODE} />

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.6fr_1fr]" aria-label="آخر المعاملات وطلبات المراجعة">
        <div className="overview-panel min-w-0">
          <div className="overview-panel-heading">
            <h2>آخر المعاملات</h2>
            <Link href="/transactions" prefetch={false} className="overview-text-link">عرض الكل <Icon name="chevron-left" size={14} /></Link>
          </div>
          {recentTransactions.length ? <ul className="divide-y divide-[var(--dashboard-line)]">
            {recentTransactions.slice(0, 5).map((transaction) => {
              const amount = transactionAmount(transaction);
              return <li key={transaction.id}>
                <Link href={`/users/${encodeURIComponent(transaction.userId)}`} prefetch={false} className="overview-transaction">
                  <span className="overview-icon !h-9 !w-9"><Icon name={transaction.type === 'charge' ? 'wallet' : transaction.type === 'withdraw' ? 'withdraw' : 'transactions'} size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{userMap[transaction.userId] ?? 'مستخدم'}</span>
                    <span className="mt-1 block text-[11px] text-[var(--dashboard-muted)]">{typeLabels[transaction.type] ?? transaction.type}</span>
                  </span>
                  <span className="hidden text-xs text-[var(--dashboard-muted)] sm:block">{transaction.createdAt ? date.format(new Date(transaction.createdAt)) : '—'}</span>
                  <span className="min-w-[90px] text-end">
                    <span className={`block text-xs font-semibold tabular-nums ${amount >= 0 ? 'text-emerald-700' : 'text-stone-700'}`}><bdi>{amount > 0 ? '+' : ''}{number.format(amount)}</bdi> <span className="text-[10px] font-normal">{transaction.paymentMethod === 'points' ? 'نقطة خير' : 'دينار'}</span></span>
                    <span className={`mt-1 block text-[11px] ${transaction.status === 'pending' ? 'text-amber-700' : 'text-[var(--dashboard-muted)]'}`}>{statusLabels[transaction.status] ?? transaction.status}</span>
                  </span>
                </Link>
              </li>;
            })}
          </ul> : <div className="px-5 py-12 text-center text-sm text-[var(--dashboard-muted)]">ستظهر المعاملات الجديدة هنا.</div>}
        </div>
        <div className="overview-panel">
          <div className="overview-panel-heading">
            <h2 className="flex items-center gap-2">طلبات تحتاج مراجعة <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">{number.format(stats.pendingWithdrawals)}</span></h2>
            <Link href="/requests" prefetch={false} className="overview-text-link">عرض الكل <Icon name="chevron-left" size={14} /></Link>
          </div>
          {pendingWithdrawals.length ? <>
            <p className="px-5 pt-4 text-xs text-[var(--dashboard-muted)]">إجمالي السحب المعلق <bdi className="font-semibold text-stone-700">{number.format(stats.pendingWithdrawalAmount)}</bdi> دينار</p>
            <ul className="mt-2 divide-y divide-[var(--dashboard-line)]">
              {pendingWithdrawals.slice(0, 3).map((request) => <li key={request.id}>
                <Link href={`/requests/${encodeURIComponent(request.id)}/edit`} prefetch={false} className="overview-transaction">
                  <span className="overview-icon overview-icon-amber !h-9 !w-9"><Icon name="clock" size={16} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{userMap[request.userId] ?? 'مستخدم'}</span><span className="mt-1 block text-[11px] text-[var(--dashboard-muted)]">{withdrawMethodLabel(request.method)}</span></span>
                  <span className="text-xs font-semibold tabular-nums"><bdi>{number.format(request.amount)}</bdi> <span className="text-[10px] font-normal text-[var(--dashboard-muted)]">دينار</span></span>
                  <Icon name="chevron-left" size={14} className="text-stone-400" />
                </Link>
              </li>)}
            </ul>
          </> : <div className="flex flex-col items-center gap-3 px-5 py-12 text-center"><span className="rounded-full bg-emerald-50 p-3 text-emerald-700"><Icon name="check" size={22} /></span><p className="text-sm font-medium">لا توجد طلبات معلقة</p><p className="text-xs text-[var(--dashboard-muted)]">ستظهر طلبات السحب الجديدة هنا للمراجعة.</p></div>}
        </div>
      </section>
      <p className="pb-1 text-center text-[11px] text-[var(--dashboard-muted)]">ملخص الحسابات حتى آخر تحديث · فترة النشاط تشمل اليوم · التوقيت: فلسطين</p>
    </div>
  );
}
