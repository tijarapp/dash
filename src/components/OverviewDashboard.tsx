'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import OverviewChart from '@/components/OverviewChart';
import OverviewDateRange, { rangeLabel } from '@/components/OverviewDateRange';
import Icon, { type IconName } from '@/components/ui/Icon';
import type { DashboardData } from '@/lib/data';
import { getActivityPeriod, type DashboardActivity, type DashboardRange } from '@/lib/dashboardOverview';

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const format = (value: number) => number.format(value);


function MetricCard({ title, value, icon, href, unit, attention, children }: {
  title: string;
  value: number;
  icon: IconName;
  href: string;
  unit?: string;
  attention?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} prefetch={false} className="overview-metric group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-medium text-[var(--dashboard-muted)]">{title}</h2>
          <p className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-[28px] font-semibold leading-none tracking-tight tabular-nums sm:text-[30px]"><bdi>{format(value)}</bdi></span>
            {unit && <span className="text-xs text-[var(--dashboard-muted)]">{unit}</span>}
          </p>
        </div>
        <span className={`overview-icon ${attention ? 'overview-icon-amber' : ''}`}><Icon name={icon} size={18} /></span>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-x-7 gap-y-2 border-t border-[var(--dashboard-line)] pt-2.5">
        {children}
        <Icon name="chevron-left" size={14} className="ms-auto self-center text-stone-400 transition-colors group-hover:text-sky-700" />
      </div>
    </Link>
  );
}

function Detail({ label, value, tone }: { label: string; value: number | string; tone?: 'green' | 'amber' }) {
  return <div>
    <p className="text-[11px] text-[var(--dashboard-muted)]">{label}</p>
    <p className={`mt-1 text-xs font-semibold tabular-nums ${tone === 'green' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : ''}`}>
      <bdi>{typeof value === 'number' ? format(value) : value}</bdi>
    </p>
  </div>;
}

export default function OverviewDashboard({ stats, activity, activeInvestments, completedInvestments, activeCapital, investmentProfits, demoMode }: {
  stats: DashboardData['stats'];
  activity: DashboardActivity;
  activeInvestments: number;
  completedInvestments: number;
  activeCapital: number;
  investmentProfits: number;
  demoMode: boolean;
}) {
  const router = useRouter();
  const [period, setPeriod] = useState<DashboardRange>(30);
  const [refreshing, startRefresh] = useTransition();
  const { days, transactionsComplete } = getActivityPeriod(activity, period);
  const time = new Intl.DateTimeFormat('ar', { hour: '2-digit', minute: '2-digit', timeZone: activity.timeZone }).format(new Date(activity.generatedAt));
  const charts = [
    { title: 'الاستثمارات الجديدة', key: 'investments' as const },
    { title: 'المعاملات · جميع الحالات', key: 'transactions' as const, incomplete: !transactionsComplete },
    { title: 'رأس المال المستثمر', key: 'invested' as const, unit: 'ذهب' },
  ];
  const financials = [
    { title: 'شحن الأرصدة', key: 'topups' as const },
    { title: 'الأرباح الموزعة', key: 'profits' as const },
    { title: 'السحوبات المكتملة', key: 'withdrawals' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold tracking-tight text-[var(--dashboard-text)] sm:text-[32px]">نظرة عامة</h1>
            {demoMode && <span className="rounded-md bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800">بيانات تجريبية</span>}
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--dashboard-muted)]">ملخص المستثمرين والاستثمارات وحركة الأرصدة، في مكان واحد.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:pt-1">
          <Link href="/?view=details" prefetch={false} className="overview-control">
            <Icon name="overview" size={15} /> عرض التفاصيل <Icon name="arrow-up-right" size={13} />
          </Link>
          <OverviewDateRange value={period} onChange={setPeriod} min={activity.days[0].date} max={activity.days[activity.days.length - 1].date} />
          <button type="button" className="overview-control text-[var(--dashboard-muted)]" onClick={() => startRefresh(() => router.refresh())} disabled={refreshing} aria-label="تحديث بيانات لوحة التحكم">
            <Icon name="refresh" size={14} className={refreshing ? 'animate-spin' : ''} />
            <span aria-live="polite">{refreshing ? 'جارٍ التحديث…' : `تحديث ${time}`}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          </button>
        </div>
      </div>

      <section aria-label="ملخص الحسابات حتى آخر تحديث">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3 xl:grid-cols-3">
          <MetricCard title="المستثمرون" value={stats.investorsCount} icon="users" href="/users?tab=investors">
            <Detail label="استثمارات نشطة" value={activeInvestments} />
            <Detail label="رأس المال النشط · ذهب" value={activeCapital} />
          </MetricCard>
          <MetricCard title="إجمالي المستخدمين" value={stats.usersCount + stats.investorsCount} icon="users" href="/users">
            <Detail label="مستثمرون" value={stats.investorsCount} />
            <Detail label="بدون استثمار" value={stats.usersCount} />
          </MetricCard>
          <MetricCard title="الاستثمارات" value={stats.investmentsCount} icon="investment" href="/?view=details#investments">
            <Detail label="نشطة" value={activeInvestments} tone="green" />
            <Detail label="مكتملة" value={completedInvestments} />
          </MetricCard>
          <MetricCard title="إجمالي الاستثمار" value={stats.totalInvested} unit="ذهب" icon="coins" href="/?view=details#investments">
            <Detail label="متوسط الاستثمار" value={Math.round(stats.averageInvestment)} />
            <Detail label="عدد الاستثمارات" value={stats.investmentsCount} />
          </MetricCard>
          <MetricCard title="طلبات السحب المعلقة" value={stats.pendingWithdrawals} icon="withdraw" href="/requests" attention={stats.pendingWithdrawals > 0}>
            <Detail label="القيمة · دينار" value={stats.pendingWithdrawalAmount} />
            <Detail label="المتابعة" value={stats.pendingWithdrawals ? 'تحتاج مراجعة' : 'لا توجد طلبات معلقة'} tone={stats.pendingWithdrawals ? 'amber' : 'green'} />
          </MetricCard>
          <MetricCard title="فئات الاستثمار النشطة" value={stats.activeCategories} icon="categories" href="/categories">
            <Detail label="الإجمالي" value={stats.totalCategories} />
            <Detail label="متوقفة" value={stats.totalCategories - stats.activeCategories} />
          </MetricCard>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { title: 'إجمالي رصيد الذهب', value: stats.totalGoldBalance, unit: 'ذهب', icon: 'coins' as const, sub: 'أرصدة الحسابات الحالية' },
            { title: 'إجمالي رصيد الدينار', value: stats.totalDinarBalance, unit: 'دينار', icon: 'wallet' as const, sub: 'أرصدة الحسابات الحالية' },
            { title: 'أرباح الاستثمارات', value: investmentProfits, unit: 'ذهب', icon: 'trend-up' as const, sub: 'الأرباح المسجلة على الاستثمارات', green: true },
          ].map((metric) => <div key={metric.title} className="overview-compact">
            <div>
              <p className="text-xs text-[var(--dashboard-muted)]">{metric.title}</p>
              <p className={`mt-1 text-base font-semibold tabular-nums ${metric.green ? 'text-emerald-700' : ''}`}><bdi>{format(metric.value)}</bdi> <span className="text-[11px] font-normal text-[var(--dashboard-muted)]">{metric.unit}</span></p>
              <p className="mt-1 text-[11px] text-[var(--dashboard-muted)]">{metric.sub}</p>
            </div>
            <span className="overview-icon !h-8 !w-8"><Icon name={metric.icon} size={16} /></span>
          </div>)}
        </div>
      </section>

      {!transactionsComplete && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800" role="note">
        إحصاءات المعاملات والمبالغ الموزعة مبنية على أحدث {format(activity.transactionSample.count)} معاملة، وقد لا تغطي الفترة كاملة. إحصاءات الاستثمارات تشمل جميع السجلات.
      </p>}

      <section aria-labelledby="activity-heading">
        <div className="overview-section-heading">
          <h2 id="activity-heading">النشاط <span>· {rangeLabel(period)}</span></h2>
          <span>حركة يومية</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {charts.map((chart) => <OverviewChart key={`${JSON.stringify(period)}-${chart.key}`} title={chart.title} unit={chart.unit} incomplete={chart.incomplete} points={days.map((day) => ({ date: day.date, value: day[chart.key] }))} />)}
        </div>
      </section>

      <section aria-labelledby="financial-heading">
        <div className="overview-section-heading">
          <h2 id="financial-heading">حركة الأرصدة <span>· {rangeLabel(period)} · ذهب</span></h2>
          <span>المعاملات المكتملة فقط</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {financials.map((chart) => <OverviewChart key={`${JSON.stringify(period)}-${chart.key}`} title={chart.title} unit="ذهب" incomplete={!transactionsComplete} points={days.map((day) => ({ date: day.date, value: day[chart.key] }))} />)}
        </div>
      </section>
    </div>
  );
}
