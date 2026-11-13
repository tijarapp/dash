const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Module } = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');

const filename = resolve(__dirname, '../src/lib/dashboardOverview.ts');
const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = new Module(filename, module);
mod._compile(compiled, filename);
const { buildDashboardActivity, getActivityPeriod } = mod.exports;

const now = new Date('2026-11-13T12:00:00Z');
const transaction = (overrides = {}) => ({
  id: 'transaction', userId: 'user', type: 'charge', status: 'completed',
  goldAmount: 10, dinarAmount: 1000, createdAt: '2026-11-13T10:00:00Z',
  note: null, ...overrides,
});
const investment = (overrides = {}) => ({
  id: 'investment', userId: 'user', categoryId: 'category', categoryTitle: 'Category',
  amount: 100, totalProfit: 0, status: 'active',
  createdAt: '2026-11-13T10:00:00Z', startDate: null, endDate: null,
  ...overrides,
});

// Real financial activity must never mix dinars/points, failed payments or principal with profit.
const activity = buildDashboardActivity([
  investment(),
  investment({ createdAt: null, startDate: '2026-11-12T22:30:00Z', amount: 50 }),
], [
  transaction(),
  transaction({ status: 'pending', goldAmount: 900 }),
  transaction({ status: 'rejected', goldAmount: 900 }),
  transaction({ paymentMethod: 'points', amount: 400, goldAmount: 900 }),
  transaction({ type: 'profit', goldAmount: 20 }),
  transaction({ type: 'monthly_payout', goldAmount: 110, profitAmount: 10 }),
  transaction({ type: 'monthly_payout', goldAmount: 100 }),
  transaction({ type: 'withdraw', goldAmount: -30 }),
  transaction({ type: 'withdraw', goldAmount: 5 }),
], now);
assert.deepEqual(getActivityPeriod(activity, 7).totals, {
  investments: 2, invested: 150, transactions: 9, profits: 30, topups: 10, withdrawals: 35,
});
assert.equal(activity.days.at(-1).date, '2026-11-13');
assert.equal(activity.days.at(-1).investments, 2, 'UTC evening belongs to next Gaza date');
assert.equal(activity.timeZone, 'Asia/Gaza');
assert.equal(activity.generatedAt, now.toISOString());

// Empty series keep exactly 90 calendar days, including across the local daylight-saving change.
const empty = buildDashboardActivity([], [], now);
assert.equal(empty.days.length, 90);
assert.equal(new Set(empty.days.map((day) => day.date)).size, 90);
assert.equal(empty.days[0].date, '2026-08-16');
assert.ok(empty.days.every((day) => Object.entries(day).every(([key, value]) => key === 'date' || value === 0)));
for (const period of [7, 30, 90]) {
  assert.equal(getActivityPeriod(empty, period).days.length, period);
  assert.equal(getActivityPeriod(empty, period).transactionsComplete, true);
}
const localMidnight = buildDashboardActivity([], [], new Date('2026-11-12T22:30:00Z'));
assert.equal(localMidnight.days.at(-1).date, '2026-11-13');

// Invalid, missing, future and out-of-window timestamps must not create phantom activity.
const badDates = [null, 'not-a-date', '2026-11-14T10:00:00Z', '2026-08-15T10:00:00Z'];
const excluded = buildDashboardActivity(
  badDates.map((createdAt) => investment({ createdAt })),
  badDates.map((createdAt) => transaction({ createdAt })), now,
);
assert.equal(getActivityPeriod(excluded, 90).totals.investments, 0);
assert.equal(getActivityPeriod(excluded, 90).totals.transactions, 0);

// Non-finite and negative credits should not pollute the totals; transaction counts remain factual.
const invalidAmounts = buildDashboardActivity(
  [investment({ amount: NaN }), investment({ amount: -10 })],
  [transaction({ goldAmount: Infinity }), transaction({ goldAmount: -10 }),
    transaction({ type: 'monthly_payout', profitAmount: NaN })], now,
);
assert.deepEqual(getActivityPeriod(invalidAmounts, 30).totals, {
  investments: 2, invested: 0, transactions: 3, profits: 0, topups: 0, withdrawals: 0,
});

// A capped sample cannot claim the earliest sampled day is complete, even if its date is in range.
const cappedOnFirstDay = buildDashboardActivity([], [
  transaction({ createdAt: '2026-11-07T10:00:00Z' }), transaction(),
], now, 2);
assert.equal(getActivityPeriod(cappedOnFirstDay, 7).transactionsComplete, false);
const cappedBeforeFirstDay = buildDashboardActivity([], [
  transaction({ createdAt: '2026-11-06T10:00:00Z' }), transaction(),
], now, 2);
assert.equal(getActivityPeriod(cappedBeforeFirstDay, 7).transactionsComplete, true);
assert.equal(getActivityPeriod(cappedBeforeFirstDay, 30).transactionsComplete, false);
const uncapped = buildDashboardActivity([], [transaction()], now, 2);
assert.equal(getActivityPeriod(uncapped, 90).transactionsComplete, true);
const noValidDate = buildDashboardActivity([], [transaction({ createdAt: null })], now, 1);
assert.equal(getActivityPeriod(noValidDate, 7).transactionsComplete, false);

// Date selection changes totals, retaining only rows in the selected calendar window.
const periods = buildDashboardActivity([
  investment({ createdAt: '2026-11-13T10:00:00Z', amount: 10 }),
  investment({ createdAt: '2026-10-20T10:00:00Z', amount: 20 }),
  investment({ createdAt: '2026-09-01T10:00:00Z', amount: 30 }),
], [], now);
assert.equal(getActivityPeriod(periods, 7).totals.invested, 10);
assert.equal(getActivityPeriod(periods, 30).totals.invested, 30);
assert.equal(getActivityPeriod(periods, 90).totals.invested, 60);

assert.equal(getActivityPeriod(periods, 1).days.length, 1);
assert.equal(getActivityPeriod(periods, 1).totals.invested, 10);
assert.equal(getActivityPeriod(periods, 14).days.length, 14);
const custom = getActivityPeriod(periods, { start: '2026-10-20', end: '2026-10-20' });
assert.equal(custom.days.length, 1);
assert.equal(custom.totals.invested, 20);
assert.equal(getActivityPeriod(periods, { start: '2026-09-01', end: '2026-10-20' }).totals.invested, 50);
assert.equal(getActivityPeriod(cappedOnFirstDay, { start: '2026-11-07', end: '2026-11-13' }).transactionsComplete, false);
assert.equal(getActivityPeriod(cappedBeforeFirstDay, { start: '2026-11-07', end: '2026-11-13' }).transactionsComplete, true);

console.log('Dashboard overview checks passed: gold-only totals, completed payments, local calendar windows, invalid records and capped history coverage.');
