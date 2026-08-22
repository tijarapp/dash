'use client';

import NavAnchor from '@/components/NavAnchor';
import type {
  CategoryRow,
  InvestmentRow,
  InvestorSummary,
  TransactionRow,
  UserRow,
  WithdrawRow,
} from '@/lib/data';
import { withdrawAccountLabel, withdrawMethodLabel } from '@/lib/withdraw';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';

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

function SectionTitle({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-bold sm:text-lg">{title}</h2>
      {href && linkLabel ? (
        <NavAnchor href={href} className="text-sm text-brand-blue hover:underline">
          {linkLabel}
        </NavAnchor>
      ) : null}
    </div>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">{children}</div>
    </div>
  );
}

export default function DashboardTables({
  investors,
  users,
  investments,
  categories,
  recentTransactions,
  pendingWithdrawals,
  userMap,
}: {
  investors: InvestorSummary[];
  users: UserRow[];
  investments: InvestmentRow[];
  categories: Array<CategoryRow & { count: number; total: number }>;
  recentTransactions: TransactionRow[];
  pendingWithdrawals: WithdrawRow[];
  userMap: Record<string, string>;
}) {
  const investorsPage = usePagination(investors, 5);
  const usersPage = usePagination(users, 5);
  const investmentsPage = usePagination(investments, 8);
  const categoriesPage = usePagination(categories, 5);
  const transactionsPage = usePagination(recentTransactions, 5);
  const withdrawalsPage = usePagination(pendingWithdrawals, 5);

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle title="المستثمرون" href="/users?tab=investors" linkLabel="عرض الكل ←" />
        <div className="space-y-3 md:hidden">
          {investorsPage.pageItems.map((inv) => (
            <NavAnchor key={inv.id} href={`/users/${inv.id}`} className="block">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-semibold text-gray-900">{inv.name || '—'}</p>
                <p className="text-sm text-gray-500">{inv.phone || '—'}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-gray-400">استثمارات</p>
                    <p className="font-semibold text-brand-blue">{inv.investmentCount}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-gray-400">مستثمر</p>
                    <p className="font-semibold text-brand-gold">
                      {inv.totalInvested.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </NavAnchor>
          ))}
          {investors.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-gray-400 shadow-sm">
              لا يوجد مستثمرون
            </p>
          ) : null}
        </div>
        <div className="hidden md:block">
          <TableShell>
            <table className="w-full min-w-[720px] text-right text-sm">
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
                {investorsPage.pageItems.map((inv) => (
                  <tr key={inv.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{inv.name || '—'}</td>
                    <td className="p-3">{inv.phone || '—'}</td>
                    <td className="p-3 font-medium text-brand-gold">
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
                {investors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-400">
                      لا يوجد مستثمرون
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableShell>
        </div>
        <div className="mt-3">
          <Pagination
            page={investorsPage.page}
            totalPages={investorsPage.totalPages}
            totalItems={investorsPage.totalItems}
            from={investorsPage.from}
            to={investorsPage.to}
            onPageChange={investorsPage.setPage}
          />
        </div>
      </section>

      <section>
        <SectionTitle title="المستخدمون" href="/users" linkLabel="عرض الكل ←" />
        <div className="space-y-3 md:hidden">
          {usersPage.pageItems.map((u) => (
            <NavAnchor key={u.id} href={`/users/${u.id}`} className="block">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-semibold text-gray-900">{u.name || '—'}</p>
                <p className="text-sm text-gray-500">{u.phone || '—'}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>
                    ذهب:{' '}
                    <span className="font-semibold text-brand-gold">
                      {u.goldBalance.toLocaleString()}
                    </span>
                  </span>
                  <span>
                    دينار:{' '}
                    <span className="font-semibold">{u.dinarBalance.toLocaleString()}</span>
                  </span>
                </div>
              </div>
            </NavAnchor>
          ))}
          {users.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-gray-400 shadow-sm">
              لا يوجد مستخدمون
            </p>
          ) : null}
        </div>
        <div className="hidden md:block">
          <TableShell>
            <table className="w-full min-w-[520px] text-right text-sm">
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
                {usersPage.pageItems.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{u.name || '—'}</td>
                    <td className="p-3">{u.phone || '—'}</td>
                    <td className="p-3">{u.goldBalance.toLocaleString()}</td>
                    <td className="p-3">{u.dinarBalance.toLocaleString()}</td>
                    <td className="p-3 font-mono text-xs">{u.referralCode || '—'}</td>
                  </tr>
                ))}
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      لا يوجد مستخدمون
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableShell>
        </div>
        <div className="mt-3">
          <Pagination
            page={usersPage.page}
            totalPages={usersPage.totalPages}
            totalItems={usersPage.totalItems}
            from={usersPage.from}
            to={usersPage.to}
            onPageChange={usersPage.setPage}
          />
        </div>
      </section>

      <section>
        <SectionTitle title="جميع الاستثمارات" />
        <div className="space-y-3 md:hidden">
          {investmentsPage.pageItems.map((inv) => (
            <div key={inv.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {userMap[inv.userId] ?? inv.userId}
                  </p>
                  <p className="text-sm text-gray-500">{inv.categoryTitle}</p>
                </div>
                <StatusBadge status={inv.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <span className="font-semibold text-brand-gold">
                  {inv.amount.toLocaleString()} ذهب
                </span>
                <span className="text-green-600">
                  {inv.totalProfit > 0 ? `+${inv.totalProfit.toLocaleString()}` : '—'}
                </span>
              </div>
            </div>
          ))}
          {investments.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-gray-400 shadow-sm">
              لا توجد استثمارات
            </p>
          ) : null}
        </div>
        <div className="hidden md:block">
          <TableShell>
            <table className="w-full min-w-[800px] text-right text-sm">
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
                {investmentsPage.pageItems.map((inv) => (
                  <tr key={inv.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">
                      {userMap[inv.userId] ?? inv.userId}
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
                {investments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-400">
                      لا توجد استثمارات
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableShell>
        </div>
        <div className="mt-3">
          <Pagination
            page={investmentsPage.page}
            totalPages={investmentsPage.totalPages}
            totalItems={investmentsPage.totalItems}
            from={investmentsPage.from}
            to={investmentsPage.to}
            onPageChange={investmentsPage.setPage}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="فئات الاستثمار" href="/categories" linkLabel="إدارة الفئات ←" />
          <TableShell>
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
                {categoriesPage.pageItems.map((cat) => (
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
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      لا توجد فئات
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableShell>
          <div className="mt-3">
            <Pagination
              page={categoriesPage.page}
              totalPages={categoriesPage.totalPages}
              totalItems={categoriesPage.totalItems}
              from={categoriesPage.from}
              to={categoriesPage.to}
              onPageChange={categoriesPage.setPage}
            />
          </div>
        </section>

        <section>
          <SectionTitle title="آخر المعاملات" href="/transactions" linkLabel="عرض الكل ←" />
          <TableShell>
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
                {transactionsPage.pageItems.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-3">{userMap[t.userId] ?? t.userId}</td>
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
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-400">
                      لا توجد معاملات
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableShell>
          <div className="mt-3">
            <Pagination
              page={transactionsPage.page}
              totalPages={transactionsPage.totalPages}
              totalItems={transactionsPage.totalItems}
              from={transactionsPage.from}
              to={transactionsPage.to}
              onPageChange={transactionsPage.setPage}
            />
          </div>
        </section>
      </div>

      {pendingWithdrawals.length > 0 ? (
        <section>
          <SectionTitle title="طلبات سحب معلقة" href="/requests" linkLabel="إدارة الطلبات ←" />
          <TableShell>
            <table className="w-full min-w-[480px] text-right text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3">المستثمر</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">الطريقة</th>
                  <th className="p-3">المستلم</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalsPage.pageItems.map((w) => (
                  <tr key={w.id} className="border-t">
                    <td className="p-3 font-medium">{userMap[w.userId] ?? w.userId}</td>
                    <td className="p-3 font-medium text-red-600">
                      {w.amount.toLocaleString()}
                    </td>
                    <td className="p-3">{withdrawMethodLabel(w.method)}</td>
                    <td className="p-3">{withdrawAccountLabel(w)}</td>
                    <td className="p-3">{formatDate(w.createdAt)}</td>
                    <td className="p-3">
                      <StatusBadge status={w.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
          <div className="mt-3">
            <Pagination
              page={withdrawalsPage.page}
              totalPages={withdrawalsPage.totalPages}
              totalItems={withdrawalsPage.totalItems}
              from={withdrawalsPage.from}
              to={withdrawalsPage.to}
              onPageChange={withdrawalsPage.setPage}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
