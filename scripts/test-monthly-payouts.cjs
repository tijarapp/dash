// Financial integration checks must only run against an explicitly selected demo emulator.
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
const payouts = load(resolve(__dirname, '../src/lib/monthlyPayouts.ts'), {
  './firebaseAdmin': { adminDb: db }, './demo': { DEMO_MODE: false },
  './session': { requireAdmin: async () => { if (!authorized) throw Error('Unauthorized'); return { uid: 'admin' }; } },
  'next/cache': { revalidatePath() {} }, './categoryProfit': financial,
});
const categories = load(resolve(__dirname, '../src/lib/actions.ts'), {
  './firebaseAdmin': { adminDb: db }, './demo': { DEMO_MODE: false },
  './session': { requireAdmin: async () => { if (!authorized) throw Error('Unauthorized'); return { uid: 'admin' }; } },
  'next/cache': { revalidatePath() {} }, 'next/navigation': { redirect() { throw Error('Unauthorized'); } },
  './categoryProfit': financial, './withdraw': {}, './chargeReasons': {},
});
function form(id, month, actualProfit) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ investmentId: id, month, actualProfit })) data.set(key, String(value));
  return data;
}
const approve = (id, month, profit) => payouts.approveMonthlyPayout({ error: null }, form(id, month, profit));
(async () => {
  const legacyCategory = db.doc('investmentCategories/convert-category-test');
  const legacyInvestment = db.doc('investments/convert-subscription-test');
  await legacyCategory.set({ title: 'legacy', minInvestment: 100, durationMonths: 24, dailyProfitRate: 0.5, isActive: true });
  await legacyInvestment.set({ userId: 'monthly-payout-test', categoryId: legacyCategory.id, dailyProfitRate: 0.5, amount: 200, totalProfit: 20, totalIncome: 20, recoveredAmount: 20, status: 'active', startDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-01T00:00:00Z')) });
  const edit = new FormData();
  for (const [key, value] of Object.entries({ id: legacyCategory.id, title: 'monthly', minInvestment: 100, durationMonths: 4, expectedProfit: 20, isActive: true })) edit.set(key, String(value));
  assert.equal((await categories.updateCategory({ error: null }, edit)).error, null);
  const converted = (await legacyCategory.get()).data();
  assert.equal(converted.payoutModel, financial.MONTHLY_PAYOUT_MODEL);
  assert.equal(converted.expectedTotalReturn, 120);
  assert.equal(converted.durationMonths, 4);
  assert.equal(converted.dailyProfitRate, undefined);
  const unchanged = (await legacyInvestment.get()).data();
  assert.equal(unchanged.amount, 200);
  assert.equal(unchanged.totalProfit, 20);
  assert.equal(unchanged.dailyProfitRate, 0.5);
  assert.equal(unchanged.payoutModel, undefined); // Financial subscription conversion is explicit.
  const user = db.doc('users/monthly-payout-test');
  const inv = db.doc('investments/monthly-payout-test');
  await user.set({ goldBalance: 0, dinarBalance: 0 });
  const terms = { userId: user.id, categoryTitle: 'test', payoutModel: financial.MONTHLY_PAYOUT_MODEL, amount: 100, durationMonths: 2, expectedTotalReturn: 150, paidMonths: 0, recoveredAmount: 0, totalProfit: 0, totalIncome: 0, status: 'active', startDate: admin.firestore.Timestamp.fromDate(new Date('2020-01-31T10:00:00Z')) };
  await inv.set(terms);
  authorized = false;
  assert.ok((await approve(inv.id, 1, 7)).error);
  authorized = true;
  assert.ok((await approve(inv.id, 2, 7)).error);
  for (const profit of ['', -1, 'NaN', 0.001]) assert.ok((await approve(inv.id, 1, profit)).error);
  assert.deepEqual(await Promise.all([approve(inv.id, 1, 7), approve(inv.id, 1, 7)]), [{ error: null }, { error: null }]);
  assert.equal((await user.get()).get('goldBalance'), 57);
  assert.equal((await inv.get()).get('totalProfit'), 7); // Actual, never the projected 25.
  assert.equal((await inv.collection('monthlyPayouts').get()).size, 1);
  assert.equal((await approve(inv.id, 2, 3)).error, null);
  assert.equal((await user.get()).get('goldBalance'), 110);
  const final = (await inv.get()).data();
  assert.equal(final.recoveredAmount, 100);
  assert.equal(final.totalProfit, 10);
  assert.equal(final.totalIncome, 110);
  assert.equal(final.status, 'expired');
  assert.equal(final.nextPayoutAt, null);
  assert.equal((await inv.collection('monthlyPayouts').get()).size, 2);
  assert.equal((await approve(inv.id, 2, 3)).error, null);
  assert.equal((await user.get()).get('goldBalance'), 110);
  const future = db.doc('investments/monthly-payout-future');
  await future.set({ ...terms, startDate: admin.firestore.Timestamp.now() });
  assert.ok((await approve(future.id, 1, 0)).error);
  assert.equal((await user.get()).get('goldBalance'), 110);
  // Listing and approval must both honor a rescheduled next date.
  await future.update({ nextPayoutAt: admin.firestore.Timestamp.fromMillis(Date.now() - 1000) });
  const dueOverride = (await payouts.listMonthlyPayouts()).find(row => row.id === future.id);
  assert.equal(dueOverride.isDue, true);
  assert.equal((await approve(future.id, 1, 0)).error, null);
  assert.equal((await user.get()).get('goldBalance'), 160);
  const futureData = (await future.get()).data();
  assert.equal(futureData.nextPayoutAt.toMillis(), financial.addCalendarMonths(futureData.startDate.toDate(), 2).getTime());
  await approve(future.id, 1, 0);
  assert.equal((await user.get()).get('goldBalance'), 160);
  const deferred = db.doc('investments/monthly-payout-deferred');
  await deferred.set({ ...terms, nextPayoutAt: admin.firestore.Timestamp.fromMillis(Date.now() + 86400000) });
  assert.equal((await payouts.listMonthlyPayouts()).find(row => row.id === deferred.id).isDue, false);
  assert.ok((await approve(deferred.id, 1, 0)).error);
  assert.equal((await user.get()).get('goldBalance'), 160);
  assert.equal(financial.addCalendarMonths(new Date('2024-01-31T10:00:00Z'), 1).toISOString(), '2024-02-29T10:00:00.000Z');
  assert.equal(financial.addCalendarMonths(new Date('2024-01-31T10:00:00Z'), 2).toISOString(), '2024-03-31T10:00:00.000Z');
  const clientApp = require('firebase/app').initializeApp({ projectId: process.env.GCLOUD_PROJECT, apiKey: 'demo' }, 'monthly-rules');
  const client = require('firebase/firestore');
  const clientDb = client.getFirestore(clientApp);
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  client.connectFirestoreEmulator(clientDb, host, Number(port), { mockUserToken: { sub: user.id, user_id: user.id, role: 'user' } });
  await db.doc('investmentCategories/monthly-rule-sector').set({ payoutModel: financial.MONTHLY_PAYOUT_MODEL });
  await db.doc('investmentCategories/legacy-rule-sector').set({ dailyProfitRate: 0.5 });
  const denied = (promise) => assert.rejects(promise, error => error.code === 'permission-denied');
  await denied(client.setDoc(client.doc(clientDb, 'investments/forged-monthly'), { userId: user.id, categoryId: 'monthly-rule-sector', payoutModel: financial.MONTHLY_PAYOUT_MODEL }));
  await denied(client.setDoc(client.doc(clientDb, 'investments/old-client-monthly'), { userId: user.id, categoryId: 'monthly-rule-sector' }));
  await denied(client.setDoc(client.doc(clientDb, 'transactions/forged-monthly'), { userId: user.id, type: 'monthly_payout' }));
  await denied(client.setDoc(client.doc(clientDb, `investments/${inv.id}/monthlyPayouts/3`), { actualProfit: 100 }));
  await denied(client.setDoc(client.doc(clientDb, 'investments/legacy-client-test'), { userId: user.id, categoryId: 'legacy-rule-sector' }));
  assert.equal((await client.getDoc(client.doc(clientDb, `investments/${inv.id}/monthlyPayouts/1`))).data().actualProfit, 7);
  await client.terminate(clientDb);
  await require('firebase/app').deleteApp(clientApp);
  console.log('Category/subscription conversion and monthly payouts passed: authorization, due dates, order, exact actual profit, atomic duplicate protection, final capital and no repeat credit.');
  await db.terminate();
})().catch(async (error) => { console.error(error); await db.terminate(); process.exitCode = 1; });
