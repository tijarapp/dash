const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Module } = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const filename = resolve(__dirname, '../src/lib/categoryProfit.ts');
const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = new Module(filename, module);
mod._compile(compiled, filename);
const { buildMonthlySchedule, clampProfitPercent, validateMonthlyTerms, validateProfitPercent, monthlyTermsFromPercent, percentFromTotal } = mod.exports;
const units = (value) => Math.round(value * 100);
// Various arbitrary amounts, durations and percentages; no fixed sector catalog.
for (const [capital, months, percent] of [[10000, 1, 50], [75000, 3, 40], [12345.67, 7, 17.5], [1100000, 12, 36.5], [3000000, 14, 50], [6000000, 18, 1], [25000, 6, 75], [100, 3, 100]]) {
  const { expectedTotalReturn: total } = monthlyTermsFromPercent(capital, months, percent);
  const rows = buildMonthlySchedule(capital, months, percent);
  assert.equal(rows.length, months);
  assert.equal(units(total), units(capital) + Math.round(units(capital) * percent / 100));
  assert.equal(rows.reduce((sum, row) => sum + units(row.principal), 0), units(capital));
  assert.equal(rows.reduce((sum, row) => sum + units(row.expectedProfit), 0), units(total) - units(capital));
  assert.equal(rows.reduce((sum, row) => sum + units(row.expectedPayment), 0), units(total));
  let remaining = units(capital);
  for (const row of rows) {
    remaining -= units(row.principal);
    assert.equal(units(row.remainingCapital), remaining);
    assert.equal(units(row.expectedPayment), units(row.principal) + units(row.expectedProfit));
    assert.ok(row.principal >= 0 && row.expectedProfit >= 0);
  }
  assert.equal(rows.at(-1).remainingCapital, 0);
}
// The owner's example: 10,000 for one month at 50% returns 15,000.
assert.deepEqual(monthlyTermsFromPercent(10000, 1, 50), { minInvestment: 10000, durationMonths: 1, profitPercent: 50, expectedTotalReturn: 15000 });
assert.deepEqual(buildMonthlySchedule(10000, 1, 50)[0], {
  month: 1, principal: 10000, expectedProfit: 5000, expectedPayment: 15000, remainingCapital: 0,
});
// The percentage covers the whole duration, not each month.
assert.equal(monthlyTermsFromPercent(10000, 3, 50).expectedTotalReturn, 15000);
assert.deepEqual(buildMonthlySchedule(10000, 3, 50).map((row) => row.expectedProfit), [1666.67, 1666.66, 1666.67]);
// 100% doubles the capital over the whole duration.
assert.equal(monthlyTermsFromPercent(10000, 1, 100).expectedTotalReturn, 20000);
assert.equal(buildMonthlySchedule(100, 3, 100).reduce((n, r) => n + r.expectedProfit, 0), 100);
for (const percent of [-0.5, 0, 0.5, 100.5, NaN, Infinity]) {
  assert.ok(validateProfitPercent(percent));
  assert.throws(() => monthlyTermsFromPercent(100, 3, percent));
  assert.throws(() => buildMonthlySchedule(100, 3, percent));
}
for (const percent of [1, 1.5, 25, 50, 50.5, 75, 100]) assert.equal(validateProfitPercent(percent), null);
for (const [capital, months] of [[0, 1], [100, 0], [100, 1.5], [100, 121], [NaN, 1], [1.001, 3], [1e20, 1]]) {
  assert.throws(() => monthlyTermsFromPercent(capital, months, 10));
  assert.throws(() => buildMonthlySchedule(capital, months, 10));
}
for (const args of [[0, 1, 1], [100, 0, 150], [100, 3, 99], [100, 3, 150.001]]) assert.ok(validateMonthlyTerms(...args));
// Categories saved before the slider open on the nearest allowed percentage.
assert.equal(percentFromTotal(100000, 120000), 20);
assert.equal(percentFromTotal(25000, 40000), 60);
assert.equal(percentFromTotal(10000, 30000), 100);
assert.equal(percentFromTotal(100, 99), 1);
assert.equal(percentFromTotal(0, undefined), 1);
// Stored percentages outside the range (older 0% categories) snap into 1–100.
for (const [raw, snapped] of [[0, 1], [37.3, 37.5], [250, 100], [NaN, 1]]) assert.equal(clampProfitPercent(raw), snapped);
console.log('Monthly investment checks passed: percentages, whole-duration totals, exact schedules, rounding and invalid inputs.');
