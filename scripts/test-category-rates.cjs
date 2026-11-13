// Category rate-history checks. Must only run against an explicitly selected demo emulator.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Module } = require('node:module');
const ts = require('typescript');
const admin = require('firebase-admin');
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.GCLOUD_PROJECT?.startsWith('demo-')) throw Error('Demo Firestore emulator required');
admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT });
const db = admin.firestore();
let authorized = true;
function load(filename, mocks) {
  const mod = new Module(filename, module);
  mod.paths = module.paths;
  mod.require = (name) => name in mocks ? mocks[name] : require(name);
  mod._compile(ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
  return mod.exports;
}
const financial = load(resolve(__dirname, '../src/lib/categoryProfit.ts'), {});
const actions = load(resolve(__dirname, '../src/lib/actions.ts'), {
  './firebaseAdmin': { adminDb: db }, './demo': { DEMO_MODE: false },
  './session': { requireAdmin: async () => { if (!authorized) throw Error('Unauthorized'); return { uid: 'admin' }; } },
  'next/cache': { revalidatePath() {} }, 'next/navigation': { redirect() {} },
  './categoryProfit': financial, './withdraw': {}, './chargeReasons': {},
});
function form(fields) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, String(value));
  return data;
}
const base = { title: 'rates', description: '', imageUrl: '', minInvestment: 10000, durationMonths: 1, isActive: 'true' };
const save = (id, profitPercent, extra = {}) => actions.updateCategory({ error: null }, form({ ...base, id, profitPercent, ...extra }));
(async () => {
  for (const doc of (await db.collection('investmentCategories').where('title', '==', 'rates').get()).docs) await doc.ref.delete();

  // Creating a category stores the percentage, the derived total and the first rate period.
  for (const profitPercent of ['', -1, 50.5, 'x']) {
    assert.ok((await actions.createCategory({ error: null }, form({ ...base, profitPercent }))).error);
  }
  assert.equal((await actions.createCategory({ error: null }, form({ ...base, profitPercent: 50 }))).error, null);
  const created = (await db.collection('investmentCategories').where('title', '==', 'rates').get()).docs;
  assert.equal(created.length, 1);
  const ref = created[0].ref;
  let data = created[0].data();
  assert.deepEqual([data.profitPercent, data.expectedTotalReturn, data.payoutModel, data.rateHistory.length],
    [50, 15000, 'monthly_capital_and_profit', 1]);
  assert.equal(data.rateHistory[0].percent, 50);
  assert.ok(data.rateHistory[0].effectiveAt instanceof admin.firestore.Timestamp);

  // Saving without changing the percentage does not start a new rate period.
  assert.equal((await save(ref.id, 50, { title: 'rates', description: 'edited' })).error, null);
  data = (await ref.get()).data();
  assert.equal(data.rateHistory.length, 1);
  assert.equal(data.description, 'edited');

  // A new percentage is appended; earlier periods are kept untouched.
  const first = data.rateHistory[0].effectiveAt.toMillis();
  assert.equal((await save(ref.id, 10)).error, null);
  data = (await ref.get()).data();
  assert.deepEqual(data.rateHistory.map((entry) => entry.percent), [50, 10]);
  assert.equal(data.rateHistory[0].effectiveAt.toMillis(), first);
  assert.ok(data.rateHistory[1].effectiveAt.toMillis() >= first);
  assert.deepEqual([data.profitPercent, data.expectedTotalReturn], [10, 11000]);

  // Out-of-range percentages and unauthorized callers change nothing.
  assert.ok((await save(ref.id, 51)).error);
  authorized = false;
  assert.ok((await save(ref.id, 20)).error);
  authorized = true;
  assert.equal((await ref.get()).data().rateHistory.length, 2);

  // Categories saved before rate tracking get their first period on the next save.
  const legacy = db.doc('investmentCategories/rates-legacy');
  await legacy.set({ title: 'rates', minInvestment: 100, durationMonths: 3, expectedTotalReturn: 120, payoutModel: 'monthly_capital_and_profit', isActive: false });
  await assert.rejects(actions.toggleCategory('rates-legacy', true));
  assert.equal((await save('rates-legacy', 20, { minInvestment: 100, durationMonths: 3 })).error, null);
  assert.deepEqual((await legacy.get()).data().rateHistory.map((entry) => entry.percent), [20]);
  await actions.toggleCategory('rates-legacy', true);

  // Claims need the rate history, so a category with running investments cannot be deleted.
  const investment = db.doc('investments/rates-running');
  await investment.set({ categoryId: ref.id, status: 'active', userId: 'u', amount: 10000 });
  await assert.rejects(actions.deleteCategory(ref.id));
  assert.ok((await ref.get()).exists);
  await investment.update({ status: 'expired' });
  await actions.deleteCategory(ref.id);
  assert.equal((await ref.get()).exists, false);
  await actions.deleteCategory('rates-legacy');
  await investment.delete();

  console.log('Category rate checks passed: validation, first period, unchanged saves, appended changes, legacy categories and delete protection.');
  await db.terminate();
})().catch(async (error) => { console.error(error); await db.terminate(); process.exitCode = 1; });
