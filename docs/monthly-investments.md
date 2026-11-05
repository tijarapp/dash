# Monthly investment integration

## Administrator workflow

Create a category with a custom title, investment amount, duration in months,
and expected net profit for the entire term (excluding capital). There are no
fixed sector presets. The server derives the total projected return by adding
capital and expected profit. A preview separates returned capital and projected profit,
with rounding remainders assigned to the final installment.

Monthly categories use `payoutModel: "monthly_capital_and_profit"`,
`minInvestment`, `durationMonths` (1–120), and `expectedTotalReturn`.
They do not use `dailyProfitRate`. Production categories are not automatically
seeded. Demo mode includes one editable monthly example.

At `/monthly-payouts`, each active monthly subscription shows its next unpaid
month, date, projected profit and returned capital. Once due, the administrator
must explicitly enter actual approved profit (zero is allowed) and confirm the
payment. Projected profit is never automatically credited. Approval atomically
updates both existing wallet balances, actual profit/income totals, returned
capital, a unique monthly payment record, ledger and notification. A unique
subscription/month key prevents double credit during retries or concurrent
approvals. The last installment closes the subscription with no extra principal
refund. Paid installments are retained under `investments/{id}/monthlyPayouts`.
Investment losses require a separate accounting decision; the projection and
approval screen do not constitute a guarantee against losses.

## Mobile and Firebase implementation

Companion repository: `/Volumes/hussendev/Flutter project/tjaraa_tech`.

- `subscribeMonthlyInvestment` callable reads current active category terms,
  rejects stale price/term confirmations, deducts both existing wallet balances
  atomically and freezes subscription terms. Client request IDs make retries
  idempotent.
- First due date is one calendar month after subscription. Due dates preserve
  the original UTC day/time, clamping shorter months rather than overflowing.
- Flutter shows monthly rate/projections, scheduled payments, actual returned
  capital, remaining capital, actual profit/income and next payout date.
- Wallet entries label monthly payouts separately and show their principal and
  actual profit components.
- Monthly payments are the only investment system. The old daily callable now
  rejects requests without writing to wallets, and the Flutter daily-claim feature
  and its registration have been removed. Home shows a monthly-payment explanation.
- Rules reject all client-side investment creation. Every subscription goes
  through the monthly callable; payout and ledger records are also server-managed.
- Unconfigured categories remain editable in the dashboard with a setup badge.
  Flutter hides them from available categories and rejects direct navigation to
  categories that are inactive or lack valid monthly terms.

Existing categories can be edited and saved as monthly categories using custom
amount, months and expected net profit. Saving a category alone does not change
existing financial subscriptions. The category editor no longer offers daily
rate fields.

At `/monthly-payouts`, existing unconfigured test subscriptions can be set up.
After converting their category, review each subscription's new duration and net
expected profit and confirm conversion. The original invested amount is retained.
Previous payouts remain profit; previous capital recovery is archived and reset
to zero for the new plan. Lifetime profit/income counters are preserved, with
`legacyProfit`/`legacyIncome` snapshots for separate mobile presentation. The
conversion date begins the new calendar schedule, with the first payment one
month later. No wallet credit or debit happens on conversion. A transaction
archives the complete old subscription under `migrations/monthly_v1` and prevents
repeat conversion. Investments with different amounts require an explicitly
entered expected profit rather than an inferred financial rate.

Daily accrual is retired entirely. Category reads perform no automatic data
migration or invent expected profits. Category updates synchronize display
metadata only; financial subscription setup is explicit.

## Rollout

The owner confirmed the project has not launched. The implementation uses only
the monthly system; obsolete daily inputs and accrual calculations are removed.
The daily callable is retained solely as a disabled compatibility endpoint so
old test builds cannot credit wallets after deployment.

Changes are local and not deployed. Deploy the monthly callable, disabled daily
endpoint, category trigger and Firestore rules before enabling subscriptions.
Release the Flutter/admin changes together. Existing categories need an admin to
enter their intended amount, duration and expected net profit before becoming
available; existing test subscriptions have an explicit setup flow with archived
history. No production data is reset or deleted by these source changes.

## Verification

Administration app:

- `node scripts/test-monthly-investments.cjs`
- `npx tsc --noEmit`
- `NEXT_PUBLIC_DEMO_MODE=true npm run build`

Flutter repository:

- `flutter analyze --no-pub`
- `flutter test --no-pub`
- `npm run build --prefix firebase/functions`
- `firebase emulators:exec --project demo-monthly-investments --config firebase/firebase.monthly-test.json --only firestore 'GCLOUD_PROJECT=demo-monthly-investments node firebase/functions/test/monthly-investments.cjs'`

For the administration integration test, run the same emulator configuration
from the admin repository with its full path and execute
`GCLOUD_PROJECT=demo-monthly-investments node scripts/test-monthly-payouts.cjs`.
It verifies actual-vs-projected profit, due dates, ordering, authorization,
concurrent duplicate protection, closing capital and client write restrictions.
Tests require a demo project and emulator and never connect to production.
