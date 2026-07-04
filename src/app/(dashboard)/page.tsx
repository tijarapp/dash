import DashboardTables from '@/components/DashboardTables';
import { getDashboardData } from '@/lib/data';

export const dynamic = 'force-dynamic';

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'gold' | 'blue' | 'green' | 'red';
}) {
  const accentClass =
    accent === 'gold'
      ? 'border-r-4 border-brand-gold'
      : accent === 'green'
        ? 'border-r-4 border-green-500'
        : accent === 'red'
          ? 'border-r-4 border-red-400'
          : accent === 'blue'
            ? 'border-r-4 border-brand-blue'
            : '';

  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm sm:p-5 ${accentClass}`}>
      <p className="text-xs text-gray-500 sm:text-sm">{label}</p>
      <p className="mt-1 text-xl font-bold sm:text-2xl">{value}</p>
      {sub ? <p className="mt-1 text-xs text-gray-400">{sub}</p> : null}
    </div>
  );
}

export default async function OverviewPage() {
  const data = await getDashboardData();
  const { stats, investors, users, investments, recentTransactions, pendingWithdrawals, categories } =
    data;

  const allUsers = [...investors, ...users];
  const userMap = Object.fromEntries(allUsers.map((u) => [u.id, u.name]));
  const activeInvestments = investments.filter((i) => i.status === 'active');
  const investmentsByCategory = categories.map((cat) => ({
    ...cat,
    count: investments.filter((i) => i.categoryId === cat.id).length,
    total: investments
      .filter((i) => i.categoryId === cat.id)
      .reduce((sum, i) => sum + i.amount, 0),
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-gray-500">
          نظرة شاملة على المستثمرين والاستثمارات والمعاملات
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="عدد المستثمرين"
          value={stats.investorsCount.toLocaleString()}
          sub={`${activeInvestments.length} استثمار نشط`}
          accent="gold"
        />
        <StatCard
          label="عدد المستخدمين"
          value={stats.usersCount.toLocaleString()}
          sub="مستخدمون بدون استثمارات"
          accent="blue"
        />
        <StatCard
          label="عدد الاستثمارات"
          value={stats.investmentsCount.toLocaleString()}
          sub={`${activeInvestments.length} استثمار نشط`}
          accent="gold"
        />
        <StatCard
          label="إجمالي المستثمر (ذهب)"
          value={stats.totalInvested.toLocaleString()}
          sub={`متوسط ${Math.round(stats.averageInvestment).toLocaleString()} لكل استثمار`}
          accent="gold"
        />
        <StatCard
          label="طلبات سحب معلقة"
          value={stats.pendingWithdrawals.toLocaleString()}
          sub={stats.pendingWithdrawals > 0 ? 'تحتاج مراجعة' : 'لا توجد طلبات'}
          accent={stats.pendingWithdrawals > 0 ? 'red' : undefined}
        />
        <StatCard
          label="إجمالي رصيد الذهب"
          value={stats.totalGoldBalance.toLocaleString()}
          sub="مجموع أرصدة المستثمرين"
          accent="gold"
        />
        <StatCard
          label="إجمالي رصيد الدينار"
          value={stats.totalDinarBalance.toLocaleString()}
          sub="مجموع أرصدة المستثمرين"
        />
        <StatCard
          label="الأرباح الموزعة"
          value={stats.totalProfitsDistributed.toLocaleString()}
          sub="إجمالي أرباح المعاملات"
          accent="green"
        />
        <StatCard
          label="فئات الاستثمار"
          value={`${stats.activeCategories} / ${stats.totalCategories}`}
          sub="نشطة / إجمالي"
        />
      </div>

      <DashboardTables
        investors={investors}
        users={users}
        investments={investments}
        categories={investmentsByCategory}
        recentTransactions={recentTransactions}
        pendingWithdrawals={pendingWithdrawals}
        userMap={userMap}
      />
    </div>
  );
}
