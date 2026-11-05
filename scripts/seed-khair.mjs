import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId || process.argv[2] !== projectId)
  throw new Error('Pass the exact FIREBASE_PROJECT_ID as the first argument');
initializeApp({
  credential: cert({
    projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();
const cards = [
  {
    id: 'baraka',
    name: 'بطاقة أثر بركة',
    cost: 1000,
    chances: 1,
    color: '#168B69',
  },
  {
    id: 'rahma',
    name: 'بطاقة أثر رحمة',
    cost: 3000,
    chances: 3,
    color: '#1E5AA8',
  },
  {
    id: 'ataa',
    name: 'بطاقة أثر عطاء',
    cost: 5000,
    chances: 7,
    color: '#A76C19',
  },
];
const result = await db.runTransaction(async (tx) => {
  const refs = cards.map((c) => db.collection('khairCards').doc(c.id));
  const settingsRef = db.doc('settings/khair');
  const roundRef = db.doc('khairRounds/khair-test-round');
  const [existing, settings, round, active] = await Promise.all([
    tx.getAll(...refs),
    tx.get(settingsRef),
    tx.get(roundRef),
    tx.get(db.collection('khairRounds').where('status', '==', 'active')),
  ]);
  const now = Timestamp.now();
  cards.forEach(({ id, ...card }, order) => {
    if (!existing[order].exists)
      tx.create(refs[order], {
        ...card,
        description: '',
        imageUrl: '',
        order,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
  });
  let currentRoundId =
    settings.get('currentRoundId') ?? active.docs[0]?.id ?? null;
  if (active.empty && !round.exists && !currentRoundId) {
    tx.create(roundRef, {
      title: 'بصمة خير - جولة تجريبية',
      bannerUrl: '',
      bannerUrls: [],
      startsAt: now,
      endsAt: Timestamp.fromMillis(now.toMillis() + 7 * 86400000),
      status: 'active',
      totalPurchases: 0,
      totalChances: 0,
      totalAmount: 0,
      createdAt: now,
      updatedAt: now,
    });
    currentRoundId = roundRef.id;
  }
  tx.set(
    settingsRef,
    { ...(!settings.exists ? { defaultBannerUrl: '', defaultBannerUrls: [] } : {}), currentRoundId },
    { merge: true },
  );
  return {
    currentRoundId,
    cardsCreated: existing.filter((doc) => !doc.exists).length,
    testRoundCreated:
      active.empty && !round.exists && currentRoundId === roundRef.id,
  };
});
console.log(JSON.stringify({ projectId, ...result }));
