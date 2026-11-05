# Backend Task: "بصمة خير" (Basmat Khair) — donation cards + prize draw

Hi! We're adding a new feature to the Tjaraa Tech mobile app (Flutter). The backend is
Firebase (Firestore + Cloud Functions, TypeScript in `firebase/functions/src`) and the
Next.js admin panel. This doc is the **contract** between us. Please keep field names
exactly as written, or tell me before you change anything.

---

## 1. What the feature does
- Admin opens a **round** (campaign) with an end date/time. The app shows a countdown to it.
- While the round is open, a user can buy **one** donation card per round:
  | Card | Cost (IQD) | Chances in draw |
  |---|---|---|
  | بطاقة أثر بركة | 1,000 | 1 |
  | بطاقة أثر رحمة | 3,000 | 3 |
  | بطاقة أثر عطاء | 5,000 | 7 |
- Payment: **wallet balance** OR **khairPoints**. Points are credited by the admin after the
  user contacts support on WhatsApp (offline payment). 1 point = 1 IQD.
- After the purchase the user holds `chances` entries in that round's draw.
- Admin can **cancel** any purchase at any time. Cancelling refunds the user to the same source and removes the entries.
- After `endsAt` nobody can buy. When the admin opens the next round, users can buy again.

---

## 2. Firestore schema

### `khairCards/{cardId}`: card types (admin managed)
```ts
{
  name: string;            // "بطاقة أثر رحمة"
  description: string;     // details text, e.g. "تدعم علاج مريض"
  imageUrl: string;        // Firebase Storage download URL
  cost: number;            // IQD, integer, e.g. 3000
  chances: number;         // integer, e.g. 3
  color?: string;          // hex for card header, optional e.g. "#1E5AA8"
  order: number;           // sort order in app
  isActive: boolean;
  createdAt: Timestamp; updatedAt: Timestamp;
}
```
Seed the 3 cards above.

### `khairRounds/{roundId}`: campaigns / draws
```ts
{
  title: string;             // "السحب الكبير - نوفمبر"
  bannerUrl: string;         // top banner image (Storage URL)
  startsAt: Timestamp;
  endsAt: Timestamp;         // countdown target; buying closes at this moment
  status: "scheduled" | "active" | "closed" | "drawn" | "cancelled";
  // denormalized counters (updated by functions only):
  totalPurchases: number;
  totalChances: number;
  totalAmount: number;       // IQD collected
  winners?: { rank: number; userId: string; userName: string; amount: number }[];
  createdAt: Timestamp; updatedAt: Timestamp;
}
```
**Rule: at most ONE round with `status == "active"` at a time.** Enforce this in the admin panel or in a function.

### `settings/khair`: single doc
```ts
{
  currentRoundId: string | null;  // app reads this to find the round to show
  defaultBannerUrl: string;       // fallback when no round
  supportWhatsapp?: string;       // optional override, else app uses settings/app.supportWhatsapp
}
```

### `khairPurchases/{roundId}_{userId}`: **deterministic doc ID**
The deterministic ID is how we guarantee one purchase per user per round.
```ts
{
  roundId: string;
  userId: string;
  userName: string; userPhone: string;     // denormalized for admin table
  cardId: string; cardName: string; cardImageUrl: string;
  cost: number; chances: number;           // snapshot at purchase time
  paymentMethod: "balance" | "points";
  status: "active" | "cancelled";
  cancelledAt?: Timestamp; cancelledBy?: string; cancelReason?: string;
  createdAt: Timestamp;
}
```
If a cancelled purchase can be re-bought in the same round, the function overwrites the cancelled doc.
Keep the history of the cancelled one in a `khairPurchases/{id}/history` subcollection or in the `transactions` log.

### `users/{uid}`: new field
```ts
khairPoints: number;   // default 0, only changed by functions/admin
```

### `transactions`: reuse the existing collection, new `type` values
- `"khair_purchase"` (negative amount, `note: "شراء بطاقة {name}"`)
- `"khair_refund"` (positive, on cancel)
- `"khair_points_grant"` (admin credits points)
Include `paymentMethod`, `roundId` and `purchaseId` fields.

### `notifications`: reuse the existing collection. `onNotificationCreated` already pushes.
Create a notification on: purchase success, cancellation, points granted, winner announced.

---

## 3. Cloud Functions (callables, `onCall`, same style as `claimDailyProfits`)

### `purchaseKhairCard({ cardId, paymentMethod })` → `{ purchaseId, chances }`
Do everything inside **one Firestore transaction**:
1. `request.auth.uid` required → else `unauthenticated`.
2. Read `settings/khair.currentRoundId` → round. Check `status == "active"` and
   `serverNow >= startsAt && serverNow < endsAt` → else `failed-precondition` with `details.code = "ROUND_CLOSED"`.
3. Card exists and `isActive` → else `not-found` / `CARD_NOT_FOUND`.
4. `khairPurchases/{roundId}_{uid}` exists with `status == "active"` → `already-exists` / `ALREADY_PURCHASED`.
5. `paymentMethod == "balance"`: check and deduct the balance (**⚠️ confirm with me: `dinarBalance`,
   `goldBalance`, or both like investments do today**). `"points"`: check and deduct `khairPoints`.
   Insufficient → `failed-precondition` / `INSUFFICIENT_BALANCE` or `INSUFFICIENT_POINTS`.
6. Write the purchase, the transaction log and the notification. Increment the round counters.
Error `details.code` values the app maps: `ROUND_CLOSED`, `CARD_NOT_FOUND`, `ALREADY_PURCHASED`,
`INSUFFICIENT_BALANCE`, `INSUFFICIENT_POINTS`, `INVALID_PAYMENT_METHOD`.

### `adminCancelKhairPurchase({ purchaseId, reason })`: admin only (`token.role == "admin"`)
Transaction: set `status = "cancelled"`, refund cost to the original `paymentMethod` source, decrement
the round counters, write a `khair_refund` transaction and a notification. Idempotent: cancelling an
already-cancelled purchase does nothing.

### `adminGrantKhairPoints({ userId, points, note })`: admin only
Increment `khairPoints`, write a `khair_points_grant` transaction and a notification
("تمت إضافة {points} نقطة لشراء بطاقة بصمة خير").
(Optional: `adminRevokeKhairPoints`.)

### `adminDrawKhairRound({ roundId })`: admin only, optional for v1
Only when `serverNow >= endsAt`. Build a weighted pool from active purchases (each purchase
appears `chances` times). Pick winners without repeating a user, using a crypto-secure random
(`crypto.randomInt`). Save `winners`, set `status = "drawn"`, and notify the winners. Log the seed and the pool size for auditability.

### Scheduled `closeExpiredKhairRounds` (every 5 min)
Set `status = "closed"` for active rounds past `endsAt`. The callable already checks the time, so this is only for admin display.

---

## 4. Security rules (`firebase/firestore.rules`)
```
match /khairCards/{id}     { allow read: if true;  allow write: if isAdmin(); }
match /khairRounds/{id}    { allow read: if true;  allow write: if isAdmin(); }
match /settings/khair      { (already covered by settings/{docId}: read true, write false) }
match /khairPurchases/{id} {
  allow read: if isAdmin() || isOwner(resource.data.userId);
  allow write: if false;            // functions only
}
```
Also make sure the client **cannot** change `khairPoints`. Today `isWalletBalanceDeduction()` /
`onlyEditableUserFields()` only allow specific keys, so `khairPoints` is already blocked. Please double-check this.

Indexes: `khairPurchases (userId ASC, createdAt DESC)`, `khairPurchases (roundId ASC, status ASC, createdAt DESC)`.

---

## 5. Next.js admin panel
1. **Cards**: CRUD for the 3 card types (name, description, image upload, cost, chances, color, order, active).
2. **Rounds**: create/edit a round (title, banner upload, startsAt, endsAt via date-time picker),
   activate it (sets `settings/khair.currentRoundId`, only one active), close it early, view live counters.
3. **Purchases**: table filtered by round, status and payment method. Search by phone or name.
   **Cancel** button with reason (calls `adminCancelKhairPurchase`). CSV export.
4. **Points**: search user by phone, then grant points with a note (calls `adminGrantKhairPoints`). Show points history.
5. **Draw** (if v1): "run draw" button after the end time, winners list, and "publish winners".
All money operations go through the callables, never direct client writes from the panel.
Store `endsAt` in **UTC**. Show it in the panel in **Asia/Baghdad** time.

---

## 6. What I (mobile) need from you
- [ ] Schema + seed data (3 cards + 1 test round ending ~7 days out) on the **dev** project.
- [ ] `purchaseKhairCard` deployed, with the error codes above.
- [ ] `adminCancelKhairPurchase`, `adminGrantKhairPoints` + admin screens.
- [ ] Rules + indexes deployed.
- [ ] Answer: which balance field(s) are deducted? Can a user re-buy after a cancel in the same round?
- [ ] Sample response payloads for success and for each error.

## 7. Open product questions (being confirmed with the customer)
- "Once per user": one card per round total (current assumption) or one per card type?
- Draw: automatic weighted random (above) or manual admin selection?
- ⚠️ Legal / store policy: paid entry for a cash prize can be classed as gambling (Apple 5.3, Google
  Play Real-Money Gambling). We're likely to frame it as a donation with a free sweepstake, plus official rules.
  Please keep the draw logic auditable (seed + pool snapshot) in case we need to show fairness.
