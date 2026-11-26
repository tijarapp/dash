import { KHAIR_CARDS } from '@/lib/khairCards';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp, type Query } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebaseAdmin';
import { getAdminUser } from '@/lib/session';
import { DEMO_MODE } from '@/lib/demo';
import { phoneSearchPrefixes } from '@/lib/phoneSearch';

export const dynamic = 'force-dynamic';
function serialize(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serialize(item)]),
    );
  return value;
}
function validId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    !!value &&
    !value.includes('/') &&
    value.length <= 512
  );
}
export async function GET(request: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  if (DEMO_MODE)
    return NextResponse.json({
      cards: KHAIR_CARDS,
      rounds: [],
      purchases: [],
      users: [],
      history: [],
      settings: {},
      hasMore: false,
    });
  try {
    const params = request.nextUrl.searchParams;
    if (params.has('phone')) {
      const prefixes = phoneSearchPrefixes(params.get('phone')!);
      const matches = await Promise.all(
        prefixes.map((phone) =>
          adminDb
            .collection('users')
            .where('phone', '>=', phone)
            .where('phone', '<=', `${phone}\uf8ff`)
            .limit(25)
            .get(),
        ),
      );
      const users = [
        ...new Map(
          matches
            .flatMap((snapshot) => snapshot.docs)
            .map((doc) => [doc.id, doc]),
        ).values(),
      ].slice(0, 25);
      return NextResponse.json({
        users: users.map((doc) => ({
          id: doc.id,
          name: doc.get('name') ?? '',
          phone: doc.get('phone') ?? '',
          khairPoints: doc.get('khairPoints') ?? 0,
        })),
      });
    }
    if (params.has('purchasersRoundId')) {
      // Users who hold an active card of this type in the round: the pool winners are picked from.
      const roundId = params.get('purchasersRoundId');
      const cardId = params.get('cardId');
      if (!validId(roundId) || !validId(cardId)) throw new Error('معرّف غير صالح');
      const rows = await adminDb
        .collection('khairPurchases')
        .where('roundId', '==', roundId)
        .where('cardId', '==', cardId)
        .where('status', '==', 'active')
        .select('userId', 'chances')
        .get();
      const chances = new Map<string, number>();
      for (const doc of rows.docs) {
        const userId = doc.get('userId');
        if (validId(userId)) chances.set(userId, (chances.get(userId) ?? 0) + (Number(doc.get('chances')) || 0));
      }
      const userIds = [...chances.keys()];
      const users = [];
      for (let offset = 0; offset < userIds.length; offset += 250) {
        const refs = userIds.slice(offset, offset + 250).map((id) => adminDb.doc(`users/${id}`));
        users.push(...await adminDb.getAll(...refs, { fieldMask: ['name', 'phone', 'referralCode'] }));
      }
      return NextResponse.json({
        purchasers: users
          .filter((doc) => doc.exists)
          .map((doc) => ({
            userId: doc.id,
            userName: String(doc.get('name') ?? ''),
            userPhone: String(doc.get('phone') ?? ''),
            referralCode: String(doc.get('referralCode') ?? ''),
            chances: chances.get(doc.id) ?? 0,
          })),
      });
    }
    if (params.has('userId')) {
      const userId = params.get('userId');
      if (!validId(userId)) throw new Error('معرّف غير صالح');
      const history = await adminDb
        .collection('transactions')
        .where('userId', '==', userId)
        .where('type', '==', 'khair_points_grant')
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
      return NextResponse.json({
        history: history.docs
          .filter((doc) => doc.get('type') === 'khair_points_grant')
          .map((doc) => ({ id: doc.id, ...(serialize(doc.data()) as object) })),
      });
    }
    let purchases: Query = adminDb.collection('khairPurchases');
    const roundId = params.get('roundId');
    if (roundId) purchases = purchases.where('roundId', '==', roundId);
    // Query by round + time; remaining filters apply to loaded results in the panel.
    purchases = purchases.orderBy('createdAt', 'desc');
    const cursor = params.get('cursor');
    if (cursor && validId(cursor)) {
      const doc = await adminDb.collection('khairPurchases').doc(cursor).get();
      if (doc.exists) purchases = purchases.startAfter(doc);
    }
    const [rounds, rows, settings, cards] = await Promise.all([
      adminDb
        .collection('khairRounds')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get(),
      purchases.limit(200).get(),
      adminDb.doc('settings/khair').get(),
      adminDb.getAll(...KHAIR_CARDS.map((card) => adminDb.doc(`khairCards/${card.id}`))),
    ]);
    const map = (docs: typeof rows.docs) =>
      docs.map((doc) => ({ id: doc.id, ...(serialize(doc.data()) as object) }));
    return NextResponse.json({
      cards: KHAIR_CARDS.map((card, index) => ({ ...card, ...(serialize(cards[index].data() ?? {}) as object), id: card.id })),
      rounds: map(rounds.docs),
      purchases: map(rows.docs),
      settings: serialize(settings.data() ?? {}),
      hasMore: rows.size === 200,
      cursor: rows.docs.at(-1)?.id ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'فشل تحميل البيانات' },
      { status: 400 },
    );
  }
}
export async function POST(request: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  if (DEMO_MODE)
    return NextResponse.json(
      { error: 'هذه العملية غير متاحة في الوضع التجريبي' },
      { status: 400 },
    );
  try {
    const body = await request.json();
    if (body.action === 'updateCard') {
      const defaults = KHAIR_CARDS.find((card) => card.id === body.id);
      if (!defaults) throw new Error('نوع البطاقة غير صالح');
      const { name, imageUrl, cost, chances } = body;
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 120)
        throw new Error('اسم البطاقة مطلوب وبحد أقصى 120 حرفاً');
      if (typeof imageUrl !== 'string' || imageUrl.length > 4096 ||
          (imageUrl !== '' && !/^https:\/\/[^\s]+$/.test(imageUrl)))
        throw new Error('رابط الصورة يجب أن يكون HTTPS');
      if (!Number.isSafeInteger(cost) || cost < 1)
        throw new Error('التكلفة يجب أن تكون عدداً صحيحاً موجباً');
      if (!Number.isSafeInteger(chances) || chances < 1)
        throw new Error('عدد الفرص يجب أن يكون عدداً صحيحاً موجباً');
      await adminDb.runTransaction(async (tx) => {
        const ref = adminDb.doc(`khairCards/${defaults.id}`);
        const existing = await tx.get(ref);
        const { id: _id, ...initial } = defaults;
        tx.set(ref, {
          ...(!existing.exists ? { ...initial, createdAt: FieldValue.serverTimestamp() } : {}),
          name: name.trim(), imageUrl, cost, chances,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      });
    } else if (body.action === 'saveWinners') {
      const { roundId, visibility, winnerChanges } = body;
      if (!validId(roundId)) throw new Error('معرّف الجولة غير صالح');
      if (!['auto', 'shown', 'hidden'].includes(visibility)) throw new Error('خيار الإظهار غير صالح');
      if (!Array.isArray(winnerChanges)) throw new Error('قائمة الفائزين غير صالحة');
      const changes = new Map<string, { userId: string; amount: number } | null>();
      for (const change of winnerChanges) {
        if (!KHAIR_CARDS.some((card) => card.id === change?.cardId)) throw new Error('نوع البطاقة غير صالح');
        if (changes.has(change.cardId)) throw new Error('يمكن اختيار فائز واحد فقط لكل بطاقة');
        if (change.userId === null) {
          changes.set(change.cardId, null);
          continue;
        }
        if (!validId(change.userId)) throw new Error('معرّف المستخدم غير صالح');
        if (typeof change.amount !== 'number' || !Number.isFinite(change.amount) || change.amount <= 0 || change.amount > 1_000_000_000)
          throw new Error('مبلغ الفوز يجب أن يكون أكبر من صفر وحتى مليار دينار');
        changes.set(change.cardId, { userId: change.userId, amount: change.amount });
      }
      const roundRef = adminDb.doc(`khairRounds/${roundId}`);
      await adminDb.runTransaction(async (tx) => {
        const round = await tx.get(roundRef);
        if (!round.exists) throw new Error('الجولة غير موجودة');
        const winners = (round.get('winners') ?? []) as { cardId: string }[];
        const saved = winners.filter((winner) => !changes.has(winner.cardId));
        for (const [cardId, winner] of changes) {
          if (!winner) continue;
          const [user, card, purchases] = await Promise.all([
            tx.get(adminDb.doc(`users/${winner.userId}`)),
            tx.get(adminDb.doc(`khairCards/${cardId}`)),
            tx.get(adminDb.collection('khairPurchases')
              .where('roundId', '==', roundId)
              .where('cardId', '==', cardId)
              .where('userId', '==', winner.userId)
              .where('status', '==', 'active')
              .limit(1)),
          ]);
          if (!user.exists) throw new Error('أحد الفائزين غير موجود');
          if (purchases.empty) throw new Error(`«${user.get('name') ?? ''}» ليس لديه شراء فعّال لهذه البطاقة في هذه الجولة`);
          const record = {
            ...winner,
            cardId,
            cardName: card.get('name') ?? KHAIR_CARDS.find((item) => item.id === cardId)!.name,
            userName: user.get('name') ?? '',
            referralCode: user.get('referralCode') ?? '',
          };
          saved.push(record);
        }
        tx.update(roundRef, {
          winners: saved,
          winnersVisibility: visibility,
          winnersUpdatedAt: FieldValue.serverTimestamp(),
        });
      });
    } else if (body.action === 'settings') {
      const { supportWhatsapp = '', referralBonus = 50 } = body;
      if (typeof referralBonus !== 'number' || !Number.isFinite(referralBonus) || referralBonus < 0 || referralBonus > 1_000_000)
        throw new Error('مكافأة الدعوة يجب أن تكون رقماً بين 0 و1,000,000');
      const rawUrls =
        body.defaultBannerUrls ??
        (body.defaultBannerUrl ? [body.defaultBannerUrl] : []);
      if (
        !Array.isArray(rawUrls) ||
        rawUrls.length > 10 ||
        rawUrls.some(
          (url: unknown) =>
            typeof url !== 'string' || !/^https:\/\//.test(url.trim()),
        )
      )
        throw new Error('قائمة الصور غير صالحة (حتى 10 صور HTTPS)');
      const defaultBannerUrls = [
        ...new Set(rawUrls.map((url: string) => url.trim())),
      ];
      const defaultBannerUrl = defaultBannerUrls[0] ?? '';
      if (
        typeof defaultBannerUrl !== 'string' ||
        typeof supportWhatsapp !== 'string' ||
        (defaultBannerUrl && !/^https:\/\//.test(defaultBannerUrl))
      )
        throw new Error('إعدادات غير صالحة');
      await adminDb.runTransaction(async (tx) => {
        const ref = adminDb.doc('settings/khair');
        const existing = await tx.get(ref);
        tx.set(
          ref,
          {
            defaultBannerUrl,
            defaultBannerUrls,
            supportWhatsapp,
            referralBonus,
            ...(!existing.exists ? { currentRoundId: null } : {}),
          },
          { merge: true },
        );
      });
    } else {
      return NextResponse.json({ error: 'العملية غير متاحة' }, { status: 403 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'فشلت العملية' },
      { status: 400 },
    );
  }
}
