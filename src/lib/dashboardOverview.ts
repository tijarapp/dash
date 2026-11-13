import type { InvestmentRow, TransactionRow } from './data';

export const DASHBOARD_TIME_ZONE = 'Asia/Gaza';
export const DASHBOARD_TRANSACTION_LIMIT = 200;

export interface DashboardActivityDay {
  date: string;
  investments: number;
  invested: number;
  transactions: number;
  profits: number;
  topups: number;
  withdrawals: number;
}

export interface DashboardActivity {
  days: DashboardActivityDay[];
  timeZone: typeof DASHBOARD_TIME_ZONE;
  generatedAt: string;
  transactionSample: {
    count: number;
    limitReached: boolean;
    oldestCreatedAt: string | null;
  };
}

export type DashboardPeriod = 1 | 7 | 14 | 30 | 90;
export type DashboardRange = DashboardPeriod | { start: string; end: string };
export type DashboardActivityTotals = Omit<DashboardActivityDay, 'date'>;

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: DASHBOARD_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function dateKey(date: Date): string {
  return dateFormatter.format(date);
}

function emptyTotals(): DashboardActivityTotals {
  return { investments: 0, invested: 0, transactions: 0, profits: 0, topups: 0, withdrawals: 0 };
}

function positiveAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

/** Aggregate on the server so the browser receives only 90 compact daily rows. */
export function buildDashboardActivity(
  investments: InvestmentRow[],
  transactions: TransactionRow[],
  now = new Date(),
  transactionLimit = DASHBOARD_TRANSACTION_LIMIT,
): DashboardActivity {
  const today = new Date(`${dateKey(now)}T12:00:00Z`);
  const days = Array.from({ length: 90 }, (_, index) => {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - (89 - index));
    return { date: day.toISOString().slice(0, 10), ...emptyTotals() };
  });
  const byDate = new Map(days.map((day) => [day.date, day]));

  function dayFor(value: string | null): DashboardActivityDay | undefined {
    if (!value) return undefined;
    const timestamp = new Date(value);
    if (!Number.isFinite(timestamp.getTime()) || timestamp > now) return undefined;
    return byDate.get(dateKey(timestamp));
  }

  for (const investment of investments) {
    const day = dayFor(investment.createdAt ?? investment.startDate);
    if (!day) continue;
    day.investments += 1;
    day.invested += positiveAmount(investment.amount);
  }

  let oldestCreatedAt: string | null = null;
  for (const transaction of transactions) {
    if (transaction.createdAt && Number.isFinite(Date.parse(transaction.createdAt))) {
      if (!oldestCreatedAt || Date.parse(transaction.createdAt) < Date.parse(oldestCreatedAt)) {
        oldestCreatedAt = transaction.createdAt;
      }
    }
    const day = dayFor(transaction.createdAt);
    if (!day) continue;
    day.transactions += 1;
    // Counts include all statuses; money represents completed gold transactions only.
    if (transaction.status !== 'completed' || transaction.paymentMethod === 'points') continue;
    if (transaction.type === 'profit') day.profits += positiveAmount(transaction.goldAmount);
    if (transaction.type === 'monthly_payout') {
      day.profits += positiveAmount(transaction.profitAmount ?? 0);
    }
    if (transaction.type === 'charge') day.topups += positiveAmount(transaction.goldAmount);
    if (transaction.type === 'withdraw') {
      day.withdrawals += positiveAmount(Math.abs(transaction.goldAmount));
    }
  }

  return {
    days,
    timeZone: DASHBOARD_TIME_ZONE,
    generatedAt: now.toISOString(),
    transactionSample: {
      count: transactions.length,
      limitReached: transactions.length >= transactionLimit,
      oldestCreatedAt,
    },
  };
}

export function getActivityPeriod(activity: DashboardActivity, period: DashboardRange) {
  const days = typeof period === 'number'
    ? activity.days.slice(-period)
    : activity.days.filter((day) => day.date >= period.start && day.date <= period.end);
  const totals = days.reduce((result, day) => ({
    investments: result.investments + day.investments,
    invested: result.invested + day.invested,
    transactions: result.transactions + day.transactions,
    profits: result.profits + day.profits,
    topups: result.topups + day.topups,
    withdrawals: result.withdrawals + day.withdrawals,
  }), emptyTotals());
  const oldest = activity.transactionSample.oldestCreatedAt;
  // The oldest sampled day may itself be partial, so require an earlier calendar day.
  const transactionsComplete = !activity.transactionSample.limitReached || Boolean(
    oldest && days.length && dateKey(new Date(oldest)) < days[0].date,
  );

  return { days, totals, transactionsComplete };
}
