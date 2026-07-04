// Grants the `admin` custom claim to a user by email.
//
// Usage: node scripts/grant-admin.mjs admin@example.com
// Requires the same FIREBASE_* env vars as the app (or a serviceAccount.json).
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/grant-admin.mjs <email>');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { role: 'admin' });
console.log(`Granted admin role to ${email} (${user.uid}).`);
process.exit(0);
