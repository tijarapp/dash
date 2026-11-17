# Monthly investments: percentage, claims and countdown

## How it works

- The administrator sets, per category, an investment amount, a duration in
  months and a **profit percentage between 1% and 100%** with a slider.
- The percentage is the profit for the **whole duration**. 10,000 at 50% returns
  15,000 in total whether the duration is one month or three.
- Capital and profit are paid in equal monthly parts. Each month the investor
  presses **Claim** in the mobile app and receives that month's share of capital
  plus that month's profit. The administrator does not send or approve payouts.
- The administrator can move the slider at any time. The new percentage applies
  **from the moment it is saved** to every active investment in the category;
  earlier days keep the percentage that was in force.

Example: 10,000 for one 30-day month, 50% for the first 25 days and 10% for the
last 5 days. Profit = 10,000 × (50% × 25/30 + 10% × 5/30) = 4,333.33, so the
claim pays 14,333.33.

## Data

`investmentCategories/{id}`

| Field | Meaning |
| --- | --- |
| `payoutModel` | `monthly_capital_and_profit` |
| `minInvestment`, `durationMonths` | Amount and term (1–120 months) |
| `profitPercent` | Current percentage, 1–100, for the whole duration |
| `rateHistory` | `[{ percent, effectiveAt }]`, one entry per change, oldest first |
| `expectedTotalReturn` | Derived: capital + capital × percent / 100 |

`investments/{id}` stores `amount`, `durationMonths`, `startDate`, `paidMonths`,
`recoveredAmount`, `totalProfit`, `totalIncome`, `nextPayoutAt`, `status`, plus
`profitPercent` (the percentage at subscription, used only if the category has
no rate history). Amount and duration are frozen at subscription. The rate is
not: claims always read the category's `rateHistory`, which is the single
source of truth. For that reason a category with active investments cannot be
deleted; stop it instead.

Each claimed month writes `investments/{id}/monthlyPayouts/{month}`, a ledger
entry `transactions/monthly_{id}_{month}` (type `monthly_payout`, with
`principalAmount` and `profitAmount`) and a notification.

## Profit formula

The same formula is implemented in three places and must stay identical:

- Cloud Function: `firebase/functions/src/monthlyInvestments.ts`
  (`averageRate`, `profitUnitsThrough`) in the Flutter repository
- Admin preview: `src/lib/categoryProfit.ts` (`buildMonthlySchedule`)
- Mobile: `lib/features/investments/domain/utils/monthly_payout_calculator.dart`

Rules:

1. Month `m` runs from `start + (m − 1)` calendar months to `start + m` calendar
   months (same UTC day and time, clamped in short months).
2. `avg(m)` is the time-weighted average percentage over that month.
3. Profit earned through month `m`, in minor units, is
   `round(capitalUnits × (avg(1) + … + avg(m)) / (100 × months))`.
   A month's profit is the difference between two consecutive values, so at a
   constant percentage the months add up exactly to `capital × percent / 100`.
4. Capital per month is `floor(capitalUnits / months)`; the last month takes the
   remainder.

## Administrator workflow

`/categories` → create or edit a category → set amount, months and the
percentage slider. The form previews the profit, the total and the monthly
schedule at the chosen percentage. Saving an edit with a different percentage
appends a `rateHistory` entry; saving without changing it does not.

There is no payouts page. Claims appear under `/transactions` and on each
user's page as `monthly_payout` entries.

## Mobile and Firebase

Companion repository: `/Volumes/hussendev/Flutter project/tjaraa_tech`.

- `subscribeMonthlyInvestment` (callable) checks the confirmed amount, duration
  and `profitPercent` against the live category, deducts the wallet and creates
  the investment. Client request IDs make retries idempotent.
- `claimMonthlyInvestment({ investmentId })` (callable) pays every month that is
  due in one transaction, credits both wallet balances, and marks the
  investment `expired` after the last month. Payout, ledger and notification
  documents use deterministic IDs and are created with `create`, so retries or
  concurrent taps cannot pay a month twice. Only the owner can claim.
- The investment details page shows a live days/hours/minutes/seconds countdown
  to the next payment and switches to the Claim button when it is due. The
  investments list shows a "ready to claim" badge.
- Firestore rules are unchanged: clients cannot create or update investments,
  payouts or `monthly_payout` ledger entries.

## Not included

- No push notification when a payment becomes claimable.
- No migration of investments created under the previous admin-approval
  system; the project has not launched and that data is test data.

## Rollout

Nothing is deployed by these changes. Deploy the functions
(`subscribeMonthlyInvestment`, `claimMonthlyInvestment`) and release the admin
and mobile apps together: the new mobile app sends `profitPercent` when
subscribing, and categories need a saved percentage before they can be
activated or subscribed to.

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

The emulator test covers subscription terms, the rate maths, the 25-day/5-day
example, ownership, due dates, duplicate protection and exact totals.

The admin category actions (first rate period, appended changes, unchanged
saves, delete protection) are checked with the same emulator configuration:
run the command above from the Flutter repository with
`node /Volumes/hussendev/backend/admin/scripts/test-category-rates.cjs` as the
script. Both tests require a demo project and never connect to production.
