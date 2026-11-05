# Basmat Khair integration

> Current flow: Khair points have been retired. New card purchases use wallet
> balance only. Admins credit the wallet from **شحن الرصيد**, selecting a reason
> (including **شحن رصيد لشراء بطاقة بصمة خير**). The reason and optional details
> appear in both the notification and transaction record. The old points-grant
> endpoint rejects requests; historical points purchases can still be refunded.
> Legacy points API descriptions below document the original implementation only.

Admin route: `/khair`. Cloud Functions source is in the adjacent mobile repository:
`/Volumes/hussendev/Flutter project/tjaraa_tech/firebase/functions/src/khair.ts`.
All callables use `us-central1` and the Node.js 22 runtime. The functions package
was upgraded from the decommissioned Node.js 20 runtime; the deployment targets
only the five new Khair functions.

## Wallet and purchase policy

As confirmed, a balance purchase deducts the full IQD cost from **each** of
`goldBalance` and `dinarBalance`, matching investment purchases. Both balances
must be sufficient. A refund restores both fields. Points purchases deduct only
`khairPoints`; refunds restore points. One point equals one IQD.

One active purchase per card type per user per round. The three types are baraka, rahma, and ataa. Their default values are 1000 IQD / 1 chance, 3000 IQD / 3 chances, and 5000 IQD / 7 chances. Admins can edit name, image, cost, and chances through the authenticated admin API. The app and purchase function read the saved khairCards catalog; purchases retain their original snapshots for refunds and history. Direct client writes remain disabled. Deploy the updated purchaseKhairCard function and rebuild the mobile app to enable the saved catalog end to end. A cancelled purchase can be bought again
while the round is open. The old cancelled document is copied into its `history`
subcollection before replacement; transaction logs also preserve each charge/refund.

## Mobile callable payloads

`purchaseKhairCard({ cardId: "baraka", paymentMethod: "balance" })`
returns `{ purchaseId: "ROUND_ID_USER_ID_CARD_ID", chances: 1 }`.
Firebase callable HTTP responses wrap this as:

```json
{"result":{"purchaseId":"ROUND_ID_USER_ID_CARD_ID","chances":1}}
```

SDK errors have `error.code` (prefixed `functions/`) and `error.details.code`:

| SDK code | Details | Example details payload |
| --- | --- | --- |
| functions/failed-precondition | ROUND_CLOSED | `{"code":"ROUND_CLOSED"}` |
| functions/not-found | CARD_NOT_FOUND | `{"code":"CARD_NOT_FOUND"}` |
| functions/already-exists | ALREADY_PURCHASED | `{"code":"ALREADY_PURCHASED"}` |
| functions/failed-precondition | INSUFFICIENT_BALANCE | `{"code":"INSUFFICIENT_BALANCE"}` |
| functions/failed-precondition | INSUFFICIENT_POINTS | `{"code":"INSUFFICIENT_POINTS"}` |
| functions/invalid-argument | INVALID_PAYMENT_METHOD | `{"code":"INVALID_PAYMENT_METHOD"}` |

For example, the callable HTTP error is:

```json
{"error":{"status":"FAILED_PRECONDITION","message":"ROUND_CLOSED","details":{"code":"ROUND_CLOSED"}}}
```

Missing authentication returns `functions/unauthenticated`. Malformed IDs return
`functions/invalid-argument`. Admin functions require the custom claim `role=admin`.

`adminCancelKhairPurchase({ purchaseId, reason })` returns `{ cancelled: true }`,
or `{ cancelled: false }` on an already cancelled purchase. A nonempty reason is required.

`adminGrantKhairPoints({ userId, points, note, requestId? })` returns `{ granted: true }`.
A nonempty note and positive integer points are required. An optional unique
`requestId` makes retries idempotent; repeating it returns `{ granted: false }`.
The admin UI always supplies and preserves this ID across retries.

`adminSaveKhairRound({ roundId?, title, bannerUrl, startsAt, endsAt, status })`
accepts ISO timestamps and returns `{ roundId }`. It enforces a single active round
using a transaction on `settings/khair`. Round counters are server owned. Khair transaction audit records also reject all
client writes, including attempts to forge points-grant history.
Closed and cancelled rounds can be reactivated with a future end time if no other round is active. The admin reopen action preserves the round ID, purchases and totals. Drawn rounds remain locked.

`closeExpiredKhairRounds` runs every five minutes. Purchase eligibility always
uses server time, independent of the schedule. The most recent round remains
in `settings/khair.currentRoundId` after closing so the app can display it.

## Seed and deploy

Development and production share the project configured by `FIREBASE_PROJECT_ID`.
In the commands below, replace `YOUR_FIREBASE_PROJECT_ID` with that project ID
from your local environment configuration.
The seed creates only missing cards and creates an active seven-day test round
only when no active/current round exists. Existing data is preserved. Images are
initially empty; upload card images and banners through the admin screen.

From the admin repository:

```sh
node --env-file=.env.local scripts/seed-khair.mjs YOUR_FIREBASE_PROJECT_ID
npm run build
```

From the mobile repository's `firebase` directory:

```sh
npm --prefix functions run build
firebase emulators:exec --only firestore --project demo-khair 'node --test functions/test/khair.cjs'
firebase deploy --project YOUR_FIREBASE_PROJECT_ID --only functions:purchaseKhairCard,functions:adminCancelKhairPurchase,functions:adminGrantKhairPoints,functions:adminSaveKhairRound,functions:closeExpiredKhairRounds,firestore:rules,firestore:indexes
```

The admin panel must be deployed using its existing Next.js hosting workflow.
Purchase browsing loads 200 records per page; filters/search/CSV apply to loaded
records, with a load-more button for older records. Points history shows grants
from the user's latest 200 grants. Counters refresh every 30 seconds.

Automatic/manual prize draws and winner publishing are deferred; the plan marks
these optional for v1 and the product decision is still open.

## Verification on 2026-11-03

- All five Khair functions deployed successfully to the configured Firebase project.
- Firestore rules released; purchase and points-history index queries succeed.
- Three cards and `khair-test-round` seeded. The round ends at
  `2026-11-10T16:47:42.363Z` (19:47 Baghdad).
- Emulator transaction/concurrency and security-rule tests pass, including
  prevention of forged Khair audit records. Live callable endpoints correctly
  reject unauthenticated requests.
- Next.js production build and unauthenticated route/API smoke checks pass.
- Development now uses `.next-dev`; production uses `.next`. This prevents
  production builds from overwriting a running development server's styles.
  CSS delivery was checked again after a production build and returned HTTP 200.

## Banner image lists

The app's carousel reads `khairRounds/{roundId}.bannerUrls` (an ordered string
array of Firebase Storage download URLs). If that list is empty, it reads
`settings/khair.defaultBannerUrls`. Legacy `bannerUrl` / `defaultBannerUrl`
values remain supported and retain the first image for older app versions.

In `/khair`, edit **الجولات** for round images or **الإعدادات** for default
images. Add up to ten images, reorder or remove entries, then save the form.
The app's Firestore listener receives saved list changes without a backend
redeployment. An updated mobile build is required for the carousel UI.

Legacy ROUND_ID_USER_ID purchase records remain readable/refundable and block repeat purchases of the same type only. New purchases use ROUND_ID_USER_ID_CARD_ID. The updated mobile app watches all user purchases for the current round.

## Fixed catalog rollout

Run `node --env-file=.env.local scripts/sync-khair-catalog.mjs YOUR_FIREBASE_PROJECT_ID` to preview the catalog normalization, then append `--apply` to restore the three canonical definitions and hide extra cards. Extra documents and all purchase history are retained. The mobile app must be rebuilt for per-type purchase availability; earlier builds watch only the legacy single-purchase document.
