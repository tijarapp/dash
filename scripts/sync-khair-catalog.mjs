// Normalize the fixed catalog; preserve extra documents and all purchase history.
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId || process.argv[2] !== projectId) throw new Error('Pass the exact FIREBASE_PROJECT_ID');
initializeApp({ credential: cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') }) });
const db = getFirestore();
const cards = [
  { id: 'baraka', name: 'بطاقة أثر بركة', cost: 1000, chances: 1, color: '#168B69' },
  { id: 'rahma', name: 'بطاقة أثر رحمة', cost: 3000, chances: 3, color: '#1E5AA8' },
  { id: 'ataa', name: 'بطاقة أثر عطاء', cost: 5000, chances: 7, color: '#A76C19' },
];
const result = await db.runTransaction(async (tx) => {
  const existing = await tx.get(db.collection('khairCards'));
  const extras = existing.docs.filter((d) => !cards.some((c) => c.id === d.id));
  if (process.argv.includes('--apply')) {
    cards.forEach(({ id, ...card }, order) => tx.set(db.doc(`khairCards/${id}`), {
      ...card, order, isActive: true, imageUrl: '', description: '', updatedAt: FieldValue.serverTimestamp(),
      ...(!existing.docs.some((d) => d.id === id) ? { createdAt: FieldValue.serverTimestamp() } : {}),
    }, { merge: true }));
    for (const doc of extras) tx.update(doc.ref, { isActive: false, updatedAt: FieldValue.serverTimestamp() });
  }
  return { fixed: cards.map((c) => c.id), hidden: extras.map((d) => d.id), applied: process.argv.includes('--apply') };
});
console.log(JSON.stringify(result));
