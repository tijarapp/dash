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
    } else if (body.action === 'settings') {
      const { supportWhatsapp = '' } = body;
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
