import NavAnchor from '@/components/NavAnchor';
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
    <div className={`rounded-2xl bg-white p-5 shadow-sm ${accentClass}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar');
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar');
}

const typeLabels: Record<string, string> = {
  charge: 'شحن',
  withdraw: 'سحب',
  profit: 'ربح',
  invest: 'استثمار',
};

const statusLabels: Record<string, string> = {
  active: 'نشط',
  completed: 'مكتمل',
  pending: 'معلق',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

function SectionTitle({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-bold">{title}</h2>
      {href && linkLabel && (
        <NavAnchor href={href} className="text-sm text-brand-blue hover:underline">
          {linkLabel}
        </NavAnchor>
      )}
    </div>
  );
}

export default async function OverviewPage() {
  const data = await getDashboardData();
  const { stats, investors, users, investments, recentTransactions, pendingWithdrawals, categories } =
    data;

  const allUsers = [...investors, ...users];
  const userMap = new Map(allUsers.map((u) => [u.id, u.name]));
  const activeInvestments = investments.filter((i) => i.status === 'active');
  const investmentsByCategory = categories.map((cat) => ({
    ...cat,
    count: investments.filter((i) => i.categoryId === cat.id).length,
    total: investments
      .filter((i) => i.categoryId === cat.id)
      .reduce((sum, i) => sum + i.amount, 0),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-gray-500">
          نظرة شاملة على المستثمرين والاستثمارات والمعاملات
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Investors Table */}
      <section>
        <SectionTitle title="المستثمرون" href="/investors" linkLabel="عرض الكل ←" />
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[800px] text-right text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3">المستثمر</th>
                <th className="p-3">الهاتف</th>
                <th className="p-3">رصيد الذهب</th>
                <th className="p-3">رصيد الدينار</th>
                <th className="p-3">عدد الاستثمارات</th>
                <th className="p-3">إجمالي المستثمر</th>
                <th className="p-3">إجمالي الأرباح</th>
                <th className="p-3">كود الإحالة</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((inv) => (
                <tr key={inv.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{inv.name || '—'}</td>
                  <td className="p-3">{inv.phone || '—'}</td>
                  <td className="p-3 text-brand-gold font-medium">
                    {inv.goldBalance.toLocaleString()}
                  </td>
                  <td className="p-3">{inv.dinarBalance.toLocaleString()}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-brand-blue">
                      {inv.investmentCount}
                    </span>
                  </td>
                  <td className="p-3 font-medium">
                    {inv.totalInvested > 0 ? inv.totalInvested.toLocaleString() : '—'}
                  </td>
                  <td className="p-3 text-green-600">
                    {inv.totalProfit > 0 ? `+${inv.totalProfit.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-3 font-mono text-xs">{inv.referralCode || '—'}</td>
                </tr>
              ))}
              {investors.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400">
                    لا يوجد مستثمرون
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Regular Users Table */}
      <section>
        <SectionTitle title="المستخدمون" href="/users" linkLabel="عرض الكل ←" />
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[600px] text-right text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3">الاسم</th>
                <th className="p-3">الهاتف</th>
                <th className="p-3">رصيد الذهب</th>
                <th className="p-3">رصيد الدينار</th>
                <th className="p-3">كود الإحالة</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{u.name || '—'}</td>
                  <td className="p-3">{u.phone || '—'}</td>
                  <td className="p-3">{u.goldBalance.toLocaleString()}</td>
                  <td className="p-3">{u.dinarBalance.toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs">{u.referralCode || '—'}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400">
                    لا يوجد مستخدمون
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* All Investments */}
      <section>
        <SectionTitle title="جميع الاستثمارات" />
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3">المستثمر</th>
                <th className="p-3">فئة الاستثمار</th>
                <th className="p-3">المبلغ (ذهب)</th>
                <th className="p-3">الأرباح المحققة</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">تاريخ البدء</th>
                <th className="p-3">تاريخ الانتهاء</th>
                <th className="p-3">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => (
                <tr key={inv.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    {userMap.get(inv.userId) ?? inv.userId}
                  </td>
                  <td className="p-3">{inv.categoryTitle}</td>
                  <td className="p-3 font-medium text-brand-gold">
                    {inv.amount.toLocaleString()}
                  </td>
                  <td className="p-3 text-green-600">
                    {inv.totalProfit > 0 ? `+${inv.totalProfit.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="p-3">{formatDate(inv.startDate)}</td>
                  <td className="p-3">{formatDate(inv.endDate)}</td>
                  <td className="p-3">{formatDate(inv.createdAt)}</td>
                </tr>
              ))}
              {investments.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400">
                    لا توجد استثمارات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Categories + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Investment Categories */}
        <section>
          <SectionTitle title="فئات الاستثمار" href="/categories" linkLabel="إدارة الفئات ←" />
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3">الفئة</th>
                  <th className="p-3">الربح اليومي</th>
                  <th className="p-3">الاستثمارات</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {investmentsByCategory.map((cat) => (
                  <tr key={cat.id} className="border-t">
                    <td className="p-3 font-medium">{cat.title}</td>
                    <td className="p-3">{cat.dailyProfitRate}%</td>
                    <td className="p-3">{cat.count}</td>
                    <td className="p-3">{cat.total > 0 ? cat.total.toLocaleString() : '—'}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          cat.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {cat.isActive ? 'نشطة' : 'متوقفة'}
                      </span>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      لا توجد فئات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Transactions */}
        <section>
          <SectionTitle title="آخر المعاملات" href="/transactions" linkLabel="عرض الكل ←" />
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3">المستخدم</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-3">{userMap.get(t.userId) ?? t.userId}</td>
                    <td className="p-3">{typeLabels[t.type] ?? t.type}</td>
                    <td
                      className={`p-3 font-medium ${t.dinarAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {t.dinarAmount >= 0 ? '+' : ''}
                      {t.dinarAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {formatDateTime(t.createdAt)}
                    </td>
                  </tr>
                ))}
                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-400">
                      لا توجد معاملات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Pending Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <section>
          <SectionTitle
            title="طلبات سحب معلقة"
            href="/requests"
            linkLabel="إدارة الطلبات ←"
          />
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3">المستثمر</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">صاحب البطاقة</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {pendingWithdrawals.map((w) => (
                  <tr key={w.id} className="border-t">
                    <td className="p-3 font-medium">
                      {userMap.get(w.userId) ?? w.userId}
                    </td>
                    <td className="p-3 font-medium text-red-600">
                      {w.amount.toLocaleString()}
                    </td>
                    <td className="p-3">{w.cardHolder}</td>
                    <td className="p-3">{formatDate(w.createdAt)}</td>
                    <td className="p-3">
                      <StatusBadge status={w.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
