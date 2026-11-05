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
const { buildMonthlySchedule, validateMonthlyTerms, monthlyTermsFromProfit, monthlyProfitRate } = mod.exports;
const units = (value) => Math.round(value * 100);
// Various arbitrary amounts and durations; no fixed sector catalog.
for (const [capital, months, total] of [[25000, 1, 40000], [75000, 3, 100000], [12345.67, 7, 14445.68], [1100000, 12, 1500000], [3000000, 14, 4500000], [6000000, 18, 9000000]]) {
  const rows = buildMonthlySchedule(capital, months, total);
  assert.equal(rows.length, months);
  assert.equal(rows.reduce((sum, row) => sum + units(row.principal), 0), units(capital));
  assert.equal(rows.reduce((sum, row) => sum + units(row.expectedProfit), 0), units(total - capital));
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
const split = buildMonthlySchedule(75000, 3, 100000);
assert.equal(split[0].expectedPayment, 33333.33);
assert.equal(split[2].expectedPayment, 33333.34);
assert.deepEqual(buildMonthlySchedule(25000, 1, 40000)[0], {
  month: 1, principal: 25000, expectedProfit: 15000, expectedPayment: 40000, remainingCapital: 0,
});
assert.equal(monthlyProfitRate(25000, 1, 40000), 60);
assert.equal(buildMonthlySchedule(100, 3, 100).reduce((n, r) => n + r.expectedProfit, 0), 0);
for (const args of [[0, 1, 1], [100, 0, 150], [100, 1.5, 150], [100, 121, 150], [100, 3, 99], [NaN, 1, 150], [100, 3, Infinity], [1.001, 3, 2], [100, 3, 150.001], [1e20, 1, 1e21]]) {
  assert.ok(validateMonthlyTerms(...args));
  assert.throws(() => buildMonthlySchedule(...args));
}
assert.deepEqual(monthlyTermsFromProfit(100000, 4, 20000), { minInvestment: 100000, durationMonths: 4, expectedTotalReturn: 120000 });
assert.equal(monthlyTermsFromProfit(0.1, 7, 0.2).expectedTotalReturn, 0.3);
assert.equal(monthlyTermsFromProfit(12345.67, 7, 2100.01).expectedTotalReturn, 14445.68);
assert.equal(monthlyTermsFromProfit(100, 2, 0).expectedTotalReturn, 100);
for (const profit of [-1, NaN, Infinity, 0.001]) assert.throws(() => monthlyTermsFromProfit(100, 3, profit));
console.log('Monthly investment checks passed: custom amounts/terms/profits, exact totals, remaining capital, rounding and invalid inputs.');
